const NODE_META = {
  intake: { label: "Intake", icon: "I", color: "bg-limeSoft text-deep" },
  materials: { label: "Materials Agent", icon: "M", color: "bg-fresh/20 text-forest" },
  ethics: { label: "Ethics Agent", icon: "E", color: "bg-leaf/20 text-forest" },
  packaging: { label: "Packaging Agent", icon: "P", color: "bg-forest/20 text-forest" },
  synthesizer: { label: "Synthesizer", icon: "S", color: "bg-sun/25 text-deep" },
};

export default function ActivityFeed({ events, active }) {
  return (
    <div className="rounded-organic border border-white/90 bg-white/90 p-5 shadow-paper backdrop-blur">
      <div className="mb-3 flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          {active && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf opacity-75" />
          )}
          <span className={`inline-flex h-3 w-3 rounded-full ${active ? "bg-leaf" : "bg-forest/30"}`} />
        </span>
        <h3 className="font-semibold text-forest">
          {active ? "Analysis in progress" : "Analysis activity"}
        </h3>
      </div>

      <ul className="space-y-2">
        {events.map((ev, i) => {
          const meta = NODE_META[ev.node] || {
            label: ev.node,
            icon: "•",
            color: "bg-forest/10 text-forest",
          };
          return (
            <li
              key={i}
              className="flex animate-floatUp items-start gap-3 rounded-xl bg-cream/70 p-3"
            >
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${meta.color}`}>
                {meta.icon}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-forest">{meta.label}</p>
                <p className="text-sm leading-6 text-deep/75">{ev.message}</p>
              </div>
            </li>
          );
        })}

        {active && (
          <li className="flex items-center gap-3 rounded-xl bg-cream/50 p-3">
            <span className="grid h-8 w-8 place-items-center">
              <span className="h-4 w-4 animate-pulseSoft rounded-full bg-leaf" />
            </span>
            <p className="text-sm font-medium text-forest/70">Research in progress</p>
          </li>
        )}
      </ul>
    </div>
  );
}
