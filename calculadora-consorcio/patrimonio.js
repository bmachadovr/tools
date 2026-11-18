"use strict";
// Análise de alavancagem patrimonial para imóveis ou veículos.
// Não calcula patrimônio líquido, retorno garantido ou probabilidade de contemplação.
(function () {
  const $ = (id) => document.getElementById(id);
  const fmt = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const num = (v) => Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
  const pc = (v) => Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]);
  let isExample = false;
  // Últimos dois campos efetivamente informados pelo operador são a fonte
  // dos cálculos; o terceiro campo é derivado automaticamente.
  let coreHistory = ["a-prazo","a-taxa"];
  const postManual = {pay:false,term:false};
  const formatBR = (v) => Number(v).toLocaleString("pt-BR",{minimumFractionDigits:2, maximumFractionDigits:2});
  function readOptionalNumber(id) {
    const text = $(id).value.trim();
    if (!text) return NaN;
    const converted = text.includes(",") ? text.replace(/\./g,"").replace(",",".") : text;
    return Number(converted);
  }
  function showDerived(id,n) {
    if (!Number.isFinite(n) || n < 0) return false;
    $(id).value = id === "a-prazo" || id === "a-prazo-apos" ? String(Math.round(n)) : formatBR(n);
    $(id).classList.add("is-derived");
    return true;
  }
  function deriveCore() {
    const carta = readOptionalNumber("a-carta");
    const valid = (id) => Number.isFinite(readOptionalNumber(id)) && readOptionalNumber(id) >= 0;
    const choices = ["a-prazo","a-taxa","a-parcela"];
    const manual = coreHistory.filter(id=>choices.includes(id) && valid(id));
    const target = choices.find(id=>!manual.includes(id));
    if (!(carta > 0) || manual.length < 2 || !target) {
      $("a-core-status").textContent="Informe a carta e mais dois valores entre prazo, taxa total e prestação. O terceiro será calculado.";
      return false;
    }
    const prazo = readOptionalNumber("a-prazo");
    const taxa = readOptionalNumber("a-taxa");
    const parcela = readOptionalNumber("a-parcela");
    let value;
    if(target === "a-parcela") {
      if(!Number.isInteger(prazo)||prazo<1||prazo>600||taxa<0||taxa>200){$("a-core-status").textContent="Confira prazo e taxa total (0 a 200%).";return false;}
      value = carta*(1+taxa/100)/prazo;
    } else if(target === "a-taxa") {
      if(!Number.isInteger(prazo)||prazo<1||prazo>600||!(parcela>0)){$("a-core-status").textContent="Confira prazo e parcela informados.";return false;}
      value = (parcela*prazo/carta-1)*100;
      if(value<0||value>200){$("a-core-status").textContent="Taxa implícita fora do intervalo de 0 a 200%. Revise os valores.";return false;}
    } else {
      if(!(parcela>0)||taxa<0||taxa>200){$("a-core-status").textContent="Confira prestação e taxa total.";return false;}
      value = Math.round(carta*(1+taxa/100)/parcela);
      if(value<1||value>600){$("a-core-status").textContent="Prazo estimado fora do intervalo permitido de 1 a 600 meses.";return false;}
    }
    if (!showDerived(target,value)) return false;
    $("a-core-status").textContent = ({"a-prazo":"Prazo","a-taxa":"Taxa total","a-parcela":"Parcela inicial"})[target]
      +" calculado(a) automaticamente por modelo linear de referência. Confira com o demonstrativo do grupo.";
    return true;
  }
  function derivePost() {
    const carta = readOptionalNumber("a-carta"), prazo = readOptionalNumber("a-prazo");
    const parcela = readOptionalNumber("a-parcela"), proprio = readOptionalNumber("a-proprio") || 0;
    const embutido = readOptionalNumber("a-embutido") || 0;
    const lance = proprio+embutido;
    const indicado = readOptionalNumber("a-contemplacao");
    const mesPreenchido = $("a-contemplacao").value.trim().length>0;
    const mes = mesPreenchido ? indicado : lance>0 ? 1 : NaN;
    const status = $("a-post-status");
    if (!(carta>0 && Number.isInteger(prazo) && prazo>=1 && parcela>0)) {
      status.textContent="Informe primeiro carta, prazo, taxa e parcela para estimar os valores pós-lance.";
      return null;
    }
    if (!(mes>=1 && mes<=prazo)) {
      status.textContent=lance>0?"Confira o mês de contemplação informado.":"Sem lance, informe um mês hipotético de contemplação neste bloco para projetar a aquisição.";
      return null;
    }
    const restantes = prazo-mes;
    const valorAAbater = Math.max(0,parcela*restantes-lance);
    if (lance>0 && (!(restantes>0) || valorAAbater<=0)) {
      status.textContent="O lance supera as parcelas posteriores previstas no modelo linear ou não há prestações restantes. Revise o cenário.";
      return null;
    }
    let n=restantes, p=parcela;
    if (lance>0) {
      const pagoApos = valorAAbater;
      const userCount = readOptionalNumber("a-prazo-apos");
      const userPay = readOptionalNumber("a-parcela-apos");
      if(postManual.term){
        if(!Number.isInteger(userCount)||userCount<1||userCount>restantes) {
          status.textContent="O prazo pós-contemplação deve ser inteiro, positivo e não ultrapassar as parcelas disponíveis.";
          return null;
        }
        n=userCount;
      }
      if(postManual.pay) {
        if(!(userPay>0)) {
          status.textContent="A prestação após a contemplação deve ser positiva.";
          return null;
        }
        p=userPay;
      }
      if(postManual.pay && !postManual.term) {
        n=Math.ceil(pagoApos/p);
        if(n>restantes) {
          status.textContent="Parcela pós-lance informada é insuficiente para liquidar o saldo nominal dentro do prazo original.";
          return null;
        }
      }
      else if(postManual.term && !postManual.pay) p=pagoApos/n;
      else if(!postManual.pay && !postManual.term) p=pagoApos/n;
      if(!postManual.term) showDerived("a-prazo-apos",n);
      if(!postManual.pay) showDerived("a-parcela-apos",p);
    } else {
      if(!postManual.term) showDerived("a-prazo-apos",restantes);
      if(!postManual.pay) showDerived("a-parcela-apos",parcela);
    }
    status.textContent= (lance>0
      ? "Lance de "+fmt(lance)+" suposto na assembleia do mês "+mes+". Primeiras "+mes+" prestações integrais; saldo nominal das seguintes é redistribuído linearmente. Valores pós-lance são estimados."
      : "Contemplação no mês "+mes+" é apenas hipótese; não há garantia de contemplação.")
      +" Abatimento real depende do regulamento e pode reduzir prazo ou parcela.";
    return {mes,n,p,restantes,lance,estimated:lance>0&&!postManual.pay&&!postManual.term};
  }


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
    if (!raw) throw Error("Informe a taxa do campo " + $(id).closest("label").childNodes[0].textContent.trim() + ".");
    const value = Number(raw);
    if (!Number.isFinite(value) || value < min || value > max) throw Error("A taxa em " + id + " precisa ficar entre " + min + "% e " + max + "%.");
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
    if(!deriveCore()) throw Error("Informe a carta e mais dois valores entre prazo, taxa total e parcela; o terceiro será calculado.");
    const tipoBem=$("a-tipo-bem").value==="veiculo"?"veiculo":"imovel";
    const veiculo=tipoBem==="veiculo";
    const bemNome=veiculo?"veículo":"imóvel";
    const indiceVeiculo=veiculo?$("a-indice-veiculo").value:"ipca";
    const periodicidadeVeiculo=veiculo?$("a-periodicidade-veiculo").value:"anual";
    const indiceConsorcio=veiculo?(indiceVeiculo==="ipca"?"IPCA":"Contrato / tabela de referência"):"INCC-M";
    const tipoIndiceBem=veiculo?"depreciação estimada":"IGMI-R";
    const capital = money("a-capital");
    const carta = money("a-carta"), preco = money("a-preco");
    const proprio = money("a-proprio", true), embutido = money("a-embutido", true);
    const parcela = money("a-parcela"), aluguel = veiculo?0:money("a-aluguel", true);
    const taxa = money("a-taxa");
    if(taxa>200) throw Error("Taxa total do consórcio acima de 200%. Revise os dados.");
    const prazo = integer("a-prazo", 1, 600);
    const post = derivePost();
    if(!post) throw Error("Informe um mês hipotético de contemplação sem lance, ou revise a composição do lance.");
    const contemplacao = post.mes;
    const horizonte = integer("a-horizonte", contemplacao, 600);
    const valorizacao = percent("a-valorizacao", -50, 50);
    const rendimento = percent("a-rendimento", -50, 50);
    const reajusteConsorcio = percent("a-reajuste-consorcio", -50, 50);
    const reajusteAluguel = veiculo?0:percent("a-reajuste-aluguel", -50, 50);

    if (!(capital > 0 && carta > 0 && preco > 0 && parcela > 0)) throw Error("Capital próprio, carta, preço do bem e parcela precisam ser maiores que zero.");
    if (embutido >= carta) throw Error("O lance embutido não pode consumir toda a carta.");
    if (proprio + embutido > carta) throw Error("A soma dos lances supera o valor da carta. Confirme as regras ou revise os valores.");
    const temLance = proprio + embutido > 0;
    const parcelaApos = post.p;
    const prazoApos = post.n;
    if (prazoApos < 0 || prazoApos>600 || parcelaApos<0 || !Number.isFinite(parcelaApos))
      throw Error("Confira o prazo e a prestação após a contemplação.");
    if (temLance && (!postManual.pay && !postManual.term) && post.estimated && prazoApos>prazo-contemplacao)
      throw Error("O prazo pós-lance ultrapassa a duração inicial.");
    if (embutido>carta*.30+.01) throw Error("Nesta hipótese o lance embutido supera 30% da carta. Confirme o limite do grupo antes de simular.");


    const creditoLiquido = carta - embutido;
    const complemento = Math.max(0, preco - creditoLiquido);
    const capitalUtilizado = proprio + complemento;
    if (capitalUtilizado > capital + .01) throw Error("O lance próprio e o complemento do imóvel excedem o capital próprio informado. Informe recursos suficientes ou altere o cenário.");
    const capitalInvestido = Math.max(0, capital - capitalUtilizado);
    // Mesma convenção temporal do comparador: juros antes dos fluxos
    // no fim do mês; INCC na parcela a cada 12 meses de contratação,
    // IGP-M no aluguel a cada 12 meses contados da primeira locação.
    const taxaMensal = Math.pow(1+rendimento/100,1/12)-1;
    const taxaImovelMensal = Math.pow(1+valorizacao/100,1/12)-1;
    const dueAt = (t) => t>contemplacao+prazoApos?0:
      (t<=contemplacao?parcela:parcelaApos)*Math.pow(1+reajusteConsorcio/100,
        veiculo&&periodicidadeVeiculo==="mensal"?(t-1)/12:Math.floor((t-1)/12));
    const rentAt = (t) => t<=contemplacao?0:
      aluguel*Math.pow(1+reajusteAluguel/100,Math.floor((t-contemplacao-1)/12));
    const investimentos = [];
    let saldoAplicado = capital, saldoImovel = 0; // saldoImovel representa o bem selecionado
    let investimentoNaContemplacao = 0, ativosNaContemplacao = 0;
    let receitaPeriodo = 0, parcelasAteHorizonte = 0;
    let totalAluguelAbatido = 0, totalAluguelExcedente = 0, totalDoBolso = 0;
    for(let t=1;t<=horizonte;t++){
      const prestacao=dueAt(t),rendLocacao=rentAt(t);
      saldoAplicado*=1+taxaMensal;
      if(saldoImovel>0) saldoImovel*=1+taxaImovelMensal;
      if(t===contemplacao){
        saldoAplicado-=capitalUtilizado;
        saldoImovel=preco;
        investimentoNaContemplacao=saldoAplicado;
        ativosNaContemplacao=saldoAplicado+preco;
      }
      const abatimento=Math.min(prestacao,rendLocacao);
      const sobra=Math.max(0,rendLocacao-prestacao);
      saldoAplicado+=sobra;
      receitaPeriodo+=rendLocacao;
      parcelasAteHorizonte+=prestacao;
      totalAluguelAbatido+=abatimento;
      totalAluguelExcedente+=sobra;
      totalDoBolso+=Math.max(0,prestacao-rendLocacao);
      investimentos.push({mes:t,imovel:saldoImovel,aplicacao:saldoAplicado});
    }
    const mesesLocacao=Math.max(0,horizonte-contemplacao);
    const investimentosFuturos=saldoAplicado;
    const valorFuturo=saldoImovel;
    const ativosFuturos=saldoAplicado+saldoImovel;
    const aluguelMedio=aluguel;
    const cobertura=prazoApos>0&&parcelaApos>0?aluguelMedio/parcelaApos*100:0;
    const diferencaMensal=parcelaApos-aluguelMedio;
    const parcelasRestantes=Math.max(0,contemplacao+prazoApos-horizonte);
    const parcelasFuturasNominais=parcelasRestantes*dueAt(horizonte);
    const caixaPeriodo=capitalUtilizado+totalDoBolso;
    const saltoMeses=Math.max(12,Math.ceil(mesesLocacao/120)*12);
    const marcos=[0];
    for(let m=saltoMeses;m<mesesLocacao;m+=saltoMeses)marcos.push(m);
    if(mesesLocacao>0)marcos.push(mesesLocacao);
    const timeline=marcos.map(m=>{
      const item=investimentos[contemplacao+m-1];
      return [m===0?"Contemplação":"Após "+(m/12).toLocaleString("pt-BR",{maximumFractionDigits:1})+" anos",
        item.imovel,item.aplicacao,item.imovel+item.aplicacao];
    });
    const alertas = [
      "Contemplação no mês " + contemplacao + " é apenas uma hipótese. Sorteio ou lance não têm data garantida; sem contemplação não há aquisição nem aluguel nos meses estimados.",
      veiculo?"A desvalorização de 10% ao ano é apenas hipótese inicial editável, não média da FIPE. Depreciação varia por modelo, ano, condições e mercado.":"IGMI-R é índice agregado de preços residenciais e não garante valorização do imóvel específico. A taxa histórica constante não é previsão de preços futuros.",
      "Valorização, rendimento financeiro e aluguel são premissas fornecidas, não previsões. Ativos brutos não representam patrimônio líquido, rentabilidade real ou lucro.",
      "Prestação inicial estimada linearmente. Após lance, redução ilustrativa. Reajuste por "+indiceConsorcio+" simulado "+(veiculo&&periodicidadeVeiculo==="mensal"?"mensalmente na taxa equivalente":"anualmente")+"; índice e regras efetivas dependem do contrato.",
      veiculo?"Veículo particular não gera aluguel na hipótese. Prestações são pagas do bolso; nas estratégias sem consórcio, seus valores equivalentes são aplicados mensalmente. Custos de utilização não incluídos.":"Aluguel na alavancagem abate primeiro a prestação; somente a sobra é aplicada. Nas alternativas, o aporte mensal equivale apenas ao desembolso efetivo do próprio bolso na prestação do consórcio. O IGP-M simulado reajusta o aluguel anualmente.",
      "A fotografia termina no horizonte escolhido. Parcelas posteriores não são antecipadas nem abatidas dos ativos. O total restante exibido supõe parcelas congeladas no valor da fotografia, sem novos reajustes e não representa saldo devedor ou quitação."
    ];
    if (aluguel > 0) alertas.push("O reajuste hipotético do aluguel segue IGP-M anual sem vacância, inadimplência ou manutenção. Na prática, o contrato e o mercado determinam o reajuste possível e a prestação continua exigível.");
    alertas.push(veiculo?"IPVA, licenciamento, seguro, manutenção, combustível, revisões e impostos não incluídos. A FIPE exige modelo e ano para fornecer uma referência real de preço, não um percentual universal.":"Despesas de aquisição (ITBI, registros, cartório), vacância e impostos não foram incluídos, por solicitação de simplificação. Na prática, esses itens reduzem o capital preservado ou o retorno.");
    if(temLance) alertas.push("Lance considerado na assembleia "+contemplacao+" apenas se vencedor; quando o mês não é informado, considera-se a assembleia seguinte (mês 1). A estimativa de parcela pós-lance é uma distribuição nominal linear, não uma prestação contratual.");
    if (creditoLiquido > preco) alertas.push("Crédito disponível excede o preço do imóvel. A diferença não deve ser tratada como dinheiro livre; sua utilização depende das regras contratuais.");
    if (isExample) alertas.unshift("EXEMPLO FICTÍCIO. Os números são ilustrativos e não devem ser apresentados como oferta válida.");

    const argumentos = [
      "Com " + fmt(capital) + " de capital próprio, a estratégia reserva " + fmt(capitalUtilizado) + " para lance e eventual complemento, preservando " + fmt(capitalInvestido) + " em aplicações. Se a carta for contemplada e liberada, os ativos brutos passam a somar " + fmt(ativosNaContemplacao) + " ("+bemNome+" + aplicação), mas permanecem obrigações de pagamento.",
      veiculo?"Veículo de uso particular: a prestação projetada de "+fmt(parcelaApos)+" após a contemplação exige desembolso de renda própria. O valor do veículo tende a depreciar e custos de uso não foram incluídos."
        : aluguel > 0
        ? "Se a locação ocorrer como planejado, o aluguel líquido hipotético de " + fmt(aluguelMedio) + "/mês cobriria " + pc(cobertura) + " da prestação pós-contemplação de " + fmt(parcelaApos) + "; " + (diferencaMensal >= 0 ? "seriam necessários " + fmt(diferencaMensal) + "/mês adicionais." : "haveria excedente operacional estimado de " + fmt(-diferencaMensal) + "/mês, sujeito a outros custos e impostos.")
        : "Sem aluguel informado, a prestação pós-contemplação de " + fmt(parcelaApos) + " deve ser suportada com renda própria. Não há argumento de autofinanciamento por locação.",
      "No horizonte de "+horizonte+" meses, o "+bemNome+" projetado por "+tipoIndiceBem+" de "+pc(valorizacao)+" ao ano e a aplicação hipotética de "+pc(rendimento)+" ao ano formam ativos brutos de "+fmt(ativosFuturos)+". As prestações são reajustadas por "+indiceConsorcio+" na periodicidade informada; nenhum pagamento posterior ao horizonte é antecipado."
    ];
    const rows = [
      ["Capital próprio inicial", fmt(capital)],
      ["Tipo de bem",veiculo?"Veículo":"Imóvel"],
      ["Preço do "+bemNome, fmt(preco)],
      ["Carta nominal", fmt(carta)],
      ["Lance próprio / embutido", fmt(proprio) + " / " + fmt(embutido)],
      ["Crédito após lance embutido", fmt(creditoLiquido)],
      ["Complemento do preço (sem despesas de aquisição)", fmt(complemento)],
      ["Capital próprio comprometido com lance / complemento", fmt(capitalUtilizado)],
      ["Capital inicial reservado para investimento", fmt(capitalInvestido)],
      ["Aplicação após contemplação hipotética (inclui rendimento até a data)", fmt(investimentoNaContemplacao)],
      ["Ativos brutos na contemplação (imóvel + aplicação)", fmt(ativosNaContemplacao)],
      ["Taxa total de administração + fundo de reserva", pc(taxa)],
      ["Parcela antes da contemplação", fmt(parcela) + " por " + contemplacao + " meses"],
      ["Parcela após contemplação", fmt(parcelaApos) + " por " + prazoApos + " meses"],
      ["Contemplação hipotética", "Mês " + contemplacao + " — não garantido"],
      ["Horizonte da análise", horizonte + " meses desde a contratação"],
      ["Meses potenciais de locação", num(mesesLocacao)],
      ["Aluguel mensal hipotético (sem vacância)", fmt(aluguelMedio) + "/mês"],
      ["Cobertura estimada da prestação", pc(cobertura)],
      ["Receitas de aluguel recebidas até o horizonte (IGP-M)", fmt(receitaPeriodo)],
      ["Aluguel utilizado para abater prestações", fmt(totalAluguelAbatido)],
      ["Excedente de aluguel aplicado", fmt(totalAluguelExcedente)],
      ["Prestações nominais pagas até o horizonte (INCC-M)", fmt(parcelasAteHorizonte)],
      ["Desembolso próprio nas prestações até o horizonte", fmt(totalDoBolso)],
      ["Saída nominal de recursos próprios (lance + complemento + prestações líquidas)", fmt(caixaPeriodo)],
      [veiculo?"Desvalorização hipotética do veículo":"Valorização hipotética do imóvel (IGMI-R)", pc(valorizacao) + " ao ano"],
      ...(veiculo?[]:[["Reajuste anual do aluguel (IGP-M)", pc(reajusteAluguel) + " ao ano"]]),
      ["Reajuste de prestações ("+indiceConsorcio+")", pc(reajusteConsorcio) + " ao ano — "+(veiculo&&periodicidadeVeiculo==="mensal"?"mensal equivalente":"anual")],
      ["Rendimento hipotético investimento", pc(rendimento) + " ao ano"],
      ["Valor bruto futuro do imóvel", fmt(valorFuturo)],
      ["Valor bruto futuro das aplicações", fmt(investimentosFuturos)],
      ["Ativos brutos futuros totais", fmt(ativosFuturos)],
      ["Prestações previstas após o horizonte", num(parcelasRestantes)],
      ["Soma nominal estimada das parcelas futuras congeladas na data (não é saldo devedor)", fmt(parcelasFuturasNominais)]
    ];
    if (!window.PatrimonioComparador) throw Error("O comparador patrimonial não foi carregado. Atualize a página.");
    const comparado = window.PatrimonioComparador.run({
      capital,preco,capitalUtilizado,capitalInvestido,parcela,parcelaApos,prazoApos,
      contemplacao,horizonte,valorizacao,rendimento,aluguel,reajusteConsorcio,reajusteAluguel,
      tipoBem,indiceVeiculo,periodicidadeVeiculo
    });
    const comparaveis = [
      ["Horizonte da fotografia",horizonte+" meses"],
      ["Tipo de bem",veiculo?"Veículo":"Imóvel"],
      ["Investimentos: 90% CDI hipotético",pc(rendimento)+" a.a."],
      [veiculo?"Veículo: depreciação hipotética":"Imóvel: IGMI-R hipotético",pc(valorizacao)+" a.a."],
      ["Consórcio: "+indiceConsorcio+" hipotético",pc(reajusteConsorcio)+" a.a. — "+(veiculo&&periodicidadeVeiculo==="mensal"?"mensal equivalente":"anual")],
      ...(veiculo?[]:[["Aluguéis: IGP-M hipotético",pc(reajusteAluguel)+" a.a."]]),
      ["Capital próprio inicial",fmt(capital)],
      ["Prestação inicial do consórcio",fmt(parcela)],
      ["Prestação após a contemplação/lance",fmt(parcelaApos)],
      ["Aportes alternativos equivalentes ao desembolso próprio",fmt(comparado.aportesAlternativos)+" até o horizonte"],
      ...(veiculo?[]:[["Aluguel utilizado para abater prestações",fmt(comparado.rentCovered)],
      ["Aluguel excedente investido",fmt(comparado.rentSurplus)]]),
      ["Aplicação integral — ativos no horizonte",fmt(comparado.investment)],
      ["Compra do imóvel à vista — ativos no horizonte",comparado.cashPossible?fmt(comparado.cash):"Inviável; faltam "+fmt(comparado.shortfall)],
      ["Alavancagem — "+bemNome+" no horizonte",fmt(comparado.scenarios[2].property)],
      ["Alavancagem — aplicações no horizonte",fmt(comparado.scenarios[2].portfolio)],
      ["Alavancagem — ativos brutos no horizonte",fmt(comparado.gross)],
      ["Alavancagem — parcelas efetivamente pagas até o horizonte",fmt(comparado.paidLever)],
      ["Alavancagem — prestações posteriores ao horizonte",comparado.left+" parcelas, valor vigente "+fmt(comparado.installmentAtH)],
      ["Alavancagem — soma nominal de parcelas restantes congeladas na fotografia (informativa)",fmt(comparado.futureNominal)],
      ["Cenário com maior estoque bruto de ativos na data",comparado.best.name+" — "+fmt(comparado.best.value)]
    ];
    const contraste = "No mês "+horizonte+", a aplicação integral acumula "+fmt(comparado.investment)
      +", a compra à vista "+(comparado.cashPossible?fmt(comparado.cash):"não é viável com o capital disponível")
      +" e a alavancagem soma "+fmt(comparado.gross)+" em ativos brutos. O consórcio já teve "
      +fmt(comparado.paidLever)+" pagos e ainda prevê "+comparado.left
      +" prestações após o horizonte (soma nominal congelada na data "+fmt(comparado.futureNominal)
      +"). "+(veiculo?"O veículo deprecia conforme hipótese editável e as parcelas saem integralmente do bolso.":"O aluguel abate as parcelas e os aportes alternativos correspondem só à diferença do bolso.")+" Obrigações posteriores não são descontadas dos ativos brutos, que não equivalem a patrimônio líquido." ;
    const detalhes = '<details class="pat-report-details"><summary>Ver composição da alavancagem, premissas e memória de cálculo</summary><div class="pat-report-inner">'
      + renderMetrics([
        ["Capital próprio inicial",fmt(capital)],
        ["Lance e complemento do "+bemNome,fmt(capitalUtilizado)],
        ["Capital preservado e investido",fmt(capitalInvestido)],
        ["Ativos brutos na fotografia",fmt(comparado.gross)],
        ["Prestações nominais após o horizonte (não é saldo devedor)",fmt(comparado.futureNominal)],
        ["Prestações pagas até o horizonte",fmt(comparado.paidLever)],
        ...(veiculo?[]:[["Aluguel / prestação base",pc(cobertura)],
        ["Aluguel que abateu prestações",fmt(comparado.rentCovered)],
        ["Sobra de aluguel aplicada",fmt(comparado.rentSurplus)]])
      ])
      + renderTimeline(timeline) + renderArguments(argumentos)
      + renderRows(rows) + renderWarnings(alertas) + '</div></details>';
    $("resultado-patrimonio").innerHTML = window.PatrimonioComparador.render(comparado)
      + '<div class="pat-contrast">'+esc(contraste)+'</div>'
      + detalhes
      + '<div class="result-actions"><button type="button" class="to-offer">Gerar proposta com esta análise →</button></div>';
    const expandButton = $("pat-expand");
    if(expandButton && $("painel-patrimonio").classList.contains("pat-results-expanded")) {
      expandButton.textContent="Sair da tela inteira";
      expandButton.setAttribute("aria-pressed","true");
    }

    if (typeof window.receberAnalisePatrimonial === "function") {
      window.receberAnalisePatrimonial({
        rows: [["Estratégia", "Comparação entre investimento, compra à vista e alavancagem patrimonial"],
          ["Categoria",veiculo?"Veículo":"Imóvel"],
          ...comparaveis, ...rows,
          ["Conclusão contextual",contraste],
          ...argumentos.map((a,i)=>["Argumento "+(i+1),a])],
        warnings: [veiculo?"Veículo: depreciação anual hipotética editável, sem aluguel. Reajuste do consórcio por "+indiceConsorcio+" ("+(periodicidadeVeiculo==="mensal"?"mensal equivalente":"anual")+"); taxa específica contratual deve ser confirmada.":"Imóvel: IGMI-R para valorização; IGP-M reajusta o aluguel, que reduz a prestação ajustada pelo INCC-M. Só o desembolso próprio vira aporte nas alternativas.",
          "Prestações após o horizonte não são descontadas nem antecipadas. A soma nominal informativa pressupõe o valor vigente congelado, sem novos reajustes. Ativos brutos não representam patrimônio líquido ou valor de quitação.",
          ...alertas],
        example: isExample
      });
    }
  }

  const form = $("form-patrimonio");
  if (!form) return;

  // A categoria é selecionada visualmente, sem depender do comparador principal.
  const savedModes={
    imovel:null,
    veiculo:{
      "a-preco":"","a-valorizacao":"-10.00",
      "a-reajuste-consorcio":"4.89","a-aluguel":"0,00",
      "a-reajuste-aluguel":"6.30"
    }
  };
  const modeFieldIds=["a-preco","a-valorizacao","a-reajuste-consorcio",
    "a-aluguel","a-reajuste-aluguel"];
  const snapshotMode=()=>Object.fromEntries(modeFieldIds.map(id=>[id,$(id).value]));
  const vehicleIndexHint=()=>{
    const index=$("a-indice-veiculo").value;
    const veh=index==="ipca";
    $("a-reajuste-consorcio-label").textContent=veh?
      "Reajuste do consórcio pelo IPCA":"Reajuste contratual do consórcio (taxa manual)";
    $("a-nota-reajuste").innerHTML=veh?
      'Veículo: <strong>IPCA de 4,89% a.a.</strong> como referência histórica de dez anos (set/2016–ago/2026). <a href="https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json" target="_blank" rel="noopener noreferrer">Fonte: BCB, SGS 433</a>. O contrato pode prever tabela FIPE, preço de montadora ou outro critério. Configure periodicidade anual ou mensal equivalente.':
      'Veículo: informe a taxa anual equivalente segundo a <strong>regra do seu contrato</strong> (FIPE por modelo/ano, tabela da montadora ou índice indicado). Não existe uma taxa FIPE universal; confirme a base e a periodicidade do grupo.';
  };
  function setAssetMode(mode, options={}) {
    if(!["imovel","veiculo"].includes(mode))return;
    const previous=$("a-tipo-bem").value;
    if(options.reset){
      savedModes.imovel={
        "a-preco":"","a-valorizacao":"8.92","a-reajuste-consorcio":"6.63",
        "a-aluguel":"0,00","a-reajuste-aluguel":"6.30"
      };
      savedModes.veiculo={
        "a-preco":"","a-valorizacao":"-10.00","a-reajuste-consorcio":"4.89",
        "a-aluguel":"0,00","a-reajuste-aluguel":"6.30"
      };
    } else if(previous!==mode) {
      savedModes[previous]=snapshotMode();
    }
    if(previous!==mode||options.reset) {
      const saved=savedModes[mode];
      if(saved)for(const [id,value] of Object.entries(saved))$(id).value=value;
    }
    $("a-tipo-bem").value=mode;
    const vehicle=mode==="veiculo";
    document.querySelectorAll("#painel-patrimonio .pat-mode-card").forEach(btn=>{
      const active=btn.dataset.asset===mode;
      btn.classList.toggle("selected",active);
      btn.setAttribute("aria-pressed",String(active));
    });
    document.querySelectorAll("#painel-patrimonio .pat-property-only").forEach(el=>el.hidden=vehicle);
    document.querySelectorAll("#painel-patrimonio .pat-vehicle-only").forEach(el=>el.hidden=!vehicle);
    $("patrimonio-grupo-imovel").textContent=vehicle?"Veículo e depreciação":"Imóvel e renda";
    $("a-preco-label").textContent=vehicle?"Preço do veículo desejado":"Preço do imóvel desejado";
    $("a-valorizacao-label").textContent=vehicle?
      "Desvalorização hipotética do veículo":"Valorização hipotética do imóvel pelo IGMI-R";
    $("a-valorizacao-unit").textContent=vehicle?"% a.a. · use negativo para depreciação":"% a.a. · residencial";
    $("a-bem-descricao").textContent=vehicle?
      "Defina o valor do veículo e quanto espera que ele perca por ano, sem atribuir renda de aluguel.":
      "Defina o preço do imóvel e as hipóteses opcionais de locação e valorização.";
    $("a-tipo-nota").textContent=vehicle?
      "Veículo de uso particular: depreciação editável, sem aluguel e reajuste do consórcio conforme contrato.":
      "Imóvel: IGMI-R para valorização, INCC-M para reajuste do consórcio e IGP-M para aluguel.";
    $("a-nota-bem").innerHTML=vehicle?
      '<strong>Depreciação ilustrativa de −10% a.a.</strong> (valor negativo e editável). Não é um índice histórico FIPE; os valores reais dependem do modelo, ano, km e mercado. <a href="https://veiculos.fipe.org.br/" target="_blank" rel="noopener noreferrer">Tabela FIPE</a> é uma referência por veículo específico. Não são considerados combustível, manutenção, seguro, IPVA, licenciamento ou revenda com impostos.':
      '<strong>Janela histórica de 10 anos (set/2016–ago/2026)</strong>. IGMI-R Brasil: <strong>8,92% a.a.</strong> (<a href="https://www.abecip.org.br/igmi-r-abecip/serie-historica" target="_blank" rel="noopener noreferrer">ABECIP</a>); IGP-M: <strong>6,30% a.a.</strong> (<a href="https://corrigirvalor.com.br/tabela/igp-m" target="_blank" rel="noopener noreferrer">FGV/BCB</a>). Taxas editáveis; sem custos e vacância.';
    $("a-nota-horizonte").innerHTML=vehicle?
      "Fotografia até o mês informado: no consórcio, paga-se a prestação do próprio bolso. Nas alternativas, investe-se esse mesmo valor. O veículo deprecia até o horizonte; reajuste conforme índice e periodicidade escolhidos. Obrigações posteriores são mostradas separadamente, sem serem descontadas dos ativos brutos.":
      "Fotografia até o mês informado. O aluguel <strong>abate primeiro a prestação</strong>; nas alternativas, investe-se somente a diferença do bolso. Sobras de aluguel são aplicadas no consórcio, com IGP-M no aluguel e INCC-M nas parcelas. Obrigações posteriores são apenas informativas.";
    if(vehicle)vehicleIndexHint();
    else{
      $("a-reajuste-consorcio-label").textContent="Reajuste do consórcio pelo INCC-M";
      $("a-nota-reajuste").innerHTML=
        'Referência editável de <strong>10 anos (set/2016–ago/2026)</strong>: INCC-M acumulado ≈ 89,99%, média composta de <strong>6,63% a.a.</strong> <a href="https://corrigirvalor.com.br/tabela/incc-m" target="_blank" rel="noopener noreferrer">Fonte: FGV IBRE / BCB, SGS 7456</a>. Reajuste anual na projeção; o contrato é soberano.';
    }
    if(previous!==mode&&!options.keepResult){
      $("resultado-patrimonio").innerHTML='<div class="empty-result"><h3>Simule '+(vehicle?"um veículo":"um imóvel")+'</h3><p>Preencha os dados da categoria selecionada e gere a nova análise.</p></div>';
      if(window.receberAnalisePatrimonial)window.receberAnalisePatrimonial(null);
      isExample=false;
    }
    $("erro-patrimonio").textContent="";
  }
  document.querySelectorAll("#painel-patrimonio .pat-mode-card").forEach(btn=>{
    btn.addEventListener("click",()=>setAssetMode(btn.dataset.asset));
  });
  $("a-indice-veiculo").addEventListener("change",()=>{
    if($("a-tipo-bem").value==="veiculo"){
      if($("a-indice-veiculo").value==="ipca")$("a-reajuste-consorcio").value="4.89";
      vehicleIndexHint();
    }
  });
  setAssetMode("imovel",{keepResult:true});

  $("painel-patrimonio").addEventListener("click",(e)=>{
    if(!e.target.closest("#pat-expand")) return;
    const panel=$("painel-patrimonio");
    const expanded=panel.classList.toggle("pat-results-expanded");
    const button=$("pat-expand");
    button.textContent=expanded?"Sair da tela inteira":"Expandir tela inteira";
    document.body.classList.toggle("pat-fullscreen-active",expanded);
    button.setAttribute("aria-pressed",String(expanded));
  });
  document.addEventListener("keydown",(e)=>{
    if(e.key==="Escape"&&$("painel-patrimonio").classList.contains("pat-results-expanded")){
      $("painel-patrimonio").classList.remove("pat-results-expanded");
      document.body.classList.remove("pat-fullscreen-active");
      const button=$("pat-expand");
      if(button){button.textContent="Expandir tela inteira";button.setAttribute("aria-pressed","false");button.focus();}
    }
  });
  const example = {
    "a-capital":"100.000,00", "a-carta":"100.000,00", "a-preco":"100.000,00",
    "a-proprio":"50.000,00", "a-embutido":"0,00",
    "a-parcela":"", "a-prazo":"120", "a-taxa":"20,00",
    "a-contemplacao":"", "a-horizonte":"60",
    "a-parcela-apos":"", "a-prazo-apos":"",
    "a-aluguel":"0,00",
    "a-valorizacao":"8.92", "a-rendimento":"8.41",
    "a-reajuste-consorcio":"6.63", "a-reajuste-aluguel":"6.30"
  };
  const vehicleExample={
    "a-capital":"40.000,00","a-carta":"80.000,00","a-preco":"80.000,00",
    "a-proprio":"20.000,00","a-embutido":"0,00","a-parcela":"",
    "a-prazo":"80","a-taxa":"18,00","a-contemplacao":"",
    "a-horizonte":"36","a-parcela-apos":"","a-prazo-apos":"",
    "a-aluguel":"0,00","a-valorizacao":"-10.00","a-rendimento":"8.41",
    "a-reajuste-consorcio":"4.89","a-reajuste-aluguel":"6.30"
  };
  ["a-carta","a-prazo","a-taxa","a-parcela"].forEach((id) => {
    $(id).addEventListener("input",()=>{
      if (id!=="a-carta") {
        coreHistory=coreHistory.filter(x=>x!==id);
        if ($(id).value.trim()) coreHistory.push(id);
        coreHistory=coreHistory.slice(-2);
        $(id).classList.remove("is-derived");
      }
      deriveCore();derivePost();
    });
  });
  ["a-proprio","a-embutido","a-contemplacao"].forEach((id)=>{
    $(id).addEventListener("input",()=>{derivePost();});
  });
  $("a-parcela-apos").addEventListener("input",()=>{
    postManual.pay=!!$("a-parcela-apos").value.trim();
    $("a-parcela-apos").classList.remove("is-derived");
    derivePost();
  });
  $("a-prazo-apos").addEventListener("input",()=>{
    postManual.term=!!$("a-prazo-apos").value.trim();
    $("a-prazo-apos").classList.remove("is-derived");
    derivePost();
  });
  $("a-exemplo").addEventListener("click", () => {
    const ex=$("a-tipo-bem").value==="veiculo"?vehicleExample:example;
    for (const [id,value] of Object.entries(ex)) $(id).value=value;
    savedModes[$("a-tipo-bem").value]=snapshotMode();
    if (window.ConsorcioMasks) window.ConsorcioMasks.formatAll();
    coreHistory=["a-prazo","a-taxa"];
    postManual.pay=false;postManual.term=false;
    deriveCore();derivePost();$("a-avancado").open=true;
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
    $("painel-patrimonio").classList.remove("pat-results-expanded");
    document.body.classList.remove("pat-fullscreen-active");
    coreHistory=["a-prazo","a-taxa"];postManual.pay=false;postManual.term=false;
    const preserveMode=$("a-tipo-bem").value;
    window.setTimeout(() => {
      setAssetMode(preserveMode,{reset:true,keepResult:true});
      $("a-avancado").open=false;
      form.querySelectorAll(".is-derived").forEach(el=>el.classList.remove("is-derived"));
      $("a-core-status").textContent="Preencha a carta e mais dois valores entre prazo, taxa total e prestação; o terceiro será calculado.";
      $("a-post-status").textContent="Com lance, se o mês não for informado, considera-se a assembleia seguinte. Os dados pós-lance são estimados linearmente.";
      $("erro-patrimonio").textContent="";
      $("resultado-patrimonio").innerHTML='<div class="empty-result"><span class="empty-icon">↗</span><h3>Construa um cenário de patrimônio</h3><p>Informe os dados para comparar investimentos, aquisição do bem e obrigações até a data escolhida.</p></div>';
      if (window.receberAnalisePatrimonial) window.receberAnalisePatrimonial(null);
    },0);
  });
}());
