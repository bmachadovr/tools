import { simulateCredit } from './simulate-credit.js';
import { amortizeBalance } from './amortize-balance.js';

export function creditToAmortize({
  targetBalance,targetPayment,targetPeriods,targetRate,
  newCreditAmount,newCreditPeriods,newCreditRate,
  contractDate,firstDue,targetFirstPeriodDays=30
}){
  const vals=[targetBalance,targetPayment,targetPeriods,targetRate,newCreditAmount,newCreditPeriods,newCreditRate];
  if(!vals.every(v=>Number.isFinite(v)&&v>0)) throw new Error('Preencha os dados essenciais com valores válidos.');
  if(newCreditAmount>=targetBalance) throw new Error('O novo crédito deve ser menor que o saldo que será amortizado.');
  const credit=simulateCredit({kind:'new',requestedAmount:newCreditAmount,periods:newCreditPeriods,monthlyRate:newCreditRate,contractDate,firstDue});
  const amort=amortizeBalance({principal:targetBalance,currentPayment:targetPayment,remainingPeriods:targetPeriods,monthlyRate:targetRate,extraPayment:newCreditAmount,firstPeriodDays:targetFirstPeriodDays});
  const baseline=targetPayment*targetPeriods;
  const newCreditTotal=credit.payment*newCreditPeriods;
  const targetTermTotal=targetPayment*amort.reducedPeriods;
  const targetPaymentTotal=amort.newPayment*targetPeriods;
  const strategyTermTotal=newCreditTotal+targetTermTotal;
  const strategyPaymentTotal=newCreditTotal+targetPaymentTotal;
  return {
    credit,amort,baseline,newCreditTotal,targetTermTotal,targetPaymentTotal,
    strategyTermTotal,strategyPaymentTotal,
    economyTerm:baseline-strategyTermTotal,
    economyPayment:baseline-strategyPaymentTotal,
    combinedPaymentTerm:targetPayment+credit.payment,
    combinedPaymentKeepingTerm:amort.newPayment+credit.payment
  };
}
