// ============================================================
// B737 Speedbrake — Performance utilities for large datasets
// ============================================================
import { FlightRecord } from './types';

/**
 * Downsample an array for chart rendering.
 * Uses LTTB-like reservoir sampling to keep visual fidelity.
 */
export function downsample<T>(
  data: T[],
  maxPoints: number,
  valueFn?: (d: T) => number,
): T[] {
  if (data.length <= maxPoints) return data;

  // Always keep first and last
  const result: T[] = [data[0]];
  const step = (data.length - 2) / (maxPoints - 2);

  for (let i = 1; i < maxPoints - 1; i++) {
    const idx = Math.round(1 + i * step);
    result.push(data[Math.min(idx, data.length - 1)]);
  }
  result.push(data[data.length - 1]);
  return result;
}

/**
 * Stratified sample: keep ALL anomalies, sample normals.
 * Critical for not losing important data points in charts.
 */
export function stratifiedSample(
  data: FlightRecord[],
  maxTotal: number,
): FlightRecord[] {
  if (data.length <= maxTotal) return data;

  const criticals = data.filter((d) => d.anomalyLevel === 'critical');
  const warnings = data.filter((d) => d.anomalyLevel === 'warning');
  const normals = data.filter((d) => d.anomalyLevel === 'normal');

  // Always keep all criticals and warnings (up to half budget)
  const kept = [...criticals, ...warnings];
  const remaining = maxTotal - kept.length;

  if (remaining > 0 && normals.length > 0) {
    // Reservoir sample from normals
    const sampled = reservoirSample(normals, Math.max(remaining, 0));
    kept.push(...sampled);
  }

  return kept.slice(0, maxTotal);
}

/** Reservoir sampling — O(n) uniform random sample */
function reservoirSample<T>(arr: T[], k: number): T[] {
  if (arr.length <= k) return [...arr];
  const reservoir = arr.slice(0, k);
  for (let i = k; i < arr.length; i++) {
    const j = Math.floor(Math.random() * (i + 1));
    if (j < k) reservoir[j] = arr[i];
  }
  return reservoir;
}

/**
 * Batch-process an array in chunks to avoid blocking the main thread.
 * Yields control back to the browser between chunks.
 */
export function processInChunks<T, R>(
  items: T[],
  processor: (item: T) => R,
  chunkSize = 2000,
): Promise<R[]> {
  return new Promise((resolve) => {
    const results: R[] = [];
    let index = 0;

    function nextChunk() {
      const end = Math.min(index + chunkSize, items.length);
      for (let i = index; i < end; i++) {
        results.push(processor(items[i]));
      }
      index = end;
      if (index < items.length) {
        setTimeout(nextChunk, 0);
      } else {
        resolve(results);
      }
    }

    nextChunk();
  });
}

/**
 * Debounce helper for filter changes
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number,
): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

/**
 * Simple LRU-ish memoization by key string
 */
const memoCache = new Map<string, { value: any; ts: number }>();
const MEMO_MAX = 50;

export function memoized<T>(key: string, compute: () => T, ttlMs = 30000): T {
  const cached = memoCache.get(key);
  if (cached && Date.now() - cached.ts < ttlMs) return cached.value as T;

  const value = compute();
  if (memoCache.size >= MEMO_MAX) {
    // Evict oldest
    const oldest = memoCache.keys().next().value;
    if (oldest !== undefined) memoCache.delete(oldest);
  }
  memoCache.set(key, { value, ts: Date.now() });
  return value;
}

/** Aggregate numeric field stats in a single pass — O(n) */
export function quickStats(values: number[]): {
  mean: number;
  std: number;
  min: number;
  max: number;
  median: number;
  count: number;
} {
  const n = values.length;
  if (n === 0) return { mean: 0, std: 0, min: 0, max: 0, median: 0, count: 0 };

  let sum = 0;
  let sumSq = 0;
  let min = Infinity;
  let max = -Infinity;

  for (let i = 0; i < n; i++) {
    const v = values[i];
    sum += v;
    sumSq += v * v;
    if (v < min) min = v;
    if (v > max) max = v;
  }

  const mean = sum / n;
  const variance = sumSq / n - mean * mean;
  const std = Math.sqrt(Math.max(0, variance));

  // Approximate median with sampling for very large arrays
  let median: number;
  if (n > 10000) {
    const sample = reservoirSample(values, 1000).sort((a, b) => a - b);
    median = sample[Math.floor(sample.length / 2)];
  } else {
    const sorted = [...values].sort((a, b) => a - b);
    median =
      n % 2 === 0
        ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
        : sorted[Math.floor(n / 2)];
  }

  return { mean, std, min, max, median, count: n };
}
