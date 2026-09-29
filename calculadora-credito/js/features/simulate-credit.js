import { payment } from '../core/price.js';

const IOF_ADDITIONAL_RATE = 0.0038;
const IOF_DAILY_RATE = 0.000082;
const IOF_MAX_DAYS = 365;
const DAY_MS = 86400000;

function daysBetween(start,end){
  const a=Date.UTC(start.getFullYear(),start.getMonth(),start.getDate());
  const b=Date.UTC(end.getFullYear(),end.getMonth(),end.getDate());
  return Math.round((b-a)/DAY_MS);
}

function iofFactor(monthlyRate,periods,firstPeriodDays){
  const unitPayment=payment(1,monthlyRate,periods);
  let balance=1,dailyTax=0;
  for(let k=1;k<=periods;k++){
    const interest=balance*monthlyRate;
    const amortization=Math.max(0,Math.min(balance,unitPayment-interest));
    const elapsed=Math.min(IOF_MAX_DAYS,Math.max(0,firstPeriodDays+(k-1)*30));
    dailyTax+=amortization*IOF_DAILY_RATE*elapsed;
    balance=Math.max(0,balance-amortization);
  }
  return IOF_ADDITIONAL_RATE+dailyTax;
}

export function simulateCredit({kind='new',requestedAmount,outstandingBalance=0,periods,monthlyRate,contractDate,firstDue}){
  if(!Number.isFinite(requestedAmount)||requestedAmount<=0)throw new Error('Valor contratado deve ser maior que zero.');
  if(!Number.isFinite(periods)||periods<=0||!Number.isInteger(periods))throw new Error('Prazo deve ser um número inteiro maior que zero.');
  if(!Number.isFinite(monthlyRate)||monthlyRate<0)throw new Error('Taxa deve ser válida.');
  if(kind==='renewal'&&(!Number.isFinite(outstandingBalance)||outstandingBalance<=0))throw new Error('Saldo devedor deve ser maior que zero.');
  const firstPeriodDays=daysBetween(contractDate,firstDue);
  if(firstPeriodDays<=0)throw new Error('O primeiro vencimento deve ser posterior à data da contratação.');
  const baseAmount=requestedAmount+(kind==='renewal'?outstandingBalance:0);
  const factor=iofFactor(monthlyRate,periods,firstPeriodDays);
  if(factor>=1)throw new Error('Não foi possível calcular o IOF para estes dados.');
  const financedAmount=baseAmount/(1-factor);
  const iof=financedAmount-baseAmount;
  return {kind,requestedAmount,outstandingBalance,baseAmount,iof,financedAmount,payment:payment(financedAmount,monthlyRate,periods),firstPeriodDays};
}
