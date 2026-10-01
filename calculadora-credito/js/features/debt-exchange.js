import { simulateCredit } from './simulate-credit.js';
import { amortizeBalance } from './amortize-balance.js';

export function debtExchange({currentBalance,currentPayment,currentPeriods,newAmount,newPayment,newPeriods,amortizeAmount=null,currentRate=null,newRate=null,currentFirstPeriodDays=30,newFirstPeriodDays=30,newContractDate=null,newFirstDue=null,amortizationMode='payment'}){
  const values=[currentBalance,currentPayment,currentPeriods,newAmount,newPayment,newPeriods];
  if(!values.every(v=>Number.isFinite(v)&&v>0)) throw new Error('Preencha os dados essenciais com valores válidos.');
  if(amortizeAmount!==null&&(!Number.isFinite(amortizeAmount)||amortizeAmount<=0)) throw new Error('O valor a amortizar deve ser maior que zero.');
  if(amortizeAmount!==null&&amortizeAmount>newAmount) throw new Error('O valor a amortizar não pode ser maior que o valor da nova operação.');

  const appliedAmount=Math.min(currentBalance,amortizeAmount??newAmount);
  const operationType=appliedAmount>=currentBalance?'liquidation':'amortization';
  const remainingBalance=Math.max(0,currentBalance-appliedAmount);
  const cashAvailable=Math.max(0,newAmount-appliedAmount);
  const currentRemaining=currentPayment*currentPeriods;
  let adjustedCurrentPayment=null;
  let adjustedCurrentPeriods=currentPeriods;
  let adjustedPaymentMethod=null;
  if(operationType==='amortization'){
    if(Number.isFinite(currentRate)&&currentRate>0){
      const amortized=amortizeBalance({
        principal:currentBalance,currentPayment,remainingPeriods:currentPeriods,
        monthlyRate:currentRate,extraPayment:appliedAmount,firstPeriodDays:currentFirstPeriodDays
      });
      if(amortizationMode==='term'){
        adjustedCurrentPayment=currentPayment;
        adjustedCurrentPeriods=Math.max(1,Math.ceil(amortized.reducedPeriods));
        adjustedPaymentMethod='financial-term';
      }else{
        adjustedCurrentPayment=amortized.newPayment;
        adjustedPaymentMethod='financial-payment';
      }
    }else{
      adjustedCurrentPayment=currentPayment*(remainingBalance/currentBalance);
      adjustedPaymentMethod='proportional-payment';
    }
  }
  const adjustedCurrentRemaining=adjustedCurrentPayment===null?currentRemaining:adjustedCurrentPayment*adjustedCurrentPeriods;
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
    currentRemaining,adjustedCurrentRemaining,adjustedCurrentPayment,adjustedCurrentPeriods,adjustedPaymentMethod,newRemaining,financialDifference,currentCost,newCost,newIof,
    paymentDifference:newPayment-currentPayment,periodDifference:newPeriods-currentPeriods,
    currentRate,newRate,currentFirstPeriodDays,newFirstPeriodDays,
    effectiveDifference:financialDifference
  };
}
