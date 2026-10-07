"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  DEMO_VEHICLES,
  formatDemoPrice,
  formatMileage,
  type Vehicle,
} from "@/data/vehicles";

function vehicleName(vehicle: Vehicle): string {
  return `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
}

function VehicleCard({
  vehicle,
  featured = false,
  onViewDetails,
}: {
  vehicle: Vehicle;
  featured?: boolean;
  onViewDetails: (vehicle: Vehicle) => void;
}) {
  return (
    <article className="vehicle-card">
      <div className="vehicle-card__image">
        <Image
          alt={vehicle.imageAlt}
          fill
          unoptimized
          sizes="(max-width: 720px) 100vw, (max-width: 1000px) 50vw, 400px"
          src={vehicle.image}
        />
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
            {formatDemoPrice(vehicle.price)}
            <small>demo price</small>
          </div>
        </div>
        <div className="vehicle-card__specs" aria-label="Vehicle specifications">
          <span className="vehicle-card__spec">{formatMileage(vehicle.mileage)}</span>
          <span className="vehicle-card__spec">{vehicle.transmission}</span>
          <span className="vehicle-card__spec">{vehicle.fuel}</span>
          <span className="vehicle-card__spec">{vehicle.body}</span>
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
  vehicle: Vehicle | null;
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
            <Image
              alt={vehicle.imageAlt}
              fill
              unoptimized
              sizes="(max-width: 720px) 100vw, 760px"
              src={vehicle.image}
            />
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
                <p className="eyebrow">Demo vehicle details</p>
                <h2 id="vehicle-dialog-title">{vehicleName(vehicle)}</h2>
              </div>
              <span className="vehicle-dialog__price">{formatDemoPrice(vehicle.price)}</span>
            </div>
            <div className="vehicle-dialog__specs">
              <span>{formatMileage(vehicle.mileage)}</span>
              <span>{vehicle.transmission}</span>
              <span>{vehicle.fuel}</span>
              <span>{vehicle.body}</span>
            </div>
            <p className="vehicle-dialog__description">{vehicle.description}</p>
            <p className="demo-price-note">
              Demonstration listing only. Price, specification, condition and availability are not verified.
            </p>
            <div className="vehicle-dialog__actions">
              <a className="button button--dark" href="#contact" onClick={onClose}>
                Enquire about this car <span aria-hidden="true">&#8594;</span>
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
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const makes = [...new Set(DEMO_VEHICLES.map((vehicle) => vehicle.make))].sort();
  const years = [...new Set(DEMO_VEHICLES.map((vehicle) => vehicle.year))].sort((a, b) => b - a);
  const featuredVehicles = DEMO_VEHICLES.filter((vehicle) => vehicle.featured);
  const normalizedSearch = search.trim().toLowerCase();
  const matchingVehicles = DEMO_VEHICLES.filter((vehicle) => {
    const searchableText = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.body} ${vehicle.fuel} ${vehicle.transmission}`.toLowerCase();
    return (
      (!normalizedSearch || searchableText.includes(normalizedSearch)) &&
      (selectedMake === "all" || vehicle.make === selectedMake) &&
      (selectedPrice === "all" ||
        (selectedPrice === "under-40000" && vehicle.price < 40000) ||
        (selectedPrice === "40000-60000" && vehicle.price >= 40000 && vehicle.price <= 60000) ||
        (selectedPrice === "over-60000" && vehicle.price > 60000)) &&
      (selectedYear === "all" || vehicle.year.toString() === selectedYear) &&
      (selectedFuel === "all" || vehicle.fuel === selectedFuel) &&
      (selectedTransmission === "all" || vehicle.transmission === selectedTransmission)
    );
  });

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
            A selection of demo listings to help you picture the collection. Vehicle details and pricing are illustrative.
          </p>
        </div>

        <div aria-label="Featured demo vehicles" className="featured-grid" id="featured-vehicles">
          {featuredVehicles.map((vehicle) => (
            <VehicleCard
              featured
              key={vehicle.id}
              onViewDetails={setSelectedVehicle}
              vehicle={vehicle}
            />
          ))}
        </div>

        <div className="inventory-block" id="inventory">
          <div className="inventory-heading">
            <div>
              <p className="eyebrow">The full collection</p>
              <h2 className="section-heading" id="inventory-heading">
                Find your match.
              </h2>
            </div>
            <p aria-live="polite" className="inventory-count">
              {matchingVehicles.length} demo {matchingVehicles.length === 1 ? "vehicle" : "vehicles"}
            </p>
          </div>

          <div aria-label="Filter demo vehicle inventory" className="filter-panel">
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
                <option value="under-40000">Under $40,000</option>
                <option value="40000-60000">$40,000–$60,000</option>
                <option value="over-60000">Over $60,000</option>
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
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Petrol">Petrol</option>
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
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
              </select>
            </div>
            <button className="filter-reset" onClick={resetFilters} type="button">
              Reset filters
            </button>
          </div>

          <div aria-labelledby="inventory-heading" className="inventory-grid">
            {matchingVehicles.length > 0 ? (
              matchingVehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} onViewDetails={setSelectedVehicle} vehicle={vehicle} />
              ))
            ) : (
              <div className="empty-state">
                <h3>No demo vehicles match those filters</h3>
                <p>Try a different search or reset the filters to see the full collection.</p>
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