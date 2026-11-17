"use strict";
// Motor independente do comparador. Valores e percentuais são informados pelo usuário;
// nenhum cenário representa aprovação, contemplação ou proposta contratual.
window.ConsorcioCompareV2 = (function () {
  const get = (id) => document.getElementById(id);
  const brMoney = (v) => Number(v).toLocaleString("pt-BR", {style:"currency",currency:"BRL"});
  const brNum = (v,decimals=2) => Number(v).toLocaleString("pt-BR",{minimumFractionDigits:decimals,maximumFractionDigits:decimals});
  const round = (v) => Math.round((v+Number.EPSILON)*100)/100;
  const CORE=["c-prazo","c-taxa","c-parcela"];
  const LOAN=["c-entrada","c-fintaxa","c-finprazo","c-finparcela"];
  const state={mode:"veiculos",coreHistory:[],loanHistory:[],netManual:false,rateManual:false,termManual:false,reajManual:false};
  const asValue=(id)=>{
    let s=String(get(id).value||"").trim().replace(/R\$|%|\s/g,"");
    if(!s) return null;
    if(s.includes(",")&&s.includes(".")) s=s.lastIndexOf(",")>s.lastIndexOf(".")?s.replace(/\./g,"").replace(",","."):s.replace(/,/g,"");
    else if(s.includes(","))s=s.replace(",",".");
    else if(/^\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,"");
    if(s.endsWith("."))s=s.slice(0,-1); // permitir vírgula decimal ainda em digitação
    const v=Number(s);
    return /^\d+(\.\d+)?$/.test(s)&&Number.isFinite(v)?v:NaN;
  };
  const value=(id,defaultValue=0)=>{
    const n=asValue(id);
    if(n===null)return defaultValue;
    if(!Number.isFinite(n)||n<0)throw Error("Confira o valor preenchido em "+get(id).closest("label").childNodes[0].textContent.trim()+".");
    return n;
  };
  const present=(id)=>String(get(id).value||"").trim()!=="";
  const set=(id,v,decimals=2)=>{
    const el=get(id);el.value=brNum(v,decimals);el.classList.add("is-derived");el.dataset.calculated="true";
  };
  const note=(id,text)=>{get(id).textContent=text;};
  const history=(arr,id,max)=>{
    const index=arr.indexOf(id);if(index!==-1)arr.splice(index,1);
    if(present(id))arr.push(id);
    while(arr.length>max)arr.shift();
  };
  function deriveCore() {
    const carta=value("c-carta");
    const found=CORE.filter(present);
    if(found.length<2||!(carta>0)){note("c-status","Preencha dois dos três campos para calcular o terceiro.");return false;}
    let target=CORE.find(id=>!present(id));
    if(!target)target=CORE.find(id=>!state.coreHistory.slice(-2).includes(id))||"c-parcela";
    const others=CORE.filter(id=>id!==target);
    if(!others.every(present))return false;
    const prazo=value("c-prazo"),taxa=value("c-taxa"),parcela=value("c-parcela");
    if(target==="c-parcela"){
      if(!Number.isInteger(prazo)||prazo<1||prazo>600||taxa>200){note("c-status","Confira prazo (1–600) e taxa total (até 200%).");return false;}
      set(target,carta*(1+taxa/100)/prazo);
    }else if(target==="c-taxa"){
      if(!Number.isInteger(prazo)||prazo<1||prazo>600||!(parcela>0)){note("c-status","Informe prazo inteiro e prestação positiva.");return false;}
      const derived=(parcela*prazo/carta-1)*100;
      if(derived<0||derived>200){note("c-status","Valores incompatíveis: a taxa total calculada seria negativa ou superior a 200%.");return false;}
      set(target,derived);
    }else{
      if(!(parcela>0)||taxa>200){note("c-status","Confira valor da prestação e taxa total.");return false;}
      const raw=carta*(1+taxa/100)/parcela;
      if(raw<1||raw>600.499){note("c-status","O prazo calculado não cabe entre 1 e 600 meses.");return false;}
      const n=Math.max(1,Math.round(raw));
      set(target,n,0);
      if(Math.abs(raw-n)>.005){note("c-status","Prazo aproximado para "+n+" prestações; não existe fração de prestação. Confira eventual parcela residual.");return true;}
    }
    const names={"c-prazo":"Prestações a pagar","c-taxa":"Taxa total","c-parcela":"Valor da parcela"};
    note("c-status",names[target]+" calculado automaticamente. A distribuição real do grupo pode ser diferente.");
    return true;
  }
  function deriveNet(){
    const carta=asValue("c-carta"),emb=asValue("c-embutido")||0;
    if(!Number.isFinite(carta)||carta<=0||!Number.isFinite(emb)||emb<0)return;
    if(!state.netManual||!present("c-liquida"))set("c-liquida",Math.max(0,carta-emb));
  }
  function effectiveMonthly(rate){
    const v=rate/100;
    return state.mode==="imoveis"?Math.expm1(Math.log1p(v)/12):v;
  }
  function payment(principal,rate,n,system,monthlyInsurance){
    if(n<=0||principal<0||!Number.isFinite(principal))return NaN;
    if(system==="sac")return principal/n+principal*rate+monthlyInsurance;
    if(rate===0)return principal/n+monthlyInsurance;
    return principal*rate/(-Math.expm1(-n*Math.log1p(rate)))+monthlyInsurance;
  }
  function isoDate(id){
    const txt=get(id).value.trim();
    if(!txt)return null;
    const date=new Date(txt+"T12:00:00Z");
    if(!Number.isFinite(date.getTime()))throw Error("Data inválida.");
    return date;
  }
  function plusMonths(date,count){
    const day=date.getUTCDate();
    const ret=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+count+1,0,12));
    const finalDay=Math.min(day,ret.getUTCDate());
    return new Date(Date.UTC(ret.getUTCFullYear(),ret.getUTCMonth(),finalDay,12));
  }
  function scheduleDays(month){
    const start=isoDate("c-contratacao"),first=isoDate("c-primeiro-vencimento");
    if(!start||!first)return month*30;
    const due=plusMonths(first,month-1);
    const days=Math.round((due.getTime()-start.getTime())/86400000);
    if(days<=0)throw Error("O primeiro vencimento precisa ser posterior à contratação.");
    return days;
  }
  function ioFCoefficient(rate,n,system){
    // Tributação aproximada sobre amortizações: art. 7º do Decreto nº 6.306/2007.
    const daily=.000082,additional=.0038,onePayment=payment(1,rate,n,system,0);
    let balance=1,weighted=0;
    for(let t=1;t<=n;t++){
      const amort=system==="sac"?1/n:(rate===0?1/n:onePayment-balance*rate);
      const exactAmort=t===n?balance:Math.max(0,Math.min(balance,amort));
      weighted+=exactAmort*Math.min(365,scheduleDays(t));
      balance=Math.max(0,balance-exactAmort);
    }
    return additional+daily*weighted;
  }
  function isExempt(){
    return !!get("c-iof-isento").checked||(state.mode==="imoveis"&&!!get("c-habitacional").checked);
  }
  function buildLoan(entry,rateInput,n){
    if(!(n>=1&&n<=600&&Number.isInteger(n))||rateInput<0||rateInput>(state.mode==="imoveis"?200:100))return null;
    const bem=value("c-carta"),fees=value("c-fintarifas"),insurance=value("c-finseguro");
    if(!(bem>0)||entry<0||entry>=bem)return null;
    const rate=effectiveMonthly(rateInput), financedPrice=bem-entry,base=financedPrice+fees;
    const system=state.mode==="veiculos"?"price":get("c-sistema").value;
    const iof=isExempt()?0:round(base*ioFCoefficient(rate,n,system));
    const financedIOF=get("c-financia-iof").checked;
    const principal=round(base+(financedIOF?iof:0));
    const initialPayment=payment(principal,rate,n,system,insurance);
    if(!Number.isFinite(initialPayment)||initialPayment<=0)return null;
    let first=round(initialPayment),last=first,total=0,baseInstTotal=0;
    if(system==="sac"){
      for(let k=1;k<=n;k++){
        const before=Math.max(0,principal-principal*(k-1)/n);
        const pay=round(principal/n+before*rate+insurance);
        if(k===1)first=pay;
        if(k===n)last=pay;
        total+=pay;
      }
      total=round(total);
      baseInstTotal=round(total-insurance*n);
    }else if(rate===0){
      // Sem juros, ajuste de centavos na última prestação.
      const normal=round(principal/n+insurance);
      const adjusted=round(principal+insurance*n-normal*(n-1));
      first=normal;last=adjusted;total=round(normal*(n-1)+adjusted);
      baseInstTotal=round(total-insurance*n);
    }else{
      first=last=round(initialPayment);
      total=round(first*n);
      baseInstTotal=round(total-insurance*n);
    }
    const external=value("c-finextras"), upfrontIOF=financedIOF?0:iof;
    return {mode:state.mode,system,entrada:entry,term:n,rateInput,monthlyRate:rate,principal,financedPrice,fees,insurance,iof,financedIOF,first,last,installmentTotal:total,total:round(entry+total+external+upfrontIOF),interest:Math.max(0,round(baseInstTotal-principal)),external,upfrontIOF,daysApprox:!get("c-contratacao").value||!get("c-primeiro-vencimento").value};
  }
  function autoLoan(){
    const fields=LOAN.filter(present);
    if(fields.length<3){note("c-finstatus","Preencha três dos quatro campos para calcular o campo faltante.");get("c-iof-display").textContent="IOF: preencha os campos essenciais para calcular.";return null;}
    let target=LOAN.find(id=>!present(id));
    if(!target)target=LOAN.find(id=>!state.loanHistory.slice(-3).includes(id))||"c-finparcela";
    let rate=value("c-fintaxa"),n=value("c-finprazo"),entry=value("c-entrada"),installment=value("c-finparcela");
    const bem=value("c-carta");
    if(!(bem>0)){note("c-finstatus","Informe o preço do bem.");return null;}
    if(target!=="c-finprazo"&&(!Number.isInteger(n)||n<1||n>600)){note("c-finstatus","Prazo deve ser inteiro de 1 a 600 meses.");return null;}
    const evalLoan=(e,r,t)=>buildLoan(e,r,t);
    let solved=null;
    if(target==="c-finparcela"){
      solved=evalLoan(entry,rate,n);
      if(!solved){note("c-finstatus","Confira entrada, prazo e taxa do financiamento.");return null;}
      set(target,solved.first);
    }else if(target==="c-entrada"){
      if(!(installment>0)){note("c-finstatus","Informe uma prestação positiva.");return null;}
      const atZero=evalLoan(0,rate,n),nearFull=evalLoan(Math.max(0,bem-.01),rate,n);
      if(!atZero||!nearFull||installment>atZero.first+.03||installment<nearFull.first-.03){
        note("c-finstatus","A prestação desejada não permite uma entrada válida (0 até o valor do bem) com esta taxa e prazo.");return null;
      }
      let lo=0,hi=bem-.01;
      for(let k=0;k<55;k++){
        const mid=(lo+hi)/2,val=evalLoan(mid,rate,n);
        if(val.first>installment)lo=mid;else hi=mid;
      }
      entry=round((lo+hi)/2);set(target,entry);
      set("c-lance",entry);
      solved=evalLoan(entry,rate,n);
    }else if(target==="c-fintaxa"){
      if(!(installment>0)){note("c-finstatus","Informe uma prestação positiva.");return null;}
      const max=state.mode==="imoveis"?200:100;
      const at0=evalLoan(entry,0,n),atMax=evalLoan(entry,max,n);
      if(!at0||!atMax||installment<at0.first-.03||installment>atMax.first+.03){
        note("c-finstatus","A parcela informada é incompatível com uma taxa positiva dentro dos limites da ferramenta.");return null;
      }
      let low=0,high=max;
      for(let k=0;k<55;k++){
        const mid=(low+high)/2;
        if(evalLoan(entry,mid,n).first<installment)low=mid;else high=mid;
      }
      rate=(low+high)/2;set(target,rate,4);
      solved=evalLoan(entry,rate,n);
    }else{
      if(!(installment>0)){note("c-finstatus","Informe uma prestação positiva.");return null;}
      let best=null;
      for(let candidate=1;candidate<=600;candidate++){
        const calc=evalLoan(entry,rate,candidate);
        if(!calc)continue;
        const delta=Math.abs(calc.first-installment);
        if(!best||delta<best.delta){best={term:candidate,delta,result:calc};}
      }
      if(!best){note("c-finstatus","Não foi possível calcular o prazo.");return null;}
      if(best.term===600&&best.result.first>installment+.05){note("c-finstatus","A parcela desejada não é suficiente para quitar em até 600 meses.");return null;}
      n=best.term;set(target,n,0);solved=best.result;
    }
    const display=(target==="c-fintaxa"?"Juros":target==="c-finprazo"?"Prazo":target==="c-entrada"?"Entrada":"Prestação");
    const diff=target==="c-finprazo"?Math.abs(solved.first-installment):0;
    note("c-finstatus",display+" calculado automaticamente"+(diff>.03?"; prazo inteiro aproximado (diferença de "+brMoney(diff)+" na prestação)":"")+".");
    get("c-iof-display").textContent="IOF estimado: "+brMoney(solved.iof)+(solved.iof===0?" (isenção indicada)":" · "+(solved.financedIOF?"incluído no financiamento":"pago à vista"))+
      (solved.daysApprox?" · vencimentos aproximados de 30 dias.":".");
    return solved;
  }
  function setMode(mode,byUser){
    if(!["veiculos","imoveis"].includes(mode))return;
    const changed=state.mode!==mode;state.mode=mode;
    const isProperty=mode==="imoveis";
    const sacOption=get("c-sac-option");
    sacOption.disabled=!isProperty;
    sacOption.hidden=!isProperty;
    get("c-price-option").textContent=isProperty?"Price — prestações fixas":"CDC — prestações fixas (Price)";
    get("c-sistema-label").textContent=isProperty?"Sistema de amortização imobiliária":"Tipo de financiamento de veículo";
    get("c-finance-system-note").textContent=isProperty
      ?"Imóveis: escolha Price ou SAC nos campos opcionais. Taxa anual efetiva convertida para mensal."
      :"Veículos: financiamento CDC, com prestações Price. SAC não é oferecido nesta modalidade.";
    if(!isProperty || changed)get("c-sistema").value="price";
    document.querySelectorAll(".mode-card").forEach(el=>{
      const selected=el.dataset.mode===mode;
      el.classList.toggle("selected",selected);
      el.setAttribute("aria-pressed",String(selected));
    });
    get("c-taxa-unidade").textContent=mode==="imoveis"?"% ao ano (efetiva)":"% ao mês";
    get("c-habitacional-row").hidden=mode!=="imoveis";
    get("c-finstatus").textContent="Prazo e parcelas sempre mensais; a taxa de imóveis é informada ao ano.";
    const reference = mode==="imoveis"
      ? {name:"INCC-M (FGV)",pct:"6,35",url:"https://portal.fgv.br/noticias/incc-m-outubro-2026",note:"A variante do INCC aplicável ao grupo deve ser conferida no contrato."}
      : {name:"IPCA (IBGE)",pct:"4,69",url:"https://www.ibge.gov.br/indicadores-e-sistemas/indices-e-certificados/16855-ipca.html",note:"O reajuste real do grupo pode seguir outro critério."};
    if(!state.reajManual || !present("c-reajuste")) get("c-reajuste").value=reference.pct;
    get("c-reajuste-info").innerHTML="Referência para "+(mode==="imoveis"?"imóveis":"veículos")+": <strong>"+reference.name+" — "+reference.pct+"% a.a.</strong>. Média anualizada de 36 meses fechados (nov/2023–out/2026). <a href='"+reference.url+"' target='_blank' rel='noopener noreferrer'>Fonte oficial</a>. "+reference.note+" Taxa editável; não é previsão.";
    if(changed&&byUser){
      // Uma taxa anual não pode ser reaproveitada como mensal, e vice-versa.
      get("c-fintaxa").value="";
      get("c-finparcela").value="";
      state.loanHistory=state.loanHistory.filter(id=>id!=="c-fintaxa"&&id!=="c-finparcela");
      note("c-finstatus","Informe os juros na nova unidade. Os demais campos foram mantidos.");
    }
    autoLoan();
  }
  function onCoreChange(id){
    get(id).classList.remove("is-derived");history(state.coreHistory,id,2);
    deriveCore();autoLoan();
  }
  function onLoanChange(id){
    get(id).classList.remove("is-derived");
    if(id==="c-fintaxa")state.rateManual=true;
    if(id==="c-finprazo")state.termManual=true;
    history(state.loanHistory,id,3);
    if(id==="c-entrada"){get("c-lance").value=get(id).value;get("c-lance").classList.add("is-derived");}
    autoLoan();
  }
  function synchronizeOwn(){
    get("c-entrada").value=get("c-lance").value;
    get("c-entrada").classList.add("is-derived");
    history(state.loanHistory,"c-entrada",3);
    autoLoan();
  }
  function init(){
    document.querySelectorAll(".mode-card").forEach(btn=>btn.addEventListener("click",()=>setMode(btn.dataset.mode,true)));
    CORE.forEach(id=>get(id).addEventListener("input",()=>onCoreChange(id)));
    LOAN.forEach(id=>get(id).addEventListener("input",()=>onLoanChange(id)));
    get("c-carta").addEventListener("input",()=>{deriveCore();deriveNet();autoLoan();});
    get("c-lance").addEventListener("input",synchronizeOwn);
    get("c-embutido").addEventListener("input",deriveNet);
    get("c-reajuste").addEventListener("input",()=>{state.reajManual=true;});
    get("c-liquida").addEventListener("input",()=>{state.netManual=present("c-liquida");});
    ["c-sistema","c-fintarifas","c-finseguro","c-finextras","c-contratacao","c-primeiro-vencimento","c-habitacional","c-iof-isento","c-financia-iof"].forEach(id=>{
      get(id).addEventListener("change",autoLoan);
      get(id).addEventListener("input",autoLoan);
    });
    get("form-comparar").addEventListener("reset",()=>{
      window.setTimeout(()=>{
        const fields=["c-carta","c-contemplacao","c-prazo","c-taxa","c-parcela",
          "c-lance","c-embutido","c-liquida","c-apos-parcela","c-apos-prazo","c-extras",
          "c-entrada","c-fintaxa","c-finprazo","c-finparcela",
          "c-fintarifas","c-finseguro","c-finextras","c-contratacao","c-primeiro-vencimento"];
        fields.forEach(id=>{const field=get(id);field.value="";field.classList.remove("is-derived");});
        get("c-financia-iof").checked=true;
        get("c-habitacional").checked=true;
        get("c-iof-isento").checked=false;
        get("c-sistema").value="price";
        get("c-detalhes").open=false;
        get("c-fin-detalhes").open=false;
        state.mode="veiculos";
        state.coreHistory=[];
        state.loanHistory=[];
        state.netManual=false;state.rateManual=false;state.termManual=false;
        state.reajManual=false;
        setMode("veiculos",false);
        deriveCore();autoLoan();
      },0);
    });
    setMode("veiculos",false);deriveCore();autoLoan();
  }
  function afterExample(){
    state.coreHistory=["c-prazo","c-taxa"];
    state.loanHistory=["c-entrada","c-fintaxa","c-finprazo"];
    state.netManual=false;state.rateManual=false;state.termManual=false;
    state.reajManual=false;
    setMode("veiculos",false);
    deriveCore();deriveNet();autoLoan();
  }
  function calculate(){
    if(!deriveCore())throw Error("No consórcio, informe dois valores coerentes entre prazo, taxa total e parcela.");
    deriveNet();
    const carta=value("c-carta"),bem=carta,n=value("c-prazo"),taxa=value("c-taxa"),pmt=value("c-parcela");
    const own=value("c-lance"),embedded=value("c-embutido"),liquid=value("c-liquida");
    const cost=value("c-extras"),reaj=value("c-reajuste"),month=value("c-contemplacao");
    if(!(bem>0&&carta>0&&n>=1&&n<=600&&Number.isInteger(n)&&pmt>0&&taxa<=200))throw Error("Confira carta, prazo, taxa e parcela do consórcio.");
    if(!Number.isInteger(month)||month<1||month>n)throw Error("A contemplação hipotética deve ocorrer entre o mês 1 e o prazo informado.");
    if(embedded>carta*.30+.01)throw Error("O lance embutido não pode superar 30% da carta neste perfil de referência.");
    if(embedded>carta||liquid<0||reaj>100)throw Error("Confira lance embutido, crédito líquido e reajuste.");
    if(!present("c-entrada")||Math.abs(value("c-entrada")-own)>.01){
      get("c-entrada").value=get("c-lance").value;
      history(state.loanHistory,"c-entrada",3);
    }
    const finance=autoLoan();
    if(!finance)throw Error("No financiamento, preencha três campos coerentes entre entrada, juros, prazo e parcela.");

    const warnings=[];
    const calculatedNet=round(carta-embedded);
    if(Math.abs(liquid-calculatedNet)>.02)warnings.push("O crédito líquido informado difere de carta menos lance embutido. Verifique outras deduções contratuais antes de apresentar o resultado.");
    const totalBid=own+embedded;
    let postCount=present("c-apos-prazo")?value("c-apos-prazo"):null;
    if(postCount!==null&&(!Number.isInteger(postCount)||postCount<1||postCount>n))throw Error("As prestações após lance devem ser inteiras e não superar o prazo informado.");
    let postPay=present("c-apos-parcela")?value("c-apos-parcela"):null;
    let inferredPost=false, incompleteBid=false;
    if(totalBid>0&&postCount!==null&&postPay===null){
      postPay=round(pmt-totalBid/postCount);
      if(postPay<=0)throw Error("O lance informado supera o saldo amortizável do cenário simplificado. Informe a nova parcela real.");
      inferredPost=true;
      warnings.push("Parcela após lance estimada pela divisão do lance entre "+postCount+" prestações; confirme no simulador do grupo.");
    }
    if(totalBid>0&&postCount===null){
      incompleteBid=true;
      warnings.push("Foi informado lance, mas não a quantidade de prestações após lance. O desembolso calculado mantém as parcelas originais e NÃO desconta a amortização do lance: comparação parcial.");
    }
    if(postPay!==null&&postCount===null){
      warnings.push("A nova parcela foi informada, mas falta o prazo após lance. Não é possível usar esse valor na soma de prestações.");
    }
    if(totalBid===0&&postPay!==null&&postCount!==null){
      warnings.push("Os valores após lance foram informados sem lance correspondente; confira se a cota já tinha amortizações anteriores.");
    }
    const priceDifference=Math.max(0,bem-liquid);
    const excess=Math.max(0,liquid-bem);
    const totalCount=postCount===null?n:postCount;
    const preCount=postCount===null?0:n-postCount;
    // Sem prazo pós-lance validado, não aplicar a nova parcela ao prazo inteiro.
    const finalPay=(postCount===null||postPay===null?pmt:postPay);
    let installmentTotal=0;
    // A distribuição real de taxas e reajustes é obtida da proposta; aqui o
    // crescimento anual é apenas uma projeção transparente em blocos de 12 meses.
    for(let t=1;t<=preCount;t++)installmentTotal+=pmt*Math.pow(1+reaj/100,Math.floor((t-1)/12));
    for(let t=1;t<=totalCount;t++)installmentTotal+=finalPay*Math.pow(1+reaj/100,Math.floor((preCount+t-1)/12));
    installmentTotal=round(installmentTotal);
    const totalCons=round(installmentTotal+own+cost+priceDifference);
    const totalFin=finance.total,diff=round(Math.abs(totalCons-totalFin));
    // Séries de caixa acumulado. O financiamento tem entrada e despesas à vista no mês zero.
    // No consórcio, lance próprio, complemento do bem e custos são colocados no mês
    // hipotético da contemplação, sem implicar data garantida de aquisição.
    // As prestações reproduzem exatamente as hipóteses usadas nos totais.
    const finalMonth=Math.max(n,finance.term);
    const flow=[];
    let runningCons=0, runningFin=round(finance.entrada+finance.external+finance.upfrontIOF);
    flow.push({month:0,cons:0,fin:runningFin});
    for(let t=1;t<=finalMonth;t++){
      if(t<=n){
        const paymentBase=t<=preCount?pmt:finalPay;
        runningCons+=paymentBase*Math.pow(1+reaj/100,Math.floor((t-1)/12));
        if(t===month)runningCons+=own+cost+priceDifference;
      }
      if(t<=finance.term){
        let loanPayment;
        if(finance.system==="sac"){
          const balanceBefore=Math.max(0,finance.principal-finance.principal*(t-1)/finance.term);
          loanPayment=round(finance.principal/finance.term+balanceBefore*finance.monthlyRate+finance.insurance);
        }else{
          loanPayment=t===finance.term?finance.last:finance.first;
        }
        runningFin+=loanPayment;
      }
      flow.push({month:t,cons:round(runningCons),fin:round(runningFin)});
    }
    // Verificar que os custos do último ponto correspondem à memória de cálculo.
    const lastFlow=flow[flow.length-1];
    if(Math.abs(lastFlow.cons-totalCons)>.02||Math.abs(lastFlow.fin-totalFin)>.02){
      throw Error("Inconsistência no fluxo acumulado. Confira parcelas e custos antes de comparar.");
    }

    if(totalBid>0&&postCount!==null&&n-postCount!==month)warnings.push("O cronograma pós-lance informado sugere início após o mês "+(n-postCount)+", diferente da contemplação hipotética no mês "+month+". Confirme as datas reais do grupo.");
    if(month!==1)warnings.push("A contemplação no mês "+month+" é somente hipótese; custos de espera não foram incluídos.");
    else warnings.push("Contemplação no primeiro mês é hipótese de comparação, sem promessa de ocorrência.");
    if(excess>0)warnings.push("Crédito líquido excede o preço do bem em "+brMoney(excess)+". Não se considera a diferença dinheiro livre.");
    if(reaj>0)warnings.push("Reajuste anual de "+brNum(reaj)+"% é uma hipótese aplicada em blocos de 12 prestações, sem vinculação às assembleias.");
    if(finance.daysApprox&&finance.iof>0)warnings.push("IOF estimado com intervalos de 30 dias e condições gerais de pessoa física. Confirme datas, eventual isenção e tributo oficial.");
    if(finance.mode==="imoveis"){
      warnings.push("Simulação imobiliária com taxa anual efetiva convertida para mensal; não inclui TR, índice do saldo devedor, seguros variáveis ou eventual evolução de obra.");
      if(get("c-habitacional").checked)warnings.push("IOF tratado como isento por finalidade habitacional. Se o imóvel não se enquadrar, desmarque essa opção no detalhamento.");
    }else if(finance.iof>0) warnings.push("IOF de veículo calculado como estimativa; isenções ou enquadramentos especiais podem alterar o valor oficial.");
    if(incompleteBid)warnings.push("Não declare vencedor pelo custo nominal enquanto a amortização pós-lance estiver ausente.");
    const comparable=!incompleteBid;
    const winner=!comparable?"Comparação parcial":(Math.abs(totalCons-totalFin)<.01?"Mesmo desembolso":(totalCons<totalFin?"Consórcio":"Financiamento"));
    const currency=brMoney;
    const financePayment=finance.system==="sac"?currency(finance.first)+" (1ª) / "+currency(finance.last)+" (última)":currency(finance.first)+(finance.first!==finance.last?" / última ajustada "+currency(finance.last):"");
    const consortiumDetails=[
      ["Preço do bem",currency(bem)],
      ["Carta contratada",currency(carta)],
      ["Lance com recursos próprios",currency(own)],
      ["Lance embutido",currency(embedded)],
      ["Crédito disponível após embutido",currency(liquid)],
      ["Prestação inicial",currency(pmt)],
      ["Prestações originais",String(n)],
      ["Prestações após lance",postCount===null?"Não informadas":String(postCount)],
      ["Nova prestação após lance",postCount===null?"Não aplicada":(postPay===null?"Não informada":currency(finalPay)+(inferredPost?" (estimada)":""))],
      ["Total em prestações",currency(installmentTotal)],
      ["Complemento para adquirir o bem",currency(priceDifference)],
      ["Custos adicionais",currency(cost)],
      ["Desembolso nominal do consórcio",currency(totalCons)+(incompleteBid?" (parcial)":"")]
    ];
    const details=[
      ["Financiamento do bem",currency(finance.financedPrice)],
      ["Tarifas financiadas",currency(finance.fees)],
      ["IOF estimado",currency(finance.iof)],
      ["Principal com despesas financiadas",currency(finance.principal)],
      ["Taxa informada",brNum(finance.rateInput,4)+(finance.mode==="imoveis"?"% ao ano (efetiva)":"% ao mês")],
      ["Prestação calculada",financePayment],
      ["Seguro mensal",currency(finance.insurance)],
      ["Juros estimados",currency(finance.interest)],
      ["Total das prestações",currency(finance.installmentTotal)],
      ["Entrada / custos à vista",currency(finance.entrada)+" / "+currency(finance.external+finance.upfrontIOF)],
      ["Desembolso total",currency(finance.total)]
    ];
    const rows=[
      ["Bem analisado",currency(bem)],
      ["Carta original",currency(carta)],
      ["Crédito líquido após embutido",currency(liquid)],
      ["Prestações originais",n+" × "+currency(pmt)],
      ["Lance com capital próprio / entrada",currency(own)],
      ["Lance embutido",currency(embedded)],
      ["Prestações pós-lance",postCount==null?"Não informadas":postCount+" × "+currency(finalPay)+(inferredPost?" (estimada)":"")],
      ["Desembolso consórcio",currency(totalCons)+(incompleteBid?" (parcial)":"")],
      ["Sistema do financiamento",finance.system==="sac"?"SAC":"Price"],
      ["Prestação do financiamento",financePayment],
      ["IOF estimado",currency(finance.iof)],
      ["Juros do financiamento",currency(finance.interest)],
      ["Desembolso financiamento",currency(totalFin)],
      ["Diferença nominal",currency(diff)+(comparable?" — menor em "+winner:" — não conclusiva")],
      ["Contemplação hipotética","Mês "+month]
    ];
    // Dados numéricos para análise técnica e comparação visual, sem recálculos na interface.
    const consPriceGap=round(totalCons-bem),finPriceGap=round(totalFin-bem);
    const financeAnnualEffective=Math.expm1(12*Math.log1p(finance.monthlyRate))*100;
    const comparisonData={
      mode:state.mode, comparable, winner, referenceValue:bem,
      consTotal:totalCons, finTotal:totalFin, difference:diff,
      consPriceGap,finPriceGap,
      costDiffPercentOfFin:totalFin>0?diff/totalFin*100:0,
      monthlyCons:pmt,monthlyPost:(postCount!==null?finalPay:null),
      monthlyPostInferred:inferredPost, postCount,preCount,consTerm:n,
      consInstallments:installmentTotal,consUpfront:own,
      consOwn:own,embedded,consLiquid:liquid,consComplement:priceDifference,
      consOtherCosts:cost,consReaj:reaj,consFeesPct:taxa,
      finFirst:finance.first,finLast:finance.last,finTerm:finance.term,
      finInterest:finance.interest,finIof:finance.iof,finFees:finance.fees,
      finInsuranceTotal:round(finance.insurance*finance.term),
      finInstallments:finance.installmentTotal,finPrincipal:finance.principal,
      finEntry:finance.entrada,finExternal:finance.external+finance.upfrontIOF,
      finSystem:finance.system,finMonthlyRate:finance.monthlyRate*100,
      finAnnualEffective:financeAnnualEffective,
      monthContemplation:month,flow
    };
    return {
      main:comparable?currency(diff):"Comparação parcial",
      heading:comparable?"diferença nominal — menor em "+winner:"amortização pós-lance não informada",
      sub:"Financiamento calculado pelo "+(finance.system==="sac"?"SAC":"sistema Price")+"; entrada igual ao lance próprio. Totais nominais, sem desconto a valor presente ou garantia de contemplação.",
      metrics:[["Carta líquida",currency(liquid)],["Entrada = lance próprio",currency(own)],["Parcela financiamento",currency(finance.first)],["Juros do financiamento",currency(finance.interest)]],
      comparison:[["Consórcio",currency(totalCons)+(incompleteBid?" (parcial)":"")],["Financiamento",currency(totalFin)],["Compra à vista",currency(bem)]],
      details,consortiumDetails,rows,warnings, finance, totalCons,totalFin,comparisonData
    };
  }
  return {init,calculate,afterExample,setMode};
}());
