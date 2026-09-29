export const brl = new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' });
export const pct = (v, digits=4) => new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:digits}).format(v*100)+'%';
export function parseBRNumber(value) {
  const s = String(value ?? '').trim(); if (!s) return null;
  let normalized = s.replace(/R\$|%|\s/g,'');
  if (normalized.includes(',')) normalized = normalized.replace(/\./g,'').replace(',','.');
  const n = Number(normalized); return Number.isFinite(n) ? n : null;
}