import { payment, principal, periods, rate, annualEquivalent } from '../core/price.js';
export function solve({ pv, pmt, n, i }) {
  const missing = [['pv',pv],['pmt',pmt],['n',n],['i',i]].filter(([,v]) => v === null);
  if (missing.length !== 1) throw new Error('Preencha exatamente três dos quatro dados financeiros e deixe um em branco.');
  const key = missing[0][0]; let value;
  if (key === 'pv') value = principal(pmt,i,n);
  if (key === 'pmt') value = payment(pv,i,n);
  if (key === 'n') value = periods(pv,pmt,i);
  if (key === 'i') value = rate(pv,pmt,n);
  const displayedRate = key === 'i' ? Math.round((value * 100 + Number.EPSILON) * 100) / 100 : null;
  return { key, value, displayedRate, annual: key === 'i' ? annualEquivalent(value) : (i !== null ? annualEquivalent(i) : null) };
}