export function payment(principal, rate, periods) {
  validatePositive(principal, 'principal'); validatePeriods(periods);
  if (rate < 0) throw new Error('Taxa não pode ser negativa.');
  if (Math.abs(rate) < 1e-14) return principal / periods;
  return principal * rate / (1 - Math.pow(1 + rate, -periods));
}
export function principal(paymentValue, rate, periods) {
  validatePositive(paymentValue, 'parcela'); validatePeriods(periods);
  if (rate < 0) throw new Error('Taxa não pode ser negativa.');
  if (Math.abs(rate) < 1e-14) return paymentValue * periods;
  return paymentValue * (1 - Math.pow(1 + rate, -periods)) / rate;
}
export function periods(principalValue, paymentValue, rate) {
  validatePositive(principalValue, 'saldo'); validatePositive(paymentValue, 'parcela');
  if (rate < 0) throw new Error('Taxa não pode ser negativa.');
  if (Math.abs(rate) < 1e-14) return principalValue / paymentValue;
  if (paymentValue <= principalValue * rate) throw new Error('A parcela não é suficiente para amortizar a dívida nessa taxa.');
  return -Math.log(1 - principalValue * rate / paymentValue) / Math.log(1 + rate);
}
export function periodsWithFirstPeriod(principalValue, paymentValue, rate, firstPeriodDays = 30) {
  validatePositive(principalValue, 'saldo'); validatePositive(paymentValue, 'parcela');
  if (rate < 0) throw new Error('Taxa não pode ser negativa.');
  if (!Number.isFinite(firstPeriodDays) || firstPeriodDays <= 0) throw new Error('Dias até o próximo vencimento devem ser maiores que zero.');
  if (Math.abs(rate) < 1e-14) return principalValue / paymentValue;
  const fraction = firstPeriodDays / 30;
  const valueAtFirstDue = principalValue * Math.pow(1 + rate, fraction);
  const ratio = 1 - (valueAtFirstDue * rate) / (paymentValue * (1 + rate));
  if (ratio <= 0) throw new Error('A parcela não é suficiente para amortizar a dívida nessa taxa.');
  return -Math.log(ratio) / Math.log(1 + rate);
}
export function rate(principalValue, paymentValue, periodsValue) {
  validatePositive(principalValue, 'saldo'); validatePositive(paymentValue, 'parcela'); validatePeriods(periodsValue);
  const zeroPayment = principalValue / periodsValue;
  if (Math.abs(paymentValue - zeroPayment) < 1e-12) return 0;
  if (paymentValue < zeroPayment) throw new Error('Não existe taxa mensal não negativa compatível com esses valores.');
  let lo = 0, hi = 1;
  const f = r => payment(principalValue, r, periodsValue) - paymentValue;
  while (f(hi) < 0 && hi < 1000) hi *= 2;
  if (f(hi) < 0) throw new Error('Não foi possível encontrar uma taxa compatível.');
  for (let k = 0; k < 160; k++) { const mid = (lo + hi) / 2; if (f(mid) > 0) hi = mid; else lo = mid; }
  return (lo + hi) / 2;
}
export function rateWithFirstPeriod(principalValue, paymentValue, periodsValue, firstPeriodDays = 30) {
  validatePositive(principalValue, 'saldo'); validatePositive(paymentValue, 'parcela'); validatePeriods(periodsValue);
  if (!Number.isFinite(firstPeriodDays) || firstPeriodDays <= 0) throw new Error('Dias até o próximo vencimento devem ser maiores que zero.');
  const fraction = firstPeriodDays / 30;
  const pvAtRate = r => {
    if (Math.abs(r) < 1e-14) return paymentValue * periodsValue;
    const annuityDueAtFirst = paymentValue * (1 - Math.pow(1 + r, -periodsValue)) / r * (1 + r);
    return annuityDueAtFirst / Math.pow(1 + r, fraction);
  };
  if (paymentValue * periodsValue < principalValue) throw new Error('Não existe taxa mensal não negativa compatível com esses valores.');
  let lo = 0, hi = 1;
  while (pvAtRate(hi) > principalValue && hi < 1000) hi *= 2;
  if (pvAtRate(hi) > principalValue) throw new Error('Não foi possível encontrar uma taxa compatível.');
  for (let k = 0; k < 180; k++) {
    const mid = (lo + hi) / 2;
    if (pvAtRate(mid) > principalValue) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
export function annualEquivalent(monthlyRate) { return Math.pow(1 + monthlyRate, 12) - 1; }
function validatePositive(v, name) { if (!Number.isFinite(v) || v <= 0) throw new Error(`${name} deve ser maior que zero.`); }
function validatePeriods(v) { if (!Number.isFinite(v) || v <= 0) throw new Error('Prazo deve ser maior que zero.'); }