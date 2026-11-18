"use strict";
// Comparação com os mesmos recursos iniciais e sem novos aportes.
// Parcelas do consórcio são pagas com renda externa e descontadas como
// custo de oportunidade na posição ajustada, sem reter economia pós-lance.
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
    let monthOwnRent=0, rentLeverage=0, paidLever=0, paidLeverFV=0;
    let annual = [];

    function pvLater(month) {
      let pv=0;
      for(let t=month+1;t<=totalPostEnd;t++) {
        const due=t<=contemplacao?parcela:parcelaApos;
        pv+=due/Math.pow(1+r,t-month);
      }
      return pv;
    }
    function snapshot(month) {
      const pv=pvLater(month);
      return {
        month,
        invested:round(invested),
        cash:cashPossible?round(cashInvested+cashProperty):null,
        leverGross:round(leverInvested+leverProperty),
        leverAdj:round(leverInvested+leverProperty-pv-paidLeverFV),
        paidFV:round(paidLeverFV),
        futurePv:round(pv)
      };
    }
    for(let t=1;t<=horizonte;t++) {
      // O capital inicial é o único montante aplicado: sem aportes mensais.
      invested*=1+r;
      if(cashPossible) {
        cashInvested=cashInvested*(1+r)+aluguel;
        cashProperty*=1+propertyRate;
        monthOwnRent+=aluguel;
      }
      if(leverProperty>0) leverProperty*=1+propertyRate;
      const due=t<=contemplacao?parcela:t<=totalPostEnd?parcelaApos:0;
      paidLever+=due;
      // A prestação efetiva é paga pela renda externa.
      // O custo de oportunidade é acumulado para comparação no horizonte.
      paidLeverFV=paidLeverFV*(1+r)+due;
      leverInvested*=1+r;
      if(t===contemplacao) {
        if(leverInvested+0.005<capitalUtilizado) {
          throw Error("Na data hipotética da contemplação, o saldo aplicado não cobre lance e complemento. Ajuste capital, prazo ou taxas para evitar aporte adicional não previsto.");
        }
        leverInvested-=capitalUtilizado;
        leverProperty=preco;
      } else if(t>contemplacao) {
        leverInvested+=aluguel;
        rentLeverage+=aluguel;
      }
      if(t>=contemplacao && (t===contemplacao || t%12===0 || t===horizonte)) {
        const point=snapshot(t);
        if(!annual.length||annual[annual.length-1].month!==t) annual.push(point);
      }
    }
    const pvFuture=pvLater(horizonte);
    const left=Math.max(0,totalPostEnd-horizonte);
    const futureNominal=left*parcelaApos;
    const investment=round(invested);
    const cash=cashPossible?round(cashInvested+cashProperty):null;
    const gross=round(leverInvested+leverProperty);
    const adjustedAssets=round(gross-pvFuture);
    const adjusted=round(adjustedAssets-paidLeverFV);
    const scenarios=[
      {id:"invest",name:"Manter investido",value:investment,gross:investment,
        portfolio:round(invested),property:0,pv:0,possible:true,
        subtitle:"Somente o capital inicial aplicado, sem aportes adicionais"},
      {id:"cash",name:"Comprar à vista",value:cash,gross:cash,
        portfolio:cashPossible?round(cashInvested):null,
        property:cashPossible?round(cashProperty):null,pv:0,possible:cashPossible,
        subtitle:cashPossible?"Compra imediata do imóvel; excedentes seguem aplicados sem novos aportes"
          :"Faltam "+money(shortfall)+" para comprar o imóvel hoje"},
      {id:"lever",name:"Alavancagem",value:adjusted,gross,
        portfolio:round(leverInvested),property:round(leverProperty),
        pv:round(pvFuture),possible:true,
        paidFV:round(paidLeverFV),adjustedAssets,
        subtitle:"Imóvel e capital aplicado, deduzidos custos de parcelas e obrigações futuras"}
    ];
    const best=scenarios.filter(s=>s.possible).reduce((a,b)=>a.value>=b.value?a:b);
    return {
      scenarios,best,cashPossible,shortfall,
      r,propertyRate,paidLever:round(paidLever),paidLeverFV:round(paidLeverFV),rentLeverage:round(rentLeverage),
      monthOwnRent:round(monthOwnRent),
      left,futureNominal:round(futureNominal),pvFuture:round(pvFuture),
      gross,adjusted,adjustedAssets,investment,cash,annual,
      extraComparedToInvest:round(adjusted-investment),
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
          +'<small>'+(s.possible?'posição ajustada ao horizonte':'com capital inicial informado')+'</small></div>'
          +'<p>'+esc(s.subtitle)+'</p>'
          +(s.possible?'<div class="pat-scenario-details">'
            +'<div><span>Imóvel projetado</span><b>'+esc(money(s.property))+'</b></div>'
            +'<div><span>Aplicações projetadas</span><b>'+esc(money(s.portfolio))+'</b></div>'
            +'<div><span>Ativos brutos</span><b>'+esc(money(s.gross))+'</b></div>'
            +(s.id==="lever"?'<div><span>VP de prestações futuras</span><b>− '+esc(money(s.pv))+'</b></div>':'')
            +'</div>':'<div class="pat-cash-shortfall">Diferença para aquisição: <strong>'+esc(money(x.shortfall))+'</strong></div>')
          +'</article>';
      }).join("")+'</div>';
  }
  function timeline(x) {
    const cMax=Math.max(1,...x.annual.flatMap(p=>[p.invested,p.leverAdj,p.cash||0]));
    const ticks=[0,.25,.5,.75,1];
    const items=[["invest","Investimento","invested"],["cash","Compra à vista","cash"],["lever","Alavancagem ajustada","leverAdj"]];
    const w=760,h=270,L=80,R=16,T=17,B=41;
    const px=i=>L+(w-L-R)*i/Math.max(1,x.annual.length-1);
    const py=value=>T+(h-T-B)*(1-Math.max(0,value)/cMax);
    const lines=ticks.map(f=>{
      const y=py(cMax*f);
      return '<line x1="'+L+'" y1="'+y.toFixed(2)+'" x2="'+(w-R)+'" y2="'+y.toFixed(2)+'" class="pat-gridline"/>'
        +'<text x="'+(L-10)+'" y="'+(y+4).toFixed(2)+'" text-anchor="end" class="pat-chart-label">'+esc(int(cMax*f/1000))+' mil</text>';
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
      +'<div class="pat-chart-head"><h4>Evolução comparativa</h4><p>Valores dos ativos; na alavancagem, subtraímos o valor presente das prestações futuras estimadas.</p></div>'
      +'<div class="pat-chart-legend">'
      +items.filter(i=>i[0]!=="cash"||x.cashPossible).map(([id,name])=>'<span><i class="pat-legend pat-legend--'+id+'"></i>'+esc(name)+'</span>').join("")+'</div>'
      +'<div class="pat-chart-scroll"><svg class="pat-chart-svg" viewBox="0 0 '+w+' '+h+'" aria-label="Gráfico comparativo da evolução patrimonial" role="img">'
      +lines+monthLabels+paths+'</svg></div>'
      +'<p class="hint">O gráfico começa no mês hipotético de contemplação. Não considera risco, tributos, custos de aquisição ou reajuste de parcelas.</p>'
      +'</div>';
  }
  function comparison(x) {
    const row=(name,vals)=>'<tr><th scope="row">'+esc(name)+'</th>'+vals.map((v)=>
      '<td>'+esc(v)+'</td>').join("")+'</tr>';
    return '<div class="pat-comparison-table"><h4>Comparação financeira no mesmo horizonte</h4><div class="pat-table-scroll">'
      +'<table><thead><tr><th scope="col">Critério</th><th scope="col">Manter investido</th><th scope="col">Comprar à vista</th><th scope="col">Alavancagem</th></tr></thead><tbody>'
      +row("Capital próprio no início",[money(x.initialCapital),money(x.initialCapital),money(x.initialCapital)])
      +row("Aporte mensal disponível",[money(x.budget),money(x.budget),money(x.budget)])
      +row("Imóvel",[money(0),x.cashPossible?money(x.scenarios[1].property):"Não viável",money(x.scenarios[2].property)])
      +row("Aplicações",[money(x.scenarios[0].portfolio),x.cashPossible?money(x.scenarios[1].portfolio):blank,money(x.scenarios[2].portfolio)])
      +row("Ativos brutos",[money(x.scenarios[0].gross),x.cashPossible?money(x.scenarios[1].gross):blank,money(x.gross)])
      +row("VP das obrigações futuras",[money(0),x.cashPossible?money(0):blank,money(x.pvFuture)])
      +row("Posição ajustada",[money(x.investment),x.cashPossible?money(x.cash):blank,money(x.adjusted)])
      +'</tbody></table></div>'
      +'<p class="hint"><strong>Critério comum:</strong> mesmo capital inicial e capacidade mensal igual à maior parcela do consórcio ('+esc(money(x.budget))+'). Em cada estratégia, o valor mensal não utilizado é investido; aluguel informado é reinvestido quando há imóvel. Na alavancagem, o resultado é deduzido do <em>valor presente dos pagamentos futuros</em>, descontado pela taxa hipotética dos investimentos. Esse valor presente não é o saldo devedor para quitação.</p></div>';
  }
  function render(x) {
    const winner=x.best.name+" ("+money(x.best.value)+")";
    const note=x.cashPossible?"Todos os três cenários são financeiramente executáveis na hipótese inicial.":
      "A compra à vista não é executável com o capital informado; exige mais "+money(x.shortfall)+" inicialmente.";
    return '<section class="pat-comparative" aria-label="Comparação de estratégias patrimoniais">'
      +'<div class="pat-summary-head"><div><span class="result-kicker">TRÊS CENÁRIOS • MESMO CAPITAL E APORTE MENSAL</span>'
      +'<h3>Qual caminho gera maior posição econômica projetada?</h3>'
      +'<p>Horizonte de '+int(x.horizon)+' meses. Resultado condicionado às taxas editáveis, aos aportes e à contemplação hipotética.</p></div>'
      +'<button type="button" class="pat-expand-btn" id="pat-expand" aria-pressed="false" title="Alternar largura do painel">Ampliar cenários</button></div>'
      +cards(x)
      +'<div class="pat-outcome"><strong>Maior valor ajustado neste cenário:</strong> '+esc(winner)
      +'<span>'+esc(note)+'</span></div>'
      +timeline(x)+comparison(x)
      +'<p class="pat-method-notice">A posição ajustada é um indicador econômico sob hipóteses e não corresponde necessariamente ao patrimônio líquido ou à rentabilidade efetiva. A comparação pressupõe renda mensal suficiente para manter o mesmo aporte nos três caminhos. Não inclui custos, impostos, vacância, reajustes contratuais ou risco de não contemplação.</p>'
      +'</section>';
  }

  window.PatrimonioComparador={run,render};
}());
