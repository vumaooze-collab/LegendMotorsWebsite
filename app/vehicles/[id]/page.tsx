"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { PublicVehicle } from "@/lib/inventory";

type VehiclePageProps = {
    params: Promise<{ id: string }>;
};

export default function VehicleDetailsPage({ params }: VehiclePageProps) {
    const [vehicle, setVehicle] = useState<PublicVehicle | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadVehicle() {
            try {
                const { id } = await params;

                const response = await fetch(`/api/vehicles/${id}`, {
                    cache: "no-store",
                });

                if (!response.ok) {
                    throw new Error("Vehicle not found.");
                }

                const data = await response.json();
                setVehicle(data.vehicle);
            } catch {
                setError("We could not find this vehicle.");
            } finally {
                setLoading(false);
            }
        }

        loadVehicle();
    }, [params]);

    if (loading) {
        return (
            <main className="vehicle-details-page">
                <div className="vehicle-details-state">
                    Loading vehicle details...
                </div>
            </main>
        );
    }

    if (error || !vehicle) {
        return (
            <main className="vehicle-details-page">
                <div className="vehicle-details-state">
                    <h1>Vehicle not found</h1>
                    <p>This vehicle may no longer be available.</p>
                    <Link className="button button--orange" href="/vehicles">
                        Back to vehicles
                    </Link>
                </div>
            </main>
        );
    }

    const primaryImage =
        vehicle.images.find((image) => image.isPrimary)?.url ??
        vehicle.images[0]?.url;

    const title = [vehicle.year, vehicle.make, vehicle.model]
        .filter(Boolean)
        .join(" ");

    const formatPrice = new Intl.NumberFormat("en-MW").format(vehicle.price);

    const formatMileage = new Intl.NumberFormat("en-MW").format(
        vehicle.mileage,
    );

    return (
        <main className="vehicle-details-page">
            <section className="vehicle-details">
                <div className="vehicle-details__top">
                    <Link className="vehicle-details__back" href="/vehicles">
                        ← Back to vehicles
                    </Link>

                    <span className="vehicle-details__status">
                        {vehicle.status}
                    </span>
                </div>

                <div className="vehicle-details__grid">
                    <div className="vehicle-details__media">
                        {primaryImage ? (
                            <Image
                                src={primaryImage}
                                alt={vehicle.images[0]?.altText ?? title}
                                width={1200}
                                height={800}
                                className="vehicle-details__image"
                                priority
                            />
                        ) : (
                            <div className="vehicle-details__no-image">
                                No vehicle image available
                            </div>
                        )}
                    </div>

                    <div className="vehicle-details__content">
                        <p className="eyebrow">LEGEND MOTORS</p>

                        <h1>{title}</h1>

                        {vehicle.variant && (
                            <p className="vehicle-details__variant">
                                {vehicle.variant}
                            </p>
                        )}

                        <div className="vehicle-details__price">
                            {vehicle.currency} {formatPrice}
                        </div>

                        <div className="vehicle-details__specs">
                            <div>
                                <span>Mileage</span>
                                <strong>{formatMileage} km</strong>
                            </div>

                            <div>
                                <span>Transmission</span>
                                <strong>{vehicle.transmission}</strong>
                            </div>

                            <div>
                                <span>Fuel</span>
                                <strong>{vehicle.fuelType}</strong>
                            </div>

                            {vehicle.bodyType && (
                                <div>
                                    <span>Body type</span>
                                    <strong>{vehicle.bodyType}</strong>
                                </div>
                            )}

                            {vehicle.engine && (
                                <div>
                                    <span>Engine</span>
                                    <strong>{vehicle.engine}</strong>
                                </div>
                            )}

                            {vehicle.color && (
                                <div>
                                    <span>Colour</span>
                                    <strong>{vehicle.color}</strong>
                                </div>
                            )}

                            {vehicle.drivetrain && (
                                <div>
                                    <span>Drivetrain</span>
                                    <strong>{vehicle.drivetrain}</strong>
                                </div>
                            )}
                        </div>

                        <div className="vehicle-details__actions">
                            <Link className="button button--orange" href="/#contact">
                                Enquire about this vehicle →
                            </Link>

                            <Link className="button" href="/vehicles">
                                View all vehicles
                            </Link>
                        </div>
                    </div>
                </div>

                {(vehicle.description || vehicle.condition) && (
                    <div className="vehicle-details__description">
                        <div>
                            <p className="eyebrow">VEHICLE INFORMATION</p>
                            <h2>More about this vehicle</h2>
                        </div>

                        <div>
                            {vehicle.condition && (
                                <p>
                                    <strong>Condition:</strong> {vehicle.condition}
                                </p>
                            )}

                            {vehicle.description && <p>{vehicle.description}</p>}
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}