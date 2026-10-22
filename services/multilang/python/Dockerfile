FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends g++ && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
COPY ../cpp/inventory_priority.cpp /tmp/inventory_priority.cpp
RUN g++ -std=c++17 -O2 -Wall -Wextra -Werror /tmp/inventory_priority.cpp -o /usr/local/bin/inventory_priority && rm /tmp/inventory_priority.cpp
RUN useradd --create-home --uid 10001 appuser && chown -R appuser:appuser /app
USER appuser
EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
