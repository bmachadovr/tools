export function compareCredit(a,b){
  for(const [name,x] of [['A',a],['B',b]]){
    if(!x||![x.amount,x.payment,x.periods,x.monthlyRate].every(v=>Number.isFinite(v)&&v>0)) throw new Error('Preencha todos os dados das duas alternativas com valores válidos.');
  }
  const normalize=x=>{
    const iof=Number.isFinite(x.iof)&&x.iof>=0?x.iof:0;
    const financedAmount=Number.isFinite(x.financedAmount)&&x.financedAmount>0?x.financedAmount:x.amount+iof;
    return {...x,iof,financedAmount,totalPaid:x.payment*x.periods,totalCost:x.payment*x.periods-x.amount};
  };
  const A=normalize(a),B=normalize(b);
  const diff={
    payment:B.payment-A.payment,periods:B.periods-A.periods,monthlyRate:B.monthlyRate-A.monthlyRate,
    amount:B.amount-A.amount,iof:B.iof-A.iof,financedAmount:B.financedAmount-A.financedAmount,
    totalPaid:B.totalPaid-A.totalPaid,totalCost:B.totalCost-A.totalCost
  };
  const pct=(delta,base)=>base?delta/base:null;
  return {A,B,diff,pct:{payment:pct(diff.payment,A.payment),amount:pct(diff.amount,A.amount),totalPaid:pct(diff.totalPaid,A.totalPaid),totalCost:pct(diff.totalCost,A.totalCost)}};
}
