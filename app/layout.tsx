import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Legend Motors | Quality Vehicles in Malawi",
    template: "%s | Legend Motors",
  },
  description:
    "Browse quality vehicles from Legend Motors Malawi. Explore available stock, enquire about vehicles and connect with our sales team.",
  openGraph: {
    title: "Legend Motors | Quality Vehicles in Malawi",
    description:
      "Browse available vehicles and connect directly with Legend Motors Malawi.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
