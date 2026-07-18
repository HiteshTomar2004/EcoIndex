// Big circular sustainability score gauge with an animated ring.

function scoreColor(score) {
  if (score >= 80) return "#2f7d4c"; // leaf
  if (score >= 60) return "#77a960"; // fresh
  if (score >= 40) return "#bb8428"; // sun
  return "#b85137"; // warm terracotta for poor
}

export default function ScoreCard({ result }) {
  const { overall_score: score, verdict, summary, normalized_product, category } = result;

  const size = 168;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  const color = scoreColor(score);

  return (
    <div className="rounded-organic border border-white/90 bg-white/95 p-6 shadow-paperLg backdrop-blur sm:p-7">
      <div className="flex flex-col items-center gap-7 sm:flex-row sm:items-start">
        {/* Gauge */}
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="#e4eee5"
              strokeWidth={stroke}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1.1s ease-out" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold tracking-[-0.06em]" style={{ color }}>
              {score}
            </span>
            <span className="text-xs font-semibold tracking-wide text-forest/60">/ 100</span>
          </div>
        </div>

        {/* Verdict + summary */}
        <div className="flex-1 text-center sm:text-left">
          <div className="mb-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span
              className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.06em] text-white"
              style={{ backgroundColor: color }}
            >
              {verdict}
            </span>
            <span className="rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold capitalize text-forest">
              {category}
            </span>
          </div>
          <h2 className="text-2xl font-bold leading-snug tracking-[-0.025em] text-deep">{normalized_product}</h2>
          <p className="mt-3 leading-7 text-deep/75">{summary}</p>
        </div>
      </div>
    </div>
  );
}
