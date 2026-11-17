"use strict";
(function () {
  const $ = (id) => document.getElementById(id);
  const money = (value) => Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const pct = (value) => Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
  const numberBR = (value) => Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
  const examplesUsed = { comparar: false, lances: false, propostas: false };
  let lastAnalysis = null;

  function parseValue(value) {
    let text = String(value == null ? "" : value).trim().replace(/\s|R\$|%/g, "");
    if (!text) return NaN;
    if (text.includes(",") && text.includes(".")) {
      const comma = text.lastIndexOf(",");
      const dot = text.lastIndexOf(".");
      text = comma > dot ? text.replace(/\./g, "").replace(",", ".") : text.replace(/,/g, "");
    } else if (text.includes(",")) {
      text = text.replace(",", ".");
    } else if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
      text = text.replace(/\./g, "");
    }
    if (!/^-?\d+(\.\d+)?$/.test(text)) return NaN;
    return Number(text);
  }
  function read(id, required) {
    const field = $(id);
    if (!field) throw Error("Campo não encontrado: " + id);
    const raw = field.value.trim();
    if (!raw && !required) return 0;
    const value = parseValue(raw);
    if (!Number.isFinite(value) || value < 0) {
      throw Error("Informe um valor válido e não negativo em: " + field.closest("label").childNodes[0].textContent.trim() + ".");
    }
    return value;
  }
  function integer(id, required) {
    const value = read(id, required);
    if (!Number.isInteger(value) || value < 1 || value > 600) {
      throw Error("Informe uma quantidade de meses inteira entre 1 e 600.");
    }
    return value;
  }
  function positive(v, text) {
    if (!Number.isFinite(v) || v <= 0) throw Error("Informe " + text + " maior que zero.");
  }
  function escapeHtml(v) {
    return String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }
  function resultMetrics(items) {
    return '<div class="metrics">' + items.map((item) => '<div class="metric"><span>' + escapeHtml(item[0]) + '</span><strong>' + escapeHtml(String(item[1])) + '</strong></div>').join("") + '</div>';
  }
  function note(text, warn) {
    return '<div class="callout' + (warn ? ' warn' : '') + '">' + escapeHtml(text) + '</div>';
  }
  function table(headers, rows) {
    const header = '<thead><tr>' + headers.map((x) => '<th>' + escapeHtml(x) + '</th>').join("") + '</tr></thead>';
    const body = rows.map((row) => '<tr>' + row.map((x) => '<td>' + escapeHtml(String(x)) + '</td>').join("") + '</tr>').join("");
    return '<table class="compare-table">' + header + '<tbody>' + body + '</tbody></table>';
  }
  function updateResult(target, heading, main, sub, metrics, sections, notices) {
    $(target).innerHTML = '<div class="result-top"><span class="result-kicker">RESULTADO DA ANÁLISE</span><span class="status-pill">Cálculo orientativo</span></div>'
      + '<div class="hero-number">' + escapeHtml(main) + '<small>' + escapeHtml(heading) + '</small></div>'
      + '<p class="result-copy">' + escapeHtml(sub) + '</p>' + resultMetrics(metrics)
      + sections.join("") + notices.map((x) => note(x.text, x.warn)).join("")
      + '<div class="result-actions"><button type="button" class="to-offer">Gerar proposta com esta análise →</button></div>';
  }
  function setError(id, error) { $(id).textContent = error ? String(error.message || error) : ""; }
  function showTab(id) {
    document.querySelectorAll(".tab").forEach((button) => {
      const selected = button.dataset.tab === id;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    document.querySelectorAll(".panel").forEach((panel) => {
      const selected = panel.id === "painel-" + id;
      panel.classList.toggle("active", selected);
      panel.hidden = !selected;
    });
    if (id === "oferta") renderOffer();
    const heading = $("painel-" + id).querySelector("h2");
    if (heading) heading.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function totalComReajuste(parcela, meses, anual) {
    if (anual === 0) return parcela * meses;
    let total = 0;
    const base = 1 + anual / 100;
    for (let m = 1; m <= meses; m++) total += parcela * Math.pow(base, Math.floor((m - 1) / 12));
    return total;
  }
  function setAnalysis(kind, rows, warnings) {
    lastAnalysis = { kind, rows, warnings, example: !!examplesUsed[kind] };
    renderOffer();
  }
  function explain(sectionTitle, contents) {
    return '<div class="result-section"><h4>' + escapeHtml(sectionTitle) + '</h4>' + contents + '</div>';
  }

  function roundCents(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  // A prestação financiada é calculada exclusivamente com a taxa mensal fornecida.
  // Tributos e despesas só entram quando informados e com sua forma de pagamento indicada.
  function calculateFinancing(principal, months, ratePercent, system) {
    if (!(principal > 0)) throw Error("O valor a financiar precisa ser maior que zero.");
    const rate = ratePercent / 100;
    let first = 0, last = 0, installmentsTotal = 0;
    if (rate === 0 && (system === "price" || system === "sac")) {
      // No último vencimento, ajustar os centavos acumulados: sem juros
      // o desembolso total precisa coincidir exatamente com o principal.
      first = roundCents(principal / months);
      last = roundCents(principal - first * (months - 1));
      installmentsTotal = roundCents(principal);
    } else if (system === "price") {
      const payment = roundCents(principal * rate / (-Math.expm1(-months * Math.log1p(rate))));
      first = last = payment;
      installmentsTotal = roundCents(payment * months);
    } else if (system === "sac") {
      const monthlyAmortization = principal / months;
      for (let month = 1; month <= months; month++) {
        const balanceBefore = principal - monthlyAmortization * (month - 1);
        const payment = roundCents(monthlyAmortization + balanceBefore * rate);
        if (month === 1) first = payment;
        if (month === months) last = payment;
        installmentsTotal += payment;
      }
      installmentsTotal = roundCents(installmentsTotal);
    } else {
      throw Error("Sistema de amortização inválido.");
    }
    return {
      principal, first, last, installmentsTotal,
      interestTotal: roundCents(installmentsTotal - principal),
      system
    };
  }

  function technicalComparison(data, extraWarnings) {
    const d=data.comparisonData;
    const roundPct=(x)=>Number(x).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})+"%";
    const scale=Math.max(d.consTotal,d.finTotal,d.referenceValue,1);
    const width=(amount)=>Math.max(2,Math.min(100,amount/scale*100)).toFixed(2)+"%";
    const nominalWinner=d.comparable
      ? (Math.abs(d.consTotal-d.finTotal)<.01?"Desembolsos nominais equivalentes":
          "Menor desembolso nominal: "+(d.consTotal<d.finTotal?"consórcio":"financiamento"))
      : "Análise parcial — lance sem amortização validada";
    const consPayment=d.monthlyPost!==null
      ? money(d.monthlyPost)+" <span class='technical-muted'>após o lance"+(d.monthlyPostInferred?" · estimativa":"")+"</span>"
      : money(d.monthlyCons)+" <span class='technical-muted'>parcela inicial</span>";
    const financePayment=money(d.finFirst)+(d.finSystem==="sac"
      ?" <span class='technical-muted'>primeira (última "+escapeHtml(money(d.finLast))+")</span>"
      :" <span class='technical-muted'>mensal"+(d.finFirst!==d.finLast?" (última ajustada)":"")+"</span>");
    const technicalRows=[
      ["Taxas informadas / juros do financiamento",roundPct(d.consFeesPct)+" (administração + reserva)",roundPct(d.finMonthlyRate)+" a.m. · "+roundPct(d.finAnnualEffective)+" a.a. efetivos"],
      ["Parcela inicial",money(d.monthlyCons),money(d.finFirst)],
      ["Parcela pós-lance / final",d.monthlyPost===null?"Não informada":money(d.monthlyPost)+(d.monthlyPostInferred?" (estimada)":""),money(d.finLast)],
      ["Prestações",d.consTerm+" meses",d.finTerm+" meses"],
      ["Recursos próprios no início",money(d.consOwn),money(d.finEntry)],
      ["Crédito líquido / principal",money(d.consLiquid),money(d.finPrincipal)],
      ["Complemento para compra / custos à vista",money(d.consComplement),money(d.finExternal)],
      ["Custo de juros", "Não há juros remuneratórios; há taxas contratuais",money(d.finInterest)],
      ["IOF estimado", "Não calculado",money(d.finIof)],
      ["Custos/seguro no financiamento","—",money(d.finFees)+" tarifas; "+money(d.finInsuranceTotal)+" seguros"],
      ["Total nominal",money(d.consTotal),money(d.finTotal)],
      ["Diferença sobre preço de referência",money(d.consPriceGap),money(d.finPriceGap)]
    ];
    const insights=[];
    const monthlyGap=Math.abs(d.finFirst-d.monthlyCons);
    if(monthlyGap<.01)insights.push("A primeira prestação é equivalente nas duas modalidades, antes de possíveis mudanças contratuais.");
    else insights.push("Na primeira prestação, o "+(d.finFirst>d.monthlyCons?"financiamento":"consórcio")+
      " exige "+money(monthlyGap)+" a mais. No SAC, a prestação normalmente diminui ao longo do prazo.");
    const deltaMonths=Math.abs(d.consTerm-d.finTerm);
    insights.push("Prazo: "+d.consTerm+" meses no consórcio e "+d.finTerm+" no financiamento"+
      (deltaMonths?" — diferença de "+deltaMonths+" meses.":" — mesma duração informada."));
    insights.push("No financiamento, os juros estimados somam "+money(d.finInterest)+
      ", além de IOF de "+money(d.finIof)+". O consórcio cobra administração e demais encargos dentro das parcelas informadas.");
    if(d.monthlyPost!==null)
      insights.push("Após o lance, a prestação do consórcio foi considerada em "+money(d.monthlyPost)+
        " durante "+d.postCount+" prestações"+(d.monthlyPostInferred?" (valor calculado por hipótese, não homologado).":"."));
    if(d.consReaj>0)
      insights.push("O consórcio inclui hipótese de reajuste de "+roundPct(d.consReaj)+
        " ao ano. O modelo não reproduz integralmente reajustes do saldo imobiliário ou as datas reais das assembleias.");
    if(d.comparable)
      insights.push("Diferença de desembolso: "+money(d.difference)+
        " ("+roundPct(d.costDiffPercentOfFin)+" do total projetado do financiamento)."+
        " Isso não representa economia a valor presente, nem vantagem assegurada pela contemplação.");
    else
      insights.push("Com lance e prazo pós-lance desconhecido, o custo do consórcio está incompleto. A diferença exibida não define qual alternativa custa menos.");
    insights.push("Acesso ao bem: financiamento após contratação e aprovação; consórcio apenas após contemplação e liberação. Mês "+d.monthContemplation+" é cenário hipotético.");
    const cards='<div class="technical-cards">'+
      '<section class="technical-card"><div class="technical-card-title">Consórcio <span>Fluxo projetado</span></div>'+
        '<div class="technical-main">'+escapeHtml(money(d.consTotal))+'</div>'+
        '<div class="technical-line"><span>Prestação</span><strong>'+consPayment+'</strong></div>'+
        '<div class="technical-line"><span>Prazo</span><strong>'+d.consTerm+' meses</strong></div>'+
        '<div class="technical-line"><span>Capital próprio</span><strong>'+escapeHtml(money(d.consOwn))+'</strong></div>'+
        '<div class="technical-line"><span>Acima do valor de referência</span><strong>'+escapeHtml(money(d.consPriceGap))+'</strong></div>'+
      '</section>'+
      '<section class="technical-card"><div class="technical-card-title">Financiamento <span>'+escapeHtml(d.finSystem==="sac"?"SAC":"Price")+'</span></div>'+
        '<div class="technical-main">'+escapeHtml(money(d.finTotal))+'</div>'+
        '<div class="technical-line"><span>Prestação</span><strong>'+financePayment+'</strong></div>'+
        '<div class="technical-line"><span>Prazo</span><strong>'+d.finTerm+' meses</strong></div>'+
        '<div class="technical-line"><span>Entrada</span><strong>'+escapeHtml(money(d.finEntry))+'</strong></div>'+
        '<div class="technical-line"><span>Juros estimados</span><strong>'+escapeHtml(money(d.finInterest))+'</strong></div>'+
      '</section></div>';
    const chart='<div class="technical-chart">'+
      '<div class="technical-chart-head"><h4>Desembolso nominal projetado</h4><p>Escala comum; valores não trazidos a valor presente.</p></div>'+
      '<div class="technical-bar-row"><span>Consórcio'+(d.comparable?"":" *")+'</span><div class="technical-bar-track"><div class="technical-bar cons" style="width:'+width(d.consTotal)+'"></div></div><strong>'+escapeHtml(money(d.consTotal))+'</strong></div>'+
      '<div class="technical-bar-row"><span>Financiamento</span><div class="technical-bar-track"><div class="technical-bar fin" style="width:'+width(d.finTotal)+'"></div></div><strong>'+escapeHtml(money(d.finTotal))+'</strong></div>'+
      (!d.comparable?'<p class="technical-footnote">* Estimativa parcial sem cronograma validado de amortização do lance.</p>':'')+
      '<div class="technical-chart-head technical-installments"><h4>Primeira prestação</h4><p>O SAC inicia com parcela maior e decrescente; os valores futuros podem mudar.</p></div>'+
      '<div class="technical-bar-row"><span>Consórcio</span><div class="technical-bar-track"><div class="technical-bar cons" style="width:'+((d.monthlyCons/Math.max(d.monthlyCons,d.finFirst,1))*100).toFixed(2)+'%"></div></div><strong>'+escapeHtml(money(d.monthlyCons))+'</strong></div>'+
      '<div class="technical-bar-row"><span>Financiamento</span><div class="technical-bar-track"><div class="technical-bar fin" style="width:'+((d.finFirst/Math.max(d.monthlyCons,d.finFirst,1))*100).toFixed(2)+'%"></div></div><strong>'+escapeHtml(money(d.finFirst))+'</strong></div>'+
      '</div>';
    const analyzed=insights.map(x=>'<li>'+escapeHtml(x)+'</li>').join("");
    const notices=extraWarnings.map(x=>note(x,true)).join("");
    return '<div class="technical-dashboard">'+
      '<div class="result-top"><span class="result-kicker">ANÁLISE FINANCEIRA COMPARATIVA</span><span class="status-pill">Estimativa matemática</span></div>'+
      '<div class="technical-verdict"><span class="technical-flag">'+escapeHtml(nominalWinner)+'</span>'+
       '<div class="hero-number">'+escapeHtml(data.main)+'<small>'+escapeHtml(data.heading)+'</small></div>'+
       '<p class="result-copy">Comparação do desembolso e das prestações com as condições informadas. Não é CET nem cálculo de valor presente.</p></div>'+
      cards+chart+
      '<div class="technical-section"><h4>Indicadores lado a lado</h4>'+table(["Indicador","Consórcio","Financiamento"],technicalRows)+'</div>'+
      '<div class="technical-section"><h4>Leitura técnica do cenário</h4><ol class="technical-insights">'+analyzed+'</ol></div>'+
      '<details class="technical-disclosure"><summary>Memória de cálculo e premissas</summary>'+
        '<div class="technical-section">'+table(["Composição do consórcio","Valor"],data.consortiumDetails)+'</div>'+
        '<div class="technical-section">'+table(["Composição do financiamento","Valor"],data.details)+'</div>'+
      '</details>'+
      '<div class="technical-section"><h4>Ressalvas contratuais e da simulação</h4>'+notices+'</div>'+
      '<div class="result-actions"><button type="button" class="to-offer">Gerar proposta com esta análise →</button></div>'+
    '</div>';
  }

  function compare() {
    const engine = window.ConsorcioCompareV2;
    if (!engine) throw Error("O módulo de cálculo comparativo não foi carregado. Recarregue a página.");
    const data = engine.calculate();
    const warnings=data.warnings.slice();
    if(examplesUsed.comparar)warnings.push("EXEMPLO ILUSTRATIVO: valores demonstrativos. Não encaminhar como oferta real.");
    $("resultado-comparar").innerHTML=technicalComparison(data,warnings);
    setAnalysis("comparar",data.rows,warnings);
  }

    function bids() {
    const carta = read("l-carta", true), bem = read("l-bem");
    const proprio = read("l-proprio"), embutido = read("l-embutido");
    const limite = read("l-limite", true);
    const modo = $("l-modo").value;
    const parcela = read("l-parcela");
    const restantesRaw = $("l-restantes").value.trim();
    const restantes = restantesRaw ? integer("l-restantes", true) : 0;
    positive(carta, "o crédito da carta");
    if (limite > 100) throw Error("O limite do lance embutido não pode ultrapassar 100%.");
    if (embutido > carta * limite / 100 + .005) throw Error("O lance embutido excede " + pct(limite) + " da carta. Ajuste os valores segundo a regra do grupo.");
    if ((parcela > 0) !== (restantes > 0) && modo === "parcela") throw Error("Para estimar a nova prestação, informe tanto a parcela atual quanto as prestações sujeitas ao abatimento.");
    const totalLance = proprio + embutido;
    const creditoLiquido = carta - embutido;
    const diferencaBem = Math.max(0, bem - creditoLiquido);
    const excesso = bem > 0 ? Math.max(0, creditoLiquido - bem) : 0;
    const nova = modo === "parcela" && parcela > 0 && restantes > 0 ? parcela - totalLance / restantes : null;
    if (nova != null && nova <= 0) throw Error("O lance supera o valor que seria amortizado pelas prestações informadas. Confira o saldo amortizável e as regras do grupo.");
    const notices = [
      { text: "O lance próprio sai do caixa do cliente; o embutido é deduzido da carta. Os custos contratuais não são automaticamente recalculados sobre o crédito líquido.", warn: false },
      { text: "O lance só produz os efeitos indicados caso seja vencedor e pago, conforme o regulamento e a data da assembleia. Não é garantia de contemplação.", warn: true }
    ];
    if (modo === "prazo") notices.push({ text: "A redução de prazo depende do cronograma de quitação das últimas parcelas e do saldo devedor. Não há um número de meses confiável sem essas informações.", warn: true });
    else if (nova != null) notices.push({ text: "Nova prestação estimada pela hipótese: parcela atual − (lance total ÷ " + restantes + " prestações). É necessário confirmar essa regra no grupo; não projetamos reajustes.", warn: true });
    else notices.push({ text: "Para estimar a redução da prestação, informe a parcela atual e a quantidade validada de prestações elegíveis. Nenhum divisor padrão foi presumido.", warn: true });
    if (excesso > 0) notices.push({ text: "A carta supera o valor do bem em " + money(excesso) + ". A destinação desse saldo depende do contrato.", warn: true });
    if (examplesUsed.lances) notices.push({ text: "EXEMPLO ILUSTRATIVO. Confira condições reais antes de compartilhar.", warn: true });
    const metrics = [
      ["Capital próprio", money(proprio)],
      ["Lance embutido", money(embutido)],
      ["Lance total", money(totalLance) + " (" + pct(totalLance / carta * 100) + ")"],
      ["Complemento para compra", bem > 0 ? money(diferencaBem) : "Informe o valor do bem"]
    ];
    if (nova != null) metrics.push(["Nova parcela hipotética", money(nova)]);
    updateResult("resultado-lances", "crédito restante para adquirir o bem", money(creditoLiquido),
      "O lance total foi de " + pct(totalLance / carta * 100) + " da carta, mas somente o componente embutido reduz o crédito para a compra.",
      metrics, [explain("Composição de recursos", table(["Componente", "Valor"], [
        ["Carta original", money(carta)],
        ["Dedução embutida", "− " + money(embutido)],
        ["Crédito utilizável", money(creditoLiquido)],
        ["Dinheiro próprio para o lance", money(proprio)]
      ]))], notices);
    setAnalysis("lances", [
      ["Carta vigente", money(carta)],
      ["Lance com capital próprio", money(proprio)],
      ["Lance embutido", money(embutido)],
      ["Lance total", money(totalLance) + " (" + pct(totalLance / carta * 100) + ")"],
      ["Crédito líquido para aquisição", money(creditoLiquido)],
      ["Complemento de recursos para adquirir o bem", bem > 0 ? money(diferencaBem) : "Não informado"],
      ["Forma de amortização", modo === "prazo" ? "Redução de prazo — não quantificada" : "Redução da prestação"],
      ["Prestação após lance", nova == null ? "Não calculada" : money(nova) + " (hipótese, " + restantes + " prestações)"]
    ], notices.map((x) => x.text));
  }

  function proposals() {
    const nome = $("p-nome").value.trim();
    if (!nome) throw Error("Informe o nome da administradora concorrente.");
    const a = {
      credito: read("p-a-credito", true), parcela: read("p-a-parcela", true), prazo: integer("p-a-prazo", true),
      taxa: read("p-a-taxa"), reserva: read("p-a-reserva"), extra: read("p-a-extras")
    };
    const b = {
      credito: read("p-b-credito", true), parcela: read("p-b-parcela", true), prazo: integer("p-b-prazo", true),
      taxa: read("p-b-taxa"), reserva: read("p-b-reserva"), extra: read("p-b-extras")
    };
    [a.credito, a.parcela, b.credito, b.parcela].forEach((v) => positive(v, "os valores de crédito e parcela"));
    if ([a.taxa, b.taxa, a.reserva, b.reserva].some((v) => v > 100)) throw Error("Confira as taxas informadas: percentuais acima de 100% precisam ser revistos.");
    const totalA = a.parcela * a.prazo + a.extra;
    const totalB = b.parcela * b.prazo + b.extra;
    const diff = Math.abs(totalA - totalB);
    const low = totalA < totalB - 0.005 ? "Plano de referência" : totalB < totalA - 0.005 ? nome : "Empate nominal";
    const notEqual = Math.abs(a.credito - b.credito) > .01 || a.prazo !== b.prazo;
    const unknownSource = !$("p-fonte").value.trim();
    const notices = [
      { text: "Os totais usam as prestações atuais multiplicadas pelo prazo informado. Não projetam reajustes, alterações de valor, data da contemplação ou custo de oportunidade.", warn: true }
    ];
    if (notEqual) notices.push({ text: "ATENÇÃO: as propostas têm crédito líquido e/ou prazo diferentes. Não é correto concluir qual é melhor apenas pela diferença em reais.", warn: true });
    if (unknownSource) notices.push({ text: "Fonte da proposta concorrente não informada. Registre origem, data e validade para comparação comercial.", warn: true });
    notices.push({ text: "As taxas de administração e reserva foram informadas apenas para leitura: não foram somadas novamente, pois podem já integrar as parcelas.", warn: false });
    if (examplesUsed.propostas) notices.push({ text: "EXEMPLO ILUSTRATIVO: números não constituem oferta real.", warn: true });
    const displayName = nome.slice(0, 70);
    const rows = [
      ["Crédito líquido", money(a.credito), money(b.credito)],
      ["Prestação", money(a.parcela), money(b.parcela)],
      ["Prestações", numberBR(a.prazo), numberBR(b.prazo)],
      ["Administração informada", $("p-a-taxa").value.trim() ? pct(a.taxa) : "Não informado", $("p-b-taxa").value.trim() ? pct(b.taxa) : "Não informado"],
      ["Reserva informada", $("p-a-reserva").value.trim() ? pct(a.reserva) : "Não informado", $("p-b-reserva").value.trim() ? pct(b.reserva) : "Não informado"],
      ["Custos adicionais", money(a.extra), money(b.extra)],
      ["Total nominal", money(totalA), money(totalB)]
    ];
    const sub = notEqual ? "Os planos não são equivalentes em crédito e/ou prazo; compare cada condição antes de decidir." : "Diferença nominal calculada a partir das prestações e dos custos adicionais informados.";
    updateResult("resultado-propostas", "diferença nominal entre propostas", money(diff), sub,
      [["Menor desembolso nominal", low], ["Equivalência de crédito e prazo", notEqual ? "Não" : "Sim"]],
      [explain("Condições lado a lado", table(["Critério", "Referência", displayName], rows))], notices);
    const fonte = $("p-fonte").value.trim(), data = $("p-data").value;
    setAnalysis("propostas", [
      ["Proposta concorrente", displayName],
      ["Crédito líquido — referência / concorrente", money(a.credito) + " / " + money(b.credito)],
      ["Prestação — referência / concorrente", money(a.parcela) + " / " + money(b.parcela)],
      ["Prazo — referência / concorrente", a.prazo + " / " + b.prazo + " meses"],
      ["Administração — referência / concorrente", ($("p-a-taxa").value.trim() ? pct(a.taxa) : "não informada") + " / " + ($("p-b-taxa").value.trim() ? pct(b.taxa) : "não informada")],
      ["Desembolso nominal — referência / concorrente", money(totalA) + " / " + money(totalB)],
      ["Diferença nominal", money(diff) + " — menor em " + low],
      ["Fonte", fonte || "Não informada"],
      ["Data da proposta", data ? data.split("-").reverse().join("/") : "Não informada"]
    ], notices.map((x) => x.text));
  }

  function buildOfferText() {
    if (!lastAnalysis) return "Faça uma análise em uma das três primeiras abas para gerar seu resumo comercial.";
    const nome = $("o-nome").value.trim();
    const objetivo = $("o-objetivo").value.trim();
    const title = { comparar: "COMPARAÇÃO DE ALTERNATIVAS", lances: "ESTRATÉGIA DE LANCE", propostas: "COMPARAÇÃO DE PROPOSTAS" }[lastAnalysis.kind];
    const rows = lastAnalysis.rows.map((entry) => entry[0] + ": " + entry[1]);
    const intro = [title, "Data: " + new Date().toLocaleDateString("pt-BR")];
    if (lastAnalysis.example) intro.unshift("EXEMPLO ILUSTRATIVO — NÃO UTILIZAR COMO OFERTA REAL");
    if (nome) intro.push("Cliente: " + nome);
    if (objetivo) intro.push("Objetivo: " + objetivo);
    return intro.concat(["", ...rows, "", "CONDIÇÕES E RESSALVAS", ...lastAnalysis.warnings.map((x) => "• " + x),
      "", "Simulação orientativa baseada nos dados informados. Não é proposta contratual e não garante contemplação. Confirme regulamento, custos, índices e condições de adesão."]).join("\n");
  }
  function renderOffer() {
    $("o-previa").textContent = buildOfferText();
    const disabled = !lastAnalysis;
    ["o-copiar", "o-whatsapp", "o-imprimir"].forEach((id) => { $(id).disabled = disabled; });
    $("o-whatsapp").disabled = disabled || (lastAnalysis && lastAnalysis.example);
  }
  async function copyOffer() {
    if (!lastAnalysis) return;
    try {
      await navigator.clipboard.writeText(buildOfferText());
      setError("erro-oferta", "Texto copiado. Confira as condições antes de compartilhar.");
    } catch (_) {
      const range = document.createRange();
      range.selectNodeContents($("o-previa"));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      const ok = document.execCommand("copy");
      selection.removeAllRanges();
      setError("erro-oferta", ok ? "Texto copiado." : "Não foi possível copiar automaticamente. Selecione e copie o texto da prévia.");
    }
  }
  const samples = {
    comparar: {
      "c-carta":"100.000,00", "c-contemplacao":"1",
      "c-prazo":"100", "c-taxa":"20", "c-parcela":"",
      "c-lance":"0", "c-embutido":"0", "c-liquida":"",
      "c-apos-parcela":"", "c-apos-prazo":"", "c-extras":"", "c-reajuste":"4,69",
      "c-entrada":"0", "c-fintaxa":"1,50", "c-finprazo":"60", "c-finparcela":"",
      "c-sistema":"price", "c-fintarifas":"", "c-finseguro":"", "c-finextras":""
    },
    lances: {
      "l-carta":"110.026,00", "l-bem":"110.026,00", "l-proprio":"33.007,80",
      "l-embutido":"0", "l-limite":"30", "l-parcela":"1.363,22",
      "l-restantes":"99", "l-modo":"parcela"
    },
    propostas: {
      "p-a-credito":"110.026,00", "p-a-parcela":"1.363,22", "p-a-prazo":"100",
      "p-a-taxa":"20,90", "p-a-reserva":"3", "p-a-extras":"0",
      "p-nome":"Exemplo de concorrente", "p-b-credito":"110.026,00",
      "p-b-parcela":"1.390,00", "p-b-prazo":"100", "p-b-taxa":"22",
      "p-b-reserva":"3", "p-b-extras":"0", "p-fonte":"Valores fictícios", "p-data":""
    }
  };

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => showTab(tab.dataset.tab));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const tabs = Array.from(document.querySelectorAll(".tab"));
      const index = tabs.indexOf(tab);
      const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 :
        (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      tabs[next].focus();
      showTab(tabs[next].dataset.tab);
    });
  });
  document.querySelectorAll(".example").forEach((button) => {
    button.addEventListener("click", () => {
      const kind = button.dataset.example;
      Object.entries(samples[kind]).forEach(([id, value]) => { $(id).value = value; });
      if (kind === "comparar" && window.ConsorcioCompareV2) window.ConsorcioCompareV2.afterExample();
      if (window.ConsorcioMasks) window.ConsorcioMasks.formatAll();
      examplesUsed[kind] = true;
      const el = $("erro-" + kind);
      el.textContent = "Exemplo ilustrativo carregado. Para informar uma operação real, clique em Limpar e preencha novamente.";
      el.style.color = "#92631e";
    });
  });
  [
    ["form-comparar", "comparar", compare],
    ["form-lances", "lances", bids],
    ["form-propostas", "propostas", proposals]
  ].forEach(([formId, kind, fn]) => {
    $(formId).addEventListener("submit", (e) => {
      e.preventDefault();
      setError("erro-" + kind, "");
      try { fn(); } catch (err) {
        setError("erro-" + kind, err);
        $("resultado-" + kind).innerHTML = '<div class="empty-result"><span class="empty-icon">!</span><h3>Dados precisam de revisão</h3><p>Corrija os campos indicados para gerar uma nova análise.</p></div>';
        if (lastAnalysis && lastAnalysis.kind === kind) lastAnalysis = null;
        renderOffer();
      }
    });
    $(formId).addEventListener("reset", () => {
      examplesUsed[kind] = false;
      window.setTimeout(() => {
        setError("erro-" + kind, "");
        $("erro-" + kind).style.color = "";
        $("resultado-" + kind).innerHTML = '<div class="empty-result"><span class="empty-icon">↗</span><h3>Aguardando uma nova análise</h3><p>Preencha os campos para calcular novamente.</p></div>';
        if (lastAnalysis && lastAnalysis.kind === kind) lastAnalysis = null;
        renderOffer();
      }, 0);
    });
  });
  document.addEventListener("click", (e) => {
    if (e.target.closest(".to-offer")) showTab("oferta");
  });
  ["o-nome", "o-objetivo"].forEach((id) => $(id).addEventListener("input", renderOffer));
  $("o-copiar").addEventListener("click", copyOffer);
  $("o-whatsapp").addEventListener("click", () => {
    if (!lastAnalysis || lastAnalysis.example) return;
    window.open("https://api.whatsapp.com/send?text=" + encodeURIComponent(buildOfferText()), "_blank", "noopener,noreferrer");
  });
  $("o-imprimir").addEventListener("click", () => { if (lastAnalysis) window.print(); });
  renderOffer();
  if (window.ConsorcioCompareV2) window.ConsorcioCompareV2.init();
}());
