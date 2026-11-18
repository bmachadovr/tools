"use strict";
// Análise de alavancagem patrimonial: cenário imobiliário didático.
// Não calcula patrimônio líquido, retorno garantido ou probabilidade de contemplação.
(function () {
  const $ = (id) => document.getElementById(id);
  const fmt = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const num = (v) => Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
  const pc = (v) => Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]);
  let isExample = false;

  function money(id, optional) {
    const raw = $(id).value.trim().replace(/\s|R\$/g, "");
    if (!raw) {
      if (optional) return 0;
      throw Error("Preencha o campo: " + $(id).closest("label").childNodes[0].textContent.trim() + ".");
    }
    const normalized = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
    const value = Number(normalized);
    if (!Number.isFinite(value) || value < 0) throw Error("Confira o valor informado em " + id + ".");
    return value;
  }
  function integer(id, min, max) {
    const raw = $(id).value.trim();
    if (!/^\d+$/.test(raw)) throw Error("Informe um número inteiro no campo " + $(id).closest("label").childNodes[0].textContent.trim() + ".");
    const value = Number(raw);
    if (value < min || value > max) throw Error("O campo " + id + " deve ficar entre " + min + " e " + max + ".");
    return value;
  }
  function percent(id, min, max) {
    const raw = $(id).value.trim().replace(",", ".");
    if (!raw) throw Error("Informe a taxa de valorização hipotética.");
    const value = Number(raw);
    if (!Number.isFinite(value) || value < min || value > max) throw Error("A valorização hipotética precisa ficar entre " + min + "% e " + max + "%.");
    return value;
  }
  function renderArguments(items) {
    return '<div class="result-section"><h4>Argumentos para a conversa</h4><ol class="pat-arguments">'
      + items.map((t) => '<li>' + esc(t) + '</li>').join("") + '</ol></div>';
  }
  function renderMetrics(items) {
    return '<div class="metrics">' + items.map(([label, value]) =>
      '<div class="metric"><span>' + esc(label) + '</span><strong>' + esc(value) + '</strong></div>').join("") + '</div>';
  }
  function renderRows(rows) {
    return '<div class="result-section"><h4>Memória dos cálculos</h4><table class="compare-table"><tbody>'
      + rows.map(([a,b]) => '<tr><td>' + esc(a) + '</td><td>' + esc(b) + '</td></tr>').join("")
      + '</tbody></table></div>';
  }
  function renderTimeline(items) {
    return '<div class="result-section"><h4>Evolução hipotética após a contemplação</h4><div class="pat-timeline-scroll">'
      + '<table class="compare-table pat-timeline"><thead><tr><th>Momento</th><th>Imóvel</th><th>Investimento</th><th>Ativos brutos</th></tr></thead><tbody>'
      + items.map(([label, property, invested, gross]) =>
        '<tr><td>' + esc(label) + '</td><td>' + esc(fmt(property)) + '</td><td>' + esc(fmt(invested)) + '</td><td><strong>' + esc(fmt(gross)) + '</strong></td></tr>').join("")
      + '</tbody></table></div><p class="hint">Valor bruto, sem deduzir saldo devedor, pagamentos, taxas, impostos ou inflação real. Taxas constantes escolhidas no cenário.</p></div>';
  }
  function renderWarnings(warnings) {
    return warnings.map((t) => '<div class="callout warn">' + esc(t) + '</div>').join("");
  }

  function calculate() {
    const capital = money("a-capital");
    const carta = money("a-carta"), preco = money("a-preco");
    const proprio = money("a-proprio", true), embutido = money("a-embutido", true);
    const custos = money("a-custos", true);
    const parcela = money("a-parcela"), aluguel = money("a-aluguel", true);
    const prazo = integer("a-prazo", 1, 600);
    const contemplacao = integer("a-contemplacao", 1, prazo);
    const horizonte = integer("a-horizonte", contemplacao, 600);
    const vacancia = integer("a-vacancia", 0, 12);
    const valorizacao = percent("a-valorizacao", -50, 50);
    const rendimento = percent("a-rendimento", -50, 50);

    if (!(capital > 0 && carta > 0 && preco > 0 && parcela > 0)) throw Error("Capital próprio, carta, preço do imóvel e parcela precisam ser maiores que zero.");
    if (embutido >= carta) throw Error("O lance embutido não pode consumir toda a carta.");
    if (proprio + embutido > carta) throw Error("A soma dos lances supera o valor da carta. Confirme as regras ou revise os valores.");
    const temLance = proprio + embutido > 0;
    const preencheuParcelaApos = $("a-parcela-apos").value.trim() !== "";
    const preencheuPrazoApos = $("a-prazo-apos").value.trim() !== "";
    if (temLance && (!preencheuParcelaApos || !preencheuPrazoApos)) {
      throw Error("Com lance, informe a prestação e a quantidade de parcelas após abatimento, conforme o demonstrativo real. Sem esses dados, a projeção duplicaria parte do desembolso.");
    }
    const parcelaApos = preencheuParcelaApos ? money("a-parcela-apos") : parcela;
    const prazoApos = preencheuPrazoApos ? integer("a-prazo-apos", 0, prazo - contemplacao) : prazo - contemplacao;
    if (prazoApos > 0 && !(parcelaApos > 0)) throw Error("A prestação após a contemplação precisa ser positiva.");


    const creditoLiquido = carta - embutido;
    const complemento = Math.max(0, preco - creditoLiquido);
    const capitalUtilizado = proprio + complemento + custos;
    if (capitalUtilizado > capital + .01) throw Error("O lance próprio, o complemento do imóvel e as despesas excedem o capital próprio total. Informe recursos suficientes ou altere a estratégia.");
    const capitalInvestido = Math.max(0, capital - capitalUtilizado);
    // A divisão dos recursos e o patrimônio bruto inicial são considerados
    // no instante da contemplação hipotética, após pagamento do lance.
    const ativosNaContemplacao = preco + capitalInvestido;
    const mesesLocacao = Math.max(0, horizonte - contemplacao);
    const investimentosFuturos = capitalInvestido * Math.pow(1 + rendimento / 100, mesesLocacao / 12);
    const ativosFuturos = investimentosFuturos + preco * Math.pow(1 + valorizacao / 100, mesesLocacao / 12);
    const aluguelMedio = aluguel * (1 - vacancia / 12);
    const receitaPeriodo = aluguelMedio * mesesLocacao;
    const valorFuturo = preco * Math.pow(1 + valorizacao / 100, mesesLocacao / 12);
    const cobertura = prazoApos > 0 ? aluguelMedio / parcelaApos * 100 : 0;
    const diferencaMensal = prazoApos > 0 ? parcelaApos - aluguelMedio : -aluguelMedio;
    const parcelasAteHorizonte = contemplacao * parcela + Math.min(Math.max(0,horizonte-contemplacao),prazoApos) * parcelaApos;
    const parcelasRestantes = Math.max(0, prazoApos - Math.max(0,horizonte-contemplacao));
    const caixaPeriodo = capitalUtilizado + parcelasAteHorizonte - receitaPeriodo;
    const parcelasFuturasNominais = parcelasRestantes * parcelaApos;
    const saltoMeses = Math.max(12, Math.ceil(mesesLocacao / 120) * 12);
    const marcos = [0];
    for (let m = saltoMeses; m < mesesLocacao; m += saltoMeses) marcos.push(m);
    if (mesesLocacao > 0) marcos.push(mesesLocacao);
    const timeline = marcos.map((m) => {
      const propriedade = preco * Math.pow(1 + valorizacao / 100, m / 12);
      const aplicacao = capitalInvestido * Math.pow(1 + rendimento / 100, m / 12);
      return [m === 0 ? "Contemplação" : "Após " + (m/12).toLocaleString("pt-BR",{maximumFractionDigits:1}) + " anos",
        propriedade, aplicacao, propriedade + aplicacao];
    });
    const alertas = [
      "Contemplação no mês " + contemplacao + " é apenas uma hipótese. Sorteio ou lance não têm data garantida; sem contemplação não há aquisição nem aluguel nos meses estimados.",
      "IPCA não mede a valorização imobiliária. Sua utilização como taxa hipotética de apreciação do imóvel é apenas ilustrativa; imóveis podem valorizar menos, ficar estáveis ou perder valor.",
      "Valorização, rendimento financeiro e aluguel são premissas fornecidas, não previsões. Ativos brutos não representam patrimônio líquido, rentabilidade real ou lucro.",
      "Prestações antes e após contemplação são informadas pelo operador, sem projetar reajustes futuros, seguros, tributos pessoais ou custo de oportunidade. Confira o demonstrativo e faça análise de sensibilidade antes de ofertar.",
      "O investimento financeiro é projetado sem novos aportes ou resgates; pressupõe que as prestações sejam custeadas por renda externa ou aluguel. Rendimento bruto não inclui tributos, taxas ou perdas.",
      "A soma nominal das prestações restantes não representa saldo devedor para quitação. Custos e prazos de liberação dependem do contrato e da aprovação da operação."
    ];
    if (aluguel > 0) alertas.push("O aluguel pode ser interrompido por desocupação, inadimplência ou manutenção. Mesmo sem receita, a prestação permanece exigível.");
    if (!$("a-custos").value.trim()) alertas.push("Despesas de aquisição não informadas: utilizadas como zero por hipótese. ITBI, cartório e outros custos podem reduzir o capital investido.");
    if (creditoLiquido > preco) alertas.push("Crédito disponível excede o preço do imóvel. A diferença não deve ser tratada como dinheiro livre; sua utilização depende das regras contratuais.");
    if (isExample) alertas.unshift("EXEMPLO FICTÍCIO. Os números são ilustrativos e não devem ser apresentados como oferta válida.");

    const argumentos = [
      "Com " + fmt(capital) + " de capital próprio, a estratégia reserva " + fmt(capitalUtilizado) + " para lance, eventual complemento e despesas, preservando " + fmt(capitalInvestido) + " em aplicações. Se a carta for contemplada e liberada, os ativos brutos passam a somar " + fmt(ativosNaContemplacao) + " (imóvel + aplicação), mas permanecem obrigações de pagamento.",
      aluguel > 0
        ? "Se a locação ocorrer como planejado, o aluguel líquido médio ajustado por vacância de " + fmt(aluguelMedio) + "/mês cobriria " + pc(cobertura) + " da prestação pós-contemplação de " + fmt(parcelaApos) + "; " + (diferencaMensal >= 0 ? "seriam necessários " + fmt(diferencaMensal) + "/mês adicionais." : "haveria excedente operacional estimado de " + fmt(-diferencaMensal) + "/mês, sujeito a outros custos e impostos.")
        : "Sem aluguel informado, a prestação pós-contemplação de " + fmt(parcelaApos) + " deve ser suportada com renda própria. Não há argumento de autofinanciamento por locação.",
      "Em " + (mesesLocacao / 12).toLocaleString("pt-BR",{maximumFractionDigits:1}) + " anos após a contemplação hipotética, com valorização imobiliária equivalente a um IPCA suposto de " + pc(valorizacao) + " ao ano e aplicação rendendo " + pc(rendimento) + " ao ano, os ativos brutos seriam " + fmt(ativosFuturos) + ". A evolução do patrimônio líquido exige conhecer o saldo devedor real, aportes e custos."
    ];
    const rows = [
      ["Capital próprio inicial", fmt(capital)],
      ["Preço do imóvel", fmt(preco)],
      ["Carta nominal", fmt(carta)],
      ["Lance próprio / embutido", fmt(proprio) + " / " + fmt(embutido)],
      ["Crédito após lance embutido", fmt(creditoLiquido)],
      ["Complemento do preço / despesas iniciais", fmt(complemento) + " / " + fmt(custos)],
      ["Capital próprio comprometido com lance / complemento / despesas", fmt(capitalUtilizado)],
      ["Capital financeiro que permanece investido", fmt(capitalInvestido)],
      ["Ativos brutos na contemplação (imóvel + aplicação)", fmt(ativosNaContemplacao)],
      ["Parcela antes da contemplação", fmt(parcela) + " por " + contemplacao + " meses"],
      ["Parcela após contemplação", fmt(parcelaApos) + " por " + prazoApos + " meses"],
      ["Contemplação hipotética", "Mês " + contemplacao + " — não garantido"],
      ["Horizonte da análise", horizonte + " meses desde a contratação"],
      ["Meses potenciais de locação", num(mesesLocacao)],
      ["Aluguel líquido médio após vacância", fmt(aluguelMedio) + "/mês"],
      ["Cobertura estimada da prestação", pc(cobertura)],
      ["Renda de aluguel no horizonte", fmt(receitaPeriodo)],
      ["Prestações nominais pagas até o horizonte", fmt(parcelasAteHorizonte)],
      ["Saída de caixa líquida no horizonte (aportes + parcelas − aluguéis)", fmt(caixaPeriodo)],
      ["Valorização hipotética imóvel (IPCA usado como referência)", pc(valorizacao) + " ao ano"],
      ["Rendimento hipotético investimento", pc(rendimento) + " ao ano"],
      ["Valor bruto futuro do imóvel", fmt(valorFuturo)],
      ["Valor bruto futuro das aplicações", fmt(investimentosFuturos)],
      ["Ativos brutos futuros totais", fmt(ativosFuturos)],
      ["Prestações previstas após o horizonte", num(parcelasRestantes)],
      ["Soma nominal das parcelas futuras (não é saldo devedor)", fmt(parcelasFuturasNominais)]
    ];
    $("resultado-patrimonio").innerHTML =
      '<div class="result-top"><span class="result-kicker">CENÁRIO DE FORMAÇÃO PATRIMONIAL</span><span class="status-pill">Hipóteses editáveis</span></div>'
      + '<div class="hero-number">' + esc(fmt(ativosNaContemplacao)) + '<small>ativos brutos após a contemplação hipotética</small></div>'
      + '<p class="result-copy">Imóvel de ' + esc(fmt(preco)) + ' + capital investido de ' + esc(fmt(capitalInvestido)) + '. Parte do patrimônio é financiada pelo compromisso com o consórcio, não é riqueza líquida imediata.</p>'
      + renderMetrics([
        ["Capital próprio inicial", fmt(capital)],
        ["Lance e despesas de aquisição", fmt(capitalUtilizado)],
        ["Capital preservado e investido", fmt(capitalInvestido)],
        ["Ativos brutos no horizonte", fmt(ativosFuturos)],
        ["Prestações nominais futuras (não é saldo devedor)", fmt(parcelasFuturasNominais)],
        ["Cobertura da prestação pelo aluguel", pc(cobertura)]
      ])
      + renderTimeline(timeline) + renderArguments(argumentos) + renderRows(rows)
      + renderWarnings(alertas)
      + '<div class="result-actions"><button type="button" class="to-offer">Gerar proposta com esta análise →</button></div>';

    if (typeof window.receberAnalisePatrimonial === "function") {
      window.receberAnalisePatrimonial({
        rows: [["Estratégia", "Alavancagem patrimonial com recursos parcialmente investidos"], ...rows, ...argumentos.map((a,i) => ["Argumento " + (i+1), a])],
        warnings: alertas,
        example: isExample
      });
    }
  }

  const form = $("form-patrimonio");
  if (!form) return;
  const example = {
    "a-capital":"100.000,00", "a-carta":"100.000,00", "a-preco":"100.000,00",
    "a-proprio":"50.000,00", "a-embutido":"0,00", "a-custos":"0,00",
    "a-parcela":"1.000,00", "a-prazo":"120",
    "a-contemplacao":"1", "a-horizonte":"60",
    "a-parcela-apos":"580,00", "a-prazo-apos":"119",
    "a-aluguel":"0,00", "a-vacancia":"0",
    "a-valorizacao":"4", "a-rendimento":"6"
  };
  $("a-exemplo").addEventListener("click", () => {
    for (const [id,value] of Object.entries(example)) $(id).value=value;
    if (window.ConsorcioMasks) window.ConsorcioMasks.formatAll();
    isExample=true;
    $("erro-patrimonio").textContent="Exemplo fictício carregado. Use Limpar para iniciar uma análise real.";
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault(); $("erro-patrimonio").textContent="";
    try { calculate(); }
    catch (e) {
      $("erro-patrimonio").textContent = e.message || "Revise os campos.";
      $("resultado-patrimonio").innerHTML = '<div class="empty-result"><h3>Revise os dados</h3><p>Corrija os campos indicados antes de gerar argumentos.</p></div>';
      if (window.receberAnalisePatrimonial) window.receberAnalisePatrimonial(null);
    }
  });
  form.addEventListener("reset", () => {
    isExample=false;
    window.setTimeout(() => {
      $("erro-patrimonio").textContent="";
      $("resultado-patrimonio").innerHTML='<div class="empty-result"><span class="empty-icon">↗</span><h3>Construa um cenário de patrimônio</h3><p>Informe os dados para avaliar capital inicial, potencial de aluguel, compromissos e argumentos de oferta.</p></div>';
      if (window.receberAnalisePatrimonial) window.receberAnalisePatrimonial(null);
    },0);
  });
}());
