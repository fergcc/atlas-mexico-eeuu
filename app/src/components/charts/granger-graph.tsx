"use client";

import { useMemo, useCallback } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Handle,
  MarkerType,
  Position,
  type Edge,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
} from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";
import { formatPValue } from "@/lib/formatters";
import { cn } from "@/lib/cn";

export interface GrangerGraphNode {
  id: string;
  label: string;
  country: "MX" | "US";
  sublabel?: string;
}

export interface GrangerGraphEdge {
  id: string;
  source: string;
  target: string;
  pValue: number;
  significant: boolean;
}

interface GrangerGraphProps {
  nodes: GrangerGraphNode[];
  edges: GrangerGraphEdge[];
  height?: number;
}

const NODE_WIDTH = 260;
const NODE_HEIGHT = 68;

function CausalNode({ data }: NodeProps<GrangerGraphNode>) {
  const isMx = data.country === "MX";
  return (
    <div
      className={cn(
        "glass-panel-strong flex h-full w-full min-w-0 flex-col justify-center overflow-hidden rounded-xl px-3.5 py-2 shadow-sm",
        isMx ? "border-l-[3px] border-l-mx" : "border-l-[3px] border-l-us"
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-foreground-muted/40" />
      <Handle type="source" position={Position.Right} className="!bg-foreground-muted/40" />
      <span className={cn("min-w-0 text-[10px] font-semibold uppercase tracking-wide", isMx ? "text-mx" : "text-us")}>
        {data.country}
      </span>
      <span className="block min-w-0 truncate text-sm font-medium text-foreground" title={data.label}>
        {data.label}
      </span>
      {data.sublabel && (
        <span className="block min-w-0 truncate text-xs text-foreground-muted" title={data.sublabel}>
          {data.sublabel}
        </span>
      )}
    </div>
  );
}

const nodeTypes = { causal: CausalNode };

function layout(nodes: GrangerGraphNode[], edges: GrangerGraphEdge[]) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", nodesep: 48, ranksep: 140 });

  nodes.forEach((n) => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);

  const rfNodes: Node<GrangerGraphNode>[] = nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      id: n.id,
      type: "causal",
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      data: n,
      draggable: false,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    };
  });

  // Two edges between the same node pair (a→b and b→a, since Granger is
  // tested in both directions) would otherwise render as overlapping
  // straight lines with labels stacked on top of each other. Bow them in
  // opposite directions and nudge their labels apart so both remain legible.
  const pairEdgeIndex = new Map<string, number>();
  const pairKey = (e: GrangerGraphEdge) => [e.source, e.target].sort().join("::");
  edges.forEach((e) => {
    const key = pairKey(e);
    pairEdgeIndex.set(key, (pairEdgeIndex.get(key) ?? -1) + 1);
  });
  const seenAgain = new Map<string, number>();

  const rfEdges: Edge[] = edges.map((e) => {
    const key = pairKey(e);
    const isReciprocal = (pairEdgeIndex.get(key) ?? 0) > 0;
    const occurrence = seenAgain.get(key) ?? 0;
    seenAgain.set(key, occurrence + 1);
    const curvature = isReciprocal ? (occurrence === 0 ? 0.35 : -0.35) : 0.15;
    const labelOffsetY = isReciprocal ? (occurrence === 0 ? -12 : 12) : 0;

    return {
      id: e.id,
      source: e.source,
      target: e.target,
      type: "default",
      pathOptions: { curvature },
      label: `p = ${formatPValue(e.pValue)}`,
      animated: e.significant,
      style: {
        stroke: e.significant ? "var(--color-primary)" : "var(--foreground-muted)",
        strokeWidth: e.significant ? 2.5 : 1.5,
        strokeDasharray: e.significant ? undefined : "4,4",
        opacity: e.significant ? 1 : 0.55,
      },
      labelStyle: {
        fill: "var(--foreground)",
        fontSize: 11,
        fontFamily: "var(--font-mono)",
        transform: labelOffsetY ? `translateY(${labelOffsetY}px)` : undefined,
      },
      labelBgStyle: { fill: "var(--surface-glass-strong)" },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 4,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: e.significant ? "var(--color-primary)" : "var(--foreground-muted)",
      },
    };
  });

  return { rfNodes, rfEdges };
}

/**
 * Directed graph of Granger-causal relationships (dagre layout, reactflow
 * rendering). Solid animated edges = statistically significant (FDR-adjusted
 * p < 0.05); dashed faded edges = tested but not significant — never hidden,
 * so absence of an edge always means "not tested," not "not causal."
 */
export function GrangerGraph({ nodes, edges, height = 320 }: GrangerGraphProps) {
  const { rfNodes, rfEdges } = useMemo(() => layout(nodes, edges), [nodes, edges]);

  // `fitView` (as a prop) sometimes runs before the flex/grid parent has
  // settled on its final width (e.g. inside the homepage's two-column
  // hero), clipping the outer nodes. Driving it imperatively from `onInit`
  // inside a rAF guarantees the container has been measured first.
  const handleInit = useCallback((instance: ReactFlowInstance) => {
    requestAnimationFrame(() => {
      instance.fitView({ padding: 0.3, duration: 0 });
    });
  }, []);

  if (nodes.length === 0) {
    return <p className="text-sm text-foreground-muted">Sin series suficientes para construir el grafo.</p>;
  }

  return (
    <div style={{ height }} className="overflow-hidden rounded-2xl border border-border-glass">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onInit={handleInit}
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.1}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll={false}
        panOnScroll={false}
        preventScrolling={false}
        className="bg-transparent"
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="var(--border-glass)" />
      </ReactFlow>
    </div>
  );
}
