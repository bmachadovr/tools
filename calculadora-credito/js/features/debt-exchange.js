export function debtExchange({currentBalance,currentPayment,currentPeriods,newPayment,newPeriods,fees=0,cashBack=0}){
  const values=[currentBalance,currentPayment,currentPeriods,newPayment,newPeriods];
  if(!values.every(v=>Number.isFinite(v)&&v>0)) throw new Error('Preencha os dados essenciais com valores válidos.');
  if(!Number.isFinite(fees)||fees<0||!Number.isFinite(cashBack)||cashBack<0) throw new Error('Custos e valor liberado não podem ser negativos.');
  const currentRemaining=currentPayment*currentPeriods;
  const newRemaining=newPayment*newPeriods+fees;
  const financialDifference=currentRemaining-newRemaining+cashBack;
  return {
    currentRemaining,newRemaining,financialDifference,
    paymentDifference:newPayment-currentPayment,
    periodDifference:newPeriods-currentPeriods,
    cashBack,fees,
    effectiveDifference:financialDifference
  };
}