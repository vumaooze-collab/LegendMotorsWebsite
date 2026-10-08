// Legacy development fixture only. Production inventory is read from Prisma through the vehicle API.
export type VehicleFuel = "Petrol" | "Hybrid" | "Electric" | "Diesel";
export type VehicleBody = "Coupe" | "Saloon" | "SUV" | "Hatchback" | "MPV";

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
    id: "toyota-harrier-2023",
    year: 2023,
    make: "Toyota",
    model: "Harrier",
    price: 105000000,
    mileage: 77000,
    transmission: "Automatic",
    fuel: "Petrol",
    body: "SUV",
    image: "https://img4.autoyas.com/655/476/1589168216554764.jpg",
    imageAlt: "2023 Toyota Harrier presented by Legend Motors Malawi",
    description: "2023 Toyota Harrier with 77,000 km. Publicly posted by Legend Motors Malawi at MK105,000,000. Confirm current availability and final price directly with the dealership.",
    featured: true,
  },
  {
    id: "toyota-rav4-adventure-2021",
    year: 2021,
    make: "Toyota",
    model: "RAV4 Adventure",
    price: 135000000,
    mileage: 47000,
    transmission: "Automatic",
    fuel: "Petrol",
    body: "SUV",
    image: "https://img3.autoyas.com/638/738/1590841966387389.jpg",
    imageAlt: "2021 Toyota RAV4 Adventure presented by Legend Motors Malawi",
    description: "2021 Toyota RAV4 Adventure with 47,000 km, automatic transmission and 1,980cc engine. Publicly posted at MK135,000,000. Confirm current availability directly.",
    featured: true,
  },
  {
    id: "mercedes-benz-c200-2016",
    year: 2016,
    make: "Mercedes-Benz",
    model: "C200",
    price: 65000000,
    mileage: 92000,
    transmission: "Automatic",
    fuel: "Petrol",
    body: "Saloon",
    image: "https://img5.autoyas.com/971/571/1590892049715714.jpg",
    imageAlt: "2016 Mercedes-Benz C200 presented by Legend Motors Malawi",
    description: "2016 Mercedes-Benz C200 with 92,000 km, petrol and automatic transmission. Publicly posted at MK65,000,000 negotiable. Confirm availability and terms.",
    featured: true,
  },
  {
    id: "suzuki-escudo-2016",
    year: 2016,
    make: "Suzuki",
    model: "Escudo (Vitara)",
    price: 58000000,
    mileage: 60000,
    transmission: "Automatic",
    fuel: "Petrol",
    body: "SUV",
    image: "https://img4.autoyas.com/653/989/1589316866539899.jpg",
    imageAlt: "2016 Suzuki Escudo Vitara presented by Legend Motors Malawi",
    description: "2016 Suzuki Escudo (Vitara), 60,000 km, petrol, automatic and 1,600cc. Publicly posted at MK58,000,000 negotiable. Confirm availability directly.",
    featured: false,
  },
  {
    id: "toyota-voxy-2015",
    year: 2015,
    make: "Toyota",
    model: "Voxy",
    price: 50000000,
    mileage: 42000,
    transmission: "Automatic",
    fuel: "Petrol",
    body: "MPV",
    image: "https://img3.autoyas.com/961/784/1591870769617842.jpg",
    imageAlt: "2015 Toyota Voxy presented by Legend Motors Malawi",
    description: "2015 Toyota Voxy with 42,000 km, petrol and automatic transmission. Publicly posted at MK50,000,000 negotiable. Confirm current availability.",
    featured: false,
  },
  {
    id: "honda-vezel-hybrid-2015",
    year: 2015,
    make: "Honda",
    model: "Vezel Hybrid",
    price: 34500000,
    mileage: 64000,
    transmission: "Automatic",
    fuel: "Hybrid",
    body: "SUV",
    image: "https://img3.autoyas.com/324/484/1588934063244846.jpg",
    imageAlt: "2015 Honda Vezel Hybrid presented by Legend Motors Malawi",
    description: "2015 Honda Vezel Hybrid with 64,000 km, 1,500cc and automatic transmission. Publicly posted at MK34,500,000 negotiable. Confirm current availability.",
    featured: false,
  },
];

export function formatDemoPrice(price: number): string {
  return `MK ${new Intl.NumberFormat("en-US").format(price)}`;
}

export function formatMileage(mileage: number): string {
  return `${new Intl.NumberFormat("en-US").format(mileage)} km`;
}
