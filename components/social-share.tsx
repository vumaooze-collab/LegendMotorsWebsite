"use client";

import { useState } from "react";
import { whatsappUrl } from "@/data/business";

export function SocialShare({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  const url = typeof window !== "undefined" ? window.location.href : "";
  const encodedUrl = encodeURIComponent(url);

  return (
    <div className="social-share" aria-label={`Share ${title}`}>
      <span>Share</span>
      <a href={whatsappUrl(`${title}\n\n${text}\n\n${url}`)} rel="noopener noreferrer" target="_blank">WhatsApp</a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} rel="noopener noreferrer" target="_blank">Facebook</a>
      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} rel="noopener noreferrer" target="_blank">LinkedIn</a>
      <button onClick={copyLink} type="button">{copied ? "Copied" : "Copy link"}</button>
    </div>
  );
}
