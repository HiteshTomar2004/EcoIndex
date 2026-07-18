// SSE client for the EcoScout backend.
//
// We use @microsoft/fetch-event-source instead of the native EventSource
// because our stream endpoint is a POST (EventSource only supports GET).

import { fetchEventSource } from "@microsoft/fetch-event-source";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Stream an analysis. Calls the provided callbacks as events arrive.
 *
 * @param {string} product
 * @param {object} handlers
 * @param {(a: {node: string, message: string}) => void} handlers.onActivity
 * @param {(result: object) => void} handlers.onResult
 * @param {(err: string) => void} handlers.onError
 * @param {AbortSignal} [signal]
 */
export async function analyzeStream(product, handlers, signal) {
  const { onActivity, onResult, onError } = handlers;

  try {
    await fetchEventSource(`${API_URL}/analyze/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product }),
      signal,
      openWhenHidden: true,
      onmessage(ev) {
        if (!ev.data) return;
        if (ev.event === "activity") {
          onActivity?.(JSON.parse(ev.data));
        } else if (ev.event === "result") {
          onResult?.(JSON.parse(ev.data));
        } else if (ev.event === "error") {
          onError?.(JSON.parse(ev.data).detail || "Analysis failed.");
        }
      },
      onerror(err) {
        // Throw to stop the retry loop; the caller handles UI state.
        onError?.(err?.message || "Connection to analyzer lost.");
        throw err;
      },
    });
  } catch (err) {
    if (err?.name !== "AbortError") {
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
