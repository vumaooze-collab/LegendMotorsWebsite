export const BUSINESS = {
  name: "Legend Motors Malawi",
  phoneDisplay: "+265 880 059 777",
  phoneInternational: "265880059777",
  email: "info@legendmotors.com",
  address: "ArtBridge House, Area 47, Sect. 5, Lilongwe, Malawi",
  hours: "Mon–Fri 8:00 AM–5:00 PM · Sat 9:00 AM–4:00 PM",
  website: "https://www.legendmotors.mw/",
} as const;

export function whatsappUrl(message: string) {
  return `https://wa.me/${BUSINESS.phoneInternational}?text=${encodeURIComponent(message)}`;
}

export function mailtoUrl(subject: string, body = "") {
  const params = new URLSearchParams({ subject, body });
  return `mailto:${BUSINESS.email}?${params.toString()}`;
}
