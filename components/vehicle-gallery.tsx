"use client";

import { useState } from "react";

import { VehicleImage } from "@/components/vehicle-image";
import type { PublicVehicle } from "@/lib/inventory";

type VehiclePhoto = PublicVehicle["images"][number];

export function VehicleGallery({ images, title }: { images: VehiclePhoto[]; title: string }) {
  const primary = images.find((image) => image.isPrimary) ?? images[0];
  const [selectedId, setSelectedId] = useState<string | undefined>(primary?.id);
  const selected = images.find((image) => image.id === selectedId) ?? primary;

  return (
    <section aria-label={`${title} photographs`} className="vehicle-gallery">
      <div className="vehicle-gallery__main">
        <VehicleImage
          alt={selected?.altText ?? `${title} vehicle photograph`}
          className="vehicle-gallery__image"
          sizes="(max-width: 900px) 100vw, 65vw"
          src={selected?.url}
        />
        {!selected && <p className="vehicle-gallery__note">The dealership will add photographs for this vehicle.</p>}
      </div>
      {images.length > 1 && (
        <div className="vehicle-gallery__thumbnails" aria-label="Choose a vehicle photograph">
          {images.map((image, index) => (
            <button
              aria-label={`Show photograph ${index + 1} of ${images.length}`}
              aria-pressed={image.id === selected?.id}
              className="vehicle-gallery__thumbnail"
              key={image.id}
              onClick={() => setSelectedId(image.id)}
              type="button"
            >
              <VehicleImage
                alt={image.altText ?? `${title}, photograph ${index + 1}`}
                sizes="120px"
                src={image.url}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
