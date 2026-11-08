import * as THREE from 'three';

// Engineering call-out labels: a dot on the 3D anchor, an elbow leader line and a text card.
// kind 'part'  -> a real mechanical/electrical component (white)
// kind 'vis'   -> a visual explanation only, not a physical part (cyan, dashed, tagged)
export class Labels {
  constructor(container) {
    this.container = container;
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.classList.add('label-lines');
    container.appendChild(this.svg);
    this.items = [];
    this.v = new THREE.Vector3();
  }

  add({ anchor, title, sub = '', group, kind = 'part', num = null, side = 'auto', dx = 70, dy = -34 }) {
    const el = document.createElement('div');
    el.className = `label ${kind}`;
    el.innerHTML = `${num ? `<span class="num">${String(num).padStart(2, '0')}</span>` : ''}<div class="txt"><div class="t">${title}</div>${sub ? `<div class="s">${sub}</div>` : ''}${kind === 'vis' ? '<div class="tag">VISUALIZATION</div>' : ''}</div>`;
    this.container.appendChild(el);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    line.setAttribute('class', `ll ${kind}`);
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('r', '3.5'); dot.setAttribute('class', `ld ${kind}`);
    this.svg.append(line, dot);
    this.items.push({ anchor, el, line, dot, group, side, dx, dy, cur: side === 'left' ? -1 : 1, w: 0 });
  }

  update(camera, W, H, groupOpacity) {
    this.svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const scale = H / 1080;
    for (const it of this.items) {
      const o = groupOpacity[it.group] ?? 0;
      if (o < 0.01) { it.el.style.opacity = 0; it.line.style.opacity = 0; it.dot.style.opacity = 0; it.el.style.visibility = 'hidden'; continue; }
      it.anchor.getWorldPosition(this.v);
      this.v.project(camera);
      if (this.v.z > 1 || this.v.z < -1) { it.el.style.visibility = 'hidden'; it.line.style.opacity = 0; it.dot.style.opacity = 0; continue; }
      const x = (this.v.x * 0.5 + 0.5) * W, y = (-this.v.y * 0.5 + 0.5) * H;
      if (it.side === 'auto') {
        if (x > W * 0.5 + 30) it.cur = 1; else if (x < W * 0.5 - 30) it.cur = -1;
      } else it.cur = it.side === 'left' ? -1 : 1;
      const ex = x + it.cur * it.dx * scale, ey = y + it.dy * scale;
      const lx = ex + it.cur * 40 * scale;
      it.line.setAttribute('points', `${x},${y} ${ex},${ey} ${lx},${ey}`);
      it.dot.setAttribute('cx', x); it.dot.setAttribute('cy', y);
      it.el.style.visibility = 'visible';
      it.el.style.opacity = o; it.line.style.opacity = o; it.dot.style.opacity = o;
      it.el.style.transform = `translate(${it.cur > 0 ? lx + 6 * scale : lx - 6 * scale}px, ${ey}px) translate(${it.cur > 0 ? '0' : '-100%'}, -50%)`;
    }
  }
}
