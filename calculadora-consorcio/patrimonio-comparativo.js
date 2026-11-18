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
      prazoApos,contemplacao,horizonte,valorizacao,rendimento,aluguel,
      reajusteConsorcio,reajusteAluguel} = d;
    if (![rendimento,valorizacao,reajusteConsorcio,reajusteAluguel]
      .every(x=>Number.isFinite(x)&&x>-100&&x<=100)) throw Error("Revise os quatro percentuais de projeção.");
    const r=Math.pow(1+rendimento/100,1/12)-1;
    const propertyRate=Math.pow(1+valorizacao/100,1/12)-1;
    const indexInstallment=1+reajusteConsorcio/100;
    const indexRent=1+reajusteAluguel/100;
    const cashPossible=capital+0.005>=preco;
    const shortfall=Math.max(0,preco-capital);
    const totalPostEnd=contemplacao+prazoApos;
    const payable=(t)=>{
      if(t<1||t>totalPostEnd)return 0;
      const original=t<=contemplacao?parcela:parcelaApos;
      // Reajuste anual na assinatura, em meses 13, 25, 37...
      return original*Math.pow(indexInstallment,Math.floor((t-1)/12));
    };
    const rentAt=(t,start)=>{
      if(!(aluguel>0)||t<start)return 0;
      // Primeiro reajuste após completar 12 meses de locação.
      return aluguel*Math.pow(indexRent,Math.floor((t-start)/12));
    };
    let invested=capital;
    let cashInvested=cashPossible?capital-preco:null;
    let cashProperty=cashPossible?preco:null;
    let leverInvested=capital,leverProperty=0;
    let apport=0,paidLever=0,rentReceivedLeverage=0,rentReceivedCash=0;
    let rentCovered=0,rentSurplus=0,ownOutlay=0;
    const annual=[];
    let lastOutlay=0,lastRent=0,lastDue=0;
    function snapshot(month){
      return {
        month,
        invested:round(invested),
        cash:cashPossible?round(cashInvested+cashProperty):null,
        leverGross:round(leverInvested+leverProperty),
        leverAdj:round(leverInvested+leverProperty),
        installment:round(lastDue),
        rent:round(lastRent),
        outlay:round(lastOutlay)
      };
    }
    for(let t=1;t<=horizonte;t++){
      const due=payable(t);
      const rentLever=t>contemplacao?rentAt(t,contemplacao+1):0;
      const rentCash=cashPossible?rentAt(t,1):0;
      const covered=Math.min(due,rentLever);
      const outlay=Math.max(0,due-rentLever);
      const surplus=Math.max(0,rentLever-due);
      // Sem consórcio: a parcela efetiva não paga do próprio bolso é aplicada.
      invested=invested*(1+r)+outlay;
      if(cashPossible){
        cashInvested=cashInvested*(1+r)+outlay+rentCash;
        cashProperty*=1+propertyRate;
        rentReceivedCash+=rentCash;
      }
      // Consórcio: aluguel quita a prestação; somente a sobra é aplicada.
      leverInvested=leverInvested*(1+r);
      if(leverProperty>0) leverProperty*=1+propertyRate;
      if(t===contemplacao){
        if(leverInvested+0.005<capitalUtilizado)
          throw Error("Na contemplação hipotética, o capital aplicado não cobre lance e complemento do imóvel.");
        leverInvested-=capitalUtilizado;
        leverProperty=preco;
      }
      leverInvested+=surplus;
      apport+=outlay;
      paidLever+=due;
      rentReceivedLeverage+=rentLever;
      rentCovered+=covered;
      rentSurplus+=surplus;
      ownOutlay+=outlay;
      lastOutlay=outlay;lastRent=rentLever;lastDue=due;
      if(t===1||t===contemplacao||t%12===0||t===horizonte){
        const point=snapshot(t);
        if(!annual.length||annual[annual.length-1].month!==t) annual.push(point);
      }
    }
    const left=Math.max(0,totalPostEnd-horizonte);
    const installmentAtH=payable(horizonte);
    const installmentNext=payable(horizonte+1);
    const futureNominalFlat=left*installmentAtH;
    const investment=round(invested);
    const cash=cashPossible?round(cashInvested+cashProperty):null;
    const gross=round(leverInvested+leverProperty);
    const scenarios=[
      {id:"invest",name:"Manter investido",value:investment,gross:investment,
        portfolio:round(invested),property:0,possible:true,
        subtitle:"Capital e aportes mensais apenas do desembolso próprio necessário"},
      {id:"cash",name:"Comprar à vista",value:cash,gross:cash,
        portfolio:cashPossible?round(cashInvested):null,
        property:cashPossible?round(cashProperty):null,possible:cashPossible,
        subtitle:cashPossible?"Imóvel, aluguel reinvestido e aportes pessoais equivalentes"
          :"Faltam "+money(shortfall)+" para adquirir o imóvel à vista"},
      {id:"lever",name:"Alavancagem",value:gross,gross,
        portfolio:round(leverInvested),property:round(leverProperty),possible:true,
        subtitle:"Aluguel abate a prestação; somente a sobra da renda locatícia é aplicada"}
    ];
    const best=scenarios.filter(s=>s.possible).reduce((a,b)=>a.value>=b.value?a:b);
    return {
      scenarios,best,cashPossible,shortfall,
      r,propertyRate,reajusteConsorcio,reajusteAluguel,rendimento,valorizacao,
      paidLever:round(paidLever),aportesAlternativos:round(apport),
      rentReceivedLeverage:round(rentReceivedLeverage),rentReceivedCash:round(rentReceivedCash),
      rentCovered:round(rentCovered),rentSurplus:round(rentSurplus),ownOutlay:round(ownOutlay),
      lastRent:round(lastRent),lastOutlay:round(lastOutlay),lastDue:round(lastDue),
      left,futureNominal:round(futureNominalFlat),installmentAtH:round(installmentAtH),
      installmentNext:round(installmentNext),
      // Apenas referência ao valor de H: NÃO projeta futuras correções pelo INCC.
      gross,adjusted:gross,investment,cash,annual,
      extraComparedToInvest:round(gross-investment),
      propertyPrice:preco,capitalInvestido,
      horizon:horizonte,contemplacao,initialCapital:capital,
      parcelaInicial:parcela,parcelaPosLance:parcelaApos,aluguelInicial:aluguel
    };
  }

  function metric(label,number,sub) {
    return '<div class="pat-smallmetric"><span>'+esc(label)+'</span><strong>'+esc(number)+'</strong>'
      +(sub?'<small>'+esc(sub)+'</small>':'')+'</div>';
  }
  function cards(x) {
    return '<div class="pat-scenario-grid">'
      +x.scenarios.map((s,i)=>{
        const mark=["01","02","03"][i];
        return '<article class="pat-scenario pat-scenario--'+s.id+'">'
          +'<div class="pat-scenario-heading"><span>'+mark+'</span><h4>'+esc(s.name)+'</h4></div>'
          +'<div class="pat-scenario-value">'+(s.possible?esc(money(s.value)):"Não viável")
          +'<small>'+(s.possible?'ativos brutos no horizonte escolhido':'capital próprio insuficiente')+'</small></div>'
          +'<p>'+esc(s.subtitle)+'</p>'
          +(s.possible?'<div class="pat-scenario-details">'
            +'<div><span>Imóvel valorizado</span><b>'+esc(money(s.property))+'</b></div>'
            +'<div><span>Aplicações financeiras</span><b>'+esc(money(s.portfolio))+'</b></div>'
            +'<div><span>Aportes pessoais até a data</span><b>'+esc(money(s.id==="lever"?0:x.aportesAlternativos))+'</b></div>'
            +(s.id==="lever"?'<div><span>Aluguel usado nas prestações</span><b>'+esc(money(x.rentCovered))+'</b></div>'
              +'<div><span>Sobra de aluguel aplicada</span><b>'+esc(money(x.rentSurplus))+'</b></div>':'')
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
      +'<div class="pat-chart-head"><h4>Evolução dos ativos até a data escolhida</h4><p>Aportes alternativos equivalem apenas ao desembolso próprio nas prestações após o aluguel. Não projetamos valores posteriores ao horizonte.</p></div>'
      +'<div class="pat-chart-legend">'
      +items.filter(i=>i[0]!=="cash"||x.cashPossible).map(([id,name])=>'<span><i class="pat-legend pat-legend--'+id+'"></i>'+esc(name)+'</span>').join("")+'</div>'
      +'<div class="pat-chart-scroll"><svg class="pat-chart-svg" viewBox="0 0 '+w+' '+h+'" aria-label="Gráfico comparativo da evolução patrimonial" role="img">'
      +lines+monthLabels+paths+'</svg></div>'
      +'<p class="hint">O gráfico começa no mês 1. Cada linha mostra ativos brutos, não patrimônio líquido. A contemplação permanece hipotética; custos de aquisição, impostos e reajustes não estão incluídos.</p>'
      +'</div>';
  }
  function comparison(x) {
    const row=(name,vals)=>'<tr><th scope="row">'+esc(name)+'</th>'
      +vals.map(v=>'<td>'+esc(v)+'</td>').join("")+'</tr>';
    const n=x.cashPossible;
    return '<div class="pat-comparison-table"><h4>Fluxos até a data escolhida</h4>'
      +'<div class="pat-table-scroll"><table><thead><tr><th scope="col">Critério</th>'
      +'<th scope="col">Manter investido</th><th scope="col">Comprar à vista</th>'
      +'<th scope="col">Alavancagem</th></tr></thead><tbody>'
      +row("Capital próprio inicial",[money(x.initialCapital),money(x.initialCapital),money(x.initialCapital)])
      +row("Rendimento das aplicações (90% CDI)",[x.rendimento.toFixed(2)+"% a.a.",n?x.rendimento.toFixed(2)+"% a.a.":"—",x.rendimento.toFixed(2)+"% a.a."])
      +row("Valorização do imóvel (IGMI-R)",["—",n?x.valorizacao.toFixed(2)+"% a.a.":"—",x.valorizacao.toFixed(2)+"% a.a."])
      +row("Reajuste anual das prestações (INCC-M)",["Base dos aportes",n?"Base dos aportes":"—",x.reajusteConsorcio.toFixed(2)+"% a.a."])
      +row("Reajuste anual de aluguel (IGP-M)",["—",n?x.reajusteAluguel.toFixed(2)+"% a.a.":"—",x.reajusteAluguel.toFixed(2)+"% a.a."])
      +row("Parcela base antes da contemplação",["—","—",money(x.parcelaInicial)])
      +row("Parcela base após lance",["—","—",money(x.parcelaPosLance)])
      +row("Parcela no último mês da fotografia",["—","—",money(x.lastDue)])
      +row("Aluguel inicial informado",["—",n?money(x.aluguelInicial):"—",money(x.aluguelInicial)])
      +row("Aluguel recebido no mês final",["—",n?money(x.aluguelInicial*Math.pow(1+x.reajusteAluguel/100,Math.floor((x.horizon-1)/12))):"—",money(x.lastRent)])
      +row("Receita de aluguel acumulada",["—",n?money(x.rentReceivedCash):"—",money(x.rentReceivedLeverage)])
      +row("Aluguel usado no pagamento de prestações",["—","—",money(x.rentCovered)])
      +row("Dinheiro próprio usado nas prestações",["—","—",money(x.ownOutlay)])
      +row("Aportes equivalentes até o horizonte",[money(x.aportesAlternativos),n?money(x.aportesAlternativos):"—",money(0)])
      +row("Sobra do aluguel investida",["—",n?"Aluguel integral aplicado":"—",money(x.rentSurplus)])
      +row("Prestações efetivamente pagas",["—","—",money(x.paidLever)])
      +row("Imóvel na data",[money(0),n?money(x.scenarios[1].property):"Não viável",money(x.scenarios[2].property)])
      +row("Aplicações na data",[money(x.scenarios[0].portfolio),n?money(x.scenarios[1].portfolio):"—",money(x.scenarios[2].portfolio)])
      +row("Ativos brutos na data",[money(x.investment),n?money(x.cash):"—",money(x.gross)])
      +row("Prestações restantes após a data",["—","—",int(x.left)])
      +row("Valor nominal da parcela vigente no horizonte",["—","—",money(x.installmentAtH)])
      +row("Soma restante se parcelas ficassem congeladas",["—","—",money(x.futureNominal)])
      +'</tbody></table></div>'
      +'<p class="hint"><strong>Metodologia:</strong> o aluguel da alavancagem abate primeiro a prestação reajustada pelo INCC-M; só o desembolso que sobra do próprio bolso torna-se aporte nos cenários de investimento e compra à vista. A sobra positiva de aluguel é aplicada na alavancagem. Na compra à vista, toda receita de aluguel é aplicada, além do aporte próprio equivalente. O IGP-M reajusta o aluguel a cada 12 meses de locação, e o INCC-M reajusta a parcela a cada 12 meses da contratação. Nenhuma obrigação posterior ao mês selecionado é abatida dos ativos.</p></div>';
  }
  function render(x) {
    const winner=x.best.name+" ("+money(x.best.value)+")";
    const note=x.cashPossible?"Os três cenários são possíveis com o capital inicial informado.":
      "Compra à vista inviável com o capital informado: faltam "+money(x.shortfall)+".";
    return '<section class="pat-comparative" aria-label="Comparação de estratégias patrimoniais">'
      +'<div class="pat-summary-head"><div><span class="result-kicker">TRÊS CENÁRIOS • FOTOGRAFIA DO MÊS '+int(x.horizon)+'</span>'
      +'<h3>Qual será o estoque de ativos na data escolhida?</h3>'
      +'<p>90% CDI para investir, IGMI-R para o imóvel, INCC-M nas parcelas e IGP-M para reajustar o aluguel. Todas as taxas são editáveis.</p></div>'
      +'<button type="button" class="pat-expand-btn" id="pat-expand" aria-pressed="false" title="Ampliar resultado para tela inteira">Expandir tela inteira</button></div>'
      +cards(x)
      +'<div class="pat-outcome"><strong>Maior estoque de ativos brutos nesta data:</strong> '+esc(winner)
      +'<span>Essa classificação NÃO mede patrimônio líquido ou o resultado da quitação. Na alavancagem restam '+esc(int(x.left))
      +' prestações; se congeladas no valor vigente de '+esc(money(x.installmentAtH))
      +', somariam '+esc(money(x.futureNominal))+' (apenas informação, sem desconto). '+esc(note)+'</span></div>'
      +timeline(x)+comparison(x)
      +'<p class="pat-method-notice">Simulação hipotética. O aluguel reduz a prestação efetivamente desembolsada; o que o cliente não precisa pagar do próprio bolso não se transforma em aporte. Prestações e aluguéis sofrem ajustes anuais pelos índices informados; valorização e investimentos usam taxas anuais convertidas para base mensal. Os dados históricos não são previsão. Não inclui IR, vacância, aquisição, manutenção e regras específicas de reajuste/lance. Os ativos são brutos e as obrigações posteriores à fotografia continuam existindo.</p>'
      +'</section>';
  }

  window.PatrimonioComparador={run,render};
}());
