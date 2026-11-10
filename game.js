(() => {
  'use strict';

  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d');
  const announcer = document.getElementById('announcer');
  const cars = [
    { name: 'Fuego GT', year: 1986, hp: 128, mass: 980, color: '#e65f45', style: 'coupe' },
    { name: 'Cobalto RS', year: 1989, hp: 154, mass: 1080, color: '#5d8fba', style: 'coupe' },
    { name: 'Rayo Turbo', year: 1992, hp: 178, mass: 1160, color: '#e9b64f', style: 'hatch' },
    { name: 'Vértigo 2.0', year: 1995, hp: 192, mass: 1190, color: '#8b74bf', style: 'coupe' },
    { name: 'Lince GTI', year: 1998, hp: 205, mass: 1120, color: '#69a77a', style: 'hatch' },
    { name: 'Cóndor V6', year: 2000, hp: 218, mass: 1320, color: '#bd5d65', style: 'coupe' },
    { name: 'Fénix Type-R', year: 2002, hp: 232, mass: 1210, color: '#d7d4cb', style: 'hatch' },
    { name: 'Tormenta GT', year: 2005, hp: 245, mass: 1270, color: '#53a7a4', style: 'coupe' }
  ];
  const gears = [52, 88, 128, 169, 210, 252];
  let W = 0, H = 0, dpr = 1, mode = 'garage', selected = 0, scroll = 0;
  let race = null, held = false, hits = [], last = 0;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function rounded(x, y, w, h, r, fill, stroke, lineWidth = 1) {
    ctx.beginPath(); ctx.roundRect(x, y, Math.max(0, w), Math.max(0, h), r);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.lineWidth = lineWidth; ctx.strokeStyle = stroke; ctx.stroke(); }
  }
  function text(value, x, y, size, color = '#f1eee8', weight = 600, align = 'left') {
    ctx.fillStyle = color; ctx.font = `${weight} ${size}px Inter, system-ui, sans-serif`;
    ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(value, x, y);
  }
  function line(x1, y1, x2, y2, color, width = 1) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
  }
  function addHit(id, x, y, w, h, fn) { hits.push({ id, x, y, w, h, fn }); }
  function announce(message) { if (announcer) announcer.textContent = message; }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  function background() {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#17191d'); grad.addColorStop(1, '#101114');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff'; ctx.globalAlpha = .025;
    for (let x = 0; x < W; x += 24) for (let y = 0; y < H; y += 24) ctx.fillRect(x, y, 1, 1);
    ctx.globalAlpha = 1;
  }
  function drawCar(car, x, y, scale = 1, facing = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale * facing, scale);
    // Stylized side profile, deliberately legible at small screen sizes.
    ctx.fillStyle = '#08090b'; ctx.beginPath(); ctx.ellipse(0, 23, 55, 6, 0, 0, Math.PI * 2); ctx.fill();
    rounded(-47, -5, 94, 24, 7, car.color);
    ctx.beginPath(); ctx.moveTo(-25, -5); ctx.lineTo(-12, -20); ctx.lineTo(18, -20); ctx.lineTo(34, -5); ctx.closePath();
    ctx.fillStyle = car.color; ctx.fill();
    ctx.beginPath(); ctx.moveTo(-17, -7); ctx.lineTo(-8, -17); ctx.lineTo(4, -17); ctx.lineTo(4, -7); ctx.closePath(); ctx.fillStyle = '#27333a'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(8, -17); ctx.lineTo(16, -17); ctx.lineTo(27, -7); ctx.lineTo(8, -7); ctx.closePath(); ctx.fill();
    for (const wx of [-27, 29]) {
      ctx.beginPath(); ctx.arc(wx, 17, 10, 0, Math.PI * 2); ctx.fillStyle = '#121316'; ctx.fill();
      ctx.beginPath(); ctx.arc(wx, 17, 4, 0, Math.PI * 2); ctx.fillStyle = '#9b9b98'; ctx.fill();
    }
    ctx.fillStyle = '#ffe0a2'; ctx.fillRect(40, 2, 5, 5); ctx.fillStyle = '#992f32'; ctx.fillRect(-47, 2, 4, 5);
    ctx.restore();
  }
  function garage() {
    background(); hits = [];
    const p = W < 600 ? 20 : 42;
    text('MOTOR CLUB', p, 30, 11, '#f28a55', 850);
    text('1986 — 2005', W - p, 30, 9, '#777a80', 750, 'right');
    line(p, 50, W - p, 50, '#ffffff18');
    text('CUARTO DE MILLA', p, 82, W < 600 ? 23 : 32, '#f3f0e8', 900);
    text('Elige tu máquina. Domina los 402 metros.', p, 109, W < 600 ? 11 : 13, '#999a9d', 500);

    const short = H < 520;
    const heroTop = short ? 116 : 130;
    const heroH = short ? 103 : W < 600 ? 142 : 176;
    const heroY = short ? 180 : W < 600 ? 204 : Math.min(235, H * .31);
    rounded(p, heroTop, W - p * 2, heroH, 14, '#1b1d21', '#ffffff12');
    const car = cars[selected];
    drawCar(car, W * .51, heroY + 45, W < 600 ? 1.1 : 1.45);
    text(`${car.year}`, p + 18, 151, 9, '#898b90', 750);
    text(car.name.toUpperCase(), p + 18, 171, W < 600 ? 14 : 16, car.color, 850);
    text(`${car.hp} HP`, W - p - 18, 153, 16, '#f2eee5', 850, 'right');
    text(`${car.mass} KG`, W - p - 18, 171, 9, '#8e9094', 700, 'right');
    const listTop = short ? 237 : W < 600 ? 291 : 325;
    text('TU GARAJE', p, listTop, 10, '#a4a4a3', 850);
    text('TOCA PARA ELEGIR', W - p, listTop, 8, '#676a70', 750, 'right');
    const cols = W < 520 ? 2 : 4;
    const gap = 9, cardW = (W - p * 2 - gap * (cols - 1)) / cols;
    const cardH = W < 600 ? 55 : 62;
    const rows = Math.ceil(cars.length / cols);
    const visibleBottom = H - (W < 600 ? 82 : 94);
    const maxScroll = Math.max(0, listTop + 18 + rows * (cardH + 8) - visibleBottom);
    scroll = clamp(scroll, 0, maxScroll);
    ctx.save(); ctx.beginPath(); ctx.rect(0, listTop + 15, W, Math.max(0, visibleBottom - listTop - 15)); ctx.clip();
    cars.forEach((item, i) => {
      const col = i % cols, row = Math.floor(i / cols), x = p + col * (cardW + gap), y = listTop + 19 + row * (cardH + 8) - scroll;
      const isSelected = selected === i;
      rounded(x, y, cardW, cardH, 9, isSelected ? '#29231f' : '#1a1b1f', isSelected ? item.color : '#ffffff10', isSelected ? 1.5 : 1);
      text(item.name, x + 10, y + 17, W < 600 ? 10 : 11, isSelected ? item.color : '#e1ded7', 800);
      text(`${item.year}  ·  ${item.hp} hp`, x + 10, y + 38, 8, '#8b8d91', 650);
      addHit(`car-${i}`, x, y, cardW, cardH, () => { selected = i; draw(); });
    });
    ctx.restore();
    const buttonH = 54, buttonY = H - buttonH - 15;
    rounded(p, buttonY, W - p * 2, buttonH, 11, '#ed7743');
    text('SALIR A LA PISTA', W / 2, buttonY + 20, 13, '#171513', 900, 'center');
    text('402 M  ·  CAMBIOS MANUALES', W / 2, buttonY + 38, 8, '#4b291c', 800, 'center');
    addHit('start', p, buttonY, W - p * 2, buttonH, startRace);
    if (maxScroll > 0) {
      const trackH = visibleBottom - listTop - 16;
      rounded(W - 7, listTop + 16, 2, trackH, 1, '#ffffff16');
      rounded(W - 7, listTop + 16 + (scroll / maxScroll) * (trackH - 25), 2, 25, 1, '#f28a55');
    }
  }
  function startRace() {
    const rivalOptions = cars.filter((_, i) => i !== selected);
    const rival = rivalOptions[Math.floor(Math.random() * rivalOptions.length)];
    race = { playerCar: cars[selected], rivalCar: rival, phase: 'countdown', elapsed: 0, clock: 0, distance: 0, rivalDistance: 0, speed: 0, rivalSpeed: 0, rpm: 900, gear: 1, reaction: null, shiftTime: 0, perfect: false, message: '', messageUntil: 0, won: false, falseStart: false, finishTime: 0, rivalFinish: 20.5 + (245 - rival.hp) * .035, finished: false };
    mode = 'race'; held = false; announce('Carrera iniciada. Espera la luz verde.'); draw();
  }
  function road() {
    const top = Math.min(Math.max(100, H * .23), H * .34), bottom = Math.min(H - 150, top + H * .38), center = W / 2;
    ctx.fillStyle = '#1c1e22'; ctx.fillRect(0, top, W, bottom - top);
    // Perspective lanes
    ctx.beginPath(); ctx.moveTo(center - 18, top); ctx.lineTo(center - W * .46, bottom); ctx.lineTo(center + W * .46, bottom); ctx.lineTo(center + 18, top); ctx.closePath();
    ctx.fillStyle = '#292b2e'; ctx.fill();
    for (let i = 0; i < 13; i++) {
      const t = ((i / 13 + race.clock * .095) % 1), yy = top + (bottom - top) * t;
      const half = 18 + (W * .46 - 18) * t;
      ctx.fillStyle = i % 2 ? '#f28a55' : '#e5e0d8';
      ctx.fillRect(center - half - 4, yy, 4 + 8 * t, 3 + 6 * t);
      ctx.fillRect(center + half, yy, 4 + 8 * t, 3 + 6 * t);
    }
    const carScale = W < 600 ? .75 : 1;
    const rise = clamp(race.distance / 402, 0, 1) * 12;
    drawCar(race.rivalCar, center + (W < 600 ? 63 : 104), bottom - 24 - rise, carScale * .75);
    drawCar(race.playerCar, center - (W < 600 ? 63 : 104), bottom - 19, carScale);
    return { top, bottom };
  }
  function gauge(x, y, width) {
    const radius = Math.max(34, Math.min(64, width * .38));
    const cx = x + radius, cy = y + radius + 3;
    ctx.beginPath(); ctx.arc(cx, cy, radius, Math.PI, 0); ctx.lineWidth = 9; ctx.strokeStyle = '#35373b'; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, radius, Math.PI, Math.PI + Math.PI * clamp(race.rpm / 8000, 0, 1)); ctx.lineWidth = 9; ctx.strokeStyle = race.rpm > 7000 ? '#e95f4c' : '#f28a55'; ctx.stroke();
    text(`${Math.round(race.rpm)}`, cx, cy - 9, 20, '#f5f0e7', 850, 'center');
    text('RPM', cx, cy + 10, 8, '#898b90', 800, 'center');
    text('0', cx - radius, cy + 16, 7, '#6d7074', 700, 'center');
    text('8', cx + radius, cy + 16, 7, '#6d7074', 700, 'center');
  }
  function finish(falseStart = false) {
    if (race.finished) return;
    race.finished = true; race.falseStart = falseStart; race.phase = 'result'; mode = 'result'; held = false;
    race.won = !falseStart && race.distance >= 402 && (race.rivalDistance < 402 || race.clock <= race.rivalFinish);
    race.finishTime = race.clock;
    announce(falseStart ? 'Salida en falso. Toca para volver al garaje.' : race.won ? 'Ganaste la carrera.' : 'Carrera terminada.');
  }
  function shift() {
    if (!race || race.phase !== 'running' || race.gear >= 6) return;
    const rpm = race.rpm;
    race.perfect = rpm >= 6500 && rpm <= 7600;
    race.gear++;
    race.shiftTime = race.perfect ? .12 : .3;
    race.speed *= race.perfect ? 1.025 : (rpm < 5200 || rpm > 7900 ? .91 : .97);
    race.message = race.perfect ? '¡CAMBIO PERFECTO!' : rpm < 5200 ? 'MUY PRONTO' : rpm > 7900 ? 'CORTE DE RPM' : 'CAMBIO';
    race.messageUntil = race.clock + 1.05;
    announce(race.message);
  }
  function update(dt) {
    if (!race) return;
    race.elapsed += dt;
    if (race.phase === 'countdown') {
      if (race.elapsed >= 3.2) { race.phase = 'running'; race.clock = 0; announce('¡Luz verde! Acelera y cambia de marcha.'); }
      return;
    }
    if (race.phase !== 'running') return;
    race.clock += dt;
    const car = race.playerCar;
    const gearMax = gears[race.gear - 1] / 3.6;
    const ratio = clamp(race.speed / gearMax, 0, 1.12);
    race.rpm = clamp(900 + ratio * 6700 + (held ? 200 : -120), 900, 8200);
    if (race.shiftTime > 0) race.shiftTime = Math.max(0, race.shiftTime - dt);
    if (held && race.shiftTime <= 0) {
      const power = car.hp / 245;
      const rpmFactor = race.rpm > 7850 ? .42 : race.rpm < 3000 ? .77 : 1;
      race.speed += (2.1 + power * 2.35) * rpmFactor * dt;
      if (race.speed > gearMax) race.speed = gearMax;
    } else {
      race.speed = Math.max(0, race.speed - .16 * dt);
    }
    race.distance += race.speed * dt;
    // AI pace varies slightly from run to run, independent of the player's chosen car.
    const rivalTime = race.rivalFinish;
    const progress = clamp(race.clock / rivalTime, 0, 1);
    race.rivalDistance = 402 * (progress * progress * (3 - 2 * progress));
    race.rivalSpeed = progress < 1 ? 402 * (6 * progress - 6 * progress * progress) / rivalTime : 0;
    if (race.distance >= 402) { race.distance = 402; finish(false); }
    else if (race.rivalDistance >= 402) finish(false);
    if (race.message && race.clock > race.messageUntil) race.message = '';
  }
  function drawRace() {
    background(); hits = [];
    const p = W < 600 ? 20 : 38;
    text('CUARTO DE MILLA', p, 27, 10, '#f28a55', 800);
    text('402 M / ELIMINACIÓN', W - p, 27, 9, '#777a80', 750, 'right');
    line(p, 48, W - p, 48, '#ffffff18');
    text(race.playerCar.name.toUpperCase(), p, 68, 10, race.playerCar.color, 850);
    text('VS', W / 2, 68, 9, '#6d7074', 800, 'center');
    text(race.rivalCar.name.toUpperCase(), W - p, 68, 10, race.rivalCar.color, 850, 'right');
    const rd = road(), y = rd.bottom + 27;
    if (W < 600) {
      const half = (W - p * 2 - 22) / 2;
      gauge(p, y, half);
      const infoX = W - p - half;
      text('MARCHA', infoX, y + 8, 8, '#868990', 800);
      text(`${race.gear}`, infoX, y + 32, 24, '#f3a166', 800);
      text('DISTANCIA', infoX, y + 56, 8, '#868990', 800);
      text(`${Math.max(0, Math.round(race.distance))} m`, infoX, y + 75, 12, '#f0eee8', 760);
      rounded(p, y + 95, W - p * 2, 5, 3, '#34363a');
      rounded(p, y + 95, (W - p * 2) * clamp(race.distance / 402, 0, 1), 5, 3, '#f17b47');
    } else {
      const gaugeW = Math.min(240, W * .25), x = W - p - gaugeW;
      gauge(p, y + 4, gaugeW);
      text('MARCHA', x, y + 8, 8, '#868990', 800);
      text(`${race.gear}`, x, y + 38, 31, '#f3a166', 800);
      text('DISTANCIA', x + 62, y + 8, 8, '#868990', 800);
      text(`${Math.max(0, Math.round(race.distance))} m`, x + 62, y + 32, 17, '#f0eee8', 760);
      rounded(x + 62, y + 50, gaugeW - 62, 5, 3, '#34363a');
      rounded(x + 62, y + 50, (gaugeW - 62) * clamp(race.distance / 402, 0, 1), 5, 3, '#f17b47');
    }
    const buttonH = W < 600 ? 62 : 60, buttonY = H - buttonH - 12, buttonX = p, buttonW = W - p * 2;
    if (mode === 'result') {
      rounded(buttonX, buttonY, buttonW, buttonH, 10, race.falseStart ? '#b8443c' : race.won ? '#eb8c52' : '#303237');
      text(race.falseStart ? 'SALIDA EN FALSO · VOLVER AL GARAGE' : race.won ? '¡GANASTE! · TOCA PARA VOLVER' : 'CARRERA TERMINADA · VOLVER AL GARAGE', W / 2, buttonY + buttonH / 2, W < 600 ? 10 : 12, race.won || race.falseStart ? '#171513' : '#f1eee8', 850, 'center');
      addHit('back', buttonX, buttonY, buttonW, buttonH, () => { mode = 'garage'; race = null; held = false; draw(); });
    } else {
      rounded(buttonX, buttonY, buttonW, buttonH, 10, held ? '#ff9c65' : '#ed7743', held ? '#ffc095' : null, 2);
      text(race.phase === 'countdown' ? 'ESPERA LA LUZ VERDE' : 'MANTÉN PARA ACELERAR', W / 2, buttonY + buttonH / 2 - 6, W < 600 ? 12 : 13, '#171513', 850, 'center');
      text(race.phase === 'countdown' ? 'NO ARRANQUES ANTES DE TIEMPO' : 'SUELTA CERCA DE 7,000 RPM PARA CAMBIAR', W / 2, buttonY + buttonH / 2 + 11, W < 600 ? 7 : 8, '#4a2418', 800, 'center');
      addHit('throttle', buttonX, buttonY, buttonW, buttonH);
    }
    if (race.phase === 'countdown' && mode === 'race') {
      const n = Math.floor(race.elapsed);
      text(n < 3 ? String(3 - n) : '¡YA!', W / 2, H * .16, 25, '#ffc07c', 900, 'center');
      text('PREPÁRATE', W / 2, H * .16 + 23, 8, '#b8b2a7', 800, 'center');
    }
    if (race.phase === 'running') {
      text(`${race.speed > 0 ? Math.round(race.speed * 3.6) : 0} km/h`, W / 2, rd.top - 13, 11, '#e5e0d8', 800, 'center');
    }
    if (race.message && mode === 'race') text(race.message, W / 2, buttonY - 14, 9, race.perfect ? '#83dfb4' : '#f3a166', 850, 'center');
    if (mode === 'result') {
      text(race.falseStart ? 'SALIDA EN FALSO' : race.won ? 'GANADOR' : 'SEGUNDO LUGAR', W / 2, rd.top - 13, 14, race.falseStart ? '#ff7b6e' : race.won ? '#ffc07c' : '#e5e0d8', 900, 'center');
      if (race.finishTime) text(`${race.finishTime.toFixed(2)} s`, W / 2, rd.top + 8, 10, '#d4cec4', 750, 'center');
    }
  }
  function draw() { if (!W || !H) return; mode === 'garage' ? garage() : drawRace(); }
  function pointerDown(e) {
    e.preventDefault(); canvas.setPointerCapture?.(e.pointerId);
    const rect = canvas.getBoundingClientRect(), x = e.clientX - rect.left, y = e.clientY - rect.top;
    const hit = [...hits].reverse().find(item => x >= item.x && x <= item.x + item.w && y >= item.y && y <= item.y + item.h);
    if (hit) {
      if (hit.id === 'throttle' && mode === 'race' && race) {
        if (race.phase === 'countdown') { finish(true); }
        else if (race.phase === 'running') { held = true; if (race.reaction === null) race.reaction = race.clock; }
        draw();
      } else hit.fn?.();
      return;
    }
    if (mode === 'garage' && Math.abs(e.movementY || 0) > 0) scroll = Math.max(0, scroll + e.movementY);
  }
  function pointerUp() { if (held && mode === 'race' && race?.phase === 'running') { held = false; shift(); draw(); } }
  canvas.addEventListener('pointerdown', pointerDown, { passive: false });
  window.addEventListener('pointerup', pointerUp, { passive: false });
  canvas.addEventListener('pointercancel', pointerUp);
  canvas.addEventListener('wheel', e => { if (mode === 'garage') { scroll = Math.max(0, scroll + e.deltaY); draw(); } }, { passive: true });
  window.addEventListener('keydown', e => {
    if (mode === 'garage' && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { scroll = Math.max(0, scroll + (e.key === 'ArrowDown' ? 100 : -100)); draw(); }
    if ((e.key === ' ' || e.key === 'ArrowUp') && mode === 'race' && race?.phase === 'running') { e.preventDefault(); held = true; }
    if ((e.key === ' ' || e.key === 'ArrowUp') && mode === 'race' && race?.phase === 'countdown') { finish(true); draw(); }
    if (e.key === 'Escape' && mode !== 'garage') { mode = 'garage'; race = null; held = false; draw(); }
  });
  window.addEventListener('keyup', e => { if ((e.key === ' ' || e.key === 'ArrowUp') && held) pointerUp(); });
  window.addEventListener('resize', resize);
  function loop(now) {
    const dt = Math.min(.04, (now - last) / 1000 || 0); last = now;
    if (mode === 'race') { update(dt); draw(); }
    requestAnimationFrame(loop);
  }
  resize(); requestAnimationFrame(loop);
})();
