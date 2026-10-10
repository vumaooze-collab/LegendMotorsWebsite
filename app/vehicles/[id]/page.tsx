import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { VehicleGallery } from "@/components/vehicle-gallery";
import { getPublicVehicle } from "@/lib/inventory";

type VehiclePageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: VehiclePageProps): Promise<Metadata> {
  const { id } = await params;
  const vehicle = await getPublicVehicle(id);
  if (!vehicle) return { title: "Vehicle not found | Legend Motors" };
  return {
    title: `${vehicle.year} ${vehicle.make} ${vehicle.model} | Legend Motors`,
    description: vehicle.description ?? `View the ${vehicle.year} ${vehicle.make} ${vehicle.model} at Legend Motors.`,
  };
}

export default async function VehicleDetailsPage({ params }: VehiclePageProps) {
  const { id } = await params;
  const vehicle = await getPublicVehicle(id);
  if (!vehicle) notFound();

  const title = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ");
  const formatPrice = new Intl.NumberFormat("en-MW", { maximumFractionDigits: 0 }).format(vehicle.price);
  const formatMileage = new Intl.NumberFormat("en-MW", { maximumFractionDigits: 0 }).format(vehicle.mileage);

  return (
    <>
      <SiteHeader />
      <main className="vehicle-details-page">
        <section className="vehicle-details">
          <div className="vehicle-details__top">
            <Link className="vehicle-details__back" href="/vehicles">&#8592; Back to vehicles</Link>
            <span className="vehicle-details__status">{vehicle.status}</span>
          </div>

          <div className="vehicle-details__grid">
            <div className="vehicle-details__media">
              <VehicleGallery images={vehicle.images} title={title} />
            </div>

            <div className="vehicle-details__content">
              <p className="eyebrow">LEGEND MOTORS</p>
              <h1>{title}</h1>
              {vehicle.variant && <p className="vehicle-details__variant">{vehicle.variant}</p>}
              <div className="vehicle-details__price">{vehicle.currency} {formatPrice}</div>

              <div className="vehicle-details__specs">
                <div><span>Mileage</span><strong>{formatMileage} km</strong></div>
                <div><span>Transmission</span><strong>{vehicle.transmission}</strong></div>
                <div><span>Fuel</span><strong>{vehicle.fuelType}</strong></div>
                {vehicle.bodyType && <div><span>Body type</span><strong>{vehicle.bodyType}</strong></div>}
                {vehicle.engine && <div><span>Engine</span><strong>{vehicle.engine}</strong></div>}
                {vehicle.color && <div><span>Colour</span><strong>{vehicle.color}</strong></div>}
                {vehicle.drivetrain && <div><span>Drivetrain</span><strong>{vehicle.drivetrain}</strong></div>}
              </div>

              <div className="vehicle-details__actions">
                <Link className="button button--orange" href="/#contact">Enquire about this vehicle &#8594;</Link>
                <Link className="button" href="/vehicles">View all vehicles</Link>
              </div>
            </div>
          </div>

          {(vehicle.description || vehicle.condition) && (
            <div className="vehicle-details__description">
              <div><p className="eyebrow">VEHICLE INFORMATION</p><h2>More about this vehicle</h2></div>
              <div>
                {vehicle.condition && <p><strong>Condition:</strong> {vehicle.condition}</p>}
                {vehicle.description && <p>{vehicle.description}</p>}
              </div>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
