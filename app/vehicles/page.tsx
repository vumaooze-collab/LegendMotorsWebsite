import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { VehicleCatalog } from "@/components/vehicle-catalog";

export const metadata: Metadata = {
    title: "Vehicles",
    description:
        "Browse available vehicles from Legend Motors Malawi.",
};

export default function VehiclesPage() {
    return (
        <>
            <SiteHeader />

            <main>
                <section className="inventory-page-hero">
                    <div className="inventory-page-hero__content">
                        <p className="eyebrow">LEGEND MOTORS INVENTORY</p>

                        <h1>Find the right vehicle.</h1>

                        <p>
                            Browse our available vehicles, compare specifications,
                            and enquire directly with Legend Motors.
                        </p>
                    </div>
                </section>

                <VehicleCatalog />
            </main>

            <SiteFooter />
        </>
    );
}