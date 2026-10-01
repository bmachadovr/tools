export function debtExchange({currentBalance,currentPayment,currentPeriods,newPayment,newPeriods,fees=0,cashBack=0,currentRate=null,newRate=null,currentFirstPeriodDays=30,newFirstPeriodDays=30,newIof=0}){
  const values=[currentBalance,currentPayment,currentPeriods,newPayment,newPeriods];
  if(!values.every(v=>Number.isFinite(v)&&v>0)) throw new Error('Preencha os dados essenciais com valores válidos.');
  if(!Number.isFinite(fees)||fees<0||!Number.isFinite(cashBack)||cashBack<0||!Number.isFinite(newIof)||newIof<0) throw new Error('Custos, IOF e valor liberado não podem ser negativos.');
  const currentRemaining=currentPayment*currentPeriods;
  const newRemaining=newPayment*newPeriods+fees;
  const financialDifference=currentRemaining-newRemaining+cashBack;
  const currentCost=currentRemaining-currentBalance;
  const newBase=currentBalance+cashBack;
  const newCost=newRemaining-newBase;
  return {
    currentRemaining,newRemaining,financialDifference,currentCost,newCost,newIof,
    paymentDifference:newPayment-currentPayment,periodDifference:newPeriods-currentPeriods,
    cashBack,fees,currentRate,newRate,currentFirstPeriodDays,newFirstPeriodDays,
    effectiveDifference:financialDifference
  };
}
