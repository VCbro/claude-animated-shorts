// node tools/stills.mjs out/x_ 60,200,400 [scale=0.5]   → out/x_0060.jpg … (+ out/x_sheet.jpg contact sheet)
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { execSync } from "child_process";
import path from "path"; import fs from "fs";
const [prefix = "out/x_", list = "30,150,300", scale = "0.5"] = process.argv.slice(2);
const browserExecutable = process.env.CHROME_PATH || "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
fs.mkdirSync(path.dirname(prefix), { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const inputProps = { audio: false };
const composition = await selectComposition({ serveUrl, id: process.env.COMP || "Short", inputProps, browserExecutable, chromiumOptions: { gl: "swangle" } });
const frames = list.split(",").map(Number);
const outs = [];
for (const frame of frames) {
  const output = `${prefix}${String(frame).padStart(4, "0")}.jpg`;
  const t = Date.now();
  await renderStill({ serveUrl, composition, frame, output, inputProps, scale: Number(scale), imageFormat: "jpeg", jpegQuality: 88, browserExecutable, chromiumOptions: { gl: "swangle" } });
  console.log(output, `${Date.now() - t} ms`); outs.push(output);
}
if (outs.length > 1) {
  const cols = Math.min(5, outs.length);
  execSync(`ffmpeg -v error -y ${outs.map((o) => `-i ${o}`).join(" ")} -filter_complex "${outs.map((_, i) => `[${i}]scale=270:-1[v${i}]`).join(";")};${outs.map((_, i) => `[v${i}]`).join("")}xstack=inputs=${outs.length}:layout=${outs.map((_, i) => `${(i % cols) * 270}_${Math.floor(i / cols) * 480}`).join("|")}:fill=black" ${prefix}sheet.jpg`);
  console.log(`${prefix}sheet.jpg`);
}
