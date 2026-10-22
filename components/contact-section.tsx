"use client";

import { useState, type FormEvent } from "react";
import { BUSINESS, whatsappUrl } from "@/data/business";

export function ContactSection() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const interest = String(data.get("interest") || "vehicle");
    const message = String(data.get("message") || "").trim();
    const website = String(data.get("website") || "");

    setSubmitting(true);
    setError("");
    setSent(false);

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, interest, message, website }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "We could not save your enquiry. Please try again.");
        return;
      }

      const text = [
        "Hello Legend Motors, I would like to make an enquiry.",
        `Name: ${name}`,
        `Phone: ${phone}`,
        `Interest: ${interest}`,
        `Message: ${message || "I would like more information."}`,
      ].join("\n");

      setSent(true);
      window.location.assign(whatsappUrl(text));
    } catch {
      setError("Connection problem. Please try again or contact the dealership directly on WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="contact-heading" className="contact-section" id="contact">
      <div className="section-shell contact-layout">
        <div className="contact-copy">
          <p className="eyebrow">Legend Motors sales desk</p>
          <h2 className="section-heading" id="contact-heading">Ready to find the right car?</h2>
          <p>
            Speak directly with Legend Motors about a vehicle, finance, sourcing or trade-in.
            Your enquiry is recorded for dealership follow-up and then sent to WhatsApp.
          </p>
          <dl className="contact-details">
            <div className="contact-detail"><dt>Phone / WhatsApp</dt><dd><a href={`tel:+${BUSINESS.phoneInternational}`}>{BUSINESS.phoneDisplay}</a></dd></div>
            <div className="contact-detail"><dt>Email</dt><dd><a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a></dd></div>
            <div className="contact-detail"><dt>Showroom</dt><dd>{BUSINESS.address}</dd></div>
            <div className="contact-detail"><dt>Hours</dt><dd>{BUSINESS.hours}</dd></div>
          </dl>
          <a className="whatsapp-link" href={whatsappUrl("Hello Legend Motors, I would like help finding a vehicle.")} rel="noopener noreferrer" target="_blank">
            <span aria-hidden="true" className="whatsapp-mark">W</span>
            Chat with sales on WhatsApp <span aria-hidden="true">↗</span>
          </a>
        </div>

        <form className="enquiry-form" onSubmit={handleSubmit}>
          <h3>Send a vehicle enquiry</h3>
          <p className="form-note">Your enquiry is saved for the dealership team, then WhatsApp opens so you can continue the conversation.</p>
          <div className="form-grid">
            <div className="form-field"><label htmlFor="enquiry-name">Your name</label><input autoComplete="name" id="enquiry-name" name="name" maxLength={100} required /></div>
            <div className="form-field"><label htmlFor="enquiry-phone">Phone / WhatsApp</label><input autoComplete="tel" id="enquiry-phone" name="phone" maxLength={30} required type="tel" /></div>
            <div className="form-field form-field--wide">
              <label htmlFor="enquiry-interest">What do you need?</label>
              <select defaultValue="vehicle" id="enquiry-interest" name="interest">
                <option value="vehicle">Buy a vehicle</option>
                <option value="finance">Finance enquiry</option>
                <option value="trade-in">Sell / trade in my vehicle</option>
                <option value="source">Source a vehicle</option>
                <option value="service">Service / parts enquiry</option>
              </select>
            </div>
            <div className="form-field form-field--wide"><label htmlFor="enquiry-message">Your message</label><textarea id="enquiry-message" name="message" maxLength={1500} placeholder="Tell us the make, model, budget or service you need." /></div>
            <div aria-hidden="true" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }}>
              <label htmlFor="enquiry-website">Leave this field empty</label>
              <input autoComplete="off" id="enquiry-website" name="website" tabIndex={-1} />
            </div>
          </div>
          <button className="button button--charcoal form-submit" type="submit" disabled={submitting}>
            {submitting ? "Saving enquiry…" : "Send to WhatsApp"} <span aria-hidden="true">→</span>
          </button>
          {error && <p className="form-status" role="alert">{error}</p>}
          {sent && <p className="form-status" role="status">Enquiry saved. Opening WhatsApp…</p>}
        </form>
      </div>
    </section>
  );
}
