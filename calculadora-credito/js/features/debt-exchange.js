import { simulateCredit } from './simulate-credit.js';

export function debtExchange({currentBalance,currentPayment,currentPeriods,newAmount,newPayment,newPeriods,amortizeAmount=null,currentRate=null,newRate=null,currentFirstPeriodDays=30,newFirstPeriodDays=30,newContractDate=null,newFirstDue=null}){
  const values=[currentBalance,currentPayment,currentPeriods,newAmount,newPayment,newPeriods];
  if(!values.every(v=>Number.isFinite(v)&&v>0)) throw new Error('Preencha os dados essenciais com valores válidos.');
  if(amortizeAmount!==null&&(!Number.isFinite(amortizeAmount)||amortizeAmount<=0)) throw new Error('O valor a amortizar deve ser maior que zero.');
  if(amortizeAmount!==null&&amortizeAmount>newAmount) throw new Error('O valor a amortizar não pode ser maior que o valor da nova operação.');

  const appliedAmount=Math.min(currentBalance,amortizeAmount??newAmount);
  const operationType=appliedAmount>=currentBalance?'liquidation':'amortization';
  const remainingBalance=Math.max(0,currentBalance-appliedAmount);
  const cashAvailable=Math.max(0,newAmount-appliedAmount);
  const currentRemaining=currentPayment*currentPeriods;
  let newIof=null;

  if(Number.isFinite(newRate)&&newRate>0){
    const contractDate=newContractDate??new Date();
    const firstDue=newFirstDue??new Date(contractDate.getTime()+30*86400000);
    newIof=simulateCredit({kind:'new',requestedAmount:newAmount,periods:newPeriods,monthlyRate:newRate,contractDate,firstDue}).iof;
  }

  const newRemaining=newPayment*newPeriods;
  const financialDifference=currentRemaining-newRemaining+cashAvailable;
  const currentCost=currentRemaining-currentBalance;
  const newCost=newRemaining-newAmount;

  return {
    operationType,appliedAmount,remainingBalance,cashAvailable,
    currentRemaining,newRemaining,financialDifference,currentCost,newCost,newIof,
    paymentDifference:newPayment-currentPayment,periodDifference:newPeriods-currentPeriods,
    currentRate,newRate,currentFirstPeriodDays,newFirstPeriodDays,
    effectiveDifference:financialDifference
  };
}
