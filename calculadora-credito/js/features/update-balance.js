function addMonthsClamped(date, months) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  const wantedDay = date.getDate();
  d.setMonth(d.getMonth() + months);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(wantedDay, lastDay));
  return d;
}
const dayDiff = (a,b) => Math.round((b-a)/86400000);

export function updateBalance({principal, monthlyRate, payment, periods, baseDate, nextDue, targetDate}) {
  if (![principal,payment,periods].every(v => Number.isFinite(v) && v > 0)) throw new Error('Dados do contrato incompletos para atualizar o saldo.');
  if (!Number.isFinite(monthlyRate) || monthlyRate < 0) throw new Error('Taxa mensal inválida.');
  if (!(baseDate instanceof Date) || !(nextDue instanceof Date) || !(targetDate instanceof Date)) throw new Error('Datas inválidas para atualização.');
  if (targetDate < baseDate) throw new Error('A data de atualização não pode ser anterior à data do saldo devedor.');
  if (nextDue <= baseDate) throw new Error('O próximo vencimento deve ser posterior à data do saldo devedor.');

  let balance = principal;
  let lastEvent = baseDate;
  let paid = 0;
  const totalPeriods = Math.ceil(periods);

  for (let k=0; k<totalPeriods; k++) {
    const due = addMonthsClamped(nextDue, k);
    if (due > targetDate) break;
    const days = dayDiff(lastEvent, due);
    balance *= Math.pow(1 + monthlyRate, days / 30);
    const actualPayment = Math.min(payment, balance);
    balance = Math.max(0, balance - actualPayment);
    paid++;
    lastEvent = due;
    if (balance <= 0.005) { balance = 0; break; }
  }

  if (balance > 0 && targetDate > lastEvent) {
    const days = dayDiff(lastEvent, targetDate);
    balance *= Math.pow(1 + monthlyRate, days / 30);
  }

  const remaining = Math.max(0, totalPeriods - paid);
  const upcomingDue = remaining > 0 ? addMonthsClamped(nextDue, paid) : null;
  return { balance, paid, remaining, nextDue: upcomingDue };
}
