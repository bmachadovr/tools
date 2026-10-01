const IOF_ADDITIONAL_RATE = 0.0038;
const IOF_DAILY_RATE = 0.000082;
const IOF_MAX_DAYS = 365;
const DAY_MS = 86400000;

function daysBetween(start,end){
  const a=Date.UTC(start.getFullYear(),start.getMonth(),start.getDate());
  const b=Date.UTC(end.getFullYear(),end.getMonth(),end.getDate());
  return Math.round((b-a)/DAY_MS);
}

function addMonthsClamped(date,months){
  const year=date.getFullYear(),month=date.getMonth()+months,day=date.getDate();
  const lastDay=new Date(year,month+1,0).getDate();
  return new Date(year,month,Math.min(day,lastDay));
}

function financeFirstPeriodDays(contractDate,firstDue){
  // Convenção observada na simulação BB: o período financeiro exclui o dia
  // da contratação. Ex.: 01/10 a 05/11 = 34 dias financeiros.
  return Math.max(1,daysBetween(contractDate,firstDue)-1);
}

function paymentWithFirstPeriod(principalValue,monthlyRate,periods,firstPeriodDays){
  if(Math.abs(monthlyRate)<1e-14)return principalValue/periods;
  const fraction=firstPeriodDays/30;
  let pvFactor=0;
  for(let k=1;k<=periods;k++)pvFactor+=Math.pow(1+monthlyRate,-(fraction+k-1));
  return principalValue/pvFactor;
}

function iofFactor(monthlyRate,periods,contractDate,firstDue){
  const financialDays=financeFirstPeriodDays(contractDate,firstDue);
  const fraction=financialDays/30;
  const discountFactors=[];
  let factorSum=0;
  for(let k=1;k<=periods;k++){
    const df=Math.pow(1+monthlyRate,-(fraction+k-1));
    discountFactors.push(df);factorSum+=df;
  }

  // Em operação com principal definido e pagamentos parcelados, a base diária
  // é o principal de cada parcela. Para uma prestação fixa, esse principal é
  // representado pelo valor presente de cada prestação. A incidência diária
  // usa os dias corridos reais até cada vencimento, limitada a 365 dias.
  let weightedTaxDays=0;
  for(let k=1;k<=periods;k++){
    const due=addMonthsClamped(firstDue,k-1);
    const elapsed=Math.min(IOF_MAX_DAYS,Math.max(0,daysBetween(contractDate,due)));
    const principalShare=discountFactors[k-1]/factorSum;
    weightedTaxDays+=principalShare*elapsed;
  }
  return IOF_ADDITIONAL_RATE+IOF_DAILY_RATE*weightedTaxDays;
}

export function simulateCredit({kind='new',requestedAmount,outstandingBalance=0,periods,monthlyRate,contractDate,firstDue,originalContractDate=null,originalFinalDue=null}){
  if(!Number.isFinite(requestedAmount)||requestedAmount<=0)throw new Error('Valor contratado deve ser maior que zero.');
  if(!Number.isFinite(periods)||periods<=0||!Number.isInteger(periods))throw new Error('Prazo deve ser um número inteiro maior que zero.');
  if(!Number.isFinite(monthlyRate)||monthlyRate<0)throw new Error('Taxa deve ser válida.');
  if(kind==='renewal'&&(!Number.isFinite(outstandingBalance)||outstandingBalance<=0))throw new Error('Saldo devedor deve ser maior que zero.');
  const firstPeriodDays=daysBetween(contractDate,firstDue);
  if(firstPeriodDays<=0)throw new Error('O primeiro vencimento deve ser posterior à data da contratação.');
  const financialFirstPeriodDays=financeFirstPeriodDays(contractDate,firstDue);
  const factor=iofFactor(monthlyRate,periods,contractDate,firstDue);
  if(factor>=1)throw new Error('Não foi possível calcular o IOF para estes dados.');

  const newMoneyWithIof=requestedAmount/(1-factor);
  const newMoneyIof=newMoneyWithIof-requestedAmount;

  let outstandingIof=0, outstandingIofMode='none', complementaryDays=0;
  if(kind==='renewal'){
    if(originalContractDate&&originalFinalDue){
      const originalTaxableDays=Math.min(IOF_MAX_DAYS,Math.max(0,daysBetween(originalContractDate,originalFinalDue)));
      const finalRenewedDue=addMonthsClamped(firstDue,periods-1);
      const renewedTaxableDays=Math.min(IOF_MAX_DAYS,Math.max(0,daysBetween(originalContractDate,finalRenewedDue)));
      complementaryDays=Math.max(0,renewedTaxableDays-originalTaxableDays);
      outstandingIof=outstandingBalance*IOF_DAILY_RATE*complementaryDays;
      outstandingIofMode='informed';
    }else{
      const assumedOriginalTaxableDays=180;
      const finalRenewedDue=addMonthsClamped(firstDue,periods-1);
      const renewedTaxableDays=Math.min(IOF_MAX_DAYS,Math.max(0,daysBetween(contractDate,finalRenewedDue)));
      complementaryDays=Math.max(0,renewedTaxableDays-assumedOriginalTaxableDays);
      outstandingIof=outstandingBalance*IOF_DAILY_RATE*complementaryDays;
      outstandingIofMode='estimated';
    }
  }

  const iof=newMoneyIof+outstandingIof;
  const baseAmount=requestedAmount+(kind==='renewal'?outstandingBalance:0);
  const financedAmount=baseAmount+iof;

  return {
    kind,requestedAmount,outstandingBalance,baseAmount,iof,newMoneyIof,outstandingIof,
    financedAmount,payment:paymentWithFirstPeriod(financedAmount,monthlyRate,periods,financialFirstPeriodDays),
    firstPeriodDays,financialFirstPeriodDays,
    iofBase:requestedAmount,outstandingIofIncluded:kind==='renewal',
    outstandingIofMode,complementaryDays
  };
}
