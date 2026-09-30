export function compareCredit(a,b){
  for(const [name,x] of [['A',a],['B',b]]){
    if(!x||![x.amount,x.payment,x.periods,x.monthlyRate].every(v=>Number.isFinite(v)&&v>0)) throw new Error('Preencha todos os dados das duas alternativas com valores válidos.');
  }
  const normalize=x=>({
    ...x,
    totalPaid:x.payment*x.periods,
    totalCost:x.payment*x.periods-x.amount
  });
  const A=normalize(a),B=normalize(b);
  const diff={
    payment:B.payment-A.payment,
    periods:B.periods-A.periods,
    monthlyRate:B.monthlyRate-A.monthlyRate,
    amount:B.amount-A.amount,
    totalPaid:B.totalPaid-A.totalPaid,
    totalCost:B.totalCost-A.totalCost
  };
  const pct=(delta,base)=>base?delta/base:null;
  return {A,B,diff,pct:{
    payment:pct(diff.payment,A.payment),
    amount:pct(diff.amount,A.amount),
    totalPaid:pct(diff.totalPaid,A.totalPaid),
    totalCost:pct(diff.totalCost,A.totalCost)
  }};
}