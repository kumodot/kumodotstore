import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Fm1TopView } from "./Fm1TopView.tsx";
import { FM1_TOP } from "./fm1TopShapes.ts";
import type { Fm1Build } from "./fm1Code.ts";

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

/** Wrap the code on its "|" separators so it fits the card. */
function wrap(ctx: CanvasRenderingContext2D, code: string, maxW: number): string[] {
  const parts = code.split("|");
  const lines: string[] = [];
  let cur = "";
  parts.forEach((p, i) => {
    const piece = (i ? "|" : "") + p;
    if (cur && ctx.measureText(cur + piece).width > maxW) { lines.push(cur); cur = piece; } else cur += piece;
  });
  if (cur) lines.push(cur);
  return lines;
}

/** Order picture: 3D view, top view and the code, saved as a PNG download. */
export async function exportFm1Image(opts: {
  build: Fm1Build;
  hex: (id: string) => string;
  factory: { body: string; keys: string };
  snapshot: string;          // data URL of the 3D view
  code: string;
}) {
  const { build, hex, factory, snapshot, code } = opts;
  await Promise.all([
    document.fonts.load("52px 'Kumo Signal'"),
    document.fonts.load("26px 'Martian Mono'"),
  ]).catch(() => undefined);

  const W = 1400, pad = 48, inner = W - pad * 2;
  const viewW = FM1_TOP.w + 80, viewH = FM1_TOP.h + 80;
  const topH = Math.round((inner * viewH) / viewW);

  const svg = renderToStaticMarkup(createElement(Fm1TopView, { build, hex, factory, className: "" }))
    .replace("<svg ", `<svg xmlns="http://www.w3.org/2000/svg" width="${inner}" height="${topH}" `);
  const [top, view] = await Promise.all([
    loadImage("data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)),
    loadImage(snapshot),
  ]);
  const viewH3 = Math.round((inner * view.height) / view.width);

  const probe = document.createElement("canvas").getContext("2d")!;
  probe.font = "26px 'Martian Mono', monospace";
  const lines = wrap(probe, code, inner);
  const H = pad + 70 + 20 + viewH3 + 24 + topH + 36 + 40 + lines.length * 38 + pad;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#0D0D0C";
  ctx.fillRect(0, 0, W, H);

  let y = pad;
  ctx.fillStyle = "#EEECE6";
  ctx.textBaseline = "top";
  ctx.font = "52px 'Kumo Signal', monospace";
  ctx.fillText(build.mode === "case" ? "FM1_KZ CASE" : "FM1_KZ KNOBS", pad, y);
  y += 70 + 20;
  ctx.drawImage(view, pad, y, inner, viewH3);
  y += viewH3 + 24;
  ctx.drawImage(top, pad, y, inner, topH);
  y += topH + 36;
  ctx.fillStyle = "#FF5A1F";
  ctx.font = "20px 'Martian Mono', monospace";
  ctx.fillText("ORDER CODE", pad, y);
  y += 40;
  ctx.fillStyle = "#EEECE6";
  ctx.font = "26px 'Martian Mono', monospace";
  lines.forEach((l, i) => ctx.fillText(l, pad, y + i * 38));

  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = `fm1-kz-${build.mode}-kustomizer.png`;
  a.click();
}
