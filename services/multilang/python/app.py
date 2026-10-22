import json
import os
import re
import secrets
import subprocess
from collections import Counter
from typing import Annotated

import psycopg
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="Legends Motors Analytics API", version="1.0.0")
DATABASE_URL = os.getenv("DATABASE_URL", "")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")

class HeadlineBatch(BaseModel):
    headlines: list[str] = Field(min_length=1, max_length=100)

class InventoryPriorityInput(BaseModel):
    days_in_stock: int = Field(ge=0, le=36500)
    published: bool
    featured: bool

def authorize(authorization: Annotated[str | None, Header()] = None) -> None:
    if len(INTERNAL_API_KEY) < 32:
        raise HTTPException(status_code=503, detail="Internal API is not configured")
    scheme, _, token = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not secrets.compare_digest(token, INTERNAL_API_KEY):
        raise HTTPException(status_code=401, detail="Unauthorized")

@app.get("/health")
def health():
    if not DATABASE_URL:
        raise HTTPException(status_code=503, detail="Database is not configured")
    try:
        with psycopg.connect(DATABASE_URL, connect_timeout=3) as conn:
            conn.execute("SELECT 1")
        return {"status": "ok", "service": "legends-motors-python", "database": "connected"}
    except Exception:
        raise HTTPException(status_code=503, detail="Database unavailable")

@app.post("/analyze/headlines", dependencies=[Depends(authorize)])
def analyze_headlines(batch: HeadlineBatch):
    # Transparent keyword triage, not financial advice or a predictive model.
    cleaned = [re.sub(r"\s+", " ", item).strip()[:500] for item in batch.headlines]
    cleaned = [item for item in cleaned if item]
    if not cleaned:
        raise HTTPException(status_code=422, detail="Provide at least one non-empty headline")
    keywords = {
        "supply": ("supply", "shortage", "imports", "import", "export", "shipment", "shipping"),
        "demand": ("demand", "sales", "buyers", "consumer", "growth"),
        "pricing": ("price", "prices", "inflation", "tax", "duty", "currency", "kwacha", "exchange rate"),
        "risk": ("recall", "fraud", "ban", "crisis", "disruption", "scam", "regulation"),
    }
    results = []
    for headline in cleaned:
        lower = headline.casefold()
        tags = [name for name, terms in keywords.items() if any(term in lower for term in terms)]
        results.append({"headline": headline, "topics": tags or ["unclassified"], "reviewRecommended": bool(set(tags) & {"pricing", "risk", "supply"})})
    return {
        "count": len(results),
        "method": "rule-based keyword triage; not a forecast",
        "topicCounts": dict(Counter(tag for item in results for tag in item["topics"])),
        "items": results,
    }

@app.post("/score/inventory", dependencies=[Depends(authorize)])
def score_inventory(payload: InventoryPriorityInput):
    # Arguments are validated and passed without a shell to the C++ helper.
    try:
        completed = subprocess.run(
            ["/usr/local/bin/inventory_priority", str(payload.days_in_stock),
             "1" if payload.published else "0", "1" if payload.featured else "0"],
            check=True, capture_output=True, text=True, timeout=2,
        )
        return json.loads(completed.stdout)
    except (OSError, subprocess.SubprocessError, json.JSONDecodeError):
        raise HTTPException(status_code=503, detail="Inventory scoring helper unavailable")
