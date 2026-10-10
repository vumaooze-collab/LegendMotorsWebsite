import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function VehicleNotFound() {
  return (
    <>
      <SiteHeader />
      <main className="vehicle-details-page">
        <div className="vehicle-details-state">
          <h1>Vehicle not found</h1>
          <p>This vehicle may no longer be available.</p>
          <Link className="button button--orange" href="/vehicles">Back to vehicles</Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
