# Graph Report - src  (2026-11-01)

## Corpus Check
- Corpus is ~21,967 words - fits in a single context window. You may not need a graph.

## Summary
- 264 nodes · 1473 edges · 11 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Telas: tema.ts
- Telas: [id].tsx
- Linhas de Lista
- Início
- Telas: formatar.ts
- Regras de Acesso RN
- Banco e Ações
- Modelo de Domínio
- Regras de Acesso RN
- Telas: _layout.tsx
- Dados de Demonstração

## God Nodes (most connected - your core abstractions)
1. `useBanco()` - 44 edges
2. `Icone()` - 41 edges
3. `useUsuario()` - 38 edges
4. `BarraTopo()` - 36 edges
5. `Botao()` - 30 edges
6. `TelaInicio()` - 29 edges
7. `Aparecer()` - 26 edges
8. `Tela()` - 26 edges
9. `cor` - 26 edges
10. `TelaAviso()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `LayoutLogado()` --calls--> `useBanco()`  [EXTRACTED]
  app/(logado)/_layout.tsx → dados/banco.tsx
- `LayoutAbas()` --calls--> `useBanco()`  [EXTRACTED]
  app/(logado)/(abas)/_layout.tsx → dados/banco.tsx
- `LayoutAbas()` --calls--> `useUsuario()`  [EXTRACTED]
  app/(logado)/(abas)/_layout.tsx → dados/banco.tsx
- `LayoutAbas()` --calls--> `pendencias()`  [EXTRACTED]
  app/(logado)/(abas)/_layout.tsx → dados/consultas.ts
- `LayoutAbas()` --calls--> `ehFamilia()`  [EXTRACTED]
  app/(logado)/(abas)/_layout.tsx → dados/permissoes.ts

## Import Cycles
- None detected.

## Communities (11 total, 0 thin omitted)

### Community 0 - "Telas: tema.ts"
Cohesion: 0.10
Nodes (39): estilos, Carregamento(), LayoutRaiz(), Arquivo, estilos, Destino, Grupo(), confirmar() (+31 more)

### Community 1 - "Telas: [id].tsx"
Cohesion: 0.25
Nodes (38): TelaEntrar(), TelaAluno(), TelaPerfilAluno(), Parentesco, TelaVincular(), TelaAtestado(), TelaEnviarAtestado(), TelaAutorizacao() (+30 more)

### Community 2 - "Linhas de Lista"
Cohesion: 0.14
Nodes (28): TelaAvisos(), TipoFiltro, TelaSuporte(), TipoFiltro, BotaoFlutuante(), Filtro(), LinhaFiltros(), Etiqueta() (+20 more)

### Community 3 - "Início"
Cohesion: 0.13
Nodes (27): Atalho, atalhosDo(), Bolinha(), CartaoHoje(), Contadores, estilos, Horario(), proximaAula() (+19 more)

### Community 4 - "Telas: formatar.ts"
Cohesion: 0.25
Nodes (17): TelaNovaAutorizacao(), TipoAutorizacao, dataCompleta(), dataCurta(), dataRelativa(), diaMais(), doisDigitos(), horaValida() (+9 more)

### Community 5 - "Regras de Acesso RN"
Cohesion: 0.19
Nodes (17): ProvedorBanco(), useCriarBanco(), alunosVisiveis(), avisosVisiveis(), destinatariosDoAviso(), ehGestao(), EQUIPE, GESTAO (+9 more)

### Community 6 - "Banco e Ações"
Cohesion: 0.15
Nodes (11): agora(), Banco, buscar(), ContextoBanco, Decisao, familiaDe(), nomeDoAluno(), notificar() (+3 more)

### Community 7 - "Modelo de Domínio"
Cohesion: 0.13
Nodes (14): Aluno, Atestado, Autorizacao, Chamado, DiaSemana, Horario, Mensagem, Notificacao (+6 more)

### Community 8 - "Regras de Acesso RN"
Cohesion: 0.41
Nodes (10): Aba, TelaPedidos(), pendencias(), atestadosVisiveis(), autorizacoesVisiveis(), ehFamilia(), podeAnalisarAtestado(), podeEnviarAtestado() (+2 more)

### Community 9 - "Telas: _layout.tsx"
Cohesion: 0.36
Nodes (7): bolinha(), iconeAba(), LayoutAbas(), contarAvisosNaoLidos(), contarChamadosAguardando(), ehEquipe(), fonte

### Community 10 - "Dados de Demonstração"
Cohesion: 0.38
Nodes (6): CONTAS_DEMO, criarDadosDemonstracao(), dia(), diasAtras(), SENHA_DEMO, BancoDados

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useBanco()` connect `Telas: [id].tsx` to `Telas: tema.ts`, `Linhas de Lista`, `Início`, `Telas: formatar.ts`, `Banco e Ações`, `Regras de Acesso RN`, `Telas: _layout.tsx`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Should `Telas: tema.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10445468509984639 - nodes in this community are weakly interconnected._
- **Why does `Icone()` connect `Telas: [id].tsx` to `Telas: tema.ts`, `Linhas de Lista`, `Início`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Should `Linhas de Lista` be split into smaller, more focused modules?**
  _Cohesion score 0.13978494623655913 - nodes in this community are weakly interconnected._
- **Why does `useUsuario()` connect `Telas: [id].tsx` to `Telas: tema.ts`, `Linhas de Lista`, `Início`, `Telas: formatar.ts`, `Banco e Ações`, `Regras de Acesso RN`, `Telas: _layout.tsx`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Should `Início` be split into smaller, more focused modules?**
  _Cohesion score 0.12561576354679804 - nodes in this community are weakly interconnected._
- **Should `Banco e Ações` be split into smaller, more focused modules?**
  _Cohesion score 0.14705882352941177 - nodes in this community are weakly interconnected._