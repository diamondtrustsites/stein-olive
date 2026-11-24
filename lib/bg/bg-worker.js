// Hintergrund entfernen im Browser (IS-Net, Apache-2.0). Läuft in einem eigenen Worker, damit die Seite nicht hängt.
// Bekommt ein Bild (ImageBitmap) und gibt eine Maske 1024×1024 zurück (0 = Hintergrund, 255 = Produkt).
import * as ort from './ort.wasm.min.mjs';
const base = new URL('./', import.meta.url).href;
ort.env.wasm.wasmPaths = base;
ort.env.wasm.numThreads = 1;
ort.env.wasm.proxy = false;
const S = 1024;
let sess = null;
async function load() {
  if (sess) return sess;
  sess = await ort.InferenceSession.create(base + 'isnet.onnx', { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
  return sess;
}
self.onmessage = async (e) => {
  const { id, bitmap, warm } = e.data || {};
  try {
    const s = await load();
    if (warm) { self.postMessage({ id, ok: true }); return; }
    const c = new OffscreenCanvas(S, S); const x = c.getContext('2d');
    x.drawImage(bitmap, 0, 0, S, S); bitmap.close && bitmap.close();
    const d = x.getImageData(0, 0, S, S).data; const n = S * S; const f = new Float32Array(3 * n);
    for (let i = 0; i < n; i++) { f[i] = d[i * 4] / 255 - 0.5; f[n + i] = d[i * 4 + 1] / 255 - 0.5; f[2 * n + i] = d[i * 4 + 2] / 255 - 0.5; }
    const out = await s.run({ [s.inputNames[0]]: new ort.Tensor('float32', f, [1, 3, S, S]) });
    const m = out[s.outputNames[0]].data;
    let lo = Infinity, hi = -Infinity; for (let i = 0; i < n; i++) { const v = m[i]; if (v < lo) lo = v; if (v > hi) hi = v; }
    const k = 1 / (hi - lo || 1); const mask = new Uint8ClampedArray(n);
    // weiche, aber saubere Kante: 0.3…0.7 → 0…255
    for (let i = 0; i < n; i++) { const v = (m[i] - lo) * k; mask[i] = Math.max(0, Math.min(255, Math.round((v - 0.3) / 0.4 * 255))); }
    self.postMessage({ id, mask }, [mask.buffer]);
  } catch (err) { self.postMessage({ id, error: String(err && err.message || err) }); }
};
