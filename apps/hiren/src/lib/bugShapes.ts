import type { BugType, Shape } from "./bugGame";

type DrawArgs = (
  c: CanvasRenderingContext2D,
  s: number,
  type: BugType,
  swing: number,
  flap: number,
) => void;

const TAU = Math.PI * 2;

// Animated legs for crawlers (spider, roach): swing offsets the foot ends.
function legs(c: CanvasRenderingContext2D, s: number, color: string, pairs: number, spread: number, swing: number) {
  c.strokeStyle = color;
  c.lineWidth = Math.max(1.6, s * 0.05);
  c.lineCap = "round";
  for (let i = 0; i < pairs; i++) {
    const ly = (-0.2 + (i / Math.max(1, pairs - 1)) * 0.6) * s;
    const o = swing * (i % 2 ? -1 : 1) * s;
    c.beginPath();
    c.moveTo(-s * 0.28, ly);
    c.lineTo(-s * spread, ly + o);
    c.moveTo(s * 0.28, ly);
    c.lineTo(s * spread, ly + o);
    c.stroke();
  }
}

// Dangling legs for flyers — hang down/back, barely moving.
function dangle(c: CanvasRenderingContext2D, s: number, color: string, n: number) {
  c.strokeStyle = color;
  c.lineWidth = Math.max(1.4, s * 0.045);
  c.lineCap = "round";
  for (let i = 0; i < n; i++) {
    const lx = (-0.18 + i * 0.18) * s;
    c.beginPath();
    c.moveTo(lx * 0.6, s * 0.3);
    c.lineTo(lx, s * 0.7);
    c.stroke();
  }
}

function head(c: CanvasRenderingContext2D, s: number, y: number, r: number, eye?: string) {
  c.fillStyle = "oklch(0.3 0.03 45)";
  c.strokeStyle = "oklch(0.78 0.05 65)";
  c.lineWidth = Math.max(1.2, s * 0.04);
  c.beginPath();
  c.arc(0, y, r, 0, TAU);
  c.fill();
  c.stroke();
  c.fillStyle = eye ?? "oklch(0.96 0.01 90)";
  c.beginPath();
  c.arc(-r * 0.4, y - r * 0.1, r * 0.24, 0, TAU);
  c.arc(r * 0.4, y - r * 0.1, r * 0.24, 0, TAU);
  c.fill();
}

// A wing flapped by scaling its height by `flap` (0..1).
function wing(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rot: number, flap: number, fill: string) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(1, flap);
  c.fillStyle = fill;
  c.beginPath();
  c.ellipse(0, 0, rx, ry, 0, 0, TAU);
  c.fill();
  c.restore();
}

const gnat: DrawArgs = (c, s, t, _swing, flap) => {
  dangle(c, s, t.spot, 3);
  wing(c, -s * 0.2, -s * 0.05, s * 0.26, s * 0.14, -0.5, flap, "oklch(0.95 0.02 230 / 0.4)");
  wing(c, s * 0.2, -s * 0.05, s * 0.26, s * 0.14, 0.5, flap, "oklch(0.95 0.02 230 / 0.4)");
  c.fillStyle = t.color;
  c.beginPath();
  c.ellipse(0, s * 0.1, s * 0.32, s * 0.38, 0, 0, TAU);
  c.fill();
  c.fillStyle = "oklch(0.98 0.01 90)";
  c.beginPath();
  c.arc(-s * 0.14, -s * 0.28, s * 0.18, 0, TAU);
  c.arc(s * 0.14, -s * 0.28, s * 0.18, 0, TAU);
  c.fill();
  c.fillStyle = "oklch(0.2 0.02 60)";
  c.beginPath();
  c.arc(-s * 0.14, -s * 0.26, s * 0.07, 0, TAU);
  c.arc(s * 0.14, -s * 0.26, s * 0.07, 0, TAU);
  c.fill();
};

const fly: DrawArgs = (c, s, t, _swing, flap) => {
  dangle(c, s, t.spot, 3);
  wing(c, -s * 0.28, -s * 0.02, s * 0.42, s * 0.2, -0.5, flap, "oklch(0.92 0.02 230 / 0.4)");
  wing(c, s * 0.28, -s * 0.02, s * 0.42, s * 0.2, 0.5, flap, "oklch(0.92 0.02 230 / 0.4)");
  c.fillStyle = t.color;
  c.beginPath();
  c.ellipse(0, s * 0.16, s * 0.3, s * 0.44, 0, 0, TAU);
  c.fill();
  c.fillStyle = t.spot;
  c.beginPath();
  c.ellipse(0, s * 0.02, s * 0.26, s * 0.16, 0, 0, TAU);
  c.fill();
  head(c, s, -s * 0.34, s * 0.22, "oklch(0.55 0.22 25)"); // red compound eyes
};

const moth: DrawArgs = (c, s, t, _swing, flap) => {
  dangle(c, s, t.spot, 3);
  c.fillStyle = t.color;
  c.globalAlpha = 0.92;
  for (const d of [-1, 1]) {
    c.save();
    c.rotate(d * (0.2 - flap * 0.25));
    c.beginPath();
    c.ellipse(d * s * 0.34, s * 0.04, s * 0.4, s * 0.5, 0, 0, TAU);
    c.fill();
    c.restore();
  }
  c.globalAlpha = 1;
  c.fillStyle = t.spot;
  c.beginPath();
  c.ellipse(0, s * 0.08, s * 0.16, s * 0.46, 0, 0, TAU);
  c.fill();
  c.strokeStyle = t.spot;
  c.lineWidth = Math.max(1.2, s * 0.04);
  for (const d of [-1, 1]) {
    c.beginPath();
    c.moveTo(d * s * 0.06, -s * 0.4);
    c.quadraticCurveTo(d * s * 0.3, -s * 0.7, d * s * 0.18, -s * 0.85);
    c.stroke();
  }
  head(c, s, -s * 0.34, s * 0.18);
};

const wasp: DrawArgs = (c, s, t, _swing, flap) => {
  dangle(c, s, t.spot, 3);
  wing(c, -s * 0.3, -s * 0.05, s * 0.34, s * 0.18, -0.4, flap, "oklch(0.9 0.02 230 / 0.35)");
  wing(c, s * 0.3, -s * 0.05, s * 0.34, s * 0.18, 0.4, flap, "oklch(0.9 0.02 230 / 0.35)");
  c.fillStyle = t.color;
  c.beginPath();
  c.ellipse(0, s * 0.18, s * 0.3, s * 0.5, 0, 0, TAU);
  c.fill();
  c.fillStyle = t.spot;
  for (const yy of [0.02, 0.22, 0.42]) {
    c.beginPath();
    c.ellipse(0, s * yy, s * 0.3 * (1 - yy * 0.5), s * 0.07, 0, 0, TAU);
    c.fill();
  }
  c.beginPath();
  c.moveTo(-s * 0.05, s * 0.64);
  c.lineTo(0, s * 0.82);
  c.lineTo(s * 0.05, s * 0.64);
  c.fill();
  head(c, s, -s * 0.36, s * 0.2);
};

const mosquito: DrawArgs = (c, s, t, _swing, flap) => {
  dangle(c, s, t.spot, 4);
  wing(c, -s * 0.24, -s * 0.04, s * 0.32, s * 0.13, -0.5, flap, "oklch(0.9 0.02 300 / 0.32)");
  wing(c, s * 0.24, -s * 0.04, s * 0.32, s * 0.13, 0.5, flap, "oklch(0.9 0.02 300 / 0.32)");
  c.fillStyle = t.color;
  c.beginPath();
  c.ellipse(0, s * 0.16, s * 0.15, s * 0.46, 0, 0, TAU);
  c.fill();
  head(c, s, -s * 0.36, s * 0.16);
  c.strokeStyle = t.spot;
  c.lineWidth = Math.max(1.2, s * 0.045);
  c.beginPath();
  c.moveTo(0, -s * 0.48);
  c.lineTo(0, -s * 0.84); // long proboscis
  c.stroke();
};

const spider: DrawArgs = (c, s, t, swing, _flap) => {
  legs(c, s, t.spot, 4, 0.85, swing);
  c.fillStyle = t.color;
  c.beginPath();
  c.ellipse(0, s * 0.22, s * 0.42, s * 0.46, 0, 0, TAU);
  c.fill();
  c.beginPath();
  c.ellipse(0, -s * 0.22, s * 0.26, s * 0.24, 0, 0, TAU);
  c.fill();
  c.strokeStyle = t.spot;
  c.lineWidth = Math.max(1.4, s * 0.05);
  for (const d of [-1, 1]) {
    c.beginPath();
    c.moveTo(d * s * 0.08, -s * 0.4);
    c.lineTo(d * s * 0.14, -s * 0.54);
    c.stroke();
  }
  c.fillStyle = "oklch(0.96 0.02 30)";
  for (const dx of [-0.12, -0.04, 0.04, 0.12]) {
    c.beginPath();
    c.arc(dx * s, -s * 0.26, s * 0.035, 0, TAU);
    c.fill();
  }
};

const roach: DrawArgs = (c, s, t, swing, _flap) => {
  legs(c, s, t.spot, 3, 0.6, swing);
  c.fillStyle = t.color;
  c.beginPath();
  c.ellipse(0, s * 0.12, s * 0.42, s * 0.58, 0, 0, TAU);
  c.fill();
  c.strokeStyle = t.spot;
  c.lineWidth = Math.max(1.4, s * 0.05);
  c.beginPath();
  c.moveTo(0, -s * 0.4);
  c.lineTo(0, s * 0.6);
  c.stroke();
  c.fillStyle = "oklch(1 0 0 / 0.25)";
  c.beginPath();
  c.ellipse(-s * 0.16, -s * 0.08, s * 0.1, s * 0.3, -0.3, 0, TAU);
  c.fill();
  head(c, s, -s * 0.4, s * 0.2);
  c.strokeStyle = t.spot;
  c.lineWidth = Math.max(1.2, s * 0.04);
  for (const d of [-1, 1]) {
    c.beginPath();
    c.moveTo(d * s * 0.08, -s * 0.5);
    c.quadraticCurveTo(d * s * 0.5, -s * 0.8, d * s * 0.66, -s * 0.6);
    c.stroke();
  }
};

export const SHAPES: Record<Exclude<Shape, "centipede">, DrawArgs> = {
  gnat, fly, moth, wasp, mosquito, spider, roach,
};

// Centipede: a trailing segmented body. The caller owns `hist` (newest first).
export function drawCentipede(
  c: CanvasRenderingContext2D,
  hist: { x: number; y: number }[],
  size: number,
  color: string,
  spot: string,
  t: number,
) {
  const segs = 12;
  const gap = 10;
  const s = size;
  for (let i = segs; i >= 0; i--) {
    const p = hist[Math.min(i * gap, hist.length - 1)];
    if (!p) continue;
    const pn = hist[Math.min(i * gap + gap, hist.length - 1)] ?? p;
    const a = Math.atan2(p.y - pn.y, p.x - pn.x);
    const rip = Math.sin(t * 0.02 + i * 0.6) * 0.5;
    const seg = i / segs;
    c.save();
    c.translate(p.x, p.y);
    c.rotate(a + Math.PI / 2);
    c.strokeStyle = spot;
    c.lineWidth = 3;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(-s * 0.5, 0);
    c.lineTo(-s * 0.95, rip * s * 0.5);
    c.moveTo(s * 0.5, 0);
    c.lineTo(s * 0.95, -rip * s * 0.5);
    c.stroke();
    c.fillStyle = i === 0 ? "oklch(0.5 0.16 30)" : color;
    c.beginPath();
    c.ellipse(0, 0, s * (0.5 - seg * 0.15), s * (0.42 - seg * 0.12), 0, 0, TAU);
    c.fill();
    if (i === 0) {
      c.fillStyle = "oklch(0.95 0.02 30)";
      c.beginPath();
      c.arc(-s * 0.18, -s * 0.1, s * 0.1, 0, TAU);
      c.arc(s * 0.18, -s * 0.1, s * 0.1, 0, TAU);
      c.fill();
      c.strokeStyle = spot;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-s * 0.1, -s * 0.4);
      c.lineTo(-s * 0.3, -s * 0.7);
      c.moveTo(s * 0.1, -s * 0.4);
      c.lineTo(s * 0.3, -s * 0.7);
      c.stroke();
    }
    c.restore();
  }
}
