"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import type { PublicVehicle } from "@/lib/inventory";

function vehicleName(vehicle: PublicVehicle): string {
  return `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
}

function formatPrice(value: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function VehicleCard({
  vehicle,
  featured = false,
  onViewDetails,
}: {
  vehicle: PublicVehicle;
  featured?: boolean;
  onViewDetails: (vehicle: PublicVehicle) => void;
}) {
  const primaryImage = vehicle.images.find((image) => image.isPrimary) ?? vehicle.images[0];
  const altText = primaryImage?.altText ?? `${vehicle.make} ${vehicle.model}`;

  return (
    <article className="vehicle-card">
      <div className="vehicle-card__image">
        {primaryImage ? (
          <Image alt={altText} fill unoptimized sizes="(max-width: 720px) 100vw, (max-width: 1000px) 50vw, 400px" src={primaryImage.url} />
        ) : <div aria-label="Vehicle image unavailable" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#68716d", background: "#e8ece9" }}>Image unavailable</div>}
        {featured && <span className="vehicle-card__badge">Featured</span>}
      </div>
      <div className="vehicle-card__body">
        <div className="vehicle-card__topline">
          <div>
            <h3 className="vehicle-card__title">
              {vehicle.make} {vehicle.model}
            </h3>
            <span className="vehicle-card__year">{vehicle.year} model</span>
          </div>
          <div className="vehicle-card__price">
            {formatPrice(vehicle.price, vehicle.currency)}
            <small>public listing price</small>
          </div>
        </div>
        <div className="vehicle-card__specs" aria-label="Vehicle specifications">
          <span className="vehicle-card__spec">{vehicle.mileage.toLocaleString()} km</span>
          <span className="vehicle-card__spec">{vehicle.transmission}</span>
          <span className="vehicle-card__spec">{vehicle.fuelType}</span>
          <span className="vehicle-card__spec">{vehicle.bodyType ?? "Vehicle"}</span>
        </div>
        <button
          aria-label={`View details for ${vehicleName(vehicle)}`}
          className="vehicle-card__action"
          onClick={() => onViewDetails(vehicle)}
          type="button"
        >
          <span>View vehicle details</span>
          <span aria-hidden="true">&#8594;</span>
        </button>
      </div>
    </article>
  );
}

function VehicleDetailsDialog({
  vehicle,
  onClose,
}: {
  vehicle: PublicVehicle | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (vehicle && !dialog.open) {
      dialog.showModal();
    } else if (!vehicle && dialog.open) {
      dialog.close();
    }
  }, [vehicle]);

  return (
    <dialog
      aria-labelledby="vehicle-dialog-title"
      className="vehicle-dialog"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        }
      }}
      onClose={onClose}
      ref={dialogRef}
    >
      {vehicle && (
        <>
          <div className="vehicle-dialog__image">
            {vehicle.images.length > 0 ? (
              <Image
                alt={vehicle.images.find((image) => image.isPrimary)?.altText ?? vehicle.images[0].altText ?? `${vehicle.make} ${vehicle.model}`}
                fill
                unoptimized
                sizes="(max-width: 720px) 100vw, 760px"
                src={(vehicle.images.find((image) => image.isPrimary) ?? vehicle.images[0]).url}
              />
            ) : <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#68716d", background: "#e8ece9" }}>Image unavailable</div>}
            <button
              aria-label="Close vehicle details"
              className="vehicle-dialog__close"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>
          <div className="vehicle-dialog__content">
            <div className="vehicle-dialog__top">
              <div>
                <p className="eyebrow">Vehicle details</p>
                <h2 id="vehicle-dialog-title">{vehicleName(vehicle)}</h2>
              </div>
              <span className="vehicle-dialog__price">{formatPrice(vehicle.price, vehicle.currency)}</span>
            </div>
            <div className="vehicle-dialog__specs">
              <span>{vehicle.mileage.toLocaleString()} km</span>
              <span>{vehicle.transmission}</span>
              <span>{vehicle.fuelType}</span>
              <span>{vehicle.bodyType ?? "Vehicle"}</span>
            </div>
            <p className="vehicle-dialog__description">
              {vehicle.description ?? "Please contact Legend Motors for the latest condition and specification details."}
            </p>
            <p className="demo-price-note">
              Listing status and availability are confirmed by the dealership before publication. Final pricing and condition must be confirmed directly with Legend Motors Malawi.
            </p>
            <div className="vehicle-dialog__actions">
              <a className="button button--dark" href="/#contact" onClick={onClose}>
                Enquire about this car <span aria-hidden="true">&#8594;</span>
              </a>
              <a className="button button--outline-dark" href={`/vehicles/${vehicle.id}`} onClick={onClose}>
                Full vehicle page
              </a>
              <button className="button button--outline-dark" onClick={onClose} type="button">
                <span className="dialog-close-label">Back to vehicles</span>
              </button>
            </div>
          </div>
        </>
      )}
    </dialog>
  );
}

export function VehicleCatalog() {
  const [search, setSearch] = useState("");
  const [selectedMake, setSelectedMake] = useState("all");
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedFuel, setSelectedFuel] = useState("all");
  const [selectedTransmission, setSelectedTransmission] = useState("all");
  const [selectedVehicle, setSelectedVehicle] = useState<PublicVehicle | null>(null);
  const [vehicles, setVehicles] = useState<PublicVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (selectedMake !== "all") params.set("make", selectedMake);
    if (selectedYear !== "all") params.set("year", selectedYear);
    if (selectedFuel !== "all") params.set("fuelType", selectedFuel);
    if (selectedTransmission !== "all") params.set("transmission", selectedTransmission);
    if (selectedPrice === "under-40000000") params.set("maxPrice", "39999999.99");
    if (selectedPrice === "40000000-80000000") {
      params.set("minPrice", "40000000");
      params.set("maxPrice", "80000000");
    }
    if (selectedPrice === "over-80000000") params.set("minPrice", "80000000.01");

    setLoading(true);
    setLoadError(false);
    fetch(`/api/vehicles${params.size ? `?${params.toString()}` : ""}`)
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load listings.");
        return response.json();
      })
      .then((result) => {
        if (!active) return;
        setVehicles(result.vehicles ?? []);
      })
      .catch(() => {
        if (!active) return;
        setVehicles([]);
        setLoadError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [search, selectedMake, selectedPrice, selectedYear, selectedFuel, selectedTransmission]);

  const makes = [...new Set(vehicles.map((vehicle) => vehicle.make))].sort();
  const years = [...new Set(vehicles.map((vehicle) => vehicle.year))].sort((a, b) => b - a);
  const featuredVehicles = vehicles.filter((vehicle) => vehicle.featured);
  const matchingVehicles = vehicles;

  function resetFilters() {
    setSearch("");
    setSelectedMake("all");
    setSelectedPrice("all");
    setSelectedYear("all");
    setSelectedFuel("all");
    setSelectedTransmission("all");
  }

  return (
    <section aria-labelledby="featured-heading" className="catalog-section" id="vehicles">
      <div className="section-shell">
        <div className="catalog-topline">
          <div>
            <p className="eyebrow">Shop our selection</p>
            <h2 className="section-heading" id="featured-heading">
              Cars worth a closer look.
            </h2>
          </div>
          <p className="catalog-note">
            Inventory is delivered through the dealership inventory system and only includes published, public-facing vehicles.
          </p>
        </div>

        {loading ? (
          <div className="inventory-block">
            <p className="inventory-count">Loading vehicles…</p>
          </div>
        ) : null}

        {!loading && featuredVehicles.length > 0 ? (
          <div aria-label="Featured vehicles" className="featured-grid" id="featured-vehicles">
            {featuredVehicles.map((vehicle) => (
              <VehicleCard featured key={vehicle.id} onViewDetails={setSelectedVehicle} vehicle={vehicle} />
            ))}
          </div>
        ) : null}

        <div className="inventory-block" id="inventory">
          <div className="inventory-heading">
            <div>
              <p className="eyebrow">The full collection</p>
              <h2 className="section-heading" id="inventory-heading">
                Find your match.
              </h2>
            </div>
            <p aria-live="polite" className="inventory-count">
              {matchingVehicles.length} {matchingVehicles.length === 1 ? "vehicle" : "vehicles"}
            </p>
          </div>

          <div aria-label="Filter vehicle inventory" className="filter-panel">
            <div className="filter-field">
              <label htmlFor="vehicle-search">Search vehicles</label>
              <input
                autoComplete="off"
                id="vehicle-search"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Try a make, model or body style"
                type="search"
                value={search}
              />
            </div>
            <div className="filter-field">
              <label htmlFor="make-filter">Make</label>
              <select id="make-filter" onChange={(event) => setSelectedMake(event.target.value)} value={selectedMake}>
                <option value="all">All makes</option>
                {makes.map((make) => (
                  <option key={make} value={make}>
                    {make}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-field">
              <label htmlFor="price-filter">Price</label>
              <select id="price-filter" onChange={(event) => setSelectedPrice(event.target.value)} value={selectedPrice}>
                <option value="all">Any price</option>
                <option value="under-40000000">Under MWK 40,000,000</option>
                <option value="40000000-80000000">MWK 40,000,000–80,000,000</option>
                <option value="over-80000000">Over MWK 80,000,000</option>
              </select>
            </div>
            <div className="filter-field">
              <label htmlFor="year-filter">Year</label>
              <select id="year-filter" onChange={(event) => setSelectedYear(event.target.value)} value={selectedYear}>
                <option value="all">Any year</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-field">
              <label htmlFor="fuel-filter">Fuel type</label>
              <select id="fuel-filter" onChange={(event) => setSelectedFuel(event.target.value)} value={selectedFuel}>
                <option value="all">All fuel types</option>
                {[...new Set(vehicles.map((vehicle) => vehicle.fuelType))].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-field">
              <label htmlFor="transmission-filter">Transmission</label>
              <select
                id="transmission-filter"
                onChange={(event) => setSelectedTransmission(event.target.value)}
                value={selectedTransmission}
              >
                <option value="all">Any transmission</option>
                {[...new Set(vehicles.map((vehicle) => vehicle.transmission))].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <button className="filter-reset" onClick={resetFilters} type="button">
              Reset filters
            </button>
          </div>

          <div aria-labelledby="inventory-heading" className="inventory-grid">
            {loadError ? (
              <div className="empty-state" role="alert">
                <h3>Vehicle listings are temporarily unavailable</h3>
                <p>Please try again shortly or contact Legend Motors directly.</p>
              </div>
            ) : matchingVehicles.length > 0 ? (
              matchingVehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} onViewDetails={setSelectedVehicle} vehicle={vehicle} />
              ))
            ) : (
              <div className="empty-state">
                <h3>No vehicles match those filters</h3>
                <p>Try a different search or reset the filters to see all available stock.</p>
                <button className="text-link" onClick={resetFilters} type="button">
                  Reset search <span aria-hidden="true">&#8594;</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <VehicleDetailsDialog onClose={() => setSelectedVehicle(null)} vehicle={selectedVehicle} />
    </section>
  );
}
