import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: the site is meant to be cloned and run by anyone without
  // a Node server or database in production (see docs/arquitectura.md).
  output: "export",
  images: {
    unoptimized: true,
  },
  // Static export emits `page.html` by default, which generic static file
  // servers (Vercel's "Other" framework preset, GitHub Pages, S3, ...) don't
  // resolve for a clean `/page` URL. `trailingSlash` emits `page/index.html`
  // instead, which every static host resolves for `/page/` (and Vercel/most
  // hosts also redirect the no-slash form) — the portable, host-agnostic fix.
  trailingSlash: true,
  // react-simple-maps@3 (pinned for React 19 compat via --legacy-peer-deps)
  // calls d3-zoom internally on every <ComposableMap>, even without a
  // <ZoomableGroup>. Its zoom/pan effect isn't safe under React
  // StrictMode's dev-only double-invoke (a known upstream issue), which
  // otherwise crashes the choropleth map in `next dev`. Production builds
  // never double-invoke effects, so this only affects local development.
  reactStrictMode: false,
};

export default nextConfig;
