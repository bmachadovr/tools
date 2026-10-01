import { simulateCredit } from './simulate-credit.js';

export function debtExchange({currentBalance,currentPayment,currentPeriods,newPayment,newPeriods,cashBack=0,currentRate=null,newRate=null,currentFirstPeriodDays=30,newFirstPeriodDays=30,newContractDate=null,newFirstDue=null}){
  const values=[currentBalance,currentPayment,currentPeriods,newPayment,newPeriods];
  if(!values.every(v=>Number.isFinite(v)&&v>0)) throw new Error('Preencha os dados essenciais com valores válidos.');
  if(!Number.isFinite(cashBack)||cashBack<0) throw new Error('O valor adicional liberado não pode ser negativo.');

  const currentRemaining=currentPayment*currentPeriods;
  const newBase=currentBalance+cashBack;
  let newIof=null;

  if(Number.isFinite(newRate)&&newRate>0){
    const contractDate=newContractDate??new Date();
    const firstDue=newFirstDue??new Date(contractDate.getTime()+30*86400000);
    const tax=simulateCredit({
      kind:'new',
      requestedAmount:newBase,
      periods:newPeriods,
      monthlyRate:newRate,
      contractDate,
      firstDue
    });
    newIof=tax.iof;
  }

  // A parcela informada já representa o fluxo mensal da nova operação.
  // O IOF calculado é exibido como composição estimada da contratação,
  // sem somá-lo novamente ao fluxo para evitar dupla contagem.
  const newRemaining=newPayment*newPeriods;
  const financialDifference=currentRemaining-newRemaining+cashBack;
  const currentCost=currentRemaining-currentBalance;
  const newCost=newRemaining-newBase;

  return {
    currentRemaining,newRemaining,financialDifference,currentCost,newCost,newIof,
    paymentDifference:newPayment-currentPayment,periodDifference:newPeriods-currentPeriods,
    cashBack,currentRate,newRate,currentFirstPeriodDays,newFirstPeriodDays,
    effectiveDifference:financialDifference
  };
}
