/**
 * The ONLY place aggressive blur is allowed to sit "under" arbitrary
 * content: three soft color blobs (indigo/teal/violet — the MX/US/primary
 * hues) fixed behind everything, aria-hidden, non-interactive. Never put
 * text directly on this layer; pages stack `GlassPanel`/`GlassCard`
 * surfaces on top of it instead.
 */
export function BackgroundAurora() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      <div
        className="aurora-blob absolute -left-32 -top-40 h-[32rem] w-[32rem] rounded-full opacity-40 dark:opacity-30"
        style={{ background: "radial-gradient(circle, var(--color-primary) 0%, transparent 70%)" }}
      />
      <div
        className="aurora-blob absolute right-[-10rem] top-16 h-[28rem] w-[28rem] rounded-full opacity-30 dark:opacity-25"
        style={{ background: "radial-gradient(circle, var(--color-mx-soft) 0%, transparent 70%)" }}
      />
      <div
        className="aurora-blob absolute bottom-[-12rem] left-1/3 h-[34rem] w-[34rem] rounded-full opacity-30 dark:opacity-25"
        style={{ background: "radial-gradient(circle, var(--color-us-soft) 0%, transparent 70%)" }}
      />
    </div>
  );
}
