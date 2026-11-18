"use strict";
// Comparação de três trajetórias de ATIVOS BRUTOS até uma data definida.
// Em investimento e compra à vista, o fluxo alternativo equivale às parcelas
// efetivas do consórcio; no consórcio, são prestações pagas com renda externa.
// Não se antecipam prestações futuras nem se afirma equivalência patrimonial
// líquida. Pagamentos posteriores à data são apresentados separadamente.
(function () {
  const money = (n) => Number(n).toLocaleString("pt-BR", {style:"currency",currency:"BRL"});
  const int = (n) => Number(n).toLocaleString("pt-BR",{maximumFractionDigits:0});
  const esc = (s) => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const round = (n) => Math.round((n+Number.EPSILON)*100)/100;
  const blank = "—";

  function run(d) {
    const {capital,preco,capitalUtilizado,capitalInvestido,parcela,parcelaApos,
      prazoApos,contemplacao,horizonte,valorizacao,rendimento,aluguel} = d;
    const r = Math.pow(1+rendimento/100,1/12)-1;
    const propertyRate = Math.pow(1+valorizacao/100,1/12)-1;
    const cashPossible = capital+0.005>=preco;
    const shortfall = Math.max(0,preco-capital);
    const totalPostEnd = contemplacao+prazoApos;
    let invested = capital;
    let cashInvested = cashPossible?capital-preco:null;
    let cashProperty = cashPossible?preco:null;
    let leverInvested = capital;
    let leverProperty = 0;
    let monthOwnRent=0, rentLeverage=0, paidLever=0, aportesAlternativos=0;
    const annual=[];

    function snapshot(month) {
      return {
        month,
        invested:round(invested),
        cash:cashPossible?round(cashInvested+cashProperty):null,
        leverGross:round(leverInvested+leverProperty),
        leverAdj:round(leverInvested+leverProperty)
      };
    }

    // Convenção temporal: capital aplicado rende durante o mês.
    // Ao final do mês, o fluxo disponível se torna aporte em A/B ou é pago
    // como prestação em C. Lance/complemento saem do capital no mês m.
    for(let t=1;t<=horizonte;t++) {
      const due=t<=contemplacao?parcela:t<=totalPostEnd?parcelaApos:0;
      if (!Number.isFinite(due) || due<0) throw Error("Parcela mensal inválida no cenário.");
      // Hipóteses A e B: aportes alternativos iguais às prestações EFETIVAS.
      invested=invested*(1+r)+due;
      if(cashPossible) {
        cashInvested=cashInvested*(1+r)+due+aluguel;
        cashProperty*=1+propertyRate;
        monthOwnRent+=aluguel;
      }
      aportesAlternativos+=due;
      // Hipótese C: não há aporte extra nas aplicações; a renda paga due.
      paidLever+=due;
      if(leverProperty>0) leverProperty*=1+propertyRate;
      leverInvested*=1+r;
      if(t===contemplacao) {
        if(leverInvested+0.005<capitalUtilizado) {
          throw Error("Na data hipotética da contemplação, o saldo aplicado não cobre lance e complemento. Ajuste capital ou condições do cenário.");
        }
        leverInvested-=capitalUtilizado;
        leverProperty=preco;
      } else if(t>contemplacao) {
        leverInvested+=aluguel;
        rentLeverage+=aluguel;
      }
      if(t===1 || t===contemplacao || t%12===0 || t===horizonte) {
        const point=snapshot(t);
        if(!annual.length||annual[annual.length-1].month!==t) annual.push(point);
      }
    }
    const left=Math.max(0,totalPostEnd-horizonte);
    const futureNominal=left*parcelaApos;
    const investment=round(invested);
    const cash=cashPossible?round(cashInvested+cashProperty):null;
    const gross=round(leverInvested+leverProperty);
    // Fotografia da data escolhida: somente ativos naquele instante.
    // Obrigações ainda a vencer são divulgadas, sem serem antecipadas.
    const adjusted=gross;
    const scenarios=[
      {id:"invest",name:"Manter investido",value:investment,gross:investment,
        portfolio:round(invested),property:0,possible:true,
        subtitle:"Capital inicial + aportes equivalentes às prestações pagas até o horizonte"},
      {id:"cash",name:"Comprar à vista",value:cash,gross:cash,
        portfolio:cashPossible?round(cashInvested):null,
        property:cashPossible?round(cashProperty):null,possible:cashPossible,
        subtitle:cashPossible?"Imóvel adquirido no início e aportes mensais equivalentes aplicados"
          :"Faltam "+money(shortfall)+" para adquirir o imóvel à vista"},
      {id:"lever",name:"Alavancagem",value:gross,gross,
        portfolio:round(leverInvested),property:round(leverProperty),possible:true,
        subtitle:"Imóvel + aplicações na data; parcelas futuras exibidas à parte"}
    ];
    const best=scenarios.filter(s=>s.possible).reduce((a,b)=>a.value>=b.value?a:b);
    return {
      scenarios,best,cashPossible,shortfall,
      r,propertyRate,paidLever:round(paidLever),
      aportesAlternativos:round(aportesAlternativos),rentLeverage:round(rentLeverage),
      monthOwnRent:round(monthOwnRent),
      left,futureNominal:round(futureNominal),
      gross,adjusted,investment,cash,annual,
      extraComparedToInvest:round(gross-investment),
      propertyPrice:preco,capitalInvestido,
      horizon:horizonte,contemplacao,initialCapital:capital,
      parcelaInicial:parcela,parcelaPosLance:parcelaApos
    };
  }

  function metric(label,number,sub) {
    return '<div class="pat-smallmetric"><span>'+esc(label)+'</span><strong>'+esc(number)+'</strong>'
      +(sub?'<small>'+esc(sub)+'</small>':'')+'</div>';
  }
  function cards(x) {
    return '<div class="pat-scenario-grid">'
      + x.scenarios.map((s,i)=>{
        const mark = ["01","02","03"][i];
        return '<article class="pat-scenario pat-scenario--'+s.id+'">'
          +'<div class="pat-scenario-heading"><span>'+mark+'</span><h4>'+esc(s.name)+'</h4></div>'
          +'<div class="pat-scenario-value">'+(s.possible?esc(money(s.value)):"Não viável")
          +'<small>'+(s.possible?'ativos brutos na data escolhida':'com capital inicial informado')+'</small></div>'
          +'<p>'+esc(s.subtitle)+'</p>'
          +(s.possible?'<div class="pat-scenario-details">'
            +'<div><span>Imóvel projetado</span><b>'+esc(money(s.property))+'</b></div>'
            +'<div><span>Aplicações projetadas</span><b>'+esc(money(s.portfolio))+'</b></div>'
            +'<div><span>Ativos brutos</span><b>'+esc(money(s.gross))+'</b></div>'
            +(s.id==="lever"?'<div><span>Parcelas efetivamente pagas até a data</span><b>'+esc(money(x.paidLever))+'</b></div><div><span>Prestações futuras (não abatidas)</span><b>'+esc(int(x.left))+' × '+esc(money(x.parcelaPosLance))+'</b></div>':'')
            +'</div>':'<div class="pat-cash-shortfall">Diferença para aquisição: <strong>'+esc(money(x.shortfall))+'</strong></div>')
          +'</article>';
      }).join("")+'</div>';
  }
  function timeline(x) {
    const values=x.annual.flatMap(p=>[p.invested,p.leverAdj,...(x.cashPossible?[p.cash]:[])]);
    const cMin=Math.min(0,...values),cMax=Math.max(1,...values);
    const scaleRange=Math.max(1,cMax-cMin);
    const ticks=[0,.25,.5,.75,1];
    const items=[["invest","Investimento","invested"],["cash","Compra à vista","cash"],["lever","Alavancagem (ativos brutos)","leverGross"]];
    const w=760,h=270,L=80,R=16,T=17,B=41;
    const px=i=>L+(w-L-R)*i/Math.max(1,x.annual.length-1);
    const py=value=>T+(h-T-B)*(1-(value-cMin)/scaleRange);
    const lines=ticks.map(f=>{
      const value=cMin+scaleRange*f;
      const y=py(value);
      return '<line x1="'+L+'" y1="'+y.toFixed(2)+'" x2="'+(w-R)+'" y2="'+y.toFixed(2)+'" class="pat-gridline"/>'
        +'<text x="'+(L-10)+'" y="'+(y+4).toFixed(2)+'" text-anchor="end" class="pat-chart-label">'+esc(int(value/1000))+' mil</text>';
    }).join("");
    const monthLabels=x.annual.map((p,i)=>{
      if(i>0 && i<x.annual.length-1 && i%Math.max(1,Math.ceil(x.annual.length/6))!==0)return "";
      return '<text x="'+px(i).toFixed(2)+'" y="'+(h-13)+'" text-anchor="middle" class="pat-chart-label">'+p.month+'m</text>';
    }).join("");
    const paths=items.filter(item=>item[0]!=="cash"||x.cashPossible).map(([id,name,key])=>{
      const path=x.annual.map((p,i)=>(i?"L":"M")+px(i).toFixed(2)+","+py(p[key]).toFixed(2)).join(" ");
      return '<path d="'+path+'" fill="none" class="pat-line pat-line--'+id+'"/>'
        +'<circle cx="'+px(x.annual.length-1).toFixed(2)+'" cy="'+py(x.annual[x.annual.length-1][key]).toFixed(2)+'" r="4" class="pat-dot pat-dot--'+id+'"/>';
    }).join("");
    return '<div class="pat-chartwrap">'
      +'<div class="pat-chart-head"><h4>Evolução dos ativos até a data escolhida</h4><p>Os aportes no investimento e na compra à vista correspondem às parcelas efetivas do consórcio em cada mês. Não projetamos obrigações futuras como desembolsos antes do horizonte.</p></div>'
      +'<div class="pat-chart-legend">'
      +items.filter(i=>i[0]!=="cash"||x.cashPossible).map(([id,name])=>'<span><i class="pat-legend pat-legend--'+id+'"></i>'+esc(name)+'</span>').join("")+'</div>'
      +'<div class="pat-chart-scroll"><svg class="pat-chart-svg" viewBox="0 0 '+w+' '+h+'" aria-label="Gráfico comparativo da evolução patrimonial" role="img">'
      +lines+monthLabels+paths+'</svg></div>'
      +'<p class="hint">O gráfico começa no mês 1. Cada linha mostra ativos brutos, não patrimônio líquido. A contemplação permanece hipotética; custos de aquisição, impostos e reajustes não estão incluídos.</p>'
      +'</div>';
  }
  function comparison(x) {
    const row=(name,vals)=>'<tr><th scope="row">'+esc(name)+'</th>'+vals.map((v)=>
      '<td>'+esc(v)+'</td>').join("")+'</tr>';
    return '<div class="pat-comparison-table"><h4>Comparação financeira no mesmo horizonte</h4><div class="pat-table-scroll">'
      +'<table><thead><tr><th scope="col">Critério</th><th scope="col">Manter investido</th><th scope="col">Comprar à vista</th><th scope="col">Alavancagem</th></tr></thead><tbody>'
      +row("Capital próprio no início",[money(x.initialCapital),money(x.initialCapital),money(x.initialCapital)])
      +row("Aporte do mês 1",[money(x.parcelaInicial),x.cashPossible?money(x.parcelaInicial):blank,"Prestação "+money(x.parcelaInicial)])
      +row("Fluxo dos meses após lance",[money(x.parcelaPosLance),x.cashPossible?money(x.parcelaPosLance):blank,"Prestação "+money(x.parcelaPosLance)])
      +row("Aportes realizados até o horizonte",[money(x.aportesAlternativos),x.cashPossible?money(x.aportesAlternativos):blank,money(0)])
      +row("Prestações pagas até o horizonte",[money(0),x.cashPossible?money(0):blank,money(x.paidLever)])
      +row("Imóvel",[money(0),x.cashPossible?money(x.scenarios[1].property):"Não viável",money(x.scenarios[2].property)])
      +row("Aplicações",[money(x.scenarios[0].portfolio),x.cashPossible?money(x.scenarios[1].portfolio):blank,money(x.scenarios[2].portfolio)])
      +row("Ativos brutos na data",[money(x.scenarios[0].gross),x.cashPossible?money(x.scenarios[1].gross):blank,money(x.gross)])
      +row("Prestações após o horizonte (quantidade)",["0",x.cashPossible?"0":blank,int(x.left)])
      +row("Soma nominal das futuras prestações",["Não se aplica",x.cashPossible?"Não se aplica":blank,money(x.futureNominal)])
      +'</tbody></table></div>'
      +'<p class="hint"><strong>Fotografia da data:</strong> os três cenários utilizam o mesmo capital inicial e os mesmos fluxos mensais disponíveis até o horizonte. Nos cenários sem consórcio, o fluxo equivalente à prestação de cada mês é aplicado; na alavancagem, esse valor paga somente a prestação efetiva, sem reinvestimento da diferença do lance. <strong>As parcelas futuras não são descontadas nem projetadas antes do horizonte.</strong> A soma nominal remanescente aparece apenas como informação, sem representar saldo devedor de quitação. Os ativos brutos não são patrimônios líquidos equivalentes.</p></div>';
  }
  function render(x) {
    const winner=x.best.name+" ("+money(x.best.value)+")";
    const note=x.cashPossible?"Todos os três cenários podem ser simulados com o capital inicial informado.":
      "A compra à vista não é viável com o capital informado: faltam "+money(x.shortfall)+" inicialmente.";
    return '<section class="pat-comparative" aria-label="Comparação de estratégias patrimoniais">'
      +'<div class="pat-summary-head"><div><span class="result-kicker">TRÊS CENÁRIOS • FOTOGRAFIA DO MESMO HORIZONTE</span>'
      +'<h3>Como estarão os ativos na data escolhida?</h3>'
      +'<p>Horizonte: '+int(x.horizon)+' meses. Aportes alternativos iguais às prestações efetivas, sem antecipar pagamentos futuros.</p></div>'
      +'<button type="button" class="pat-expand-btn" id="pat-expand" aria-pressed="false" title="Alternar largura do painel">Ampliar cenários</button></div>'
      +cards(x)
      +'<div class="pat-outcome"><strong>Maior valor de ativos brutos na data:</strong> '+esc(winner)
      +'<span>Não representa a melhor estratégia nem maior patrimônio líquido. Na alavancagem, há '+esc(int(x.left))
      +' prestações futuras estimadas, somando '+esc(money(x.futureNominal))+' nominais, fora desta fotografia. '+esc(note)+'</span></div>'
      +timeline(x)+comparison(x)
      +'<p class="pat-method-notice">A projeção apresenta apenas o estoque de ativos até o horizonte. As prestações pagas entram como fluxos de saída da renda no consórcio e como aportes alternativos nos demais cenários. Não se abatem nem antecipam pagamentos posteriores à data. Isso torna a visão temporal consistente, mas ativos brutos não são patrimônio líquido: considere separadamente as obrigações contratuais ainda existentes. Contemplação não é garantida; não são incluídos impostos, vacância, custos de aquisição ou reajustes.</p>'
      +'</section>';
  }

  window.PatrimonioComparador={run,render};
}());
