function money(v){return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});}
function pct(v){return Math.abs(v*100).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%';}
function push(list,type,title,text,metric,priority=50){if(text)list.push({type,title,text,metric,priority});}

export function offerInsights(context,data){
  const out=[];
  if(context==='simulation'){
    const {requestedAmount=0,payment=0,periods=0,kind='new',outstandingBalance=0}=data;
    push(out,'value',kind==='renewal'?'Valor liberado':'Crédito disponível',kind==='renewal'?money(requestedAmount)+' de valor adicional disponível para você.':money(requestedAmount)+' disponíveis para você.',requestedAmount,90);
    if(payment>0)push(out,'payment','Impacto mensal','Parcela estimada de '+money(payment)+' em '+periods+' meses.',payment,80);
    if(kind==='renewal'&&outstandingBalance>0)push(out,'balance','Saldo renovado',money(outstandingBalance)+' do saldo atual será incorporado à nova operação.',outstandingBalance,60);
  }
  if(context==='comparison'){
    const {diff}=data;
    if(diff.payment!==0)push(out,'payment','Parcela',diff.payment<0?'A alternativa B reduz a parcela em '+money(-diff.payment)+'.':'A alternativa B aumenta a parcela em '+money(diff.payment)+'.',Math.abs(diff.payment),90);
    if(diff.totalPaid!==0)push(out,'cost','Desembolso total',diff.totalPaid<0?'A alternativa B reduz o desembolso total em '+money(-diff.totalPaid)+'.':'A alternativa B aumenta o desembolso total em '+money(diff.totalPaid)+'.',Math.abs(diff.totalPaid),85);
    if(diff.periods!==0)push(out,'term','Prazo',diff.periods<0?'A alternativa B encerra '+Math.abs(diff.periods)+' parcelas antes.':'A alternativa B acrescenta '+diff.periods+' parcelas ao prazo.',Math.abs(diff.periods),70);
  }
  if(context==='exchange'){
    const {financialDifference,paymentDifference,periodDifference,cashBack=0}=data;
    push(out,'cost','Efeito financeiro',financialDifference>=0?'A troca reduz o desembolso nominal em '+money(financialDifference)+'.':'A troca acrescenta '+money(-financialDifference)+' ao desembolso nominal.',Math.abs(financialDifference),95);
    if(paymentDifference!==0)push(out,'payment','Parcela',paymentDifference<0?'A nova operação reduz a parcela em '+money(-paymentDifference)+'.':'A nova operação aumenta a parcela em '+money(paymentDifference)+'.',Math.abs(paymentDifference),85);
    if(cashBack>0)push(out,'value','Valor adicional',money(cashBack)+' ficam disponíveis além da liquidação da dívida atual.',cashBack,80);
    if(periodDifference!==0)push(out,'term','Prazo',periodDifference<0?'O novo prazo é '+Math.abs(periodDifference)+' parcelas menor.':'O novo prazo é '+periodDifference+' parcelas maior.',Math.abs(periodDifference),65);
  }
  if(context==='creditAmortization'){
    const {economyTerm,economyPayment,credit,amort}=data;
    const best=Math.max(economyTerm,economyPayment),mode=economyTerm>=economyPayment?'reduzindo o prazo':'reduzindo a parcela';
    push(out,'cost','Resultado da estratégia',best>=0?'No cenário de '+mode+', a estratégia reduz o desembolso nominal em '+money(best)+'.':'Mesmo no cenário mais favorável calculado, há acréscimo nominal de '+money(-best)+'.',Math.abs(best),95);
    if(amort?.periodsSaved>0)push(out,'term','Prazo da dívida atual','A amortização elimina aproximadamente '+Math.floor(amort.periodsSaved)+' parcelas da dívida atual.',amort.periodsSaved,80);
    if(amort?.paymentReduction>0)push(out,'payment','Parcela da dívida atual','Mantendo o prazo, a parcela da dívida amortizada cai '+money(amort.paymentReduction)+'.',amort.paymentReduction,80);
    if(credit?.payment>0)push(out,'payment','Novo crédito','O novo crédito acrescenta parcela de '+money(credit.payment)+'.',credit.payment,70);
  }

  if(context==='amortization'){
    const {extraPayment=0,newBalance=0,fullAmortizedPeriods=0,partialAmortization=0,paymentReduction=0,interestSavingTerm=0,interestSavingPayment=0}=data;
    push(out,'value','Amortização','Amortização de '+money(extraPayment)+' reduz o saldo para '+money(newBalance)+'.',extraPayment,95);
    if(fullAmortizedPeriods>0||partialAmortization>0)push(out,'term','Redução de prazo','A amortização elimina '+fullAmortizedPeriods+' parcelas completas'+(partialAmortization>0?' e '+money(partialAmortization)+' da próxima parcela.':'.'),fullAmortizedPeriods,85);
    if(paymentReduction>0)push(out,'payment','Redução de parcela','Mantendo o prazo, a parcela diminui '+money(paymentReduction)+'.',paymentReduction,80);
    const bestInterest=Math.max(interestSavingTerm,interestSavingPayment);
    if(bestInterest>0)push(out,'cost','Economia de juros','A economia estimada de juros chega a '+money(bestInterest)+'.',bestInterest,75);
  }
  if(context==='futureBalance'){
    const {balance=0,paid=0,remaining=null,targetDateText=''}=data;
    push(out,'balance','Saldo projetado',(targetDateText?'Em '+targetDateText+', o saldo estimado é ':'Saldo estimado de ')+money(balance)+'.',balance,95);
    if(paid>0)push(out,'term','Parcelas até a data',paid+' parcela'+(paid===1?' será considerada paga.':'s serão consideradas pagas.'),paid,80);
    if(Number.isFinite(remaining))push(out,'term','Prazo restante','Restam aproximadamente '+remaining+' parcelas após a atualização.',remaining,70);
  }
  if(context==='converter'){
    const {findingAmount,result,payment,periods}=data;
    if(findingAmount)push(out,'value','Capacidade em crédito','Uma parcela de '+money(payment)+' representa aproximadamente '+money(result)+' de crédito em '+periods+' meses.',result,90);
    else push(out,'payment','Impacto mensal',money(result)+' é a parcela estimada para o valor e prazo informados.',result,90);
  }
  return out.sort((a,b)=>b.priority-a.priority).slice(0,3);
}
