const DIM_META = {
  materials: { label: "Materials & Footprint", icon: "M" },
  ethics: { label: "Brand Ethics", icon: "E" },
  packaging: { label: "Packaging & End-of-Life", icon: "P" },
};

function barColor(score) {
  if (score >= 80) return "bg-leaf";
  if (score >= 60) return "bg-fresh";
  if (score >= 40) return "bg-sun";
  return "bg-[#b85137]";
}

export default function DimensionBar({ dim }) {
  const meta = DIM_META[dim.dimension] || { label: dim.dimension, icon: "•" };

  return (
    <div className="rounded-organic border border-white/90 bg-white/90 p-5 shadow-paper backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-forest/10 text-xs font-bold text-forest">{meta.icon}</span>
          <h4 className="font-semibold text-forest">{meta.label}</h4>
        </div>
        <span className="font-bold text-deep">{dim.score}<span className="text-sm font-medium text-forest/50">/100</span></span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-cream">
        <div
          className={`h-full rounded-full ${barColor(dim.score)}`}
          style={{ width: `${dim.score}%`, transition: "width 1s ease-out" }}
        />
      </div>

      <p className="mt-3 text-sm leading-6 text-deep/75">{dim.summary}</p>

      {dim.key_findings?.length > 0 && (
        <ul className="mt-3 space-y-1">
          {dim.key_findings.map((f, i) => (
            <li key={i} className="flex gap-2 text-sm leading-6 text-deep/70">
              <span className="text-leaf">▪</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
