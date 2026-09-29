export function buildSchedule(principal, monthlyRate, payment, maxPeriods = 600) {
  const rows = []; let balance = principal; let totalInterest = 0;
  for (let n = 1; n <= maxPeriods && balance > 0.005; n++) {
    const interest = balance * monthlyRate;
    const actualPayment = Math.min(payment, balance + interest);
    const amortization = actualPayment - interest;
    if (amortization <= 0) throw new Error('A parcela não amortiza o saldo.');
    const closing = Math.max(0, balance - amortization);
    rows.push({ n, opening: balance, interest, amortization, payment: actualPayment, closing });
    totalInterest += interest; balance = closing;
  }
  return { rows, totalInterest, finalBalance: balance };
}