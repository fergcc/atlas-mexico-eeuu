/**
 * Los 50 estados + DC de Estados Unidos, replicados desde
 * `pipeline/reference/region_registry.yaml` (fuente de verdad del pipeline).
 *
 * `next export` necesita conocer los params de rutas dinámicas en build time,
 * así que esta lista estática permite `generateStaticParams()` en
 * `/estadounidense/[estado]` sin tener que parsear YAML desde el frontend.
 *
 * Si `region_registry.yaml` cambia, actualizar aquí también.
 */
export interface UsState {
  fips: string; // código FIPS, 2 dígitos
  name: string;
  abbr: string;
  slug: string; // usado en la URL /estadounidense/[estado]
  border_mx: boolean; // colinda con México
}

export const US_STATES: UsState[] = [
  { fips: "01", name: "Alabama", abbr: "AL", slug: "alabama", border_mx: false },
  { fips: "02", name: "Alaska", abbr: "AK", slug: "alaska", border_mx: false },
  { fips: "04", name: "Arizona", abbr: "AZ", slug: "arizona", border_mx: true },
  { fips: "05", name: "Arkansas", abbr: "AR", slug: "arkansas", border_mx: false },
  { fips: "06", name: "California", abbr: "CA", slug: "california", border_mx: true },
  { fips: "08", name: "Colorado", abbr: "CO", slug: "colorado", border_mx: false },
  { fips: "09", name: "Connecticut", abbr: "CT", slug: "connecticut", border_mx: false },
  { fips: "10", name: "Delaware", abbr: "DE", slug: "delaware", border_mx: false },
  { fips: "11", name: "District of Columbia", abbr: "DC", slug: "district-of-columbia", border_mx: false },
  { fips: "12", name: "Florida", abbr: "FL", slug: "florida", border_mx: false },
  { fips: "13", name: "Georgia", abbr: "GA", slug: "georgia", border_mx: false },
  { fips: "15", name: "Hawaii", abbr: "HI", slug: "hawaii", border_mx: false },
  { fips: "16", name: "Idaho", abbr: "ID", slug: "idaho", border_mx: false },
  { fips: "17", name: "Illinois", abbr: "IL", slug: "illinois", border_mx: false },
  { fips: "18", name: "Indiana", abbr: "IN", slug: "indiana", border_mx: false },
  { fips: "19", name: "Iowa", abbr: "IA", slug: "iowa", border_mx: false },
  { fips: "20", name: "Kansas", abbr: "KS", slug: "kansas", border_mx: false },
  { fips: "21", name: "Kentucky", abbr: "KY", slug: "kentucky", border_mx: false },
  { fips: "22", name: "Louisiana", abbr: "LA", slug: "louisiana", border_mx: false },
  { fips: "23", name: "Maine", abbr: "ME", slug: "maine", border_mx: false },
  { fips: "24", name: "Maryland", abbr: "MD", slug: "maryland", border_mx: false },
  { fips: "25", name: "Massachusetts", abbr: "MA", slug: "massachusetts", border_mx: false },
  { fips: "26", name: "Michigan", abbr: "MI", slug: "michigan", border_mx: false },
  { fips: "27", name: "Minnesota", abbr: "MN", slug: "minnesota", border_mx: false },
  { fips: "28", name: "Mississippi", abbr: "MS", slug: "mississippi", border_mx: false },
  { fips: "29", name: "Missouri", abbr: "MO", slug: "missouri", border_mx: false },
  { fips: "30", name: "Montana", abbr: "MT", slug: "montana", border_mx: false },
  { fips: "31", name: "Nebraska", abbr: "NE", slug: "nebraska", border_mx: false },
  { fips: "32", name: "Nevada", abbr: "NV", slug: "nevada", border_mx: false },
  { fips: "33", name: "New Hampshire", abbr: "NH", slug: "new-hampshire", border_mx: false },
  { fips: "34", name: "New Jersey", abbr: "NJ", slug: "new-jersey", border_mx: false },
  { fips: "35", name: "New Mexico", abbr: "NM", slug: "new-mexico", border_mx: true },
  { fips: "36", name: "New York", abbr: "NY", slug: "new-york", border_mx: false },
  { fips: "37", name: "North Carolina", abbr: "NC", slug: "north-carolina", border_mx: false },
  { fips: "38", name: "North Dakota", abbr: "ND", slug: "north-dakota", border_mx: false },
  { fips: "39", name: "Ohio", abbr: "OH", slug: "ohio", border_mx: false },
  { fips: "40", name: "Oklahoma", abbr: "OK", slug: "oklahoma", border_mx: false },
  { fips: "41", name: "Oregon", abbr: "OR", slug: "oregon", border_mx: false },
  { fips: "42", name: "Pennsylvania", abbr: "PA", slug: "pennsylvania", border_mx: false },
  { fips: "44", name: "Rhode Island", abbr: "RI", slug: "rhode-island", border_mx: false },
  { fips: "45", name: "South Carolina", abbr: "SC", slug: "south-carolina", border_mx: false },
  { fips: "46", name: "South Dakota", abbr: "SD", slug: "south-dakota", border_mx: false },
  { fips: "47", name: "Tennessee", abbr: "TN", slug: "tennessee", border_mx: false },
  { fips: "48", name: "Texas", abbr: "TX", slug: "texas", border_mx: true },
  { fips: "49", name: "Utah", abbr: "UT", slug: "utah", border_mx: false },
  { fips: "50", name: "Vermont", abbr: "VT", slug: "vermont", border_mx: false },
  { fips: "51", name: "Virginia", abbr: "VA", slug: "virginia", border_mx: false },
  { fips: "53", name: "Washington", abbr: "WA", slug: "washington", border_mx: false },
  { fips: "54", name: "West Virginia", abbr: "WV", slug: "west-virginia", border_mx: false },
  { fips: "55", name: "Wisconsin", abbr: "WI", slug: "wisconsin", border_mx: false },
  { fips: "56", name: "Wyoming", abbr: "WY", slug: "wyoming", border_mx: false },
];

export function getUsStateBySlug(slug: string): UsState | undefined {
  return US_STATES.find((s) => s.slug === slug);
}

export function getUsStateByFips(fips: string): UsState | undefined {
  return US_STATES.find((s) => s.fips === fips);
}
