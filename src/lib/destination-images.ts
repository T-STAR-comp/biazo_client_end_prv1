/** Locally hosted destination photos (sourced from Unsplash, city-matched). */
export const HERO_IMAGE = "/images/hero-airplane.jpg";

export const destinationImages = {
  "Cape Town": {
    src: "/images/destinations/cape-town.jpg",
    alt: "Table Mountain overlooking Cape Town at dusk",
  },
  Nairobi: {
    src: "/images/destinations/nairobi.jpg",
    alt: "Nairobi skyline on a sunny day, Kenya",
  },
  Marrakech: {
    src: "/images/destinations/marrakech.jpg",
    alt: "Koutoubia Mosque and Jemaa el-Fnaa square at sunset, Marrakech",
  },
  Zanzibar: {
    src: "/images/destinations/zanzibar.jpg",
    alt: "Aerial view of Stone Town on the coast, Zanzibar",
  },
  Lagos: {
    src: "/images/destinations/lagos.jpg",
    alt: "Lekki-Ikoyi Link Bridge over the lagoon, Lagos",
  },
  Kigali: {
    src: "/images/destinations/kigali.jpg",
    alt: "Kigali city skyline at sunset, Rwanda",
  },
  Cairo: {
    src: "/images/destinations/cairo.jpg",
    alt: "The Pyramids of Giza and the Sphinx, Egypt",
  },
  Accra: {
    src: "/images/destinations/accra.jpg",
    alt: "Accra city skyline, Ghana",
  },
  Lilongwe: {
    src: "/images/destinations/lilongwe.jpg",
    alt: "Lake Malawi surrounded by mountains, Malawi",
  },
  Windhoek: {
    src: "/images/destinations/windhoek.jpg",
    alt: "Windhoek city street with modern buildings, Namibia",
  },
  "Addis Ababa": {
    src: "/images/destinations/addis-ababa.jpg",
    alt: "Addis Ababa city skyline with high-rise buildings, Ethiopia",
  },
  Dakar: {
    src: "/images/destinations/dakar.jpg",
    alt: "Dakar city skyline across the water, Senegal",
  },
} as const;

export type DestinationCity = keyof typeof destinationImages;

export function getDestinationImage(city: string) {
  return destinationImages[city as DestinationCity];
}
