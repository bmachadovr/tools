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
- [x] Obter uma segunda simulação do **mesmo plano** com lance de 30% da carta, com redução da parcela informada. A **origem do lance** ainda não foi confirmada.
- [ ] Obter exemplos com **lance próprio e embutido identificados separadamente**, inclusive mudança de prazo e cronogramas das parcelas posteriores.
- [ ] Confirmar o calendário e a base dos reajustes FIPE.

**Decisão de produto:** o primeiro exemplo valida a **reconciliação do custo nominal**. Uma segunda simulação do mesmo plano, documentada na seção 15, reproduz a parcela após lance por uma divisão em **99 prestações**. Isso valida a hipótese **neste caso observado**, mas **não homologa uma regra universal de redução pós-lance**, nem permite projetar reajustes e parcelas de outros grupos sem contrato ou exemplos adicionais.


## 15. Segundo caso de referência — mesmo plano com lance de 30% (17/11/2026)

**Origem:** segunda imagem operacional, referente ao **mesmo plano** do caso 14. A imagem não discrimina a origem do lance (próprio, embutido ou combinado) nem mostra o fluxo mensal das prestações. Registrar valores sem identificadores institucionais.

### 15.1. Valores observados

| Campo | Sem lance | Segundo cenário |
| --- | ---: | ---: |
| Carta de crédito nominal | R$ 110.026,00 | R$ 110.026,00 |
| Prazo inicial | 100 meses | 100 meses |
| Taxa de administração total | 20,90% | 20,90% |
| Fundo de reserva total | 3,00% | 3,00% |
| Primeira parcela | R$ 1.363,22 | R$ 1.363,22 |
| Valor do lance | R$ 0,00 | **R$ 33.007,80** |
| Nova parcela após lance | R$ 1.363,22 | **R$ 1.029,81** |

O lance equivale exatamente a `33.007,80 / 110.026,00 = 30,00%` do valor da carta.

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
- **Não comprovado:** se o lance de 30% é embutido, próprio ou combinação; se a redução é aplicada ao fundo comum ou a outros componentes; e se o prazo é mantido em outras modalidades.

### 15.3. Implicações para a aplicação comercial

- Criar teste automatizado que recebe **R$ 110.026,00**, prazo **100**, parcela **R$ 1.363,22**, lance **R$ 33.007,80** e espera parcela **R$ 1.029,81** na hipótese de **99 prestações remanescentes**.
- O número de parcelas **sujeitas a amortização deve ser uma entrada/variável do cálculo**, não derivado automaticamente do prazo inicial em todos os grupos.
- Separar três informações: **parcela inicial informada**, **parcelas remanescentes elegíveis ao abatimento** e **saldo/obrigação amortizável**.
- Continuar permitindo modo comercial que calcula a redução por parcelas remanescentes **somente com confirmação da regra**, mostrando a hipótese e a data-base.
- Não extrapolar a redução de `lance / parcelas_restantes` para amortização por **prazo** sem regra contratual específica.
- Não deduzir o lance da carta para calcular o crédito líquido **enquanto a origem do lance não for informada**:
  - **Se próprio:** o desembolso do cliente inclui o lance; o crédito disponível para comprar o bem não é reduzido por esse componente.
  - **Se embutido:** o valor embutido é descontado da carta, diminuindo o crédito líquido disponível para aquisição.
  - **Se combinado:** descontar apenas a parte embutida, mantendo o capital próprio separado.
- O limite operacional informado de **30% da carta** continua sendo aplicado **somente ao lance embutido**, e não deve ser usado para inferir que todo lance de 30% é embutido.

### 15.4. Validações pendentes

- [x] Reproduzir a redução da parcela do segundo cenário: **R$ 1.029,81** com divisor 99.
- [ ] Confirmar se as **99 prestações** decorrem de primeira parcela já paga/excluída ou de regra diferente.
- [ ] Identificar a origem exata dos **R$ 33.007,80** e o crédito efetivamente disponível após contemplação.
- [ ] Repetir no mesmo plano com **outro valor de lance** para testar a linearidade do abatimento.
- [ ] Validar lance próprio, embutido e combinado, de modo independente.
- [ ] Conferir as condições de redução **de prazo**, além da redução do valor da prestação.
- [ ] Obter cronograma de parcelas por componente e regras de reajuste para testar amortizações posteriores.

**Critério de aceite:** nenhuma fórmula inferida de **um único par de simulações** deve se tornar regra permanente sem confirmação adicional em propostas ou demonstrações de outros valores e grupos.
