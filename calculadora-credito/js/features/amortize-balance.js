import { payment, periods, periodsWithFirstPeriod } from '../core/price.js';

function positive(value, name) {
  if (!Number.isFinite(value) || value <= 0) throw new Error(name+' deve ser maior que zero.');
}
export function amortizeBalance({principal, currentPayment, remainingPeriods, monthlyRate, extraPayment, firstPeriodDays=null}) {
  positive(principal,'Saldo devedor'); positive(currentPayment,'Parcela'); positive(remainingPeriods,'Parcelas restantes'); positive(monthlyRate,'Taxa'); positive(extraPayment,'Valor da amortização');
  if (extraPayment >= principal) throw new Error('O valor da amortização deve ser menor que o saldo devedor.');

  let effectiveFirstPeriodDays=firstPeriodDays;
  let timingMethod='informed';
  if (!Number.isFinite(effectiveFirstPeriodDays) || effectiveFirstPeriodDays <= 0) {
    const annuityDue=currentPayment*(1-Math.pow(1+monthlyRate,-remainingPeriods))/monthlyRate*(1+monthlyRate);
    const impliedFraction=Math.log(annuityDue/principal)/Math.log(1+monthlyRate);
    effectiveFirstPeriodDays=impliedFraction*30;
    if (!Number.isFinite(effectiveFirstPeriodDays) || effectiveFirstPeriodDays <= 0) effectiveFirstPeriodDays=30;
    timingMethod='inferred';
  }

  const newBalance=principal-extraPayment;

  // Redução decrescente: antecipa as parcelas finais pelo valor presente na data do saldo.
  const fraction=effectiveFirstPeriodDays/30;
  let available=extraPayment;
  let fullAmortizedPeriods=0;
  for(let k=Math.floor(remainingPeriods);k>=1;k--){
    const settlementValue=currentPayment/Math.pow(1+monthlyRate,fraction+k-1);
    if(available+1e-8>=settlementValue){
      available-=settlementValue;
      fullAmortizedPeriods++;
    }else break;
  }
  const partialAmortization=Math.max(0,available);
  const hasPartial=partialAmortization>0.005 && fullAmortizedPeriods<remainingPeriods;
  const remainingFullPeriods=Math.max(0,Math.floor(remainingPeriods)-fullAmortizedPeriods-(hasPartial?1:0));
  const residualPayment=hasPartial?Math.max(0,currentPayment-partialAmortization):0;

  const annuityFactor=(1-Math.pow(1+monthlyRate,-remainingPeriods))/monthlyRate;
  const newPayment=newBalance*Math.pow(1+monthlyRate,fraction)/(annuityFactor*(1+monthlyRate));
  const originalTotal=currentPayment*remainingPeriods;
  const termTotal=currentPayment*remainingFullPeriods+residualPayment;
  const paymentTotal=newPayment*remainingPeriods;
  return {
    newBalance,firstPeriodDays:effectiveFirstPeriodDays,timingMethod,
    reducedPeriods:remainingFullPeriods+(hasPartial?1:0),
    fullReducedPeriods:remainingFullPeriods,residualPayment,
    fullAmortizedPeriods,partialAmortization,
    periodsSaved:fullAmortizedPeriods,
    newPayment,
    paymentReduction:currentPayment-newPayment,
    interestSavingTerm:Math.max(0,originalTotal-termTotal-extraPayment),
    interestSavingPayment:Math.max(0,originalTotal-paymentTotal-extraPayment)
  };
}
