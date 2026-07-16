import { Wind, Pill, Plane, Bean, FlaskConical, Factory, Boxes, type LucideProps } from "lucide-react";

/**
 * Maps the free-form `icon` string in `sectors.yaml` / `manifest.json` to a
 * lucide-react component. Extend this map (never hardcode a sector id) as
 * new sectors get added with new icon slugs.
 */
const ICON_MAP: Record<string, typeof Wind> = {
  wind: Wind,
  pill: Pill,
  plane: Plane,
  bean: Bean,
  "flask-conical": FlaskConical,
  factory: Factory,
};

/**
 * Renders as a component (rather than pages resolving `getSectorIcon(...)`
 * into a local variable used as a JSX tag) so the icon lookup never trips
 * the "component created during render" lint rule.
 */
export function SectorIcon({ icon, ...rest }: { icon: string } & LucideProps) {
  const Icon = ICON_MAP[icon] ?? Boxes;
  return <Icon {...rest} />;
}
