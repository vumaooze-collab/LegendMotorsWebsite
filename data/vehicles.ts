export type VehicleFuel = "Petrol" | "Hybrid" | "Electric";
export type VehicleBody = "Coupe" | "Saloon" | "SUV" | "Hatchback";

export interface Vehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  price: number;
  mileage: number;
  transmission: "Automatic" | "Manual";
  fuel: VehicleFuel;
  body: VehicleBody;
  image: string;
  imageAlt: string;
  description: string;
  featured: boolean;
}

export const DEMO_VEHICLES: Vehicle[] = [
  {
    id: "porsche-911-carrera-2022",
    year: 2022,
    make: "Porsche",
    model: "911 Carrera",
    price: 126900,
    mileage: 9800,
    transmission: "Automatic",
    fuel: "Petrol",
    body: "Coupe",
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Silver Porsche sports car on a quiet road",
    description:
      "A performance-focused coupe with a distinctive profile and a driver-first cabin. This listing is demonstration content; confirm specification and availability before publication.",
    featured: true,
  },
  {
    id: "bmw-5-series-530i-2023",
    year: 2023,
    make: "BMW",
    model: "5 Series 530i",
    price: 48500,
    mileage: 13200,
    transmission: "Automatic",
    fuel: "Petrol",
    body: "Saloon",
    image:
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Dark luxury saloon parked outdoors",
    description:
      "A refined executive saloon imagined for long-distance comfort and everyday use. Vehicle details and the displayed demo price are placeholders.",
    featured: true,
  },
  {
    id: "mercedes-benz-c-class-2022",
    year: 2022,
    make: "Mercedes-Benz",
    model: "C-Class C 300",
    price: 42800,
    mileage: 18450,
    transmission: "Automatic",
    fuel: "Hybrid",
    body: "Saloon",
    image:
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Modern silver Mercedes-Benz viewed from the front",
    description:
      "A contemporary saloon with a calm, premium feel and a thoughtfully designed interior. Confirm the exact vehicle specification before any real-world use.",
    featured: true,
  },
  {
    id: "audi-q5-premium-2023",
    year: 2023,
    make: "Audi",
    model: "Q5 Premium",
    price: 46750,
    mileage: 11600,
    transmission: "Automatic",
    fuel: "Petrol",
    body: "SUV",
    image:
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Dark performance SUV parked against an urban backdrop",
    description:
      "A versatile premium SUV presented here as a sample listing. Equipment, condition, mileage and pricing must be replaced with verified details.",
    featured: false,
  },
  {
    id: "lexus-rx-350-2022",
    year: 2022,
    make: "Lexus",
    model: "RX 350",
    price: 43900,
    mileage: 21100,
    transmission: "Automatic",
    fuel: "Hybrid",
    body: "SUV",
    image:
      "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "Premium SUV shown in a clean outdoor setting",
    description:
      "A comfort-oriented SUV concept for the sample inventory. Demo imagery and vehicle data are illustrative rather than an offer for sale.",
    featured: false,
  },
  {
    id: "tesla-model-3-long-range-2023",
    year: 2023,
    make: "Tesla",
    model: "Model 3 Long Range",
    price: 38250,
    mileage: 7900,
    transmission: "Automatic",
    fuel: "Electric",
    body: "Saloon",
    image:
      "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=85",
    imageAlt: "White electric sedan photographed from the front quarter",
    description:
      "An all-electric saloon sample listing with placeholder mileage and pricing. Replace this record with current, verified inventory data before launch.",
    featured: false,
  },
];

export function formatDemoPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatMileage(mileage: number): string {
  return `${new Intl.NumberFormat("en-US").format(mileage)} mi`;
}