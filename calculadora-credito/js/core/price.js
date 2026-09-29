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
export function annualEquivalent(monthlyRate) { return Math.pow(1 + monthlyRate, 12) - 1; }
function validatePositive(v, name) { if (!Number.isFinite(v) || v <= 0) throw new Error(`${name} deve ser maior que zero.`); }
function validatePeriods(v) { if (!Number.isFinite(v) || v <= 0) throw new Error('Prazo deve ser maior que zero.'); }