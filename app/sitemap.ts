// app/sitemap.ts

import type { MetadataRoute } from "next";
import { CITY_REGISTRY } from "@/config/cities.config";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.maison-delux.com";

  const localizedPages = ["fr", "ar"].flatMap((locale) => [
    {
      url: `${baseUrl}/${locale}/cities`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    ...CITY_REGISTRY.filter((city) => city.cityPage.publicVisible).map((city) => ({
      url: `${baseUrl}/${locale}/cities/${city.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: city.slug === "casablanca" ? 0.9 : 0.6,
    })),
    {
      url: `${baseUrl}/${locale}/cities/casablanca/estimate`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.9,
    },
  ]);

  return [
    {
      url: `${baseUrl}/fr`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/ar`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...localizedPages,
  ];
}
