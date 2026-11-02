# Meu SENAI — MVP

Aplicativo mobile de comunicação entre o SENAI, alunos, responsáveis e equipe (TCC).
Feito com **Expo (React Native) + TypeScript**. Roda no Android, iOS e no navegador.

> Todos os dados são fictícios e ficam salvos só no aparelho (AsyncStorage). Não há integração com sistemas oficiais do SENAI.

## Como rodar

```bash
npm install
```

```bash
npx expo start
```

- **Celular:** instale o app **Expo Go** e leia o QR code que aparece no terminal.
- **Navegador:** aperte `w` no terminal (ou rode `npm run web`).

## Contas de demonstração

Senha de todas: `senai123`. Na tela de login, basta tocar no perfil.

| Perfil | E-mail |
| --- | --- |
| Responsável (mãe do Pedro) | larissa@familia.demo |
| Aluno | pedro@aluno.demo |
| Coordenação | fernanda@senai.demo |
| Secretaria | juliana@senai.demo |
| Professor | ricardo@senai.demo |
| Direção | paulo@senai.demo |
| Responsável (mãe da Ana) | claudia@familia.demo |
| Aluna | ana@aluno.demo |

"Minha conta" → **Restaurar dados de demonstração** volta tudo ao estado inicial.

## O que o MVP cobre

| Requisito | Onde |
| --- | --- |
| RF01 Autenticação | `src/app/login.tsx`, guarda em `src/app/(app)/_layout.tsx` |
| RF02 Acesso por perfil | `src/data/access.ts` (todas as telas leem por aqui) |
| RF03 Dados do aluno (nome, nascimento, turma, curso, dias e horários) | aba Aluno, `src/components/student.tsx` |
| RF04 Até 2 responsáveis (3 perfis por aluno) | Secretaria → Alunos → Vincular responsável |
| RF05 Comunicados gerais / por turma | aba Avisos, botão "Novo aviso" (equipe) |
| RF06 Avisos individuais (ex.: suspensão) com "Estou ciente" | `src/app/(app)/aviso/` |
| RF07 Notificações | sino na tela inicial e contadores nas abas |
| RF08 Envio de atestado (foto/PDF) | Pedidos → Atestados, análise pela secretaria/coordenação |
| RF09 Autorizações e liberação do aluno | Pedidos → Autorizações (pedido da família ou da escola) |
| RF10–RF12 Central de suporte, escolha do destinatário, acompanhamento | aba Suporte |

Regras de negócio RN02–RN10 verificadas por script:

```bash
npm run check
```

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm start` | Servidor Expo |
| `npm run web` | Abre no navegador |
| `npm run typecheck` | Checagem de tipos |
| `npm run check` | Testa as regras de negócio |
| `npx eslint src scripts` | Lint |

## Estrutura

```
src/
  app/            telas (Expo Router: cada arquivo é uma rota)
    login.tsx
    (app)/        área logada
      (tabs)/     Início, Avisos, Pedidos, Aluno, Suporte
      aviso/ atestado/ autorizacao/ suporte/ aluno/
  components/     UI (ui.tsx), animações, snackbar, linhas de lista, perfil do aluno
  data/           tipos, dados demo, regras de acesso, store persistente
  lib/format.ts   datas, máscaras, rótulos
  theme.ts        cores, tipografia, espaçamento, movimento
```

Documentação de produto e design: [PRODUCT.md](PRODUCT.md), [DESIGN.md](DESIGN.md). Mapa do código: `graphify-out/graph.html`.

## Créditos

Logo SENAI: [SENAI_logo_2024.png](https://commons.wikimedia.org/wiki/File:SENAI_logo_2024.png), Wikimedia Commons, licença CC BY-SA 4.0. Recortada em `assets/senai-mark.png`. O logo "MEU SENAI" (`assets/meu-senai-logo*.png`) junta essa marca com "MEU" na fonte Exo 2 ExtraBold (SIL OFL), inclinada 10° para combinar com o letreiro; gerado por `scripts/make-logo.py`. A marca SENAI pertence à CNI/SENAI; uso aqui restrito ao projeto acadêmico.

## Limitações conhecidas (MVP)

- Sem servidor: cada aparelho tem sua própria cópia dos dados.
- Senhas de demonstração em texto puro, apenas para a apresentação.
- Notificações dentro do app (sem push do sistema).
