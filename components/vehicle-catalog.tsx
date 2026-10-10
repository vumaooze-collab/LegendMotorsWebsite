"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { VehicleImage } from "@/components/vehicle-image";
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
        <VehicleImage alt={altText} sizes="(max-width: 720px) 100vw, (max-width: 1000px) 50vw, 400px" src={primaryImage?.url} />
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
            <VehicleImage
              alt={vehicle.images.find((image) => image.isPrimary)?.altText ?? vehicle.images[0]?.altText ?? `${vehicle.make} ${vehicle.model}`}
              sizes="(max-width: 720px) 100vw, 760px"
              src={(vehicle.images.find((image) => image.isPrimary) ?? vehicle.images[0])?.url}
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
              <Link className="button button--dark" href="/#contact" onClick={onClose}>
                Enquire about this car <span aria-hidden="true">&#8594;</span>
              </Link>
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

export function VehicleCatalog({ featuredOnly = false }: { featuredOnly?: boolean }) {
  const pageSize = featuredOnly ? 48 : 24;
  const [search, setSearch] = useState("");
  const [selectedMake, setSelectedMake] = useState("all");
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedFuel, setSelectedFuel] = useState("all");
  const [selectedTransmission, setSelectedTransmission] = useState("all");
  const [selectedSort, setSelectedSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(0);
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
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    params.set("sort", selectedSort);
    if (selectedPrice === "under-40000000") params.set("maxPrice", "39999999.99");
    if (selectedPrice === "40000000-80000000") {
      params.set("minPrice", "40000000");
      params.set("maxPrice", "80000000");
    }
    if (selectedPrice === "over-80000000") params.set("minPrice", "80000000.01");

    fetch(`/api/vehicles${params.size ? `?${params.toString()}` : ""}`)
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load listings.");
        return response.json();
      })
      .then((result) => {
        if (!active) return;
        setLoadError(false);
        setVehicles(result.vehicles ?? []);
        setTotal(result.total ?? 0);
        setPageCount(result.pageCount ?? 0);
        if (result.pageCount > 0 && page > result.pageCount) {
          setPage(result.pageCount);
          return;
        }
      })
      .catch(() => {
        if (!active) return;
        setVehicles([]);
        setTotal(0);
        setPageCount(0);
        setLoadError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [search, selectedMake, selectedPrice, selectedYear, selectedFuel, selectedTransmission, selectedSort, page, pageSize]);

  const makes = [...new Set(vehicles.map((vehicle) => vehicle.make))].sort();
  const years = [...new Set(vehicles.map((vehicle) => vehicle.year))].sort((a, b) => b - a);
  const featuredVehicles = vehicles.filter((vehicle) => vehicle.featured);
  const matchingVehicles = vehicles;

  function resetFilters() {
    setLoading(true);
    setSearch("");
    setSelectedMake("all");
    setSelectedPrice("all");
    setSelectedYear("all");
    setSelectedFuel("all");
    setSelectedTransmission("all");
    setSelectedSort("recent");
    setPage(1);
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
            <p className="inventory-count" role="status">Loading available vehicles…</p>
          </div>
        ) : null}

        {featuredOnly && loadError && <div className="featured-empty" role="alert"><p className="eyebrow">The collection</p><h3>Listings are taking a moment.</h3><p>Please try again shortly, or contact Legend Motors directly about current availability.</p></div>}

        {featuredOnly && !loading && featuredVehicles.length > 0 ? (
          <div aria-label="Featured vehicles" className="featured-grid" id="featured-vehicles">
            {featuredVehicles.slice(0, 3).map((vehicle) => (
              <VehicleCard featured key={vehicle.id} onViewDetails={setSelectedVehicle} vehicle={vehicle} />
            ))}
          </div>
        ) : null}

        {featuredOnly && !loading && featuredVehicles.length === 0 && !loadError && (
          <div className="featured-empty">
            <p className="eyebrow">The collection</p>
            <h3>New listings are on the way.</h3>
            <p>Contact Legend Motors to discuss current availability or tell us what you are looking for.</p>
            <Link className="text-link" href="/vehicles">Explore all available vehicles <span aria-hidden="true">&#8594;</span></Link>
          </div>
        )}

        {featuredOnly && !loading && featuredVehicles.length > 0 && (
          <div className="featured-more"><Link className="button button--dark" href="/vehicles">Explore all vehicles <span aria-hidden="true">&#8594;</span></Link></div>
        )}

        {!featuredOnly && <div className="inventory-block" id="inventory">
          <div className="inventory-heading">
            <div>
              <p className="eyebrow">The full collection</p>
              <h2 className="section-heading" id="inventory-heading">
                Find your match.
              </h2>
            </div>
            <p aria-live="polite" className="inventory-count">
              {total} {total === 1 ? "vehicle" : "vehicles"}
            </p>
          </div>

          <div aria-label="Filter vehicle inventory" className="filter-panel">
            <div className="filter-field">
              <label htmlFor="vehicle-search">Search vehicles</label>
              <input
                autoComplete="off"
                id="vehicle-search"
                onChange={(event) => { setLoading(true); setSearch(event.target.value); setPage(1); }}
                placeholder="Try a make, model or body style"
                type="search"
                value={search}
              />
            </div>
            <div className="filter-field">
              <label htmlFor="make-filter">Make</label>
              <select id="make-filter" onChange={(event) => { setLoading(true); setSelectedMake(event.target.value); setPage(1); }} value={selectedMake}>
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
              <select id="price-filter" onChange={(event) => { setLoading(true); setSelectedPrice(event.target.value); setPage(1); }} value={selectedPrice}>
                <option value="all">Any price</option>
                <option value="under-40000000">Under MWK 40,000,000</option>
                <option value="40000000-80000000">MWK 40,000,000–80,000,000</option>
                <option value="over-80000000">Over MWK 80,000,000</option>
              </select>
            </div>
            <div className="filter-field">
              <label htmlFor="year-filter">Year</label>
              <select id="year-filter" onChange={(event) => { setLoading(true); setSelectedYear(event.target.value); setPage(1); }} value={selectedYear}>
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
              <select id="fuel-filter" onChange={(event) => { setLoading(true); setSelectedFuel(event.target.value); setPage(1); }} value={selectedFuel}>
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
                onChange={(event) => { setLoading(true); setSelectedTransmission(event.target.value); setPage(1); }}
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
            <div className="filter-field">
              <label htmlFor="sort-filter">Sort by</label>
              <select id="sort-filter" onChange={(event) => { setLoading(true); setSelectedSort(event.target.value); setPage(1); }} value={selectedSort}>
                <option value="recent">Recently added</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </select>
            </div>
            <button className="filter-reset" onClick={resetFilters} type="button">
              Reset filters
            </button>
          </div>

          {pageCount > 1 && !loadError && <nav aria-label="Vehicle result pages" className="catalog-pagination">
            <button className="filter-reset" disabled={page <= 1 || loading} onClick={() => { setLoading(true); setPage((current) => current - 1); }} type="button">Previous</button>
            <span aria-live="polite">Page {page} of {pageCount}</span>
            <button className="filter-reset" disabled={page >= pageCount || loading} onClick={() => { setLoading(true); setPage((current) => current + 1); }} type="button">Next</button>
          </nav>}

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
        </div>}
      </div>
      <VehicleDetailsDialog onClose={() => setSelectedVehicle(null)} vehicle={selectedVehicle} />
    </section>
  );
}
