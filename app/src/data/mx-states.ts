/**
 * Los 32 estados de México, replicados desde
 * `pipeline/reference/region_registry.yaml` (fuente de verdad del pipeline).
 *
 * `next export` necesita conocer los params de rutas dinámicas en build time,
 * así que esta lista estática permite `generateStaticParams()` en
 * `/estatal/[estado]` sin tener que parsear YAML desde el frontend.
 *
 * Si `region_registry.yaml` cambia, actualizar aquí también.
 */
export interface MxState {
  code: string; // clave de entidad INEGI, 2 dígitos
  name: string;
  abbr: string;
  slug: string; // usado en la URL /estatal/[estado]
  border: boolean; // colinda con EEUU
}

export const MX_STATES: MxState[] = [
  { code: "01", name: "Aguascalientes", abbr: "AGU", slug: "aguascalientes", border: false },
  { code: "02", name: "Baja California", abbr: "BC", slug: "baja-california", border: true },
  { code: "03", name: "Baja California Sur", abbr: "BCS", slug: "baja-california-sur", border: false },
  { code: "04", name: "Campeche", abbr: "CAM", slug: "campeche", border: false },
  { code: "05", name: "Coahuila", abbr: "COA", slug: "coahuila", border: true },
  { code: "06", name: "Colima", abbr: "COL", slug: "colima", border: false },
  { code: "07", name: "Chiapas", abbr: "CHP", slug: "chiapas", border: false },
  { code: "08", name: "Chihuahua", abbr: "CHH", slug: "chihuahua", border: true },
  { code: "09", name: "Ciudad de México", abbr: "CDMX", slug: "ciudad-de-mexico", border: false },
  { code: "10", name: "Durango", abbr: "DUR", slug: "durango", border: false },
  { code: "11", name: "Guanajuato", abbr: "GUA", slug: "guanajuato", border: false },
  { code: "12", name: "Guerrero", abbr: "GRO", slug: "guerrero", border: false },
  { code: "13", name: "Hidalgo", abbr: "HID", slug: "hidalgo", border: false },
  { code: "14", name: "Jalisco", abbr: "JAL", slug: "jalisco", border: false },
  { code: "15", name: "México", abbr: "MEX", slug: "estado-de-mexico", border: false },
  { code: "16", name: "Michoacán", abbr: "MIC", slug: "michoacan", border: false },
  { code: "17", name: "Morelos", abbr: "MOR", slug: "morelos", border: false },
  { code: "18", name: "Nayarit", abbr: "NAY", slug: "nayarit", border: false },
  { code: "19", name: "Nuevo León", abbr: "NL", slug: "nuevo-leon", border: true },
  { code: "20", name: "Oaxaca", abbr: "OAX", slug: "oaxaca", border: false },
  { code: "21", name: "Puebla", abbr: "PUE", slug: "puebla", border: false },
  { code: "22", name: "Querétaro", abbr: "QUE", slug: "queretaro", border: false },
  { code: "23", name: "Quintana Roo", abbr: "ROO", slug: "quintana-roo", border: false },
  { code: "24", name: "San Luis Potosí", abbr: "SLP", slug: "san-luis-potosi", border: false },
  { code: "25", name: "Sinaloa", abbr: "SIN", slug: "sinaloa", border: false },
  { code: "26", name: "Sonora", abbr: "SON", slug: "sonora", border: true },
  { code: "27", name: "Tabasco", abbr: "TAB", slug: "tabasco", border: false },
  { code: "28", name: "Tamaulipas", abbr: "TAM", slug: "tamaulipas", border: true },
  { code: "29", name: "Tlaxcala", abbr: "TLA", slug: "tlaxcala", border: false },
  { code: "30", name: "Veracruz", abbr: "VER", slug: "veracruz", border: false },
  { code: "31", name: "Yucatán", abbr: "YUC", slug: "yucatan", border: false },
  { code: "32", name: "Zacatecas", abbr: "ZAC", slug: "zacatecas", border: false },
];

export function getMxStateBySlug(slug: string): MxState | undefined {
  return MX_STATES.find((s) => s.slug === slug);
}

export function getMxStateByCode(code: string): MxState | undefined {
  return MX_STATES.find((s) => s.code === code);
}
