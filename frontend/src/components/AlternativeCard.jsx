export default function AlternativeCard({ alt }) {
  return (
    <div className="group rounded-organic border border-leaf/15 bg-white/90 p-5 shadow-paper transition duration-200 hover:border-leaf/30 hover:shadow-paperLg">
      <div className="mb-2 flex items-start justify-between gap-3">
        <h4 className="font-semibold leading-snug text-forest">{alt.name}</h4>
        {alt.approx_score != null && (
          <span className="shrink-0 rounded-full bg-leaf px-2.5 py-1 text-xs font-bold text-white">
            ~{alt.approx_score}
          </span>
        )}
      </div>
      <p className="text-sm leading-6 text-deep/75">{alt.reason}</p>
      <div className="mt-3 flex items-center gap-1 text-sm font-semibold text-leaf">
        <span>Better choice</span>
      </div>
    </div>
  );
}
