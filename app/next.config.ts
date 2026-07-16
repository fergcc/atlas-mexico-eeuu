import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: the site is meant to be cloned and run by anyone without
  // a Node server or database in production (see docs/arquitectura.md).
  output: "export",
  images: {
    unoptimized: true,
  },
  // react-simple-maps@3 (pinned for React 19 compat via --legacy-peer-deps)
  // calls d3-zoom internally on every <ComposableMap>, even without a
  // <ZoomableGroup>. Its zoom/pan effect isn't safe under React
  // StrictMode's dev-only double-invoke (a known upstream issue), which
  // otherwise crashes the choropleth map in `next dev`. Production builds
  // never double-invoke effects, so this only affects local development.
  reactStrictMode: false,
};

export default nextConfig;
