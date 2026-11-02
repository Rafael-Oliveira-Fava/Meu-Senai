# Graph Report - src  (2026-11-01)

## Corpus Check
- Corpus is ~20,246 words - fits in a single context window. You may not need a graph.

## Summary
- 260 nodes · 1398 edges · 7 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Modelo de Domínio
- Kit de UI
- Kit de UI
- Kit de UI
- Telas: format.ts
- Store e Ações
- Telas: _layout.tsx

## God Nodes (most connected - your core abstractions)
1. `useStore()` - 44 edges
2. `Icon()` - 41 edges
3. `useUser()` - 38 edges
4. `AppBar()` - 34 edges
5. `EmptyState()` - 33 edges
6. `Button()` - 30 edges
7. `Home()` - 28 edges
8. `FadeIn()` - 26 edges
9. `Card()` - 26 edges
10. `NoticeDetail()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `AppLayout()` --calls--> `useStore()`  [EXTRACTED]
  app/(app)/_layout.tsx → data/store.tsx
- `TabsLayout()` --calls--> `isFamily()`  [EXTRACTED]
  app/(app)/(tabs)/_layout.tsx → data/access.ts
- `TabsLayout()` --calls--> `pendingActions()`  [EXTRACTED]
  app/(app)/(tabs)/_layout.tsx → data/selectors.ts
- `TabsLayout()` --calls--> `unreadNoticeCount()`  [EXTRACTED]
  app/(app)/(tabs)/_layout.tsx → data/selectors.ts
- `TabsLayout()` --calls--> `useStore()`  [EXTRACTED]
  app/(app)/(tabs)/_layout.tsx → data/store.tsx

## Import Cycles
- None detected.

## Communities (7 total, 0 thin omitted)

### Community 0 - "Modelo de Domínio"
Cohesion: 0.09
Nodes (47): Item, Pedidos(), Tab, st, canDecideAuthorization(), canLinkGuardian(), canPublish(), canPublishGeneral() (+39 more)

### Community 1 - "Kit de UI"
Cohesion: 0.18
Nodes (46): StudentScreen(), Kinship, LinkGuardian(), CertificateDetail(), NewCertificate(), Picked, st, today() (+38 more)

### Community 2 - "Kit de UI"
Cohesion: 0.12
Nodes (32): Target, confirm(), AppLayout(), KIND_ICON, st, st, Gate(), RootLayout() (+24 more)

### Community 3 - "Kit de UI"
Cohesion: 0.12
Nodes (44): Notifications(), AlunoTab(), Avisos(), Filter, Counts, Home(), nextClass(), Shortcut (+36 more)

### Community 4 - "Telas: format.ts"
Cohesion: 0.14
Nodes (17): st, Stat(), canSeeNotice(), noticeRecipients(), TicketStatus, Weekday, age(), AUTH_TYPE_LABEL (+9 more)

### Community 5 - "Store e Ações"
Cohesion: 0.12
Nodes (3): Store, AuthorizationType, ReviewStatus

### Community 6 - "Telas: _layout.tsx"
Cohesion: 0.23
Nodes (12): badge(), icon(), IconName, TabsLayout(), Filter, Suporte(), isStaff(), lastActivity() (+4 more)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useStore()` connect `Kit de UI` to `Modelo de Domínio`, `Kit de UI`, `Kit de UI`, `Telas: format.ts`, `Telas: _layout.tsx`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Should `Modelo de Domínio` be split into smaller, more focused modules?**
  _Cohesion score 0.08959899749373433 - nodes in this community are weakly interconnected._
- **Why does `Store` connect `Store e Ações` to `Modelo de Domínio`, `Kit de UI`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Should `Kit de UI` be split into smaller, more focused modules?**
  _Cohesion score 0.11510204081632654 - nodes in this community are weakly interconnected._
- **Why does `Icon()` connect `Kit de UI` to `Modelo de Domínio`, `Kit de UI`, `Kit de UI`, `Telas: format.ts`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Should `Kit de UI` be split into smaller, more focused modules?**
  _Cohesion score 0.12322695035460993 - nodes in this community are weakly interconnected._
- **Should `Telas: format.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14035087719298245 - nodes in this community are weakly interconnected._