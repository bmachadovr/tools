import { payment, periods, periodsWithFirstPeriod } from '../core/price.js';

function positive(value, name) {
  if (!Number.isFinite(value) || value <= 0) throw new Error(name+' deve ser maior que zero.');
}
export function amortizeBalance({principal, currentPayment, remainingPeriods, monthlyRate, extraPayment, firstPeriodDays=30}) {
  positive(principal,'Saldo devedor'); positive(currentPayment,'Parcela'); positive(remainingPeriods,'Parcelas restantes'); positive(monthlyRate,'Taxa'); positive(extraPayment,'Valor da amortização');
  positive(firstPeriodDays,'Dias até o próximo vencimento');
  if (extraPayment >= principal) throw new Error('O valor da amortização deve ser menor que o saldo devedor.');
  const newBalance=principal-extraPayment;
  if (currentPayment <= newBalance*monthlyRate) throw new Error('A parcela atual não é suficiente para amortizar o novo saldo nessa taxa.');
  const reducedPeriods=periodsWithFirstPeriod(newBalance,currentPayment,monthlyRate,firstPeriodDays);
  const fraction=firstPeriodDays/30;
  const annuityFactor=(1-Math.pow(1+monthlyRate,-remainingPeriods))/monthlyRate;
  const newPayment=newBalance*Math.pow(1+monthlyRate,fraction)/(annuityFactor*(1+monthlyRate));
  const originalTotal=currentPayment*remainingPeriods;
  const termTotal=currentPayment*reducedPeriods;
  const paymentTotal=newPayment*remainingPeriods;
  return {
    newBalance,firstPeriodDays,
    reducedPeriods,
    periodsSaved:Math.max(0,remainingPeriods-reducedPeriods),
    newPayment,
    paymentReduction:currentPayment-newPayment,
    interestSavingTerm:Math.max(0,originalTotal-termTotal),
    interestSavingPayment:Math.max(0,originalTotal-paymentTotal)
  };
}
