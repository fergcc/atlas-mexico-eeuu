"use client";

import { useEffect, useState } from "react";
import { checkEngineHealth } from "@/lib/engine-client";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";

export function EngineStatusBadge() {
  const [status, setStatus] = useState<"checking" | "connected" | "disconnected">(
    process.env.NEXT_PUBLIC_ENGINE_URL ? "checking" : "disconnected"
  );

  useEffect(() => {
    const engine = process.env.NEXT_PUBLIC_ENGINE_URL;
    if (!engine) return;
    checkEngineHealth().then((ok) => {
      setStatus(ok ? "connected" : "disconnected");
    });
  }, []);

  if (status === "checking") return null;

  return (
    <Badge
      tone={status === "connected" ? "success" : "neutral"}
      icon={status === "connected" ? <Wifi size={12} aria-hidden="true" /> : <WifiOff size={12} aria-hidden="true" />}
    >
      {status === "connected" ? "Engine conectado" : "Engine desconectado"}
    </Badge>
  );
}
