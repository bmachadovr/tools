# Calculadora de Consórcio — Central de Estratégias Comerciais

> **Status:** especificação funcional e técnica aprovada para início do desenvolvimento (17/11/2026).  
> **Local:** `tools/calculadora-consorcio/` (pasta `calculadora-consorcio/` na raiz do repositório `tools`).  
> **Produto:** aplicação web independente, estática, responsiva e orientada ao apoio à negociação.  
> **Importante:** este README documenta o projeto; nenhuma funcionalidade está implementada apenas pela criação desta pasta.

## 1. Propósito

Construir uma **central de estratégias de consórcio**, inspirada na experiência de uso da Calculadora de Crédito existente, com foco em **análises que ajudem a transformar números em explicações e propostas comerciais claras**.

A ferramenta deve responder, principalmente:

- Em que condições um consórcio pode fazer sentido para este cliente?
- Como diferentes fontes e tipos de lance afetam crédito disponível, desembolso e pagamentos futuros?
- Como uma proposta se compara ao financiamento, à compra à vista ou à proposta de outra administradora?
- Que premissas, vantagens, limitações e riscos precisam ser mostrados com transparência?
- Como gerar um resumo simples e compartilhável para apoiar a conversa comercial?

**Não se trata de um simulador básico de contratação.** Já existe uma solução operacional interna para informar carta, prazo, prestações e condições do produto. Evitar retrabalho e duplicação de funcionalidades é uma decisão expressa de escopo.

### 1.1. Usuário e contexto

- Usuário principal: profissional que faz atendimento e oferta de consórcio.
- Uso principal: atendimento em computador, com previsão de utilização em celular.
- Uso secundário: apresentar ao cliente cenários e enviar um resumo de proposta pelo WhatsApp.
- Uso sem integração inicial com sistemas internos: dados necessários serão informados manualmente, de preferência reaproveitando resultados de uma simulação já disponível ao atendente.
- O objetivo comercial **não autoriza distorcer resultados** nem privilegiar uma alternativa sem fundamento matemático.

## 2. Regra absoluta de identidade e neutralidade

**Obrigatório em todo o projeto, sem exceções:**

1. A instituição utilizada como referência operacional **não pode ser identificada** pelo nome, marca, sigla, logotipo ou outros identificadores.
2. Essa proibição vale para **toda a interface, código-fonte, HTML, CSS, JavaScript, variáveis, funções, comentários, dados de teste, configurações, caminhos, nomes de arquivos, metadados, títulos, textos de SEO, documentação, propostas e mensagens geradas**.
3. Nenhuma paleta, símbolo, assinatura ou aparência deve sugerir vínculo ou endosso institucional não declarado.
4. Para a alternativa principal utilizar somente rótulos neutros, como **“Plano de referência”**, **“Nossa simulação”** ou **“Cenário analisado”**.
5. **Administradoras concorrentes podem ser nomeadas** e comparadas. Exemplos de nomes permitidos quando sustentados por dados: Santander, Itaú, CAIXA Consórcio, Porto Bank e Embracon.
6. Não embutir identificação institucional oculta em constantes, chaves, IDs, comentários, identificadores internos, commits de conteúdo, amostras ou telemetria.
7. Antes de cada publicação, revisar manualmente e por busca automatizada os identificadores proibidos estabelecidos fora deste repositório, sem registrar tais identificadores nos próprios arquivos do projeto.

A neutralidade visual e nominal **não elimina** a necessidade de declarar as premissas, características contratuais e fontes dos resultados. Não afirmar que uma hipótese vale para todas as administradoras.

## 3. Princípios do produto

- **Valor comercial antes de volume de funcionalidades.** Priorizar decisões reais de atendimento.
- **Cálculo verificável.** Regras e fórmulas explícitas, testes matemáticos e rastreabilidade das premissas.
- **Sem falsa precisão.** Não apresentar cenário hipotético como proposta confirmada.
- **Sem promessa de contemplação.** Contemplação por sorteio ou lance depende das regras do grupo e de fatores que não são controlados pela ferramenta.
- **Comparações justas.** Equalizar crédito líquido, momento de aquisição, aporte inicial, prazo, cobertura de encargos e hipóteses de reajuste.
- **Poucos campos por tarefa.** Usar informação já obtida em simulação operacional quando disponível.
- **Linguagem acessível.** Explicar finalidade, campos e resultados para quem não domina consórcio.
- **Privacidade por padrão.** Não depender de nome, CPF, número de contrato, telefone ou dados pessoais de clientes.
- **Baixa complexidade.** Aplicação simples em HTML/CSS/JavaScript, executada no navegador, sem backend obrigatório.
- **Sem apresentação enviesada.** Se outra alternativa for melhor nas premissas informadas, mostrar isso.

## 4. Escopo funcional — primeira versão (MVP)

### 4.1. Comparar alternativas — prioridade 1

**Objetivo:** comparar consórcio, financiamento e, quando pertinente, compra à vista.

**Entradas essenciais:**
- Valor efetivo do bem e valor de crédito utilizável.
- Condições obtidas no simulador operacional: crédito nominal, prestação(ões), prazo restante, taxa total de administração, fundo de reserva, seguros e outros custos aplicáveis.
- Alternativa de financiamento: entrada, prazo, parcela, taxa/CET e encargos, quando disponíveis.
- Horizonte de comparação e cenários **hipotéticos** de contemplação (sem previsão nem garantia).
- Premissas de reajuste do bem e das prestações, se aplicáveis.

**Resultados:**
- Capital próprio necessário e desembolso inicial.
- Fluxo mensal e desembolso acumulado em cada cenário.
- Custo total projetado e custos segregados por tipo.
- Diferenças em reais e percentuais sob hipóteses equivalentes.
- Diferença de disponibilidade do bem: aquisição imediata versus aquisição condicionada à contemplação.
- Conclusão comercial descritiva, incluindo desvantagens e riscos.

**Atenção:** uma comparação apenas entre parcelas, sem considerar o momento em que o cliente recebe o bem, **é inadequada**.

### 4.2. Estratégia de lances — prioridade 2

**Objetivo:** comparar lance com recursos próprios, embutido e combinado, respeitando o regulamento de cada plano.

**Entradas:**
- Crédito nominal, valor líquido desejado para aquisição e recursos próprios disponíveis.
- Lance próprio, lance embutido, percentual máximo admitido e base contratual de cálculo. Para o cenário operacional informado, adotar teto de **30% da carta para o componente embutido**; capital próprio pode ser somado. O percentual efetivo precisa ser verificado para cada grupo.
- Prazo e prestações de referência; regras de amortização pós-lance.
- Uso de FGTS **somente quando admitido** para a operação e observadas as condições aplicáveis.

**Resultados:**
- Valor e percentual de cada lance, discriminando origens.
- Crédito líquido destinado à compra após dedução de lance embutido e demais deduções aplicáveis.
- Valor de carta necessário para atingir o crédito líquido desejado.
- Desembolso próprio, recursos preservados e evolução de prestações ou prazo, quando o contrato permitir.
- Cenários de redução de prazo ou de parcela, sempre de acordo com a regra do plano.

**Regras críticas:**
- **Lance embutido não é dinheiro adicional disponível**: utiliza parte do próprio crédito e reduz o valor líquido para adquirir o bem.
- **Regra operacional informada:** o lance embutido pode chegar a **30% da própria carta**, somado a lance de capital próprio. O limite de 30% é exclusivo do componente embutido e não é teto do lance total; verificar limites mais restritivos do grupo.
- Não contar lance embutido como desembolso de recursos próprios.
- O efeito financeiro do lance depende de contemplação efetiva e das regras de amortização.
- Percentual de lance, lance embutido e cálculo de prestações não devem usar fórmulas universais quando forem regras particulares de um plano.
- Um lance maior **não garante contemplação**.

### 4.3. Analisar proposta concorrente — prioridade 3

**Objetivo:** comparar um plano de referência sem identificação institucional com propostas de administradoras concorrentes **identificáveis**.

**Entradas:**
- Administradora concorrente e modalidade (veículos, imóveis etc.).
- Dados conferidos da proposta: carta, crédito líquido, prazo, parcelas e sua evolução, taxa de administração, fundo de reserva, seguros, reajustes, condições de lance e demais encargos.
- Fonte, data de consulta, validade e eventuais restrições comerciais.
- Mesmo objetivo de compra e parâmetros comuns entre as alternativas.

**Resultados:**
- Tabela lado a lado com **Plano de referência** e concorrente(s).
- Diferenças de prestações, custos projetados, crédito disponível e regras contratuais.
- Alertas de comparação não equivalente e campos ausentes.
- Argumentos comerciais baseados em diferenças verificáveis; vantagens e desvantagens de todas as alternativas.

**Fontes e atualização:**
- Dados públicos de sites oficiais e regulamentos, quando acessíveis.
- Propostas reais fornecidas pelo cliente e registradas manualmente com a devida referência.
- Estatísticas do Banco Central como **contexto de mercado**, não como substitutas de preços e condições individuais.
- Atualização automática apenas se existir fonte autorizada, estável e tecnicamente acessível.
- Registrar **fonte, data e status de validação**; evitar apresentar preços de divulgação como oferta vigente e garantida.
- Não coletar automaticamente dados de sistemas protegidos ou contornar autenticação e restrições de acesso.

### 4.4. Gerador de proposta comercial — prioridade 4

**Objetivo:** converter a análise em uma peça curta, profissional e compreensível.

**Saídas previstas:**
- Resumo com objetivo do cliente, entradas, cenários, diferenças financeiras e condições.
- Tabelas e gráficos simples, legíveis no celular.
- Texto comercial em linguagem natural, sem afirmações enganosas.
- Botão de copiar e opção de compartilhar pelo WhatsApp; se possível, impressão/PDF pelo navegador.
- Avisos claros de hipóteses, fontes, validade das condições e ausência de garantia de contemplação.

**Regras:** não preencher automaticamente dados pessoais, não inserir assinatura institucional, não inventar taxas ou condições e não ocultar custos desfavoráveis.

## 5. Evolução posterior — não faz parte do MVP

1. **Planejamento de aquisição:** comparar cenários para quem pretende comprar ou trocar um bem em meses/anos, considerando datas hipotéticas de contemplação.
2. **Custo de oportunidade e patrimônio:** comparar preservar ou aplicar recursos, utilizá-los como lance, poupar para comprar à vista ou financiar.
3. **Carta ideal / crédito líquido necessário:** recurso avançado dentro da estratégia de lances, quando a fórmula do plano for conhecida e validada.
4. **Amortização avançada:** modelos de redução de prazo ou de prestações com regras específicas do contrato.
5. **Biblioteca de condições de concorrentes:** histórico datado e auditável das informações públicas e comerciais, quando houver benefício comprovado.
6. **Argumentação contextual:** sugestões calculadas conforme objeção ou perfil da operação, sem transformar o sistema em um gerador de argumentos enviesados.

**Fora de escopo no lançamento:** simulador básico duplicado, CRM, cadastro de clientes, integração com sistemas internos, backend, autenticação e armazenamento de dados sensíveis.

## 6. Modelo de dados e parâmetros

Separar o **motor matemático** das **regras contratuais configuráveis** e da **camada de apresentação**.

### 6.1. Dados da operação

- Modalidade e finalidade: veículo, imóvel ou outras.
- Preço do bem; valor do crédito nominal; crédito líquido efetivamente utilizável.
- Prazo, data-base e cronograma de prestações informadas ou projetadas. Registrar **data de constituição do grupo**, pois ela pode determinar o regime normativo aplicável.
- Taxa de administração **definida para cada proposta/grupo** (base de incidência, percentual total, eventual cobrança antecipada e distribuição temporal); nenhum percentual global será presumido.
- Fundo comum: **percentuais mensais e distribuição definidos pela proposta/grupo**, não necessariamente lineares; histórico, saldos e base de cálculo.
- Fundo de reserva (base, cobrança, distribuição temporal e eventual restituição conforme contrato).
- Seguro e outros encargos, quando existirem.
- Critério e periodicidade de reajuste; índice de referência, se previsto.
- Regras de lance, lance embutido e amortização aplicáveis; separar o teto do embutido da soma com capital próprio.
- Recursos próprios, entrada e objetivos financeiros do cliente.

### 6.2. Dados da comparação

- Financiamento: preço do bem, entrada, valor financiado, prestações, prazo, juros, CET/encargos e cronograma.
- Concorrente: administradora, identificação da proposta, condições, fonte e data.
- Cenários: mês hipotético de contemplação, hipótese de reajuste e rendimento alternativo, quando pertinente.
- Identificador genérico de cenário, sem conteúdo institucional.

### 6.3. Regras de cálculo

- Exibir valor nominal e, quando útil, comparação em valores presentes, **explicitando taxa de desconto**.
- Distinguir **parcela inicial**, **parcela futura projetada**, **custo contratual** e **custo total efetivo desembolsado**.
- Custo total projetado deve agregar apenas fluxos efetivamente pagos, sem dupla contagem de aportes, lances e parcelas.
- Separar desembolso de recursos próprios de redução do crédito por lance embutido.
- Não supor valor de restituição do fundo de reserva sem base contratual.
- Não substituir o CET do financiamento por taxa nominal, quando o CET for necessário para uma comparação justa.
- Reajustes devem ser parametrizados, e a ferramenta precisa mostrar cenários sem reajuste e com reajustes definidos pelo usuário, se aplicáveis.
- Cálculos devem tratar datas, prazos, arredondamentos e parcelas residuais de forma determinística.
- Se faltar informação crítica, **exibir “dados insuficientes” ou comparação parcial**, nunca preencher custos relevantes silenciosamente com zero.
- O sistema deve diferenciar **valor informado**, **valor calculado**, **valor estimado** e **condição verificada**.

## 7. Experiência do usuário e design

Inspirar-se no padrão geral da Calculadora de Crédito existente, sem reproduzir identidade visual de instituição financeira.

- Primeiro computador: largura confortável, boa densidade de informação e resultados lado a lado.
- Responsividade real para celular: campos grandes, cartões reorganizáveis e tabelas sem perda de leitura.
- Navegação por funcionalidades: menu superior / menu móvel, cartões e, se adequado, carrossel entre módulos.
- Visual profissional, limpo e neutro, com temas **Claro, Escuro e Colorido**; o tema colorido deve ter paleta própria, não institucional.
- Cada módulo terá uma **explicação de uso breve e objetiva**, compreensível para leigos.
- Exemplo opcional com números fictícios, claramente identificado, e botão **Limpar**.
- Campos essenciais primeiro; opções avançadas recolhidas em seção de detalhes.
- Máscaras brasileiras: moeda em R$, percentuais, inteiros e datas em `dd/mm/aaaa`.
- Validação imediata e legível; botão de calcular somente com dados essenciais válidos.
- Resumo de premissas próximo aos resultados; destaque para riscos e limitações relevantes.
- Acessibilidade: teclado, rótulos explícitos, contraste adequado, foco visível e estados de erro anunciáveis.
- Gerar oferta, copiar resumo e compartilhar por WhatsApp a partir do resultado.

### 7.1. Jornada ideal

1. Escolher a situação comercial (financiamento, lance, concorrente ou proposta).
2. Informar os dados mínimos já disponíveis no atendimento.
3. Calcular e apresentar cenários comparáveis.
4. Ler conclusão fundamentada, incluindo oportunidades e riscos.
5. Ajustar hipóteses e gerar mensagem/proposta.

## 8. Arquitetura e publicação

- Repositório: `tools`; diretório: `calculadora-consorcio/`.
- Site estático publicado via GitHub Pages, mantendo independência dos demais módulos.
- Tecnologias preferenciais: **HTML, CSS e JavaScript puros**, sem framework ou build obrigatório.
- Estrutura sugerida quando iniciar a implementação:

```text
calculadora-consorcio/
├── README.md
├── index.html
├── css/
│   └── app.css
├── js/
│   ├── app.js
│   ├── calculos.js
│   ├── regras.js
│   └── propostas.js
├── data/
│   └── fontes-exemplo.json
└── tests/
    └── calculos.test.js
```

- Nomes técnicos devem ser genéricos e descritivos; não usar identificadores da instituição de referência.
- Regras contratuais nunca devem estar espalhadas pela UI; centralizar parâmetros configuráveis e validar seu formato.
- Sem segredo ou credencial no navegador; não usar chaves privadas em arquivos públicos.
- Preferir cálculos inteiramente locais para preservar privacidade e disponibilidade.
- Cadastrar o link da nova ferramenta na página inicial de `tools` **somente após a implementação mínima estar utilizável**.
- Rodapé sugerido: **“Simulação matemática. Resultados sujeitos às premissas e condições contratuais. Desenvolvido por: bmachado.dev – 2026.”**
- Não copiar elementos gráficos nem mensagens institucionais de terceiros.

## 9. Qualidade, conferência e segurança comercial

Antes de divulgar qualquer módulo:

1. Confrontar resultados com **exemplos verificáveis** de simulações operacionais e propostas reais, utilizando dados anonimizados.
2. Registrar casos de teste: sem lance; lance próprio; lance embutido; combinado; crédito líquido inferior ao necessário; reajuste; taxa/seguro ausente; dados contraditórios; contemplação hipotética em meses diferentes.
3. Conferir totais de desembolso mês a mês e igualdade dos fluxos na comparação.
4. Testar limites e entradas inválidas: zero, negativos, datas inconsistentes, percentuais fora da faixa, prazo excessivo e valor de lance superior ao limite contratual.
5. Exigir fonte e data para propostas de concorrentes; marcar dados vencidos como não confirmados.
6. Identificar explicitamente resultados que **não** podem ser inferidos apenas com números: chance de contemplação, aprovação cadastral, regras de assembleia, disponibilidade imediata, preços efetivos e restituições.
7. Testar navegação em desktop e celular; não publicar gráficos e tabelas que escondam dados relevantes.
8. Revisar a identidade neutra de ponta a ponta antes do commit e da publicação.
9. Validar textos comerciais: nenhuma afirmação de contemplação garantida, de economia universal ou de superioridade sem comparação equivalente.

## 10. Roadmap por ordem de entrega

### Fase 0 — Preparação (atual)

- [x] Definir missão comercial e descartar simulador básico duplicado.
- [x] Definir neutralidade absoluta da instituição de referência e permissão de nomear concorrentes.
- [x] Definir módulos prioritários e arquitetura simples.
- [x] Criar diretório e README do projeto.
- [ ] Reunir **exemplos anonimizados** com condições contratuais reais e documentar premissas.
- [ ] Criar casos matemáticos de referência e critérios de validação.

### Fase 1 — MVP

- [ ] Criar interface responsiva e navegação.
- [ ] Implementar **Comparar alternativas**.
- [ ] Implementar **Estratégia de lances**.
- [ ] Implementar **Analisar proposta concorrente**.
- [ ] Implementar **Gerador de proposta** e compartilhamento.
- [ ] Executar testes numéricos e revisão de textos.
- [ ] Adicionar à página inicial de `tools` quando estiver pronto.

### Fase 2 — Inteligência comercial

- [ ] Planejamento de aquisição.
- [ ] Comparação de custo de oportunidade e investimentos.
- [ ] Análise de amortização avançada.
- [ ] Catálogo atualizado e verificável de condições concorrentes, caso seja sustentável.
- [ ] Melhorias de argumentos e apresentações fundamentadas.

## 11. Decisões técnicas ainda pendentes

Definir **com base em dados reais**, antes de codificar regras específicas:

- Fórmula contratual de distribuição da taxa de administração e eventuais antecipações.
- Índices e periodicidade de reajuste por modalidade/plano.
- Fundo de reserva, seguro, restituições e cobranças eventuais.
- Limites de lance embutido e bases de cálculo.
- Critério de abatimento de saldo, prazo e/ou parcelas após lance.
- Regras aplicáveis a FGTS, quando pertinente.
- Como obter e renovar condições documentadas de concorrentes.
- Convenção exata de arredondamento e tratamento de diferenças residuais.

**Regra de decisão:** na ausência de informação suficiente, entregar cálculo parcial transparente em vez de inventar parâmetros.

## 12. Critérios de aceite do MVP

O MVP estará pronto quando:

- Um atendente conseguir executar as quatro tarefas prioritárias **sem usar outro simulador básico dentro desta ferramenta**.
- Uma pessoa leiga entender o preenchimento com explicações curtas.
- Resultados financeiros forem reproduzíveis, rastreáveis e passarem nos casos de teste.
- Lances embutidos, reajustes e datas hipotéticas não produzirem conclusões enganosas.
- Propostas concorrentes exibirem nome, fonte e data quando disponíveis, ou aviso de ausência dessas informações.
- O gerador produzir um resumo comercial útil para WhatsApp com premissas e alertas.
- O código e a interface não contiverem identificadores da instituição de referência.
- O projeto funcionar como página estática, de modo independente, no desktop e no celular.

---

**Princípio orientador:** esta ferramenta não precisa calcular tudo; precisa **esclarecer as escolhas do cliente com comparações corretas** e apoiar uma oferta comercial responsável.

## 13. Levantamento preliminar de regras contratuais — 17/11/2026

> **Status:** pesquisa documental preliminar, **não homologada para cálculo de oferta real**. As cláusulas gerais públicas analisadas incluem uma versão de bens móveis de **fevereiro de 2018**, além de informações públicas mais recentes sobre modalidades de consórcio. O conteúdo serve para modelar campos e mecanismos de cálculo, **não** para presumir que uma regra, índice, prazo ou percentual se aplica a todos os grupos atuais. Antes da publicação, validar com as condições do plano e a proposta de participação vigente. Por decisão de identidade do projeto, a fonte institucional não é nomeada nem vinculada neste repositório.

### 13.1. Componentes da prestação

Os contratos analisados preveem os seguintes componentes, que deverão ser calculados em linhas separadas:

- **Fundo comum:** percentual de aquisição do crédito, com integralização contratual de 100% ao longo do plano e distribuição variável definida pela proposta. O contrato histórico de 2018 admite percentuais não lineares.
- **Taxa de administração:** percentual total definido por proposta/grupo, podendo variar inclusive entre participantes, conforme as condições aplicáveis. O contrato histórico de 2018 admite distribuição não linear; **para grupos constituídos a partir de 01/07/2024**, considerar a exigência regulatória de percentual proporcional/fixo, com possibilidade de cobrança antecipada, conforme Resolução BCB nº 285, art. 19. Não extrapolar cláusulas antigas para grupos novos.
- **Taxa de administração antecipada:** parcela eventual **integrante e dedutível da taxa total**, com cronograma próprio nos casos contratualmente permitidos; **não somar duas vezes**. O contrato histórico de 2018 menciona os campos 42 (antecipada), 43 (total) e 44 (quantidade de primeiras prestações com antecipação).
- **Fundo de reserva:** percentual de acordo com a proposta, com cronograma próprio, potencialmente não linear.
- **Seguro:** facultativo/conforme plano; na versão pública analisada de bens móveis, prêmio proporcional ao saldo devedor.
- **Diferenças de prestação, reajustes, tarifas e encargos eventuais:** separados da prestação ordinária.

**Modelo de cálculo genérico por período `t` (sujeito à validação contratual):**

```text
prestacao_t =
    fundo_comum_t
  + administracao_t
  + reserva_t
  + seguro_t
  + diferencas_e_encargos_t

fundo_comum_t    = base_atualizada_t × percentual_fc_t
administracao_t  = base_administracao_t × percentual_ta_t
reserva_t        = base_reserva_t × percentual_fr_t
seguro_t         = base_seguro_t × aliquota_seguro_t
```

- Armazenar **cronogramas de percentuais por parcela**, não apenas taxa total e prazo; registrar também o regime do grupo e os percentuais efetivamente indicados na proposta ou demonstrativo.
- A base e o instante de atualização de cada componente devem ser configuráveis.
- Nunca supor `percentual_fc_t = 1 / prazo` quando houver fator de redução, adesão a grupo em andamento ou parcelas não lineares. **Também não supor taxa de administração linear para grupos antigos nem aplicar distribuição não linear arbitrária a grupos novos.**
- Diferenciar **taxa total contratada**, **taxa antecipada** e **fluxo efetivo de cobrança**.

### 13.2. Reajustes por modalidade

O contrato público histórico de bens móveis analisado mencionava:

- Automóveis, camionetas e motocicletas: **tabela de preço de referência de veículos (FIPE)**.
- Caminhões, tratores, implementos agrícolas e eletroeletrônicos: **IPCA**.
- Possibilidade de critério diferente na assembleia de constituição do grupo.

Materiais públicos mais recentes mencionam, para certas modalidades:

- Imóveis: atualização anual pelo **INCC**.
- Serviços: atualização do crédito pelo **IPCA** até a contemplação.

**Não fixar esses índices universalmente.** Implementar `tipo_indice`, `periodicidade`, `data_base_reajuste`, `historico_valores`, `reajusta_credito` e `reajusta_parcelas_pos_contemplacao` como parâmetros. Em projeções, admitir curva definida pelo usuário; resultados futuros são hipóteses, não valores garantidos.

### 13.3. Lances e contemplação

**Parâmetro operacional informado em 17/11/2026:** é permitido compor o lance com até **30% do valor da própria carta em lance embutido**, acrescido de capital próprio, conforme condições aplicáveis ao grupo.

```text
limite_embutido = valor_carta × 0,30
lance_total = lance_embutido + lance_proprio
credito_liquido_preliminar = valor_carta - lance_embutido
```

Exemplo puramente aritmético: carta R$ 100.000, embutido R$ 30.000, capital próprio R$ 20.000. Lance total R$ 50.000 (50% da carta); crédito líquido preliminar R$ 70.000. O capital próprio **não é adicionado ao crédito** e o teto de 30% **não limita o lance total**. A base para a classificação do lance na assembleia pode ser diferente da carta: validar as regras.

- Modalidades a suportar, conforme disponibilidade no grupo: **livre, fixo, próprio, embutido e combinado**.
- Lance expresso por percentual da **base vigente na assembleia**, parametrizada pela regra do grupo.
- Crédito líquido após lance embutido: `credito_utilizavel = credito_vigente - lance_embutido - deducoes_permitidas` (evitar dupla dedução).
- Um lance vencedor pode permitir amortizar prestações mediante **redução do prazo**, em ordem inversa de vencimento, ou **diluição proporcional nas prestações vincendas**, quando admitido.
- Nas cláusulas históricas analisadas, a amortização proporcional considera **fundo comum, taxa de administração e fundo de reserva**.
- A confirmação e liquidação do lance dependem de **aprovação, pagamento e condições da assembleia**.
- **Não generalizar** o percentual mínimo de 10% ou o prazo de liquidação em dias úteis encontrados no contrato antigo: são exemplos históricos, não defaults homologados.
- Sem acesso a resultados e regras atualizados da assembleia, **não estimar uma chance objetiva de contemplação**; dados históricos de lances não são garantia.

### 13.4. Antecipação e quitação

- O contrato histórico estudado previa opções de amortizar prestações com **redução proporcional da prestação** ou **antecipação das últimas prestações**.
- **Quitar prestações não assegura contemplação imediata**; continuar distinguindo quitação da obrigação e obtenção do crédito.
- Se houver correções ou diferenças de prestação futuras previstas em contrato, indicar que projeções de quitação podem depender de apuração posterior.
- Não aplicar automaticamente descontos financeiros de juros típicos de financiamento sobre valores de consórcio. A redução resulta dos componentes e das regras de amortização.

### 13.5. Disponibilização e uso do crédito

- Atribuição de crédito depende de contemplação, recursos do grupo e cumprimento das condições documentais/contratuais.
- Distinção indispensável entre **carta nominal**, **crédito vigente na assembleia**, **crédito líquido após lance embutido** e **valor efetivamente liberado para a compra**.
- Aprovação documental, análise de capacidade de pagamento, garantias e prazos operacionais **não devem ser tratados como automáticos**.
- Possíveis usos de saldo excedente ou despesas de aquisição, inclusive limitações percentuais, dependem da modalidade e das regras vigentes.

### 13.6. Decisões de engenharia derivadas

1. Definir uma estrutura `plano` com **parâmetros opcionais**, validação e status de confirmação de cada regra.
2. Implementar um **motor de fluxo de caixa mensal** separado do gerador de textos e da UI.
3. Oferecer um **modo simplificado** por entradas totais da proposta e um **modo detalhado** para refletir cronogramas e reajustes reais.
4. Nunca completar dado ausente com parâmetro histórico sem sinalização; mostrar **comparação parcial**.
5. Exibir em cada resultado: **data-base**, hipóteses, grau de confiabilidade e diferença entre resultado nominal e projetado.
6. Tratar **redução de prestações** e **redução do prazo** como rotinas diferentes, testadas contra exemplos anonimizados do simulador operacional.
7. Para comparação com financiamento, usar fluxos na **mesma data-base**, registrar CET e simular **cenários hipotéticos** de contemplação.
8. Não incluir nome, sigla, marca ou outro identificador institucional em nenhum arquivo, mesmo em referências de pesquisa ou comentários.

### 13.7. Casos de teste adicionais identificados

- Distribuição linear versus **não linear** dos percentuais de fundo comum e encargos.
- Meses iniciais com componente de administração antecipada.
- Atualização periódica do preço-base com parcelas futuras reajustadas.
- Alteração do valor de referência após a contemplação, conforme a regra de amortização vigente.
- Lance próprio: consumo de recursos do cliente, sem redução da carta disponível.
- Lance embutido: desconto do crédito, sem consumi-lo como aporte próprio.
- Lance combinado: soma das origens para oferta, abatimentos discriminados.
- Carta R$ 100.000: embutido R$ 30.000 permitido; R$ 30.000,01 bloqueado pelo teto operacional.
- Acrescentar R$ 20.000 próprios ao embutido de R$ 30.000 sem disparar bloqueio de limite de embutido; crédito preliminar R$ 70.000.
- Comparar propostas de dois grupos com mesma carta e prazo, mas taxa de administração total, cronograma de fundo comum e antecipação de administração diferentes.
- Lance vencedor com redução de prazo versus redução proporcional de prestações.
- Quitação de prestações sem contemplação imediata.
- Simulações com informações insuficientes ou limites de lance não confirmados.

### 13.8. Pendências de homologação antes de desenvolver regras específicas

- [ ] Obter texto atualizado das cláusulas gerais dos grupos comercializados atualmente.
- [ ] Verificar proposta de participação modelo com **todos os campos comerciais**, sem informações pessoais.
- [x] Registrar regra operacional informada: até 30% da própria carta em lance embutido, podendo adicionar capital próprio (17/11/2026).
- [ ] Confirmar no plano o limite efetivo e o método de classificação do lance, inclusive a base de cálculo da assembleia.
- [ ] Confirmar valores mínimos de lance, modalidades de disputa e eventual lance fixo.
- [ ] Obter por proposta/grupo o **cronograma de fundo comum e da taxa de administração** e identificar cobrança antecipada, distribuição do fundo de reserva e condições de parcelas reduzidas.
- [ ] Confirmar periodicidade e base do índice para **cada modalidade atual**.
- [ ] Confirmar se seguros e fundo de reserva variam por oferta.
- [ ] Validar no mínimo **três casos reais anonimizados**: sem lance, lance próprio e embutido; incluir amortização pós-lance.
- [ ] Somente após validação, registrar perfil contratual homologado sem identificadores institucionais.

### 13.9. Distribuição das contribuições nas parcelas — verificação regulatória de 17/11/2026

**Conclusão principal:** a cobrança mensal **não pode ser reconstruída com segurança a partir da taxa total e do prazo apenas**. É necessário conhecer o cronograma contratual dos componentes, a data de constituição do grupo e a existência de antecipações ou reduções.

**Evidência de regras históricas:** o contrato de bens móveis de fevereiro de 2018 admite distribuição não linear de **fundo comum**, **fundo de reserva** e **taxa de administração** quando definida na Proposta de Participação (cláusulas 11.3, 11.4 e 11.5). Sua cláusula 11.7.17 trata da administração antecipada cobrada nas primeiras prestações com percentual e período definidos na proposta.

**Mudança regulatória posterior:** a **Resolução BCB nº 285, art. 19**, determina que a taxa de administração seja cobrada proporcionalmente aos meses, mediante percentual fixo, ressalvada a cobrança antecipada legalmente permitida. Os **arts. 56, 57 e 59** estabelecem a aplicação aos grupos constituídos a partir de **01/07/2024** e regra de transição para grupos anteriores. Portanto, cláusulas de 2018 **não devem ser aplicadas automaticamente a novos grupos**. A situação jurídica e os fluxos de cada grupo precisam ser conferidos.

**Antecipação de taxa:** nos termos da **Lei nº 11.795/2008, art. 27, § 3º**, e da orientação pública do regulador, valores antecipados da taxa de administração devem ser **deduzidos da taxa total contratada**, nunca adicionados ao total. O cronograma de cobrança deve respeitar o regime e a proposta efetiva.

**Informação verificável:** a Resolução BCB nº 285, **art. 2º, IX**, prevê discriminação da prestação inicial em tabela de valores e percentuais. O **art. 49** prevê demonstrativo individual com componentes da prestação, percentual de amortização mensal e histórico recente de pagamentos. Usar propostas e demonstrativos **anonimizados** para homologar os cálculos, sem coleta de dados identificáveis de consorciados.

#### Estrutura de dados sugerida

```text
perfil_de_calculo:
  constituicao_grupo: AAAA-MM-DD
  modalidade: tipo_de_bem
  base_reajuste: conforme_proposta
  taxa_administracao_total_pct: fornecida
  taxa_administracao_antecipada_pct: fornecida_ou_zero_comprovado
  fonte_regras: proposta_ou_demonstrativo_anonimizado
  cronograma:
    mes_1:
      fundo_comum_pct: fornecido
      administracao_regular_pct: fornecido
      administracao_antecipada_pct: fornecido
      fundo_reserva_pct: fornecido
      seguro: conforme_proposta
    mes_2_ate_N:
      ...: percentuais_verificados_por_periodo
```

**Forma de implementação preferida:**
1. **Modo comercial rápido:** usar o valor e a estrutura de parcelas já retornados pelo simulador operacional, sem tentar reconstruí-los quando faltarem taxas por período.
2. **Modo detalhado validado:** importar/informar uma agenda de percentuais por mês ou faixas de meses comprovadas na proposta, com atualização da base de crédito conforme o contrato.
3. **Modo para grupos com cobrança proporcional:** projetar componente regular de administração como percentual fixo por período, separado da antecipação prevista, respeitando a taxa total e a base atualizada.
4. **Sem dados de distribuição:** bloquear estimativas de evolução de parcela que dependam desses percentuais; permitir apenas comparações explicitamente parciais.

**Verificações obrigatórias:**
- Somatório dos percentuais do **fundo comum** deve corresponder à integralização contratual prevista, descontadas amortizações e ajustes aplicáveis.
- Somatório dos percentuais de **administração regular + antecipada** deve ser reconciliado com a **taxa de administração total**, sem dupla cobrança.
- Percentuais de **fundo de reserva** devem conciliar com o total contratual, sob suas regras de reajuste e cobrança.
- Distinguir percentual sobre a carta-base de valor efetivamente pago após reajustes; **somar reais históricos não substitui a conferência dos percentuais**.
- Testar primeira, segunda, última e prestações imediatamente antes/depois de mudança de faixa ou término de cobrança antecipada.
- Exibir diferenças de arredondamento, componentes adicionais e eventuais parcelas residuais.

**Dados ainda necessários para aferir a distribuição real:** pelo menos **uma proposta atual anonimizada** acompanhada de demonstrativo de parcelas ou extrato com componentes de cobrança. Sem isso, **não há fundamento para inventar percentuais mensais específicos**.

## 14. Caso de referência recebido — simulação operacional de automóvel (17/11/2026)

**Origem:** imagem de simulação e esclarecimentos posteriores fornecidos pelo usuário. Por regra do projeto, o repositório não armazena marca nem identificadores operacionais específicos. Os dados foram fornecidos para validação de fórmulas, **não representam condições universais**.

### 14.1. Dados confirmados pelo usuário

| Campo | Valor |
| --- | ---: |
| Segmento | Automóvel |
| Situação do grupo | Formação |
| Atualização do bem | FIPE |
| Prazo | 100 meses |
| **Valor da carta / crédito disponível antes de lance** | **R$ 110.026,00** |
| Rótulo correspondente na tela | «Total contratado» |
| **Taxa total de administração do grupo** | **20,90%** |
| **Fundo de reserva do grupo** | **3,00%** |
| Primeira parcela exibida | R$ 1.363,22 |
| Lance simulado | R$ 0,00 |
| Parcela após lance | R$ 1.363,22 |

**Observação:** este é um cenário sem lance; o valor nominal da carta coincide com o crédito disponível para a compra **antes de outras condições ou despesas eventualmente aplicáveis**. Se o cliente utilizar lance embutido, o crédito líquido para aquisição deverá ser recalculado.

### 14.2. Reconciliação matemática do exemplo

```text
carta = 110.026,00
fundo_comum_total_pct = 100,00%
administracao_total_pct = 20,90%
fundo_reserva_total_pct = 3,00%
prazo = 100

fundo_comum_nominal   = 110.026,00
administracao_nominal = 110.026,00 × 0,209 = 22.995,434
reserva_nominal       = 110.026,00 × 0,03  =  3.300,78
soma_nominal          = 110.026,00 × (1 + 0,209 + 0,03)
                      = 136.322,214
media_mensal_nominal  = 136.322,214 ÷ 100 = 1.363,22214
primeira_parcela_exibida = 1.363,22
```

A **média nominal aritmética arredondada** coincide com a **primeira parcela** exibida, com as taxas totais declaradas. Isso é um **teste de consistência**, não comprova a composição discriminada da primeira prestação nem que o cronograma de cobrança dos componentes seja linear.

- O total nominal **R$ 136.322,21** é o resultado matemático da soma de 100% do crédito, 20,90% de administração e 3% de reserva, **sem projetar FIPE, seguro ou encargos adicionais**.
- A diferença nominal entre esse total e o crédito é **R$ 26.296,21**, correspondendo a 23,90% da carta, e **não** a diferença causada por distribuição não linear.
- O produto `1.363,22 × 100 = 136.322,00` perde R$ 0,21 em relação ao cálculo com precisão completa por **arredondamento mensal**; não é projeção de pagamento.
- A igualdade **não** demonstra que as próximas 99 parcelas serão R$ 1.363,22 nem que fundo comum, administração e reserva estarão distribuídos de forma uniforme.
- Os percentuais **20,90% e 3,00% são dados deste grupo**, não valores padrão de outros grupos.
- O cenário usa FIPE como atualização de referência, mas datas e mecanismos de reajuste não são conhecidos; nenhuma projeção automática pode ser homologada com esses dados isolados.

### 14.3. Casos de teste resultantes

1. Entrada: carta **R$ 110.026,00**, administração **20,90%**, reserva **3,00%**, prazo **100 meses**, lance **zero**.
2. Calcular a soma nominal **R$ 136.322,214** antes de arredondamento e média nominal **R$ 1.363,22214**.
3. Comparar a média arredondada com a parcela observada **R$ 1.363,22**, **sem inferir cronograma mensal**.
4. Se lance embutido = zero, verificar que o crédito líquido preliminar coincide com a carta.
5. Se lance combinado for simulado, aplicar teto operacional informado de **30% da carta ao componente embutido**, somando recursos próprios separadamente, sem alterar a base de 20,90% + 3% sem justificativa contratual.
6. Testar dois grupos com cartas iguais e **taxa total de administração e/ou reserva diferentes**; o motor deve usar percentuais informados para cada grupo.
7. Se a distribuição mensal não for fornecida, exibir **custo nominal de referência** e parcela efetivamente informada, mas não fabricar cronograma de prestações.

### 14.4. Evidências ainda necessárias

- [x] Confirmar que o campo «Total contratado» corresponde ao **valor da carta** neste exemplo.
- [x] Confirmar as taxas totais **20,90% de administração** e **3,00% de reserva** deste grupo.
- [x] Reconciliar aritmeticamente a **média nominal** com a primeira parcela exibida.
- [ ] Obter composição discriminada da primeira parcela (fundo comum, administração regular, administração antecipada, reserva, seguro e eventuais encargos).
- [ ] Obter o cronograma de cobrança por mês/faixa ou parcelas de referência em diferentes etapas do grupo.
- [ ] Identificar possíveis antecipações de administração e a regra efetiva para este grupo.
- [x] Obter uma segunda simulação do **mesmo plano** com lance de 30% da carta, com redução da parcela informada. A origem do lance foi confirmada posteriormente como **capital próprio**.
- [x] Obter simulação com **lance próprio** e confirmação verbal do comportamento equivalente para **lance embutido**; este último ainda não foi demonstrado em imagem.
- [ ] Obter testes de lance **combinado**, redução de prazo e cronogramas de parcelas posteriores.
- [ ] Confirmar o calendário e a base dos reajustes FIPE.

**Decisão de produto:** o primeiro exemplo valida a **reconciliação do custo nominal**. Uma segunda simulação do mesmo plano, **com lance de capital próprio**, documentada na seção 15, reproduz a parcela após lance por uma divisão em **99 prestações**. Isso valida a hipótese **neste caso observado**, mas **não homologa uma regra universal de redução pós-lance**, nem permite projetar reajustes e parcelas de outros grupos sem contrato ou exemplos adicionais.


## 15. Segundo caso de referência — mesmo plano com lance de 30% (17/11/2026)

**Origem:** segunda imagem operacional, referente ao **mesmo plano** do caso 14. O usuário confirmou posteriormente que os **R$ 33.007,80 são integralmente de capital próprio**. A imagem não mostra o fluxo mensal das prestações. Registrar valores sem identificadores institucionais.

### 15.1. Valores observados

| Campo | Sem lance | Segundo cenário |
| --- | ---: | ---: |
| Carta de crédito nominal | R$ 110.026,00 | R$ 110.026,00 |
| Prazo inicial | 100 meses | 100 meses |
| Taxa de administração total | 20,90% | 20,90% |
| Fundo de reserva total | 3,00% | 3,00% |
| Primeira parcela | R$ 1.363,22 | R$ 1.363,22 |
| Lance com capital próprio | R$ 0,00 | **R$ 33.007,80** |
| Nova parcela após lance | R$ 1.363,22 | **R$ 1.029,81** |

O lance equivale exatamente a `33.007,80 / 110.026,00 = 30,00%` do valor da carta. **Como é integralmente próprio, não reduz a carta/crédito disponível para aquisição**; trata-se de desembolso adicional do cliente para amortização na hipótese de contemplação e quitação do lance. O limite de 30% mencionado para lance embutido não foi utilizado nesse exemplo.

### 15.2. Descoberta matemática: divisão por 99 parcelas

```text
reducao_mensal_observada = 1.363,22 - 1.029,81
                         = 333,41

lance / 99               = 33.007,80 / 99
                         = 333,412121...

primeira_parcela - (lance / 99)
                         = 1.363,22 - 333,412121...
                         = 1.029,807878...
arredondamento_2_casas  = 1.029,81  (valor idêntico à tela)

controle_alternativo:
primeira_parcela - (lance / 100)
                         = 1.033,142
                         = 1.033,14  (NÃO coincide com a tela)
```

**Evidência:** a nova parcela coincide exatamente, depois de arredondamento, com uma **redução distribuída em 99 parcelas**, e não 100. Isso sugere que **a primeira parcela fica fora do abatimento ou que o simulador considera 99 obrigações remanescentes**. Não é possível concluir apenas das imagens **por que** são 99 prestações (por exemplo, primeira parcela já paga), se existe algum encargo separado ou qual é a regra para grupos com prazos distintos.

**Grau de confiança:**
- **Confirmado por imagem:** valores, mesmo plano, lance de 30% da carta, parcela de R$ 1.029,81.
- **Reproduzido matematicamente:** `nova_parcela = arredondar(parcela_inicial - lance / 99, 2)` para **este caso**.
- **Hipótese a verificar:** usar `prazo_original - 1` como divisor é regra contratual geral; a primeira parcela estaria paga ou excluída da amortização.
- **Confirmado pelo usuário:** o lance de R$ 33.007,80 é **100% capital próprio**, com crédito nominal preservado em **R$ 110.026,00** antes de eventuais deduções contratuais independentes do lance.
- **Não comprovado:** se a redução é aplicada ao fundo comum ou a outros componentes; e se o prazo é mantido em outras modalidades.

### 15.3. Implicações para a aplicação comercial

- Criar teste automatizado que recebe **R$ 110.026,00**, prazo **100**, parcela **R$ 1.363,22**, lance **R$ 33.007,80** e espera parcela **R$ 1.029,81** na hipótese de **99 prestações remanescentes**.
- O número de parcelas **sujeitas a amortização deve ser uma entrada/variável do cálculo**, não derivado automaticamente do prazo inicial em todos os grupos.
- Separar três informações: **parcela inicial informada**, **parcelas remanescentes elegíveis ao abatimento** e **saldo/obrigação amortizável**.
- Continuar permitindo modo comercial que calcula a redução por parcelas remanescentes **somente com confirmação da regra**, mostrando a hipótese e a data-base.
- Não extrapolar a redução de `lance / parcelas_restantes` para amortização por **prazo** sem regra contratual específica.
- **Para este caso confirmado de lance próprio:** registrar **desembolso de R$ 33.007,80** com recursos do cliente; **crédito para a compra permanece R$ 110.026,00** antes de outras deduções eventualmente previstas.
- **Para outros casos:** lance embutido diminui crédito disponível; no combinado, descontar somente a parte embutida e somar separadamente o capital próprio.
- O limite operacional informado de **30% da carta** continua sendo aplicado **somente ao lance embutido**, e não deve ser usado para inferir que todo lance de 30% é embutido.

### 15.4. Validações pendentes

- [x] Reproduzir a redução da parcela do segundo cenário: **R$ 1.029,81** com divisor 99.
- [ ] Confirmar se as **99 prestações** decorrem de primeira parcela já paga/excluída ou de regra diferente.
- [x] Confirmar origem dos **R$ 33.007,80**: **capital próprio integral**, não deduzido da carta.
- [ ] Verificar se existem outras deduções contratuais sobre o crédito na efetiva aquisição, distintas do lance próprio.
- [ ] Repetir no mesmo plano com **outro valor de lance** para testar a linearidade do abatimento.
- [x] Obter um exemplo de lance **próprio** com parcela após lance.
- [x] Registrar regra operacional **informada pelo usuário**: o lance embutido tem o mesmo efeito sobre a parcela que lance próprio de igual valor, mas reduz o crédito disponível.
- [ ] Conferir com evidências adicionais o comportamento de lance **embutido e combinado** em propostas de outros grupos.
- [ ] Conferir as condições de redução **de prazo**, além da redução do valor da prestação.
- [ ] Obter cronograma de parcelas por componente e regras de reajuste para testar amortizações posteriores.

**Critério de aceite:** a fórmula de redução da parcela está reproduzida em um par de simulações do mesmo grupo e a equivalência do embutido foi confirmada pelo usuário. Não converter automaticamente essa informação em regra universal para outros grupos, prazos ou formas de amortização.


## 16. Regra operacional confirmada pelo usuário — lance embutido (17/11/2026)

**Origem da confirmação:** declaração explícita do usuário após a segunda simulação: **o lance embutido produz a mesma redução nas prestações que um lance próprio do mesmo valor; sua diferença é que o montante embutido é deduzido da carta de crédito**. Não há imagem de simulação embutida; registrar como **regra operacional informada**, não como segunda validação independente do sistema.

### 16.1. Exemplo equivalente no mesmo plano

| Item | Lance próprio | Lance embutido |
| --- | ---: | ---: |
| Carta contratada | R$ 110.026,00 | R$ 110.026,00 |
| Valor do lance (30% da carta) | R$ 33.007,80 | R$ 33.007,80 |
| Recursos próprios usados no lance | R$ 33.007,80 | R$ 0,00 |
| Valor deduzido da carta | R$ 0,00 | R$ 33.007,80 |
| Crédito líquido preliminar para aquisição | R$ 110.026,00 | **R$ 77.018,20** |
| Primeira prestação de referência | R$ 1.363,22 | R$ 1.363,22 |
| Nova prestação após lance no cenário informado | **R$ 1.029,81** (observada) | **R$ 1.029,81** (derivada da regra informada) |

**Condição de aplicação:** o quadro compara cenários de igual valor total de lance e amortização da mesma prestação, considerando as 99 obrigações usadas no exemplo, **sem atualizações ou outras deduções contratuais**. Não é oferta nem confirmação de contemplação.

### 16.2. Algoritmo proposto para o modo comercial

```text
carta = 110026.00
prazo_original = 100
parcelas_sujeitas_a_amortizacao = 99   # parâmetro confirmado no exemplo, não padrão universal
parcela_antes_lance = 1363.22

lance_proprio = input >= 0
lance_embutido = input >= 0
assert lance_embutido <= 0.30 * carta   # regra operacional; validar limites específicos
lance_total = lance_proprio + lance_embutido

credito_liquido_preliminar = carta - lance_embutido
reducao_parcela = lance_total / parcelas_sujeitas_a_amortizacao
nova_parcela = arredondar(parcela_antes_lance - reducao_parcela, 2)
```

A redução por lance total deve ser aplicada **somente** se as condições da operação comprovarem essa forma de amortização e a quantidade de parcelas remanescentes. Para outros grupos, os campos devem ser parametrizáveis. Não contar recursos próprios como dedução de crédito; não contar lance embutido como recurso de caixa do cliente.

### 16.3. Cenário de lance combinado — previsão para implementação

Exemplo **hipotético** para essa mesma carta: embutido R$ 22.005,20 (20% da carta) + próprio R$ 11.002,60 (10% da carta) = lance total R$ 33.007,80. Na hipótese de mesma forma de amortização, nova prestação seria **R$ 1.029,81**, enquanto o crédito líquido preliminar seria **R$ 88.020,80**. Os dois componentes do lance devem ser apresentados separadamente na interface e na proposta.

### 16.4. Testes pendentes e limitações

- [x] Registrar que a diferença entre embutido e próprio é **origem do recurso e crédito líquido**, não o efeito do valor total ofertado sobre a amortização da prestação, conforme regra informada.
- [x] Aplicar limite de **30% da carta somente ao embutido**, sem limitar por engano o lance total com recursos próprios.
- [ ] Confirmar se as **99 prestações** decorrem de primeira prestação paga, excluída ou outra regra operacional.
- [ ] Homologar o comportamento em outros grupos com taxas, prazos e cronogramas diferentes.
- [ ] Confirmar eventuais limitações próprias de lances combinados por modalidade.
- [ ] Validar distribuição mensal das taxas e o reflexo de reajustes futuros sobre prestações após lance.

**Separação de evidências:** simulação em imagem confirma a amortização após lance **próprio**; o comportamento igual do **embutido** foi **informado pelo usuário**, mas ainda não há captura independente desse cenário.

## 17. Terceiro caso — composição compensatória e manutenção do valor nominal da parcela (17/11/2026)

> **Correção importante em relação à interpretação anterior:** foi fornecido um **detalhamento das prestações com fator de redução**, e o usuário esclareceu que a distribuição diferenciada da taxa de administração **não altera, por si só, o valor da parcela**: o componente que muda é a **amortização inicial do fundo comum**. Não tratar a antecipação de administração como acréscimo ao boleto. Não substituir este esclarecimento por hipótese de aumento das cinco primeiras parcelas.

**Origem:** capturas de um grupo em andamento, distintas das simulações do grupo em formação das seções 14–16. Nenhum nome ou identificador institucional deve constar nos arquivos do projeto.

### 17.1. Condições informadas e composição visível

| Campo | Valor |
| --- | ---: |
| Segmento | Automóvel |
| Situação | Grupo em andamento |
| Carta / crédito nominal | R$ 110.026,00 |
| Prazo indicado | 100 meses |
| Administração total | **17,20% + 0,60% = 17,80%** |
| Administração nominal total | R$ 19.584,63 |
| Fundo de reserva nominal total | **3,00% / R$ 3.300,78** |
| Seguro de vida | 0,0000% / R$ 0,00 |
| Parcela indicada | **R$ 1.329,12** |
| Observação da proposta | **0,60% diluído nas 5 primeiras parcelas** |
| Modo da tela detalhada | **Com fator de redução de prestação** |

**Detalhamento mensal exibido na nova captura:**

| Componente da prestação exibida | Percentual mensal | Valor mensal |
| --- | ---: | ---: |
| Taxa de administração | **0,1200%** | **R$ 132,03** |
| Fundo de reserva | **0,0300%** | **R$ 33,01** |
| Amortização do fundo comum | **1,0580%** | **R$ 1.164,08** |
| Seguro | **0,0000%** | **R$ 0,00** |
| **Total** | **1,2080%** | **R$ 1.329,12** |

Este detalhamento **confirma diretamente** o percentual de administração de 0,1200%, correspondente a **0,60% ÷ 5**, e que o fundo comum absorve, neste período exibido, **1,0580%**. O percentual mensal do fundo comum **não é 1% constante**. A soma reproduz exatamente a prestação observada.

### 17.2. Reconciliação matemática comprovada

```text
valor_carta = 110026,00
taxa_administracao_total = 17,80%
taxa_administracao_normal = 17,20%
taxa_administracao_5_iniciais = 0,60%
fundo_reserva_total = 3,00%
seguro = 0,00%
prestacoes = 100

composicao_mensal_exibida:
  administracao = 0,1200% × 110026 = 132,0312  -> 132,03
  reserva       = 0,0300% × 110026 =  33,0078  ->  33,01
  fundo_comum   = 1,0580% × 110026 = 1164,07508 -> 1164,08
  seguro        = 0,0000% × 110026 =   0,00
  parcela = 132,03 + 33,01 + 1164,08 = 1329,12
  percentual_total = 0,1200 + 0,0300 + 1,0580 = 1,2080%

custo_nominal_total_teorico = 110026 × (1 + 0,178 + 0,03)
                            = 132911,408 -> 132911,41
media_aritmetica_teorica = 132911,408 / 100 = 1329,11408 -> 1329,11
```

A diferença de centavos entre **média aritmética direta** e **soma de componentes arredondados** requer tratar arredondamentos e ajustes residuais. A **coincidência da parcela exibida com os componentes discriminados** não é mais apenas hipótese: está documentada na própria tela.

### 17.3. Regra operacional confirmada: a distribuição altera a amortização

- Conforme esclarecimento do usuário, **a prestação nominal não se modifica somente porque a administração está distribuída entre períodos**. Mantida a base do bem, o valor da prestação é preservado mediante **compensação no percentual de amortização do fundo comum**.
- Na composição observada, administração de **0,1200%**, reserva de **0,0300%** e amortização de **1,0580%** somam exatamente a participação mensal de **1,2080%**.
- Uma administração mensal menor pode ser compensada por amortização maior; quando a administração mensal aumentar, a amortização poderá diminuir, **conforme o cronograma efetivo do grupo**.
- Essa redistribuição é distinta de **reajustes do crédito/bem**, **lance/amortização extraordinária**, **seguro** ou **alteração de fator de redução**; esses eventos podem modificar os valores pagos.
- O sistema tem uma opção para detalhar prestações **sem fator de redução**. As capturas **não demonstram** a composição dessa visualização alternativa; não presumir igualdade entre os modos.

### 17.4. Exemplo matemático de cronograma conciliado — hipótese, não extração da tela

Existe um cronograma hipotético que reproduz todas as taxas totais mantendo **1,2080%** da carta por mês, antes de reajustes:

```text
primeiras 5 parcelas:
  administracao   = 0,60% / 5    = 0,120000000% por parcela
  fundo_reserva   = 3,00% / 100  = 0,030000000% por parcela
  amortizacao     = 1,208% - 0,12% - 0,03% = 1,058000000%

demais 95 parcelas — HIPÓTESE:
  administracao   = 17,20% / 95 = 0,1810526316% por parcela
  fundo_reserva   = 3,00% / 100 = 0,0300000000% por parcela
  amortizacao     = 1,208% - 0,1810526316% - 0,03%
                  = 0,9969473684% por parcela

conferencia hipotetica dos totais:
  administracao = 5 × 0,12% + 95 × 0,1810526316% = 17,80%
  fundo_comum   = 5 × 1,058% + 95 × 0,9969473684% = 100,00%
  reserva       = 100 × 0,03% = 3,00%
```

**Atenção:** a composição das demais 95 parcelas é **dedução possível**, ainda **não confirmada pelo sistema**. Usar esse cálculo somente para orientar investigação e testes, não como regra contratual homologada.

### 17.5. Especificação para o motor de cálculo

**Separar dois conceitos:**

1. `valor_nominal_da_prestacao_t`: valor decorrente do crédito atualizado, do plano e do fator aplicável.
2. `composicao_prestacao_t`: taxas e amortização atribuídas ao mês, respeitando os percentuais acumulados e a conciliação final.

Quando o plano adotado efetivamente **preservar a prestação** pela compensação da amortização:

```text
percentual_total_mensal_t = conforme_plano_e_base_atualizada
percentual_amortizacao_t =
    percentual_total_mensal_t
  - percentual_administracao_t
  - percentual_reserva_t
  - percentual_seguro_t
  - outros_componentes_percentuais_t

prestacao_t = soma_de_componentes_arredondados_ou_regra_de_arredondamento_verificada
```

**Não deduzir automaticamente** `percentual_total_mensal_t = (100 + taxa_admin_total + reserva_total) / prazo` para qualquer grupo: só utilizar se demonstrado pelo perfil do contrato. Se faltar cronograma, receber **parcela observada** como entrada e declarar os componentes desconhecidos.

**Testes essenciais:**
- [x] Reproduzir o total **R$ 1.329,12** pelos componentes da nova tela.
- [x] Confirmar que **0,12% × 5 = 0,60%**.
- [x] Registrar informação operacional de que a distribuição especial altera a **amortização inicial**, não a prestação exclusivamente por causa da taxa.
- [ ] Conferir percentual de administração e amortização **da 6ª parcela** ou de outro período após os cinco primeiros **somente se houver fonte acessível** (por exemplo, demonstrativo/contrato); a tecla de navegação para a próxima parcela foi informada como **não funcional**, portanto não depender desse recurso.
- [ ] Comparar telas **com e sem fator de redução**, sem presumir equivalência.
- [ ] Validar aplicação da regra para grupo em formação e outros grupos.
- [ ] Confirmar arredondamentos e ajustes residuais na última parcela.

**Orientação prática:** não bloquear o desenvolvimento das ferramentas comerciais por falta do detalhamento da sexta parcela. Usar **parcela real informada** e **taxas totais do grupo**; oferecer projeção detalhada somente quando a distribuição por período estiver validada. Não inventar a alíquota das demais prestações.

**Decisão de produto:** não criar lógica de aumento da parcela nas cinco primeiras prestações por causa do adicional de 0,60%. A distribuição das taxas e a compensação pela amortização devem ficar no **cronograma dos componentes**. Isso não constitui garantia de prestação fixa diante de reajustes e de outros eventos contratuais.

## 18. Pesquisa do portal público de consórcios — 17/11/2026

> **Status:** levantamento de informações públicas, realizado em 17/11/2026, complementar às imagens operacionais das seções 14–17. O portal apresenta explicações gerais e condições de produtos, **não** o detalhamento mensal de cada grupo. Por regra de neutralidade absoluta do projeto, **não são copiados nome, marca, domínio ou URLs que identifiquem a instituição de referência**. As evidências públicas permanecem na conversa de pesquisa, fora dos arquivos publicados.

### 18.1. Regras corroboradas pela fonte

| Assunto | Informação encontrada | Decisão de implementação |
| --- | --- | --- |
| Composição das parcelas | Fundo comum, taxa de administração, fundo de reserva e eventual seguro prestamista | Segregar componentes e não presumir ausência de seguro nem taxas fixas |
| Contemplação | Por sorteio ou por lance; a oferta não assegura o resultado | Nunca estimar contemplação como garantida |
| Lance embutido | Valor ofertado com a carta é deduzido do crédito utilizável | Calcular crédito líquido pela dedução exclusiva do componente embutido |
| Lance vencedor | Pode reduzir prazo ou valor de prestações, conforme regras do plano | Tratar como duas estratégias distintas; solicitar modalidade de amortização |
| Uso da carta | Depende de contemplação, aprovação documental, garantias e avaliação aplicável | Não apresentar carta como dinheiro automaticamente disponível |
| Reajustes | Valores de parcelas podem continuar sendo atualizados após contemplação | Não congelar prestações futuras após lance ou contemplação |
| Consórcio x financiamento | Financiamento pode disponibilizar o bem após aprovação; consórcio depende de contemplação | Comparar custo e também momento de acesso ao bem |
| Quitação de financiamento | Há possibilidade de usar a carta após contemplação para quitar financiamento de bem da mesma categoria, com autorização | Potencial novo módulo de estratégias; não homologar sem regras específicas |
| Uso de excedente | Parte do saldo não utilizado na aquisição pode cobrir despesas relacionadas ao bem ou amortizar a cota, conforme categoria e regras do plano | Criar campos separados para preço do bem, despesas e saldo da carta; não presumir reembolso livre |
| Múltiplas cartas | O material público menciona utilização combinada sob condições (categoria e enquadramento, especialmente com FGTS) | Evolução futura, sujeita a elegibilidade e aprovação |
| Imóveis e FGTS | Pode servir, conforme elegibilidade e regras aplicáveis, para lance e amortização | Não habilitar como dinheiro livre nem em segmentos não autorizados |
| Crédito contemplado não utilizado | Material público informa manutenção de rendimentos e possibilidade de uso posterior | Considerar a data de utilização na estratégia de aquisição futura; rendimento só com índice válido |
| Desistência | Restituição depende de contrato, apurações e prazos; não é imediata por padrão | Incluir na explicação de riscos, sem calcular restituição sem regras |

**Fontes e limites:** o portal e os artigos oficiais são textos informativos; referências de produtos como número máximo de meses, idade de bens usados, percentual de despesas acessórias e modalidades disponíveis podem mudar e **não representam cláusulas universais de qualquer grupo**. Conferir a proposta e regulamento efetivos na data da oferta.

### 18.2. Novas oportunidades comerciais identificadas

**A. Substituir financiamento por carta contemplada (fase posterior).**
- Entradas: saldo para quitação de financiamento existente, categoria do bem, crédito utilizável, preço/valor de garantia, custos e momento hipotético da contemplação.
- Saídas: diferença de desembolso, custo de oportunidade, saldo de crédito e impacto da nova obrigação.
- Restrição: só tratar como operação viável após conferir elegibilidade, autorização e garantias. **Não comparar sem considerar o tempo de espera para contemplação.**

**B. Planejar crédito excedente e despesas de aquisição (fase posterior).**
- Entradas: carta vigente, lance embutido, preço negociado do bem, impostos/despesas, limite contratual dessas despesas e saldo remanescente.
- Saídas: crédito líquido após lance, valor destinado ao vendedor, custos acessórios admissíveis, sobra potencial e opção de amortização, quando prevista.
- O material público menciona **limite de até 10% para determinadas despesas de aquisição** em contexto imobiliário; **não codificar esse percentual como regra global**, nem permitir utilização sem condições.

**C. Estratégias de consórcio imobiliário e FGTS (fase posterior).**
- Entradas: crédito, saldo potencialmente elegível de FGTS, capacidade de pagamento e modalidade autorizada (lance, amortização ou quitação).
- Saídas: cenários separados de recursos próprios, FGTS e valor embutido, com efeitos sobre crédito líquido e obrigações.
- Restrições: elegibilidade do participante, do imóvel, limites normativos e procedimentos operacionais são **obrigatórios**; sem conferência, exibir apenas cenário condicional.

**D. Compra planejada com rendimento do crédito contemplado não utilizado (fase posterior).**
- Entradas: data de contemplação hipotética, data de aquisição, crédito disponível, índices confirmados e custos.
- Saídas: evolução condicional do crédito disponível e diferenças de poder de compra.
- Restrição: não misturar **reajuste de crédito de cota não contemplada**, **rendimentos do crédito contemplado não utilizado** e **reajuste das parcelas**; são mecanismos distintos.

### 18.3. O que o portal NÃO comprovou

- Não forneceu percentuais **mensais reais de fundo comum, administração e amortização** para os grupos das imagens.
- Não confirmou por documentação pública acessada o teto de **30% do lance embutido** para todos os grupos. Esse percentual está registrado como **regra operacional informada pelo usuário**, sujeito às condições da proposta.
- Não definiu o motivo exato de usar **99 prestações** no abatimento mostrado no caso de 100 meses.
- Não comprovou por fonte pública acessada o algoritmo de **compensação da administração pela amortização** no caso específico do fator de redução. Esse mecanismo está documentado nas imagens e na explicação do usuário.
- Não disponibilizou um banco público de **taxas e ofertas comerciais de todas as administradoras** em tempo real.

### 18.4. Decisão de prioridade

- **Manter o MVP:** comparador consórcio x financiamento, estratégia de lances, análise de proposta concorrente e gerador de proposta.
- **Incorporar agora somente critérios e alertas** necessários para comparações válidas: risco de não contemplação, crédito líquido após embutido, custos completos, reajustes e elegibilidade.
- **Adicionar ao backlog após o MVP**: quitação de financiamento com carta contemplada; despesas de aquisição e saldo excedente; estratégias imobiliárias com FGTS; e utilização conjunta de cartas ou rendimentos de crédito contemplado.
- **Não condicionar o início do desenvolvimento** à reconstrução das parcelas detalhadas sem dados contratados suficientes.

**Critério transversal:** destacar de forma verificável o que é `informado pelo usuário`, `observado na simulação`, `publicado em material informativo`, `confirmado no contrato` ou `estimado`.

## 19. Base regulatória oficial — conferência de 17/11/2026

**Fontes públicas primárias consultadas fora do portal comercial:**

- **Lei nº 11.795, de 8 de outubro de 2008 (texto atualizado, Câmara dos Deputados):** https://www2.camara.leg.br/legin/fed/lei/2008/lei-11795-8-outubro-2008-581885-normaatualizada-pl.html
- **Resolução BCB nº 285, de 19 de janeiro de 2023 (texto do regulador, com alterações):** https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?numero=285&tipo=resolu%C3%A7%C3%A3o+bcb
- **Orientações públicas do Banco Central sobre as novas regras e vigência:** https://bcb.gov.br/meubc/faqs/p/novas-regras-sobre-a-constituicao-e-o-funcionamento-de-grupos-de-consorcios
- **Página oficial sobre administradoras de consórcio:** https://www.bcb.gov.br/estabilidadefinanceira/administradoraconsorcio

Esses endereços **não identificam a instituição de referência** do produto. A lista acima é a base normativa da pesquisa, distinta das condições comerciais e dos regulamentos particulares de cada grupo. Verificar sempre a **redação consolidada vigente** na data de implementação, pois os normativos podem ser alterados.

### 19.1. Dispositivos relevantes para o motor

| Fonte | Dispositivo | Implicação técnica |
| --- | --- | --- |
| Lei 11.795/2008 | Art. 22, §§ 1º e 3º | Sorteio ou lance conforme contrato; crédito contemplado pode ser utilizado para quitação total de financiamento próprio, sujeito a anuência e condições |
| Lei 11.795/2008 | Arts. 23 e 24 | Contemplação condicionada aos recursos do grupo; crédito na data da assembleia e rendimentos do crédito não utilizado, quando aplicáveis |
| Lei 11.795/2008 | Art. 27, caput e § 1º | Prestação composta de fundo comum, taxa de administração e demais obrigações contratuais; valores/obrigações expressos em percentuais de referência |
| Lei 11.795/2008 | Art. 27, § 3º, I e II | Antecipação legal de taxa de administração tem tratamento específico, inclusive destaque e dedução da taxa total; **não duplicar cobrança** |
| Resolução BCB 285/2023 | Arts. 2º e 19, conforme redação vigente | Informações contratuais discriminadas; cobrança regular da taxa de administração conforme regra proporcional/fixa, ressalvada antecipação admitida |
| Resolução BCB 285/2023 | Regra do lance vencedor e do lance embutido | Lance vencedor deve amortizar ou quitar parcelas vincendas na forma contratual; lance embutido utiliza parte do crédito da contemplação |
| Resolução BCB 285/2023 | Demonstrativo individual (art. 49) | Cronograma e históricos devem permitir discriminar componentes, amortizações e valores efetivamente devidos |
| Orientação do Banco Central | Novas regras desde 01/07/2024 | **Data de constituição do grupo** é essencial na seleção do regime normativo aplicável |

**Limites de interpretação:**

1. **A lei e a resolução não estabelecem um teto geral de 30% para lance embutido.** O limite de 30% registrado neste projeto é **regra operacional informada**, sujeita às regras do grupo.
2. A lei e a resolução **não determinam que se divida lance por `prazo - 1`**. A coincidência encontrada no exemplo com 99 prestações segue sendo validação específica, não regra normativa geral.
3. **“0,60% diluído nas cinco primeiras parcelas” não pode ser automaticamente classificado como antecipação legal da taxa de administração do art. 27, § 3º.** É, antes de tudo, uma **distribuição de cobrança exibida no sistema**; a classificação jurídica/contratual exige conferir proposta e contrato. A informação anterior de que o lançamento é compensado pelo fundo comum permanece como regra operacional observada, não como imposição da lei.
4. **A regulação não apresenta o cronograma mensal exato de cada grupo.** Isso continua dependendo da proposta, dos demonstrativos individuais e do fator de redução.
5. A lei não autoriza tratar a contemplação como certa, nem desconsiderar o momento de aquisição na comparação com financiamento.
6. Taxa de administração antecipada legal, taxa total da proposta, parcela mensal de administração e fundo comum **são conceitos separados**; não preencher um campo com o valor do outro.

### 19.2. Critérios adicionais de aceitação

- [x] Identificar fontes oficiais da Lei 11.795/2008 e da Resolução BCB 285/2023.
- [x] Registrar a diferença entre **direito estabelecido pela norma** e **condição particular do grupo**.
- [x] Registrar expressamente que **30% embutido** e **divisão por 99** são condições operacionais/empíricas, não percentuais prescritos pela lei.
- [ ] Validar a natureza contratual exata dos 0,60% cobrados nas cinco primeiras prestações.
- [ ] Conferir na proposta vigente as características do grupo que possam alterar o cronograma.
- [ ] Revalidar a redação consolidada das normas no início da implementação e antes de publicação.

**Regra de documentação:** referências regulatórias oficiais genéricas podem ser citadas. Não inserir em código, repositório, metadados ou proposta o nome, domínio, identificadores ou marcas da instituição de referência.
