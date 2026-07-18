const DIM_LABEL = {
  materials: "Materials",
  ethics: "Ethics",
  packaging: "Packaging",
};

function hostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function Citations({ citations }) {
  if (!citations?.length) return null;

  return (
    <div className="rounded-organic border border-white/90 bg-white/90 p-5 shadow-paper backdrop-blur">
      <h3 className="mb-3 flex items-center gap-2 font-semibold text-forest">
        Evidence
        <span className="rounded-full bg-forest/10 px-2 py-0.5 text-xs font-bold text-forest">
          {citations.length} sources
        </span>
      </h3>
      <ul className="grid gap-2 sm:grid-cols-2">
        {citations.map((c, i) => (
          <li key={i}>
            <a
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-transparent bg-cream/70 p-3 transition duration-200 hover:border-forest/10 hover:bg-cream"
            >
              <span className="shrink-0 rounded-full bg-white px-2 py-1 text-xs font-semibold text-forest">
                {DIM_LABEL[c.dimension] || c.dimension}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-deep">{c.title}</p>
                <p className="truncate text-xs text-forest/60">{hostname(c.url)}</p>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
