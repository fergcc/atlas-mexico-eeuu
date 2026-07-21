/**
 * Las 13 provincias y territorios de Canadá, replicados desde el registro
 * del Engine y el adapter de StatCan.
 *
 * `next export` necesita conocer los params de rutas dinámicas en build time,
 * así que esta lista estática permite `generateStaticParams()` en
 * `/canadiense/[provincia]`.
 *
 * Si el registro cambia, actualizar aquí también.
 */
export interface CaProvince {
  code: string; // código StatCan, 2 dígitos
  name: string;
  abbr: string;
  slug: string; // usado en la URL /canadiense/[provincia]
  border_us: boolean; // colinda con EEUU
}

export const CA_PROVINCES: CaProvince[] = [
  { code: "10", name: "Newfoundland and Labrador", abbr: "NL", slug: "newfoundland-and-labrador", border_us: false },
  { code: "11", name: "Prince Edward Island", abbr: "PE", slug: "prince-edward-island", border_us: false },
  { code: "12", name: "Nova Scotia", abbr: "NS", slug: "nova-scotia", border_us: false },
  { code: "13", name: "New Brunswick", abbr: "NB", slug: "new-brunswick", border_us: true },
  { code: "24", name: "Quebec", abbr: "QC", slug: "quebec", border_us: true },
  { code: "35", name: "Ontario", abbr: "ON", slug: "ontario", border_us: true },
  { code: "46", name: "Manitoba", abbr: "MB", slug: "manitoba", border_us: true },
  { code: "47", name: "Saskatchewan", abbr: "SK", slug: "saskatchewan", border_us: true },
  { code: "48", name: "Alberta", abbr: "AB", slug: "alberta", border_us: true },
  { code: "59", name: "British Columbia", abbr: "BC", slug: "british-columbia", border_us: true },
  { code: "60", name: "Yukon", abbr: "YT", slug: "yukon", border_us: false },
  { code: "61", name: "Northwest Territories", abbr: "NT", slug: "northwest-territories", border_us: false },
  { code: "62", name: "Nunavut", abbr: "NU", slug: "nunavut", border_us: false },
];

export function getCaProvinceBySlug(slug: string): CaProvince | undefined {
  return CA_PROVINCES.find((s) => s.slug === slug);
}

export function getCaProvinceByCode(code: string): CaProvince | undefined {
  return CA_PROVINCES.find((s) => s.code === code);
}
