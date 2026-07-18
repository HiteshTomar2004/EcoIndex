import { useRef, useState } from "react";
import { analyzeStream } from "./api";
import WaveBackground from "./components/WaveBackground";
import SearchBar from "./components/SearchBar";
import ActivityFeed from "./components/ActivityFeed";
import ScoreCard from "./components/ScoreCard";
import DimensionBar from "./components/DimensionBar";
import AlternativeCard from "./components/AlternativeCard";
import Citations from "./components/Citations";

export default function App() {
  const [events, setEvents] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  async function handleAnalyze(product) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setEvents([]);
    setResult(null);
    setError(null);
    setLoading(true);

    await analyzeStream(
      product,
      {
        onActivity: (a) => setEvents((prev) => [...prev, a]),
        onResult: (r) => {
          setResult(r);
          setLoading(false);
        },
        onError: (msg) => {
          setError(msg);
          setLoading(false);
        },
      },
      controller.signal
    );
  }

  const started = loading || result || error;

  return (
    <div className="relative flex min-h-screen flex-col font-sans">
      <WaveBackground />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 pb-8 pt-10 sm:px-8 sm:pt-14">
        <header className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-forest/15 bg-white/80 px-3.5 py-1.5 text-xs font-semibold tracking-[0.03em] text-forest shadow-paper backdrop-blur">
            Responsible Consumption Agent
          </div>
          <h1 className="text-4xl font-bold tracking-[-0.055em] text-deep sm:text-6xl">
            Eco <span className="text-leaf">Index</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-forest/80 sm:text-lg">
            Clear, evidence-led sustainability intelligence for the products
            you consider.
          </p>
        </header>

        <section
          className={`mx-auto transition-all duration-500 ${
            started ? "max-w-4xl" : "max-w-3xl sm:mt-6"
          }`}
        >
          <SearchBar onSubmit={handleAnalyze} loading={loading} />
        </section>

        {error && (
          <div className="mx-auto mt-6 max-w-3xl rounded-organic border border-[#b85137]/25 bg-white/95 p-4 text-center shadow-paper">
            <p className="font-bold text-[#c0532f]">{error}</p>
            <p className="mt-1 text-sm text-deep/70">
              Make sure the backend is running and your API keys are set.
            </p>
          </div>
        )}

        {(loading || (events.length > 0 && !result)) && (
          <section className="mt-8">
            <ActivityFeed events={events} active={loading} />
          </section>
        )}

        {result && (
          <section className="mt-8 space-y-6">
            <ScoreCard result={result} />

            <div className="grid gap-4 md:grid-cols-3">
              {result.dimensions.map((d) => (
                <DimensionBar key={d.dimension} dim={d} />
              ))}
            </div>

            {result.alternatives?.length > 0 && (
              <div>
                <h3 className="mb-3 text-xl font-bold tracking-[-0.02em] text-deep">
                  Better alternatives
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {result.alternatives.map((alt, i) => (
                    <AlternativeCard key={i} alt={alt} />
                  ))}
                </div>
              </div>
            )}

            <Citations citations={result.citations} />

            {events.length > 0 && (
              <details className="rounded-organic border border-white/80 bg-white/85 p-4 shadow-paper">
                <summary className="cursor-pointer font-semibold text-forest">
                  How the analysis worked ({events.length} steps)
                </summary>
                <div className="mt-3">
                  <ActivityFeed events={events} active={false} />
                </div>
              </details>
            )}
          </section>
        )}

        <footer className="mt-auto pt-16 text-center text-xs font-medium tracking-wide text-[#e8f2d0]/85">
          Multi-agent analysis powered by LangGraph · Gemini · Tavily
        </footer>
      </main>
    </div>
  );
}
