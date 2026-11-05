// Exports the picture's sound cues to out/cues.json: scene cuts, impacts, UI pops, risers (all in seconds).
import { build } from "esbuild"; import fs from "fs";
const r = await build({ entryPoints: ["src/story.tsx"], bundle: true, platform: "node", format: "esm", write: false, jsx: "automatic",
  packages: "external", loader: { ".css": "empty" } });
const tmp = "out/.story.mjs"; fs.mkdirSync("out", { recursive: true }); fs.writeFileSync(tmp, r.outputFiles[0].text);
const S = await import(process.cwd() + "/" + tmp);
const fps = 30, s = (f) => +(f / fps).toFixed(3);
const cues = { duration: s(S.DURATION), cuts: S.SCENES.map((x) => s(x.from)).filter((t) => t > 0), impacts: (S.IMPACTS || []).map(s), pops: (S.POPS || []).map(s), risers: (S.RISERS || []).map(s) };
fs.writeFileSync("out/cues.json", JSON.stringify(cues, null, 1)); fs.unlinkSync(tmp);
console.log(JSON.stringify(cues));
