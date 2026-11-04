// Builds src/data/india_dots.json: a dot-matrix India (official outline incl. all of J&K + Ladakh) and a city table.
import fs from "fs"; import { feature } from "topojson-client";
const topo = JSON.parse(fs.readFileSync("node_modules/world-atlas/countries-50m.json", "utf8"));
const ind = feature(topo, topo.objects.countries).features.find(f => f.id === "356");
const polys = ind.geometry.type === "Polygon" ? [ind.geometry.coordinates] : ind.geometry.coordinates;
// northern extent per the official Indian map (approximate, fine at dot-matrix scale)
const north = [[73.9,32.8],[73.2,34.0],[72.5,35.3],[73.2,36.4],[74.6,37.05],[75.8,36.9],[77.0,35.9],[78.0,35.6],[79.5,35.6],[80.3,35.3],[80.2,34.5],[79.0,33.2],[78.8,32.4],[77.5,32.6],[75.8,32.4],[74.6,32.4]];
polys.push([north]);
const inRing = (x, y, r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const inside = (x, y) => polys.some(p => inRing(x, y, p[0]) && !p.slice(1).some(h => inRing(x, y, h)));
const LON0 = 67.5, LON1 = 98, LAT0 = 6, LAT1 = 37.5, K = Math.cos(22 * Math.PI / 180);
const W = 1000, sx = W / ((LON1 - LON0) * K), H = Math.round((LAT1 - LAT0) * sx);
const proj = (lon, lat) => [+((lon - LON0) * K * sx).toFixed(1), +((LAT1 - lat) * sx).toFixed(1)];
const step = 0.42, dots = [];
for (let lat = LAT1; lat > LAT0; lat -= step * 0.87) { const row = Math.round((LAT1 - lat) / (step * 0.87));
  for (let lon = LON0 + (row % 2 ? step / 2 : 0); lon < LON1; lon += step / K * 0.87) if (inside(lon, lat)) dots.push(proj(lon, lat)); }
const cities = { Delhi: [77.21, 28.61], Mumbai: [72.88, 19.08], Kolkata: [88.36, 22.57], Chennai: [80.27, 13.08], Bengaluru: [77.59, 12.97], Hyderabad: [78.49, 17.39], Lucknow: [80.95, 26.85], Srinagar: [74.8, 34.08], Jaipur: [75.79, 26.91], Patna: [85.14, 25.6], Ahmedabad: [72.57, 23.02], Pune: [73.86, 18.52], Bhopal: [77.41, 23.26], Guwahati: [91.74, 26.14], Indore: [75.86, 22.72], Kochi: [76.27, 9.93] };
const C = Object.fromEntries(Object.entries(cities).map(([k, v]) => [k, proj(...v)]));
fs.mkdirSync("src/data", { recursive: true });
fs.writeFileSync("src/data/india_dots.json", JSON.stringify({ w: W, h: H, dots, cities: C }));
console.log("dots", dots.length, "size", W, H);
