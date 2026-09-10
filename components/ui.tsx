import React from "react";

export function SectionHeading({ kicker, title, sub }: { kicker?: string; title: string; sub?: string }) {
  return (
    <div className="mb-5">
      {kicker && <div className="kicker mb-1.5">{kicker}</div>}
      <h2 className="font-display text-[1.6rem] sm:text-[1.8rem] leading-[1.15] font-semibold text-ink">{title}</h2>
      {sub && <p className="text-subink mt-1.5 max-w-measure text-[15px]">{sub}</p>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border hairline bg-surface min-w-0 ${className}`}>{children}</section>;
}

export function Meta({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div>
      <div className="text-xs tracking-[.01em] text-faint font-semibold">{label}</div>
      <div className="tnum font-semibold text-ink leading-tight mt-0.5">{value}</div>
      {hint && <div className="text-xs text-faint leading-tight mt-0.5">{hint}</div>}
    </div>
  );
}

const VBADGE: Record<string, { c: string; t: string; dot: string }> = {
  coincide: { c: "bg-teal-wash text-teal-ink border-teal-soft/50", t: "Coincide con la cifra oficial", dot: "bg-teal" },
  aproximado: { c: "bg-amber/[.08] text-amber border-amber-soft/60", t: "Aproximado al publicado", dot: "bg-amber" },
  difiere: { c: "bg-black/[.04] text-subink border-line", t: "Difiere del publicado", dot: "bg-faint" },
  "sin referencia": { c: "bg-black/[.04] text-subink border-line", t: "Sin referencia oficial", dot: "bg-faint" },
};
export function ValidationBadge({ status, computed, official, diff, unit }:
  { status?: string; computed?: number | null; official?: number | null; diff?: number | null; unit?: string }) {
  if (!status) return null;
  const s = VBADGE[status] ?? VBADGE["sin referencia"];
  const mean = typeof unit === "string" && unit.includes("años");
  const u = mean ? " años" : "%";
  const du = mean ? " años" : " pp";
  const tip = official != null && computed != null ? `Nacional 12–65: calculado ${computed}${u} · oficial ${official}${u} (Δ ${diff}${du})` : "";
  return (
    <span title={tip} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${s.c}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} aria-hidden />
      {s.t}
      {official != null && computed != null && <span className="tnum opacity-70">· {computed}{u} vs {official}{u}</span>}
    </span>
  );
}
export function statusDot(status?: string) { return (VBADGE[status ?? "sin referencia"] ?? VBADGE["sin referencia"]).dot; }
