"use client";

import Link from "next/link";

export default function VehiclePageError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="vehicle-details-page">
      <div className="vehicle-details-state" role="alert">
        <h1>Vehicle details are unavailable</h1>
        <p>We could not load this listing just now. Please try again or browse the current inventory.</p>
        <div className="vehicle-details__actions">
          <button className="button button--orange" onClick={() => retry()} type="button">Try again</button>
          <Link className="button" href="/vehicles">Browse vehicles</Link>
        </div>
      </div>
    </main>
  );
}
