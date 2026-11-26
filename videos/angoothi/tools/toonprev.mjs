import puppeteer from 'puppeteer-core'; import fs from 'fs';
import { rama, hanuman } from '../toon.js';
const html = `<html><body style="margin:0;background:#3a6;display:flex;gap:10px">${[rama({}), rama({ mouth: 1 }), hanuman({ pose: 'namaste' }), hanuman({ pose: 'fly' }), hanuman({ pose: 'look' })].map((s) => `<img style="height:900px" src="data:image/svg+xml;base64,${Buffer.from(s).toString('base64')}">`).join('')}</body></html>`;
fs.writeFileSync('out/toon.html', html);
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH, args: ['--no-sandbox'] }); const p = await b.newPage();
await p.setViewport({ width: 2900, height: 900 }); await p.goto('file://' + process.cwd() + '/out/toon.html'); await new Promise((r) => setTimeout(r, 500));
await p.screenshot({ path: 'out/toon.png' }); await b.close();
