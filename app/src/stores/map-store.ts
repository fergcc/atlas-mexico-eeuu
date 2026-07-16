import { create } from "zustand";

/**
 * Minimal cross-cutting UI state for the choropleth map: which state is
 * hovered. Deliberately NOT in the URL (nuqs handles the *selected*
 * indicator/sector/year, which is shareable) — hover is transient and
 * doesn't belong in a shareable link.
 */
interface MapStoreState {
  hoveredStateCode: string | null;
  setHoveredStateCode: (code: string | null) => void;
}

export const useMapStore = create<MapStoreState>((set) => ({
  hoveredStateCode: null,
  setHoveredStateCode: (code) => set({ hoveredStateCode: code }),
}));
