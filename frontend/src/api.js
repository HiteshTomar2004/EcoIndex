// SSE client for the EcoScout backend.
//
// We use @microsoft/fetch-event-source instead of the native EventSource
// because our stream endpoint is a POST (EventSource only supports GET).

import { fetchEventSource } from "@microsoft/fetch-event-source";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Wake the backend before streaming.
 *
 * Render's free tier sleeps after ~15 min idle. While it wakes, its gateway
 * returns a JSON "loading" page — which would make the SSE client fail with
 * "Expected content-type to be text/event-stream". So we poll /health until
 * the app responds, reporting progress via onStatus, THEN open the stream.
 */
async function warmUp(onStatus, signal, maxWaitMs = 75000) {
  const start = Date.now();
  let attempt = 0;
  while (Date.now() - start < maxWaitMs) {
    try {
      const res = await fetch(`${API_URL}/health`, { signal });
      if (res.ok) return true;
    } catch {
      // network error while asleep — keep waiting
    }
    attempt += 1;
    if (attempt === 1) {
      onStatus?.("Waking up the analyzer (free tier cold start, ~30s)…");
    }
    await new Promise((r) => setTimeout(r, 2500));
  }
  return false;
}

/**
 * Stream an analysis. Calls the provided callbacks as events arrive.
 *
 * @param {string} product
 * @param {object} handlers
 * @param {(a: {node: string, message: string}) => void} handlers.onActivity
 * @param {(result: object) => void} handlers.onResult
 * @param {(err: string) => void} handlers.onError
 * @param {(msg: string) => void} [handlers.onStatus]
 * @param {AbortSignal} [signal]
 */
export async function analyzeStream(product, handlers, signal) {
  const { onActivity, onResult, onError, onStatus } = handlers;

  // Make sure the backend is awake before opening the event stream.
  const awake = await warmUp(onStatus, signal);
  if (!awake) {
    onError?.("The analyzer took too long to wake up. Please try again.");
    return;
  }
  onStatus?.(null); // clear the waking-up message

  let gotData = false;

  try {
    await fetchEventSource(`${API_URL}/analyze/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product }),
      signal,
      openWhenHidden: true,
      async onopen(res) {
        const ct = res.headers.get("content-type") || "";
        if (res.ok && ct.includes("text/event-stream")) return; // good
        // Cold-start gateway page or an error: read body for a useful message.
        let detail = `Server returned ${res.status}`;
        try {
          const body = await res.text();
          detail = body.slice(0, 200) || detail;
        } catch {
          /* ignore */
        }
        throw new Error(detail);
      },
      onmessage(ev) {
        if (!ev.data) return;
        if (ev.event === "activity") {
          gotData = true;
          onActivity?.(JSON.parse(ev.data));
        } else if (ev.event === "result") {
          gotData = true;
          onResult?.(JSON.parse(ev.data));
        } else if (ev.event === "error") {
          onError?.(JSON.parse(ev.data).detail || "Analysis failed.");
        }
      },
      onerror(err) {
        // Throw to stop the auto-retry loop; the caller handles UI state.
        throw err;
      },
    });
  } catch (err) {
    if (err?.name !== "AbortError" && !gotData) {
      onError?.(err?.message || "Could not reach the analyzer.");
    }
  }
}

/** Simple non-streaming fallback. */
export async function analyze(product) {
  const res = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product }),
  });
  if (!res.ok) throw new Error(`Analyzer error ${res.status}`);
  return res.json();
}
