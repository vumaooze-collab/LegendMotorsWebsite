"use client";

import { useState, type FormEvent } from "react";

export function ContactSection() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <section aria-labelledby="contact-heading" className="contact-section" id="contact">
      <div className="section-shell contact-layout">
        <div className="contact-copy">
          <p className="eyebrow">Let&apos;s talk cars</p>
          <h2 className="section-heading" id="contact-heading">
            Your next move starts with a conversation.
          </h2>
          <p>
            Ask about a vehicle, discuss finance options or tell us what you are looking for. Verified business contact details will be added here before launch.
          </p>
          <dl className="contact-details">
            <div className="contact-detail">
              <dt>Phone</dt>
              <dd>Contact number to be confirmed</dd>
            </div>
            <div className="contact-detail">
              <dt>Email</dt>
              <dd>Email address to be confirmed</dd>
            </div>
            <div className="contact-detail">
              <dt>Showroom</dt>
              <dd>Location details to be confirmed</dd>
            </div>
          </dl>
          <a
            className="whatsapp-link"
            href="https://wa.me/?text=Hello%20Legend%20Motors%2C%20I%27d%20like%20to%20make%20a%20vehicle%20enquiry."
            rel="noopener noreferrer"
            target="_blank"
          >
            <span aria-hidden="true" className="whatsapp-mark">
              W
            </span>
            Start a WhatsApp enquiry <span aria-hidden="true">&#8599;</span>
          </a>
          <span className="whatsapp-note">Business WhatsApp number must be configured before launch.</span>
        </div>

        <form className="enquiry-form" onSubmit={handleSubmit}>
          <h3>Send an enquiry</h3>
          <p className="form-note">
            Demo form only. Your details stay in this browser and are not sent or stored.
          </p>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="enquiry-name">Your name</label>
              <input autoComplete="name" id="enquiry-name" name="name" required />
            </div>
            <div className="form-field">
              <label htmlFor="enquiry-email">Email address</label>
              <input autoComplete="email" id="enquiry-email" name="email" required type="email" />
            </div>
            <div className="form-field form-field--wide">
              <label htmlFor="enquiry-interest">What are you interested in?</label>
              <select defaultValue="vehicle" id="enquiry-interest" name="interest">
                <option value="vehicle">A vehicle in the collection</option>
                <option value="finance">Finance conversation</option>
                <option value="part-exchange">Part exchange enquiry</option>
                <option value="other">Something else</option>
              </select>
            </div>
            <div className="form-field form-field--wide">
              <label htmlFor="enquiry-message">Your message</label>
              <textarea id="enquiry-message" name="message" placeholder="Tell us a little about what you are looking for." />
            </div>
          </div>
          <button className="button button--dark form-submit" type="submit">
            Preview enquiry <span aria-hidden="true">&#8594;</span>
          </button>
          {submitted && (
            <p className="form-status" role="status">
              Preview complete. Nothing was sent. Connect a verified contact destination to enable enquiries.
            </p>
          )}
        </form>
      </div>
    </section>
  );
}