import { useState } from "react";

const EXAMPLES = [
  "Nike Air Force 1 sneakers",
  "Zara cotton t-shirt",
  "iPhone 15 case",
  "Nestlé bottled water",
];

export default function SearchBar({ onSubmit, loading }) {
  const [value, setValue] = useState("");

  function submit(e) {
    e.preventDefault();
    const v = value.trim();
    if (v.length >= 2 && !loading) onSubmit(v);
  }

  return (
    <div className="w-full">
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-forest/50">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Paste a product name or URL…"
            className="w-full rounded-organic border border-forest/15 bg-white/95 py-4 pl-14 pr-5 text-base text-deep shadow-paper outline-none transition duration-200 placeholder:text-forest/40 focus:border-leaf focus:ring-4 focus:ring-leaf/10"
          />
        </div>
        <button
          type="submit"
          disabled={loading || value.trim().length < 2}
          className="rounded-organic bg-leaf px-7 py-4 text-base font-semibold text-white shadow-paper transition duration-200 hover:bg-forest disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-deep/75">Try:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => !loading && onSubmit(ex)}
            disabled={loading}
            className="rounded-full border border-forest/15 bg-white/70 px-3 py-1.5 text-sm font-medium text-forest transition duration-200 hover:border-forest/30 hover:bg-white disabled:opacity-50"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
