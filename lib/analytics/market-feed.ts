import { prisma } from "@/lib/db/prisma";

const SETTING_KEY = "market_news_feed_url";
const MAX_FEED_BYTES = 1_000_000;

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tagValue(block: string, tag: string) {
  const match = block.match(new RegExp("<(?:[\\w.-]+:)?"+tag+"\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?"+tag+"\\s*>", "i"));
  return match ? decodeXml(match[1]) : "";
}

function validateFeedUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Enter a valid public HTTPS RSS or Atom feed URL.");
  }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || !host || host === "localhost" || host.endsWith(".localhost") ||
      host.endsWith(".local") || /^127\./.test(host) || /^10\./.test(host) ||
      /^192\.168\./.test(host) || /^169\.254\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) || host === "::1" || host === "0.0.0.0" ||
      url.username || url.password) {
    throw new Error("Only public HTTPS feed URLs are allowed.");
  }
  return url;
}

export async function getMarketFeedUrl() {
  const setting = await prisma.businessSetting.findUnique({ where: { key: SETTING_KEY }, select: { value: true } });
  return setting?.value ?? "";
}

export async function saveMarketFeedUrl(raw: string) {
  const trimmed = raw.trim();
  if (trimmed) validateFeedUrl(trimmed);
  await prisma.businessSetting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: trimmed, description: "Admin-configured public market news RSS/Atom feed URL" },
    update: { value: trimmed, description: "Admin-configured public market news RSS/Atom feed URL" },
  });
  return trimmed;
}

export async function getMarketNewsSignals() {
  const feedUrl = await getMarketFeedUrl();
  if (!feedUrl) return { configured: false, sourceUrl: "", fetchedAt: null, items: [], status: "No market feed configured." };

  try {
    const url = validateFeedUrl(feedUrl);
    const response = await fetch(url, {
      headers: { accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" },
      cache: "no-store",
      signal: AbortSignal.timeout(7000),
      redirect: "error",
    });
    if (!response.ok) throw new Error("Feed returned HTTP " + response.status);
    const declaredLength = Number(response.headers.get("content-length") || 0);
    if (declaredLength > MAX_FEED_BYTES) throw new Error("Feed is larger than the 1 MB limit.");
    const xml = await response.text();
    if (xml.length > MAX_FEED_BYTES) throw new Error("Feed is larger than the 1 MB limit.");

    const blocks = [...xml.matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi)].slice(0, 30);
    const items = blocks.map((match) => {
      const block = match[2];
      const title = tagValue(block, "title");
      const description = tagValue(block, "description") || tagValue(block, "summary") || tagValue(block, "content");
      const date = tagValue(block, "pubDate") || tagValue(block, "published") || tagValue(block, "updated");
      const linkTag = block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*\/?\s*>/i);
      const linkText = tagValue(block, "link");
      let link = linkTag?.[1] || linkText;
      try { if (link) link = new URL(link, url).toString(); } catch { link = ""; }
      return { title, summary: description.slice(0, 500), publishedAt: date, link };
    }).filter((item) => item.title);

    return { configured: true, sourceUrl: feedUrl, fetchedAt: new Date().toISOString(), items, status: items.length ? "Feed loaded." : "Feed loaded but no RSS/Atom entries were recognised." };
  } catch (error) {
    return { configured: true, sourceUrl: feedUrl, fetchedAt: new Date().toISOString(), items: [], status: error instanceof Error ? error.message : "Could not load market feed." };
  }
}
