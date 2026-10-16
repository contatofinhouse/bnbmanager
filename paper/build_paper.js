// Gera o paper FINHOUSE Short Stay (HTML + PDF) a partir dos dados reais em ../data
// Uso: node paper/build_paper.js
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT_HTML = path.join(__dirname, 'FINHOUSE_ShortStay_Paper.html');
const OUT_PDF = path.join(__dirname, 'FINHOUSE_ShortStay_Paper.pdf');

// ---------- Dados ----------
const load = (id) => JSON.parse(fs.readFileSync(path.join(ROOT, 'data', id + '.json'), 'utf8'));
const props = { copan: load('copan'), f229: load('flatincrivel-229'), f320: load('flatincrivel-320') };

function row(d, label) {
  const r = d.rows.find((x) => x.label === label);
  return r ? r.values : {};
}
function monthsOf(d) { return d.columns.filter((c) => !c.isTotal); }
function sumYear(d, label, year) {
  return monthsOf(d).filter((c) => c.year === year).reduce((s, c) => s + (Number(row(d, label)[c.key]) || 0), 0);
}
function weightedADR(d, year) {
  // diária média ponderada pelas diárias
  let n = 0, v = 0;
  monthsOf(d).filter((c) => c.year === year).forEach((c) => {
    const di = Number(row(d, 'Diárias')[c.key]) || 0;
    const adr = Number(row(d, 'Média diária hóspede')[c.key]) || 0;
    if (di && adr) { n += di; v += di * adr; }
  });
  return n ? v / n : 0;
}
function occ(d, year) {
  const di = sumYear(d, 'Diárias', year);
  const days = monthsOf(d).filter((c) => c.year === year && (Number(row(d, 'Diárias')[c.key]) || 0) > 0)
    .reduce((s, c) => s + new Date(c.year, monthIdx(c.key), 0).getDate(), 0);
  return days ? di / days : 0;
}
function monthIdx(key) { return Number(key.split('-')[1]); }
function kpis(d, year) {
  const diarias = sumYear(d, 'Diárias', year);
  const checkins = sumYear(d, 'Quantidade Check-ins', year);
  const meses = monthsOf(d).filter((c) => c.year === year && (Number(row(d, 'Diárias')[c.key]) || 0) > 0).length;
  const receita = sumYear(d, 'Receita Booking', year) + sumYear(d, 'Receita Airbnb', year) + sumYear(d, 'Receita offsite', year) + sumYear(d, 'Diárias Pet', year);
  const o = occ(d, year), adr = weightedADR(d, year);
  return {
    diarias, checkins, meses, receita, occ: o, adr, revpar: o * adr,
    estadia: checkins ? diarias / checkins : 0, giro: meses ? checkins / meses : 0,
    liquida: sumYear(d, 'Receita líquida locação', year),
    lav: sumYear(d, 'Lavanderia/Diarista', year), adm: sumYear(d, 'Administração', year),
    comissao: sumYear(d, 'Comissão Booking', year), manut: sumYear(d, 'Manutenção', year),
    caixa: sumYear(d, 'Resultado Líquido / Caixa', year),
  };
}
const K = {
  copan25: kpis(props.copan, 2025), copan26: kpis(props.copan, 2026),
  f229_24: kpis(props.f229, 2024), f229_25: kpis(props.f229, 2025), f229_26: kpis(props.f229, 2026),
  f320_25: kpis(props.f320, 2025), f320_26: kpis(props.f320, 2026),
};

// ---------- Formatação ----------
const brl = (v, dec = 0) => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
const brlk = (v) => 'R$ ' + (v / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' mil';
const pct = (v, dec = 0) => (v * 100).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + '%';
const num = (v, dec = 1) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });

// ---------- Benchmarks (pesquisa de mercado out/2026) ----------
const MKT = {
  spOcc: 0.61, spADR: 245, bertiogaOcc: 0.46,
  feeTable: [
    { name: 'FINHOUSE', lo: 12, hi: 12, hl: true },
    { name: 'Housi', lo: 12, hi: 20 },
    { name: 'Seazone', lo: 20, hi: 25 },
    { name: 'Charlie', lo: 20, hi: 30 },
    { name: 'Gestoras full-service (média)', lo: 20, hi: 35 },
  ],
};

// ---------- Business 1: simulação imóvel-tipo ----------
const FEE = 0.12;
function simB1({ adr, occ, otaPct, estadia, lavCheckin, manutPct, fixosAno }) {
  const noites = Math.round(365 * occ);
  const bruto = adr * noites;
  const ota = bruto * otaPct;
  const repasse = bruto - ota; // valor efetivamente recebido das plataformas
  const checkins = Math.round(noites / estadia);
  const lav = checkins * lavCheckin;
  const adm = repasse * FEE;
  const manut = repasse * manutPct;
  const operacional = repasse - lav - adm - manut;
  const liquido = operacional - fixosAno;
  return { noites, bruto, ota, repasse, checkins, lav, adm, manut, operacional, fixosAno, liquido };
}
const simSP = simB1({ adr: 310, occ: 0.75, otaPct: 0.155, estadia: 3.1, lavCheckin: 150, manutPct: 0.02, fixosAno: 12 * (850 + 120 + 150) });
const simPraia = simB1({ adr: 420, occ: 0.72, otaPct: 0.14, estadia: 2.5, lavCheckin: 55, manutPct: 0.03, fixosAno: 12 * (2100 + 75 + 200 + 150) });
// Aluguel tradicional do mesmo studio em SP
const tradSP = { aluguel: 2200 * 12, adm: 2200 * 12 * 0.10, vacancia: 2200 }; // 10% adm imobiliária + 1 mês de vacância
tradSP.liquido = tradSP.aluguel - tradSP.adm - tradSP.vacancia;

// ---------- Business 2: compra e cotização ----------
const B2 = { preco: 550000, custosAq: 0.045, reforma: 75000, reserva: 15000, cotas: 4, valoriz: 0.05, reajuste: 0.04, custoSaida: 0.06, anos: 10 };
B2.invest = B2.preco * (1 + B2.custosAq) + B2.reforma + B2.reserva;
B2.cota = B2.invest / B2.cotas;
const cenarios = [
  { nome: 'Conservador', adr: 380, occ: 0.60 },
  { nome: 'Base', adr: 420, occ: 0.72 },
  { nome: 'Otimista', adr: 470, occ: 0.80 },
].map((c) => {
  const s = simB1({ adr: c.adr, occ: c.occ, otaPct: 0.14, estadia: 2.5, lavCheckin: 55, manutPct: 0.03, fixosAno: 12 * (2100 + 75 + 200 + 200) });
  const yieldA = s.liquido / B2.invest;
  // fluxo por cota
  const flows = [-B2.cota];
  for (let a = 1; a <= B2.anos; a++) {
    let f = (s.liquido * Math.pow(1 + B2.reajuste, a - 1)) / B2.cotas;
    if (a === B2.anos) f += (B2.preco * Math.pow(1 + B2.valoriz, B2.anos) * (1 - B2.custoSaida)) / B2.cotas;
    flows.push(f);
  }
  const tir = irr(flows);
  const payback = B2.cota / (s.liquido / B2.cotas);
  return { ...c, s, yieldA, mensalCota: s.liquido / B2.cotas / 12, tir, payback };
});
function irr(flows) {
  let lo = -0.9, hi = 1;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const npv = flows.reduce((s, f, t) => s + f / Math.pow(1 + mid, t), 0);
    if (npv > 0) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

// ---------- Gráficos SVG ----------
const C = { navy: '#0E1A2B', teal: '#0F9D8A', gold: '#C8A15A', coral: '#E0765A', slate: '#64748B', grid: '#E6E9EF', sky: '#4C8DD6' };

function lineChart({ series, keys, w = 720, h = 260, yMax = 1, refs = [], yFmt = (v) => pct(v) }) {
  const pl = 44, pr = 16, pt = 16, pb = 34;
  const iw = w - pl - pr, ih = h - pt - pb;
  const x = (i) => pl + (i / (keys.length - 1)) * iw;
  const y = (v) => pt + ih - (v / yMax) * ih;
  let g = '';
  for (let t = 0; t <= 4; t++) {
    const v = (yMax / 4) * t;
    g += `<line x1="${pl}" x2="${w - pr}" y1="${y(v)}" y2="${y(v)}" stroke="${C.grid}"/>`;
    g += `<text x="${pl - 8}" y="${y(v) + 4}" text-anchor="end" class="ax">${yFmt(v)}</text>`;
  }
  keys.forEach((k, i) => {
    if (i % 3 === 0) {
      const [yy, mm] = k.split('-');
      const lab = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][Number(mm) - 1] + '/' + yy.slice(2);
      g += `<text x="${x(i)}" y="${h - 12}" text-anchor="middle" class="ax">${lab}</text>`;
    }
  });
  refs.forEach((r) => {
    g += `<line x1="${pl}" x2="${w - pr}" y1="${y(r.v)}" y2="${y(r.v)}" stroke="${r.color}" stroke-dasharray="5 4" stroke-width="1.4"/>`;
  });
  series.forEach((s) => {
    let d = '', pen = false;
    keys.forEach((k, i) => {
      const v = s.data[k];
      if (v == null || v === 0) { pen = false; return; }
      d += (pen ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(Math.min(v, yMax)).toFixed(1) + ' ';
      pen = true;
    });
    g += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`;
    keys.forEach((k, i) => { const v = s.data[k]; if (v) g += `<circle cx="${x(i)}" cy="${y(Math.min(v, yMax))}" r="2.6" fill="${s.color}"/>`; });
  });
  return `<svg viewBox="0 0 ${w} ${h}" class="chart">${g}</svg>`;
}

function barChart({ items, w = 720, h = 240, yMax, yFmt = (v) => v, valFmt = yFmt }) {
  const pl = 52, pr = 12, pt = 20, pb = 40;
  const iw = w - pl - pr, ih = h - pt - pb;
  const bw = iw / items.length;
  const y = (v) => pt + ih - (v / yMax) * ih;
  let g = '';
  for (let t = 0; t <= 4; t++) {
    const v = (yMax / 4) * t;
    g += `<line x1="${pl}" x2="${w - pr}" y1="${y(v)}" y2="${y(v)}" stroke="${C.grid}"/>`;
    g += `<text x="${pl - 8}" y="${y(v) + 4}" text-anchor="end" class="ax">${yFmt(v)}</text>`;
  }
  items.forEach((it, i) => {
    const x0 = pl + i * bw + bw * 0.18, bwi = bw * 0.64;
    g += `<rect x="${x0}" y="${y(it.v)}" width="${bwi}" height="${pt + ih - y(it.v)}" rx="4" fill="${it.color || C.teal}"/>`;
    if (it.showVal !== false) g += `<text x="${x0 + bwi / 2}" y="${y(it.v) - 6}" text-anchor="middle" class="bv">${valFmt(it.v)}</text>`;
    g += `<text x="${x0 + bwi / 2}" y="${h - 22}" text-anchor="middle" class="ax">${it.label}</text>`;
    if (it.sub) g += `<text x="${x0 + bwi / 2}" y="${h - 9}" text-anchor="middle" class="ax small">${it.sub}</text>`;
  });
  return `<svg viewBox="0 0 ${w} ${h}" class="chart">${g}</svg>`;
}

function feeChart(rows, w = 720, h = 230) {
  const pl = 210, pr = 30, pt = 10, rowH = (h - pt - 30) / rows.length, max = 40;
  const x = (v) => pl + (v / max) * (w - pl - pr);
  let g = '';
  for (let t = 0; t <= 40; t += 10) {
    g += `<line x1="${x(t)}" x2="${x(t)}" y1="${pt}" y2="${h - 26}" stroke="${C.grid}"/>`;
    g += `<text x="${x(t)}" y="${h - 10}" text-anchor="middle" class="ax">${t}%</text>`;
  }
  rows.forEach((r, i) => {
    const yc = pt + i * rowH + rowH / 2;
    g += `<text x="${pl - 12}" y="${yc + 4}" text-anchor="end" class="${r.hl ? 'lbl hl' : 'lbl'}">${r.name}</text>`;
    const x1 = x(r.lo), x2 = x(r.hi === r.lo ? r.hi + 0.6 : r.hi);
    g += `<rect x="${x(0)}" y="${yc - 9}" width="${x2 - x(0)}" height="18" rx="9" fill="${r.hl ? C.teal : '#D7DDE6'}"/>`;
    if (r.hi !== r.lo) g += `<rect x="${x1}" y="${yc - 9}" width="${x2 - x1}" height="18" rx="9" fill="${C.slate}"/>`;
    g += `<text x="${x2 + 8}" y="${yc + 4}" class="bv">${r.lo === r.hi ? r.lo + '%' : r.lo + '–' + r.hi + '%'}</text>`;
  });
  return `<svg viewBox="0 0 ${w} ${h}" class="chart">${g}</svg>`;
}

// séries mensais
const keysOcc = [];
for (let y = 2025; y <= 2026; y++) for (let m = 1; m <= 12; m++) { if (y === 2026 && m > 9) break; keysOcc.push(`${y}-${String(m).padStart(2, '0')}`); }
const occChart = lineChart({
  keys: keysOcc,
  series: [
    { color: C.coral, data: row(props.copan, 'Ocupação') },
    { color: C.teal, data: row(props.f229, 'Ocupação') },
    { color: C.sky, data: row(props.f320, 'Ocupação') },
  ],
  refs: [{ v: MKT.spOcc, label: 'Média SP (AirDNA) ~61%', color: C.slate }, { v: MKT.bertiogaOcc, label: 'Média Bertioga ~46%', color: C.gold }],
});

const rec320 = keysOcc.map((k) => ({
  label: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][Number(k.split('-')[1]) - 1],
  v: (Number(row(props.f320, 'Receita líquida locação')[k]) || 0),
  color: k.startsWith('2026') ? C.teal : '#9FD8CF', showVal: false,
}));
const seasonChart = barChart({ items: rec320, yMax: 24000, yFmt: (v) => (v / 1000).toFixed(0) + 'k', h: 210 });

const occBench = barChart({
  items: [
    { label: 'Copan', sub: '2026', v: K.copan26.occ, color: C.coral },
    { label: 'Média SP', sub: 'AirDNA', v: MKT.spOcc, color: '#CBD3DE' },
    { label: 'Flat 229', sub: '2026', v: K.f229_26.occ, color: C.teal },
    { label: 'Flat 320', sub: '2026', v: K.f320_26.occ, color: C.sky },
    { label: 'Bertioga', sub: 'mercado', v: MKT.bertiogaOcc, color: '#CBD3DE' },
  ], yMax: 1, yFmt: (v) => pct(v), h: 230,
});

const b2Chart = barChart({
  items: cenarios.map((c) => ({ label: c.nome, sub: `${brl(c.adr)} · ${pct(c.occ)}`, v: c.tir, color: c.nome === 'Base' ? C.teal : '#9FD8CF' })),
  yMax: 0.2, yFmt: (v) => pct(v), valFmt: (v) => 'TIR ' + pct(v, 1), h: 220, w: 420,
});

// ---------- HTML ----------
const img = (f) => 'img/' + f;
const today = 'Outubro de 2026';

const dreRows = (s) => `
  <tr><td>Receita bruta de reservas (${s.noites} noites)</td><td>${brl(s.bruto)}</td></tr>
  <tr class="neg"><td>(–) Comissão das plataformas (Airbnb/Booking)</td><td>${brl(-s.ota)}</td></tr>
  <tr class="sub"><td>= Repasse das plataformas</td><td>${brl(s.repasse)}</td></tr>
  <tr class="neg"><td>(–) Lavanderia / enxoval / diarista (${s.checkins} check-ins)</td><td>${brl(-s.lav)}</td></tr>
  <tr class="neg hl"><td>(–) Administração FINHOUSE 12%</td><td>${brl(-s.adm)}</td></tr>
  <tr class="neg"><td>(–) Pequenas manutenções / reposição</td><td>${brl(-s.manut)}</td></tr>
  <tr class="sub"><td>= Resultado operacional da locação</td><td>${brl(s.operacional)}</td></tr>
  <tr class="neg"><td>(–) Condomínio, IPTU, energia, internet</td><td>${brl(-s.fixosAno)}</td></tr>
  <tr class="total"><td>= Caixa líquido ao proprietário / ano</td><td>${brl(s.liquido)}</td></tr>
  <tr><td>Equivalente mensal</td><td>${brl(s.liquido / 12)}</td></tr>`;

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<title>FINHOUSE Short Stay — Gestão e Investimento em Locação por Temporada</title>
<meta name="description" content="Paper FINHOUSE: administração profissional de imóveis short stay (Airbnb/Booking) com taxa de 12% e modelo de compra e cotização de imóveis para renda.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@500;600;700&display=swap" rel="stylesheet">
<style>
@page { size: A4; margin: 0; }
:root { --navy:${C.navy}; --teal:${C.teal}; --gold:${C.gold}; --coral:${C.coral}; --slate:${C.slate}; --ink:#1B2433; --muted:#5B6678; --line:#E6E9EF; --bg:#F6F7FA; }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
html, body { margin: 0; padding: 0; font-family: 'Inter', 'Segoe UI', Arial, sans-serif; color: var(--ink); font-size: 10.2pt; line-height: 1.5; }
.page { width: 210mm; height: 297mm; padding: 18mm 18mm 16mm; position: relative; page-break-after: always; overflow: hidden; background: #fff; }
.page:last-child { page-break-after: auto; }
h1, h2, h3 { margin: 0; }
h2 { font-family: 'Playfair Display', Georgia, serif; font-size: 23pt; font-weight: 600; color: var(--navy); letter-spacing: -0.3px; margin-bottom: 4mm; }
h3 { font-size: 11.5pt; font-weight: 700; color: var(--navy); margin: 5mm 0 2mm; }
p { margin: 0 0 3mm; color: #2B3445; }
.eyebrow { font-size: 8pt; font-weight: 700; letter-spacing: 2.2px; text-transform: uppercase; color: var(--teal); margin-bottom: 2mm; }
.lead { font-size: 11.5pt; color: var(--muted); font-weight: 400; margin-bottom: 6mm; }
.foot { position: absolute; bottom: 9mm; left: 18mm; right: 18mm; display: flex; justify-content: space-between; font-size: 7.5pt; color: #98A1B2; border-top: 1px solid var(--line); padding-top: 3mm; }
.foot b { color: var(--navy); letter-spacing: 1.5px; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; }
.grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; }
.grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4mm; }
.kpi { background: var(--bg); border-radius: 10px; padding: 4mm 4.5mm; border: 1px solid var(--line); }
.kpi .v { font-size: 17pt; font-weight: 800; color: var(--navy); letter-spacing: -0.5px; line-height: 1.1; white-space: nowrap; }
.kpi .v.t { color: var(--teal); }
.kpi .l { font-size: 7.8pt; color: var(--muted); margin-top: 1mm; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; }
.kpi .s { font-size: 8pt; color: var(--muted); margin-top: 1mm; }
.card { border: 1px solid var(--line); border-radius: 12px; padding: 5mm; background: #fff; }
.card.dark { background: var(--navy); color: #fff; border: none; }
.card.dark p, .card.dark li { color: #C9D3E3; }
.card.dark h3 { color: #fff; }
.card.teal { background: linear-gradient(135deg, #0F9D8A, #0B7F70); color: #fff; border: none; }
.card.teal p, .card.teal li { color: #E3F6F2; }
.card.teal h3 { color: #fff; }
table { width: 100%; border-collapse: collapse; font-size: 9pt; }
th { text-align: left; font-size: 7.6pt; text-transform: uppercase; letter-spacing: 0.8px; color: var(--muted); font-weight: 700; border-bottom: 2px solid var(--navy); padding: 2mm 2mm; }
td { padding: 1.9mm 2mm; border-bottom: 1px solid var(--line); }
td:not(:first-child), th:not(:first-child) { text-align: right; }
td:not(:first-child) { white-space: nowrap; }
tr.sub td { font-weight: 700; background: #F3F5F9; }
tr.total td { font-weight: 800; color: #fff; background: var(--navy); }
tr.neg td:last-child { color: #A04A3A; }
tr.hl td { background: #E8F6F3; font-weight: 700; color: var(--teal) !important; }
tr.hl td:last-child { color: var(--teal) !important; }
ul { margin: 0 0 3mm; padding-left: 4.5mm; } li { margin-bottom: 1.2mm; color: #2B3445; }
ul.check { list-style: none; padding-left: 0; } ul.check li { padding-left: 6mm; position: relative; }
ul.check li::before { content: ''; position: absolute; left: 0; top: 1.6mm; width: 3mm; height: 3mm; border-radius: 50%; background: var(--teal); box-shadow: inset 0 0 0 0.9mm #CFEFEA; }
.chart { width: 100%; height: auto; display: block; }
.chart .ax { font-size: 10px; fill: #7A8496; font-family: Inter, sans-serif; }
.chart .ax.small { font-size: 9px; }
.chart .bv { font-size: 11px; font-weight: 700; fill: ${C.navy}; font-family: Inter, sans-serif; }
.chart .lbl { font-size: 12px; fill: #2B3445; font-family: Inter, sans-serif; }
.chart .lbl.hl { font-weight: 800; fill: ${C.teal}; }
.legend { display: flex; gap: 5mm; font-size: 8.5pt; color: var(--muted); margin: 1mm 0 2mm; }
.legend i { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 5px; vertical-align: -1px; }
.src { font-size: 7.4pt; color: #98A1B2; margin-top: 1.5mm; }
.pill { display: inline-block; font-size: 7.5pt; font-weight: 700; padding: 0.8mm 2.6mm; border-radius: 99px; background: #E8F6F3; color: var(--teal); letter-spacing: 0.5px; }
.note { background: #FBF7EE; border-left: 3px solid var(--gold); padding: 3mm 4mm; border-radius: 0 8px 8px 0; font-size: 8.8pt; color: #5A4A2A; margin-top: 3mm; }
.step { display: flex; gap: 3.5mm; margin-bottom: 3mm; }
.step .n { flex: 0 0 8mm; height: 8mm; border-radius: 50%; background: var(--navy); color: #fff; font-weight: 800; display: flex; align-items: center; justify-content: center; font-size: 9pt; }
.step b { color: var(--navy); }

/* capa */
.cover { padding: 0; background: var(--navy); color: #fff; }
.cover .img { position: absolute; inset: 0; background: url('${img('cover.jpg')}') center/cover; }
.cover .shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(14,26,43,0.15) 0%, rgba(14,26,43,0.35) 40%, rgba(14,26,43,0.96) 72%, #0E1A2B 100%); }
.cover .content { position: absolute; left: 18mm; right: 18mm; bottom: 22mm; }
.cover .brand { position: absolute; top: 16mm; left: 18mm; font-weight: 800; letter-spacing: 5px; font-size: 11pt; }
.cover .brand span { color: var(--gold); }
.cover h1 { font-family: 'Playfair Display', Georgia, serif; font-size: 40pt; line-height: 1.05; font-weight: 600; letter-spacing: -0.5px; margin-bottom: 5mm; }
.cover h1 em { color: var(--gold); font-style: italic; }
.cover .subt { font-size: 12.5pt; color: #C9D3E3; max-width: 150mm; margin-bottom: 9mm; }
.cover .row { display: flex; gap: 9mm; border-top: 1px solid rgba(255,255,255,0.18); padding-top: 6mm; }
.cover .row div b { display: block; font-size: 19pt; color: #fff; font-weight: 800; }
.cover .row div span { font-size: 7.8pt; color: #9FB0C8; text-transform: uppercase; letter-spacing: 1px; }
.hero-img { width: 100%; height: 62mm; border-radius: 12px; background: url('${img('riviera.jpg')}') center/cover; margin-bottom: 5mm; }
.toc li { list-style: none; display: flex; justify-content: space-between; border-bottom: 1px dashed var(--line); padding: 2mm 0; font-size: 10.5pt; }
.toc { padding: 0; }
.toc li span:first-child b { color: var(--teal); margin-right: 4mm; }
</style></head><body>

<!-- 1. CAPA -->
<section class="page cover">
  <div class="img"></div><div class="shade"></div>
  <div class="brand">FIN<span>HOUSE</span></div>
  <div class="content">
    <div class="eyebrow" style="color:${C.gold}">Paper · ${today}</div>
    <h1>Short Stay como<br><em>ativo profissional</em></h1>
    <p class="subt">Administração completa de imóveis em Airbnb e Booking com taxa de 12% — e um modelo de compra e cotização de imóveis para renda de temporada.</p>
    <div class="row">
      <div><b>${pct((K.copan26.occ + K.f229_26.occ + K.f320_26.occ) / 3)}</b><span>Ocupação média 2026</span></div>
      <div><b>${K.copan26.checkins + K.f229_26.checkins + K.f320_26.checkins}</b><span>Check-ins jan–set/26</span></div>
      <div><b>3</b><span>Imóveis sob gestão</span></div>
      <div><b>12%</b><span>Taxa de administração</span></div>
    </div>
  </div>
</section>

<!-- 2. SUMÁRIO EXECUTIVO -->
<section class="page">
  <div class="eyebrow">Sumário executivo</div>
  <h2>Operamos acima do mercado. Agora, para terceiros.</h2>
  <p class="lead">Desde 2024 a FINHOUSE administra imóveis próprios e em cotas no Edifício Copan (São Paulo) e na Riviera de São Lourenço (Bertioga). Com processos, precificação ativa e controle financeiro mensal por imóvel, mantemos ocupação de 74% a 79% — contra cerca de 61% da média de São Paulo e 46% de Bertioga.</p>
  <div class="grid4" style="margin-bottom:6mm">
    <div class="kpi"><div class="v t">+${Math.round((K.copan26.occ - MKT.spOcc) * 100)} p.p.</div><div class="l">Copan vs média SP</div><div class="s">Ocupação ${pct(K.copan26.occ)} em 2026</div></div>
    <div class="kpi"><div class="v t">+${Math.round((K.f320_26.occ - MKT.bertiogaOcc) * 100)} p.p.</div><div class="l">Riviera vs Bertioga</div><div class="s">Flat 320: ${pct(K.f320_26.occ)} em 2026</div></div>
    <div class="kpi"><div class="v">${brlk(K.f229_25.receita)}</div><div class="l">Receita Flat 229 · 2025</div><div class="s">${K.f229_25.checkins} check-ins no ano</div></div>
    <div class="kpi"><div class="v">+${pct(K.f320_26.adr / K.f320_25.adr - 1)}</div><div class="l">Diária média Flat 320</div><div class="s">2026 vs 2025</div></div>
  </div>
  <div class="grid2">
    <div class="card teal">
      <div class="eyebrow" style="color:#CFEFEA">Business 1</div>
      <h3 style="margin-top:0">Administração Short Stay · 12%</h3>
      <p>Gestão completa do imóvel do proprietário: anúncio, preço, calendário, hóspedes, lavanderia, pequenas manutenções e prestação de contas mensal. Taxa de <b>12% sobre o valor recebido das plataformas</b> — abaixo da faixa de 20–35% das gestoras full-service.</p>
    </div>
    <div class="card dark">
      <div class="eyebrow" style="color:${C.gold}">Business 2</div>
      <h3 style="margin-top:0">Compra & Cotização</h3>
      <p>A FINHOUSE seleciona, compra, reforma e mobilia imóveis com vocação de temporada e divide em cotas entre investidores. A gestão segue o mesmo modelo de 12%. No cenário base, um flat de praia de R$ 550 mil gera TIR estimada de <b>${pct(cenarios[1].tir, 1)} a.a.</b> por cota em 10 anos.</p>
    </div>
  </div>
  <h3>Neste documento</h3>
  <ul class="toc">
    <li><span><b>01</b>O mercado de short stay no Brasil</span><span>3</span></li>
    <li><span><b>02</b>Benchmarks: ocupação, diária e taxas de gestão</span><span>4</span></li>
    <li><span><b>03</b>Track record FINHOUSE</span><span>5</span></li>
    <li><span><b>04</b>Business 1 — Administração Short Stay</span><span>7</span></li>
    <li><span><b>05</b>Business 2 — Compra & Cotização</span><span>10</span></li>
    <li><span><b>06</b>Tecnologia, riscos e próximos passos</span><span>12</span></li>
  </ul>
  <div class="foot"><b>FINHOUSE</b><span>Short Stay · Gestão & Investimento</span><span>2</span></div>
</section>

<!-- 3. MERCADO -->
<section class="page">
  <div class="eyebrow">01 · Mercado</div>
  <h2>Por que short stay?</h2>
  <div class="hero-img"></div>
  <p>A locação por temporada deixou de ser renda extra e virou uma classe de ativo. Airbnb e Booking dão acesso a demanda nacional e internacional. Bem operado, o mesmo imóvel pode render <b>bem mais que o aluguel tradicional</b> (no nosso studio-tipo em SP, ~${pct(simSP.liquido / tradSP.liquido - 1)} a mais já líquido de todos os custos), em troca de mais trabalho operacional — que é exatamente o que a FINHOUSE assume.</p>
  <div class="grid2">
    <div>
      <h3>Dois perfis de demanda que operamos</h3>
      <ul class="check">
        <li><b>Urbano (São Paulo):</b> turismo de negócios, eventos, cultura e saúde. Demanda estável o ano inteiro, estadias de ~3 noites e diárias de R$ 240–280 para studios.</li>
        <li><b>Praia (Riviera de São Lourenço):</b> lazer de famílias e casais. Muito sazonal: o verão e os feriados concentram receita, e a baixa temporada pede preço dinâmico e estadias curtas.</li>
      </ul>
    </div>
    <div>
      <h3>Mudanças que exigem profissionalização</h3>
      <ul class="check">
        <li><b>Condomínios (STJ):</b> em condomínio de uso estritamente residencial, a locação por diárias frequente depende de autorização na convenção (quórum de 2/3). Por isso, checar a convenção é o primeiro filtro.</li>
        <li><b>Reforma tributária (LC 214/2025):</b> estadias de até 90 dias foram equiparadas à hotelaria para IBS/CBS, com redutor de 40%. A pessoa física com poucos imóveis segue, em regra, apenas no IR. Já quem passa de 3 imóveis e de cerca de R$ 240 mil/ano de receita entra no regime regular.</li>
        <li><b>Plataformas:</b> taxa única do Airbnb de ~15,5–16% ao anfitrião e comissão Booking de 13–15%. A margem depende de preço e de canal direto.</li>
      </ul>
    </div>
  </div>
  <div class="foot"><b>FINHOUSE</b><span>Short Stay · Gestão & Investimento</span><span>3</span></div>
</section>

<!-- 4. BENCHMARKS -->
<section class="page">
  <div class="eyebrow">02 · Benchmarks</div>
  <h2>Ocupação acima do mercado, taxa abaixo</h2>
  <p class="lead">Comparamos nossos imóveis com as médias de mercado (AirDNA / Airbtics) e com as taxas das principais gestoras do país.</p>
  <h3>Taxa de ocupação 2026 · FINHOUSE vs mercado</h3>
  ${occBench}
  <div class="src">Fontes: AirDNA e Airbtics (São Paulo ~60–62%, ADR ~R$ 240–250); Guest Favorites (Bertioga ~42–50%). FINHOUSE: dados próprios jan–set/2026.</div>
  <h3>Taxa de administração · comparativo de mercado</h3>
  ${feeChart(MKT.feeTable)}
  <div class="src">Faixas estimadas a partir de material público e reportagens (Housi, Seazone, Charlie; PriceLabs para média full-service). Os percentuais variam por contrato, imóvel e serviços incluídos.</div>
  <table style="margin-top:4mm">
    <tr><th>Indicador</th><th>Mercado</th><th>FINHOUSE</th></tr>
    <tr><td>Ocupação São Paulo (studio)</td><td>~61%</td><td><b>${pct(K.copan26.occ)}</b> (Copan 2026)</td></tr>
    <tr><td>Diária média São Paulo</td><td>R$ 240–250</td><td><b>${brl(K.copan25.adr)}</b> (Copan 2025)</td></tr>
    <tr><td>Ocupação Bertioga / Riviera</td><td>42–50%</td><td><b>${pct(K.f229_26.occ)} – ${pct(K.f320_26.occ)}</b></td></tr>
    <tr><td>Taxa de gestão full-service</td><td>20–35%</td><td><b>12%</b></td></tr>
  </table>
  <div class="foot"><b>FINHOUSE</b><span>Short Stay · Gestão & Investimento</span><span>4</span></div>
</section>

<!-- 5. TRACK RECORD 1 -->
<section class="page">
  <div class="eyebrow">03 · Track record</div>
  <h2>Três imóveis, dois mercados, dados reais</h2>
  <p class="lead">Todos os números abaixo vêm do controle financeiro mensal de cada imóvel (DRE por reserva, conciliada com os relatórios de Airbnb e Booking).</p>
  <div class="legend"><span><i style="background:${C.coral}"></i>Copan · SP</span><span><i style="background:${C.teal}"></i>Flat 229 · Riviera</span><span><i style="background:${C.sky}"></i>Flat 320 · Riviera</span><span>┄ Média SP ~61% · Bertioga ~46%</span></div>
  ${occChart}
  <div class="src">Ocupação mensal, jan/2025 a set/2026. Linhas tracejadas: médias de mercado.</div>
  <table style="margin-top:5mm">
    <tr><th>Indicador</th><th>Copan 25</th><th>Copan 26*</th><th>Flat 229 · 25</th><th>Flat 229 · 26*</th><th>Flat 320 · 25</th><th>Flat 320 · 26*</th></tr>
    <tr><td>Cotas</td><td colspan="2">4</td><td colspan="2">3</td><td colspan="2">2</td></tr>
    <tr><td>Ocupação</td><td>${pct(K.copan25.occ)}</td><td>${pct(K.copan26.occ)}</td><td>${pct(K.f229_25.occ)}</td><td>${pct(K.f229_26.occ)}</td><td>${pct(K.f320_25.occ)}</td><td>${pct(K.f320_26.occ)}</td></tr>
    <tr><td>Diária média (ADR)</td><td>${brl(K.copan25.adr)}</td><td>${brl(K.copan26.adr)}</td><td>${brl(K.f229_25.adr)}</td><td>${brl(K.f229_26.adr)}</td><td>${brl(K.f320_25.adr)}</td><td>${brl(K.f320_26.adr)}</td></tr>
    <tr><td>RevPAR</td><td>${brl(K.copan25.revpar)}</td><td>${brl(K.copan26.revpar)}</td><td>${brl(K.f229_25.revpar)}</td><td>${brl(K.f229_26.revpar)}</td><td>${brl(K.f320_25.revpar)}</td><td>${brl(K.f320_26.revpar)}</td></tr>
    <tr><td>Diárias vendidas</td><td>${K.copan25.diarias}</td><td>${K.copan26.diarias}</td><td>${K.f229_25.diarias}</td><td>${K.f229_26.diarias}</td><td>${K.f320_25.diarias}</td><td>${K.f320_26.diarias}</td></tr>
    <tr><td>Check-ins</td><td>${K.copan25.checkins}</td><td>${K.copan26.checkins}</td><td>${K.f229_25.checkins}</td><td>${K.f229_26.checkins}</td><td>${K.f320_25.checkins}</td><td>${K.f320_26.checkins}</td></tr>
    <tr><td>Giro (check-ins/mês)</td><td>${num(K.copan25.giro)}</td><td>${num(K.copan26.giro)}</td><td>${num(K.f229_25.giro)}</td><td>${num(K.f229_26.giro)}</td><td>${num(K.f320_25.giro)}</td><td>${num(K.f320_26.giro)}</td></tr>
    <tr><td>Estadia média (noites)</td><td>${num(K.copan25.estadia)}</td><td>${num(K.copan26.estadia)}</td><td>${num(K.f229_25.estadia)}</td><td>${num(K.f229_26.estadia)}</td><td>${num(K.f320_25.estadia)}</td><td>${num(K.f320_26.estadia)}</td></tr>
    <tr class="sub"><td>Receita recebida</td><td>${brlk(K.copan25.receita)}</td><td>${brlk(K.copan26.receita)}</td><td>${brlk(K.f229_25.receita)}</td><td>${brlk(K.f229_26.receita)}</td><td>${brlk(K.f320_25.receita)}</td><td>${brlk(K.f320_26.receita)}</td></tr>
    <tr><td>Receita líquida locação</td><td>${brlk(K.copan25.liquida)}</td><td>${brlk(K.copan26.liquida)}</td><td>${brlk(K.f229_25.liquida)}</td><td>${brlk(K.f229_26.liquida)}</td><td>${brlk(K.f320_25.liquida)}</td><td>${brlk(K.f320_26.liquida)}</td></tr>
  </table>
  <div class="src">* 2026 = jan a set. Copan 2025 = mar a dez (início da operação). Receita recebida = repasses Airbnb/Booking + reservas diretas + taxa pet. Receita líquida = após comissões, lavanderia, administração e manutenção.</div>
  <div class="foot"><b>FINHOUSE</b><span>Short Stay · Gestão & Investimento</span><span>5</span></div>
</section>

<!-- 6. TRACK RECORD 2 -->
<section class="page">
  <div class="eyebrow">03 · Track record</div>
  <h2>O que aprendemos operando</h2>
  <div class="grid3" style="margin-bottom:5mm">
    <div class="card"><span class="pill">COPAN · SP</span><h3>Ícone urbano, giro alto</h3><p>Studio com vista no edifício mais famoso de SP. Operação 100% Airbnb, ~${num(K.copan25.giro, 0)} check-ins/mês e lavanderia/diarista de R$ 150 por check-in, coberta pela taxa de limpeza cobrada do hóspede. Ocupação estável de ~79% o ano todo.</p></div>
    <div class="card"><span class="pill">FLAT 229 · RIVIERA</span><h3>Maturidade e preço</h3><p>Três anos de histórico. A diária média foi de ${brl(K.f229_24.adr)} (2024) para ${brl(K.f229_25.adr)} (2025) e a receita cresceu ${pct(K.f229_25.receita / K.f229_24.receita - 1)}. Canal Booking, mais reservas diretas recorrentes e taxa pet. Caixa líquido 2025 de ${brlk(K.f229_25.caixa)}.</p></div>
    <div class="card"><span class="pill">FLAT 320 · RIVIERA</span><h3>Compra financiada</h3><p>Adquirido em 2025 por R$ 535 mil (R$ 428 mil financiados), com CAPEX de R$ 138 mil. Do ramp-up de 2025 para 2026, a ocupação foi de ${pct(K.f320_25.occ)} para ${pct(K.f320_26.occ)} e a diária subiu ${pct(K.f320_26.adr / K.f320_25.adr - 1)}. Mesmo pagando a parcela, o caixa fecha positivo em 2026 (${brlk(K.f320_26.caixa)} até set).</p></div>
  </div>
  <h3>Sazonalidade na praia · receita líquida mensal do Flat 320</h3>
  <div class="legend"><span><i style="background:#9FD8CF"></i>2025</span><span><i style="background:${C.teal}"></i>2026</span></div>
  ${seasonChart}
  <div class="src">Janeiro/2026 sozinho rendeu ${brlk(Number(row(props.f320, 'Receita líquida locação')['2026-01']))}, ~${pct(Number(row(props.f320, 'Receita líquida locação')['2026-01']) / K.f320_26.liquida)} da receita líquida de jan–set. A precificação da alta temporada decide o ano.</div>
  <h3>Alavancas que fazem a diferença</h3>
  <div class="grid2">
    <ul class="check">
      <li><b>Preço dinâmico diário:</b> por antecedência, dia da semana, eventos e feriados. Na baixa temporada, aceitar 1 noite em vez de deixar o imóvel vazio.</li>
      <li><b>Combater a ociosidade:</b> preencher as janelas de 1–2 noites entre reservas e usar descontos de última hora com piso de preço.</li>
      <li><b>Multicanal:</b> Booking, Airbnb e reserva direta para hóspedes recorrentes, sem comissão de plataforma.</li>
    </ul>
    <ul class="check">
      <li><b>Giro eficiente:</b> check-in autônomo, lavanderia terceirizada com enxoval padronizado e checklist com foto a cada saída.</li>
      <li><b>Receitas extras:</b> taxa pet, early check-in, late checkout.</li>
      <li><b>Controle mensal:</b> DRE por imóvel e por cota, conciliada com os relatórios das plataformas.</li>
    </ul>
  </div>
  <div class="foot"><b>FINHOUSE</b><span>Short Stay · Gestão & Investimento</span><span>6</span></div>
</section>

<!-- 7. BUSINESS 1 — ESCOPO -->
<section class="page">
  <div class="eyebrow">04 · Business 1</div>
  <h2>Administração Short Stay · 12%</h2>
  <p class="lead">O proprietário continua dono do imóvel e da receita. A FINHOUSE assume a operação de ponta a ponta e presta contas todo mês.</p>
  <div class="grid2">
    <div class="card">
      <h3 style="margin-top:0">Incluso nos 12%</h3>
      <ul class="check">
        <li>Criação e otimização dos anúncios (Airbnb, Booking, canal direto)</li>
        <li>Precificação dinâmica diária e gestão de calendário</li>
        <li>Gestão de ociosidade, estadia mínima e janelas entre reservas</li>
        <li>Atendimento ao hóspede antes, durante e depois da estadia</li>
        <li>Check-in/checkout e coordenação do giro</li>
        <li>Coordenação de lavanderia, enxoval, diarista e amenities</li>
        <li>Agendamento e supervisão de pequenas manutenções</li>
        <li>Gestão de reputação, avaliações e disputas/reembolsos nas plataformas</li>
        <li>Relatório mensal: DRE, ocupação, ADR, RevPAR e repasse</li>
        <li>Painel online com acesso do proprietário/cotistas</li>
      </ul>
    </div>
    <div>
      <div class="card dark" style="margin-bottom:4mm">
        <h3 style="margin-top:0">Como a taxa funciona</h3>
        <p><b style="color:#fff">12% sobre o valor recebido das plataformas</b> e das reservas diretas, depois da comissão de Airbnb/Booking. Sem mensalidade fixa: só ganhamos quando o imóvel gera receita.</p>
      </div>
      <div class="card">
        <h3 style="margin-top:0">Custos do imóvel (repassados pelo custo)</h3>
        <table>
          <tr><td>Lavanderia / diarista por check-in</td><td>R$ 55–150*</td></tr>
          <tr><td>Pequenas manutenções</td><td>pelo custo</td></tr>
          <tr><td>Reposição de amenities</td><td>pelo custo</td></tr>
          <tr><td>Condomínio, IPTU, energia, internet</td><td>proprietário</td></tr>
          <tr><td>Comissões Airbnb / Booking</td><td>retidas na fonte</td></tr>
        </table>
        <div class="src">* Varia com o tamanho do imóvel e o enxoval. Em geral é cobrada do hóspede como taxa de limpeza. Manutenções acima de R$ 500 só com aprovação prévia.</div>
      </div>
    </div>
  </div>
  <h3>KPIs que acompanhamos e reportamos</h3>
  <div class="grid4">
    <div class="kpi"><div class="v" style="font-size:13pt">Ocupação</div><div class="s">noites vendidas ÷ noites disponíveis</div></div>
    <div class="kpi"><div class="v" style="font-size:13pt">ADR</div><div class="s">diária média por noite vendida</div></div>
    <div class="kpi"><div class="v" style="font-size:13pt">RevPAR</div><div class="s">receita por noite disponível (ADR × ocupação)</div></div>
    <div class="kpi"><div class="v" style="font-size:13pt">Giro</div><div class="s">check-ins/mês e estadia média</div></div>
  </div>
  <div class="foot"><b>FINHOUSE</b><span>Short Stay · Gestão & Investimento</span><span>7</span></div>
</section>

<!-- 8. BUSINESS 1 — SIMULAÇÃO -->
<section class="page">
  <div class="eyebrow">04 · Business 1</div>
  <h2>Quanto sobra para o proprietário</h2>
  <p class="lead">Simulação anual de dois imóveis-tipo com premissas calibradas pelo nosso histórico. Valores antes do imposto de renda.</p>
  <div class="grid2">
    <div>
      <h3 style="margin-top:0">Studio urbano · SP <span class="pill">ref. Copan</span></h3>
      <div class="src" style="margin-bottom:2mm">ADR R$ 310 pago pelo hóspede (≈ R$ 262 líquido, como no Copan) · ocupação 75% · estadia 3,1 noites · Airbnb 15,5%</div>
      <table>${dreRows(simSP)}</table>
    </div>
    <div>
      <h3 style="margin-top:0">Flat de praia · Riviera <span class="pill">ref. Flat 320</span></h3>
      <div class="src" style="margin-bottom:2mm">ADR R$ 420 · ocupação 72% · estadia 2,5 noites · plataforma 14%</div>
      <table>${dreRows(simPraia)}</table>
    </div>
  </div>
  <h3>Short stay vs aluguel tradicional · studio SP</h3>
  <div class="grid3">
    <div class="kpi"><div class="v">${brl(tradSP.liquido / 12)}</div><div class="l">Aluguel tradicional / mês</div><div class="s">R$ 2.200 de aluguel, 10% de adm. imobiliária, 1 mês de vacância/ano. Condomínio pago pelo inquilino.</div></div>
    <div class="kpi"><div class="v t">${brl(simSP.liquido / 12)}</div><div class="l">Short stay FINHOUSE / mês</div><div class="s">Já descontados plataforma, lavanderia, 12% de adm., manutenção e todos os custos fixos.</div></div>
    <div class="kpi"><div class="v t">+${pct(simSP.liquido / tradSP.liquido - 1)}</div><div class="l">Renda adicional</div><div class="s">Com flexibilidade de uso próprio e reajuste de preço diário, sem esperar o aniversário do contrato.</div></div>
  </div>
  <div class="note">Simulações ilustrativas. O resultado real depende da localização, do padrão do imóvel, das regras do condomínio e da sazonalidade. Antes de assinar, fazemos um estudo de viabilidade com dados de mercado do endereço.</div>
  <div class="foot"><b>FINHOUSE</b><span>Short Stay · Gestão & Investimento</span><span>8</span></div>
</section>

<!-- 9. BUSINESS 1 — ONBOARDING -->
<section class="page">
  <div class="eyebrow">04 · Business 1</div>
  <h2>Do contrato à primeira reserva</h2>
  <div class="grid2">
    <div>
      <div class="step"><div class="n">1</div><div><b>Diagnóstico (semana 1).</b> Visita técnica, leitura da convenção do condomínio, estudo de mercado (ADR e ocupação da região) e projeção de receita.</div></div>
      <div class="step"><div class="n">2</div><div><b>Preparação (semanas 1–3).</b> Lista de enxoval, itens e pequenos ajustes. Fechadura eletrônica, internet e kit de boas-vindas.</div></div>
      <div class="step"><div class="n">3</div><div><b>Anúncio (semana 3).</b> Fotos profissionais, texto e configuração em Airbnb e Booking. Regras da casa e cadastro na portaria.</div></div>
      <div class="step"><div class="n">4</div><div><b>Lançamento (semana 4).</b> Preço de entrada para ganhar as primeiras avaliações e depois preço dinâmico.</div></div>
      <div class="step"><div class="n">5</div><div><b>Rotina mensal.</b> Fechamento até o dia 10, com DRE, relatório de KPIs e repasse ao proprietário.</div></div>
    </div>
    <div class="card">
      <h3 style="margin-top:0">Condições comerciais</h3>
      <table>
        <tr><td>Taxa de administração</td><td><b>12%</b></td></tr>
        <tr><td>Base de cálculo</td><td>valor recebido</td></tr>
        <tr><td>Mensalidade fixa</td><td>não há</td></tr>
        <tr><td>Prazo mínimo sugerido</td><td>12 meses</td></tr>
        <tr><td>Aviso prévio para rescisão</td><td>60 dias</td></tr>
        <tr><td>Reservas futuras na saída</td><td>honradas</td></tr>
        <tr><td>Fechamento e repasse</td><td>mensal</td></tr>
      </table>
      <h3>Para quem é</h3>
      <ul class="check">
        <li>Proprietários de studios e flats em SP e no litoral norte paulista</li>
        <li>Imóveis em cotas/famílias que precisam de prestação de contas por cota</li>
        <li>Investidores que querem renda maior sem operar o dia a dia</li>
      </ul>
    </div>
  </div>
  <h3>Padrões de serviço (SLA)</h3>
  <div class="grid4">
    <div class="kpi"><div class="v t">&lt; 15 min</div><div class="l">Resposta ao hóspede</div><div class="s">das 8h às 23h, todos os dias</div></div>
    <div class="kpi"><div class="v t">100%</div><div class="l">Checklist com foto</div><div class="s">a cada saída de hóspede</div></div>
    <div class="kpi"><div class="v t">≥ 4,8</div><div class="l">Meta de avaliação</div><div class="s">nota média nas plataformas</div></div>
    <div class="kpi"><div class="v t">Dia 10</div><div class="l">Prestação de contas</div><div class="s">DRE, extratos e repasse</div></div>
  </div>
  <h3>O que o proprietário recebe todo mês</h3>
  <div class="grid3">
    <div class="card"><b>DRE do imóvel</b><p style="margin:1mm 0 0;font-size:8.3pt;line-height:1.45">Receita por canal, comissões, lavanderia, manutenção, taxa de administração e resultado líquido, mês a mês e acumulado no ano.</p></div>
    <div class="card"><b>Relatório de KPIs</b><p style="margin:1mm 0 0;font-size:8.3pt;line-height:1.45">Ocupação, ADR, RevPAR, giro, estadia média e noites ociosas, comparados com o mesmo mês do ano anterior e com o mercado.</p></div>
    <div class="card"><b>Repasse e extrato</b><p style="margin:1mm 0 0;font-size:8.3pt;line-height:1.45">Lista de reservas conciliada com Airbnb e Booking, comprovantes de despesas e repasse por cota quando houver mais de um dono.</p></div>
  </div>
  <div class="foot"><b>FINHOUSE</b><span>Short Stay · Gestão & Investimento</span><span>9</span></div>
</section>

<!-- 10. BUSINESS 2 — MODELO -->
<section class="page">
  <div class="eyebrow">05 · Business 2</div>
  <h2>Compra & Cotização</h2>
  <p class="lead">Juntamos investidores para comprar imóveis com vocação de temporada. A FINHOUSE seleciona, compra, prepara e opera — e cada cotista recebe sua parte do resultado todo mês, como já fazemos com o Copan (4 cotas), o Flat 229 (3 cotas) e o Flat 320 (2 cotas).</p>
  <div class="grid4" style="margin-bottom:5mm">
    <div class="kpi"><div class="v" style="font-size:12pt">1 · Seleção</div><div class="s">Convenção permite temporada, demanda comprovada, preço abaixo do mercado e liquidez de revenda.</div></div>
    <div class="kpi"><div class="v" style="font-size:12pt">2 · Estruturação</div><div class="s">Condomínio civil ou SPE entre um grupo fechado de cotistas, com acordo de cotistas e regras de saída.</div></div>
    <div class="kpi"><div class="v" style="font-size:12pt">3 · Preparação</div><div class="s">Reforma, decoração para fotos, mobília e enxoval completos.</div></div>
    <div class="kpi"><div class="v" style="font-size:12pt">4 · Operação</div><div class="s">Gestão FINHOUSE a 12%, distribuição mensal e DRE por cota.</div></div>
  </div>
  <div class="grid2">
    <div>
      <h3 style="margin-top:0">Exemplo: flat de praia em 4 cotas</h3>
      <table>
        <tr><td>Preço do imóvel</td><td>${brl(B2.preco)}</td></tr>
        <tr><td>ITBI, escritura e registro (4,5%)</td><td>${brl(B2.preco * B2.custosAq)}</td></tr>
        <tr><td>Reforma, mobília e enxoval</td><td>${brl(B2.reforma)}</td></tr>
        <tr><td>Reserva de caixa</td><td>${brl(B2.reserva)}</td></tr>
        <tr class="sub"><td>Investimento total</td><td>${brl(B2.invest)}</td></tr>
        <tr class="total"><td>Valor por cota (1/4)</td><td>${brl(B2.cota)}</td></tr>
      </table>
      <div class="src">Premissas de saída: valorização de 5% a.a., receita reajustada em 4% a.a., venda no ano 10 com 6% de custo de corretagem. Resultados antes do IR.</div>
    </div>
    <div>
      <h3 style="margin-top:0">TIR por cota em 10 anos</h3>
      ${b2Chart}
    </div>
  </div>
  <table style="margin-top:4mm">
    <tr><th>Cenário</th><th>ADR · Ocupação</th><th>Receita bruta</th><th>Caixa líquido/ano</th><th>Yield caixa</th><th>Por cota/mês</th><th>Payback (só caixa)</th><th>TIR 10a</th></tr>
    ${cenarios.map((c) => `<tr${c.nome === 'Base' ? ' class="hl"' : ''}><td>${c.nome}</td><td>${brl(c.adr)} · ${pct(c.occ)}</td><td>${brlk(c.s.bruto)}</td><td>${brlk(c.s.liquido)}</td><td>${pct(c.yieldA, 1)}</td><td>${brl(c.mensalCota)}</td><td>${num(c.payback, 1)} anos</td><td>${pct(c.tir, 1)}</td></tr>`).join('')}
  </table>
  <div class="foot"><b>FINHOUSE</b><span>Short Stay · Gestão & Investimento</span><span>10</span></div>
</section>

<!-- 11. BUSINESS 2 — CRITÉRIOS E CASES -->
<section class="page">
  <div class="eyebrow">05 · Business 2</div>
  <h2>Critérios e provas de conceito</h2>
  <div class="grid2">
    <div class="card">
      <h3 style="margin-top:0">Checklist de aquisição</h3>
      <ul class="check">
        <li>Convenção e regimento permitem locação por temporada (ou condomínio já é “short stay friendly”)</li>
        <li>Região com ocupação de mercado ≥ 55% ou sazonalidade forte com ADR alta</li>
        <li>Yield caixa projetado ≥ 6% a.a. no cenário base, antes da valorização</li>
        <li>Condomínio ≤ 25% da receita projetada</li>
        <li>Diferencial de anúncio: vista, piscina, ícone arquitetônico, pé na areia</li>
        <li>Liquidez de revenda e documentação limpa</li>
      </ul>
    </div>
    <div class="card dark">
      <h3 style="margin-top:0">Modelo de remuneração FINHOUSE</h3>
      <ul>
        <li><b style="color:#fff">12%</b> de administração sobre o valor recebido, igual ao Business 1</li>
        <li>Taxa de estruturação na aquisição: <i>a definir</i> (cobre a busca do imóvel, a due diligence, a reforma e a montagem)</li>
        <li>FINHOUSE pode ficar com uma cota, alinhando interesses com os investidores</li>
      </ul>
      <h3>Direitos do cotista</h3>
      <ul>
        <li>Distribuição mensal do caixa líquido</li>
        <li>Painel online com DRE e extratos</li>
        <li>Uso próprio opcional, em datas de baixa temporada</li>
      </ul>
    </div>
  </div>
  <h3>Provas de conceito na carteira atual</h3>
  <table>
    <tr><th>Imóvel</th><th>Estrutura</th><th>Valor ref.</th><th>Receita recebida 2025</th><th>Caixa líquido 2025</th><th>Leitura</th></tr>
    <tr><td>Copan · SP</td><td>4 cotas</td><td>—</td><td>${brlk(K.copan25.receita)}</td><td>${brlk(K.copan25.liquida)}**</td><td style="text-align:right;white-space:normal">Giro urbano estável</td></tr>
    <tr><td>Flat 229 · Riviera</td><td>3 cotas, sem dívida</td><td>R$ 900 mil</td><td>${brlk(K.f229_25.receita)}</td><td>${brlk(K.f229_25.caixa)}</td><td style="text-align:right;white-space:normal">Yield caixa ~${pct(K.f229_25.caixa / 900000, 1)} a.a.</td></tr>
    <tr><td>Flat 320 · Riviera</td><td>2 cotas, financiado</td><td>R$ 535 mil</td><td>${brlk(K.f320_25.receita)}</td><td>${brlk(K.f320_25.caixa)}</td><td style="text-align:right;white-space:normal">Caixa positivo em 2026 já pagando a parcela</td></tr>
  </table>
  <div class="src">** Receita líquida da locação, antes dos custos fixos do imóvel. Caixa líquido = após condomínio, IPTU, energia e financiamento.</div>
  <h3>Cronograma típico de uma aquisição</h3>
  <div class="grid4">
    <div class="kpi"><div class="v" style="font-size:12pt">Mês 0–1</div><div class="s">Tese, seleção e estudo de viabilidade do imóvel-alvo. Apresentação aos investidores.</div></div>
    <div class="kpi"><div class="v" style="font-size:12pt">Mês 1–2</div><div class="s">Adesão dos cotistas, due diligence, proposta, escritura e registro.</div></div>
    <div class="kpi"><div class="v" style="font-size:12pt">Mês 2–4</div><div class="s">Reforma, mobília, enxoval, fotos e anúncios.</div></div>
    <div class="kpi"><div class="v t" style="font-size:12pt">Mês 4+</div><div class="s">Operação e primeira distribuição aos cotistas.</div></div>
  </div>
  <div class="foot"><b>FINHOUSE</b><span>Short Stay · Gestão & Investimento</span><span>11</span></div>
</section>

<!-- 12. TECNOLOGIA, RISCOS, PRÓXIMOS PASSOS -->
<section class="page">
  <div class="eyebrow">06 · Tecnologia, riscos e próximos passos</div>
  <h2>Transparência total, riscos mapeados</h2>
  <div class="grid2">
    <div class="card teal">
      <h3 style="margin-top:0">Plataforma bnbmanager</h3>
      <p>Sistema próprio de gestão e DRE de locação por temporada:</p>
      <ul>
        <li>DRE mensal por imóvel, do mesmo jeito que as planilhas de controle</li>
        <li>Visão dos sócios: resultado por cota</li>
        <li>Importação dos relatórios de Airbnb e Booking, com cálculo automático de diárias, ocupação, lavanderia e taxa de administração</li>
        <li>Acesso web seguro para proprietários e cotistas</li>
      </ul>
    </div>
    <div>
      <h3 style="margin-top:0">Principais riscos e mitigação</h3>
      <table>
        <tr><th>Risco</th><th>Mitigação</th></tr>
        <tr><td>Restrição condominial</td><td>Due diligence da convenção</td></tr>
        <tr><td>Sazonalidade / vacância</td><td>Preço dinâmico, multicanal</td></tr>
        <tr><td>Danos e hóspedes</td><td>Caução/seguro das plataformas</td></tr>
        <tr><td>Tributação (IBS/CBS, IR)</td><td>Planejamento contábil por estrutura</td></tr>
        <tr><td>Oferta de cotas (CVM)</td><td>Grupo fechado, assessoria jurídica</td></tr>
        <tr><td>Liquidez da cota</td><td>Acordo de cotistas com preferência</td></tr>
      </table>
    </div>
  </div>
  <div class="note">Captar investidores para empreendimentos imobiliários com gestão hoteleira pode ser enquadrado como contrato de investimento coletivo (CIC) e cair sob a regulação da CVM. O Business 2 será estruturado com assessoria jurídica, preferencialmente entre um grupo restrito de investidores conhecidos e sem oferta pública.</div>
  <h3>Próximos passos</h3>
  <div class="grid3">
    <div class="kpi"><div class="v t" style="font-size:13pt">Proprietário</div><div class="s">Agende o diagnóstico gratuito: receita projetada para o seu imóvel em até 7 dias.</div></div>
    <div class="kpi"><div class="v t" style="font-size:13pt">Investidor</div><div class="s">Entre na lista da próxima aquisição e receba o estudo do imóvel-alvo.</div></div>
    <div class="kpi"><div class="v t" style="font-size:13pt">Parceiro</div><div class="s">Corretores e condomínios: indique imóveis e ganhe comissão.</div></div>
  </div>
  <div class="card dark" style="margin-top:6mm; text-align:center">
    <div style="font-weight:800; letter-spacing:5px; font-size:13pt">FIN<span style="color:${C.gold}">HOUSE</span></div>
    <p style="margin:2mm 0 0">Short Stay · Gestão & Investimento · São Paulo &amp; Riviera de São Lourenço</p>
  </div>
  <div class="src" style="margin-top:4mm">Fontes de mercado: AirDNA, Airbtics, Guest Favorites, PriceLabs, sites e reportagens sobre Housi, Seazone e Charlie, STJ (2ª Seção), LC 214/2025. Dados FINHOUSE: controle financeiro interno (bnbmanager), jan/2024 a set/2026. Este documento é informativo e não é oferta de valores mobiliários. Rentabilidade passada e simulações não garantem resultado futuro.</div>
  <div class="foot"><b>FINHOUSE</b><span>Short Stay · Gestão & Investimento</span><span>12</span></div>
</section>
</body></html>`;

fs.writeFileSync(OUT_HTML, html, 'utf8');
console.log('HTML:', OUT_HTML);
console.log(JSON.stringify({ K, simSP, simPraia, tradSP, B2, cenarios: cenarios.map((c) => ({ nome: c.nome, liquido: c.s.liquido, yieldA: c.yieldA, tir: c.tir, payback: c.payback })) }, null, 1));

// ---------- PDF ----------
const browsers = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
];
const exe = browsers.find((b) => fs.existsSync(b));
if (exe) {
  execFileSync(exe, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--virtual-time-budget=8000',
    `--print-to-pdf=${OUT_PDF}`, 'file:///' + OUT_HTML.replace(/\\/g, '/')], { stdio: 'inherit' });
  console.log('PDF:', OUT_PDF);
} else console.log('Navegador não encontrado para gerar PDF.');
