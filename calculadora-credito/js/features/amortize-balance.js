import { payment, periods } from '../core/price.js';

function positive(value, name) {
  if (!Number.isFinite(value) || value <= 0) throw new Error(name+' deve ser maior que zero.');
}
export function amortizeBalance({principal, currentPayment, remainingPeriods, monthlyRate, extraPayment}) {
  positive(principal,'Saldo devedor'); positive(currentPayment,'Parcela'); positive(remainingPeriods,'Parcelas restantes'); positive(monthlyRate,'Taxa'); positive(extraPayment,'Valor da amortização');
  if (extraPayment >= principal) throw new Error('O valor da amortização deve ser menor que o saldo devedor.');
  const newBalance=principal-extraPayment;
  if (currentPayment <= newBalance*monthlyRate) throw new Error('A parcela atual não é suficiente para amortizar o novo saldo nessa taxa.');
  const reducedPeriods=periods(newBalance,currentPayment,monthlyRate);
  const newPayment=payment(newBalance,monthlyRate,remainingPeriods);
  const originalTotal=currentPayment*remainingPeriods;
  const termTotal=currentPayment*reducedPeriods;
  const paymentTotal=newPayment*remainingPeriods;
  return {
    newBalance,
    reducedPeriods,
    periodsSaved:Math.max(0,remainingPeriods-reducedPeriods),
    newPayment,
    paymentReduction:currentPayment-newPayment,
    interestSavingTerm:Math.max(0,originalTotal-termTotal-extraPayment),
    interestSavingPayment:Math.max(0,originalTotal-paymentTotal-extraPayment)
  };
}
