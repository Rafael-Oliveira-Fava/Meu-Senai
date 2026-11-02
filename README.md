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
| RF01 Autenticação | `src/app/entrar.tsx`, proteção em `src/app/(logado)/_layout.tsx` |
| RF02 Acesso por perfil | `src/dados/permissoes.ts` (todas as telas leem por aqui) |
| RF03 Dados do aluno (nome, nascimento, turma, curso, dias e horários) | aba Aluno, `src/componentes/perfil-aluno.tsx` |
| RF04 Até 2 responsáveis (3 perfis por aluno) | Secretaria → Alunos → Vincular responsável |
| RF05 Comunicados gerais / por turma | aba Avisos, botão "Novo aviso" (equipe) |
| RF06 Avisos individuais (ex.: suspensão) com "Estou ciente" | `src/app/(logado)/aviso/` |
| RF07 Notificações | sino na tela inicial e contadores nas abas |
| RF08 Envio de atestado (foto/PDF) | Pedidos → Atestados, análise pela secretaria/coordenação |
| RF09 Autorizações e liberação do aluno | Pedidos → Autorizações (pedido da família ou da escola) |
| RF10–RF12 Central de suporte, escolha do destinatário, acompanhamento | aba Suporte |

Regras de negócio RN02–RN10 verificadas por script:

```bash
npm run verificar
```

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm start` | Servidor Expo |
| `npm run web` | Abre no navegador |
| `npm run verificar` | Testa as regras de negócio |
| `npm run tipos` | Checagem de tipos (TypeScript) |
| `npm run formatar` | Formata o código (Prettier) |
| `npm run lint` | Procura erros comuns (ESLint) |

## Estrutura

Tudo em português, exceto nomes exigidos pelo framework (`app`, `_layout`, `index`, `[id]`).

```
src/
  app/                  telas (Expo Router: cada arquivo é uma rota)
    _layout.tsx         carrega fonte e dados
    entrar.tsx          login
    (logado)/           só abre com usuário logado
      (abas)/           Início, Avisos, Pedidos, Aluno, Suporte
      aviso/ atestado/ autorizacao/ suporte/ aluno/
      notificacoes.tsx  conta.tsx
  componentes/
    estrutura.tsx       barra do topo, tela, cartão, avatar, logo
    controles.tsx       botões, filtros, campos, listas de opção
    indicadores.tsx     etiquetas de situação, vazio, erro
    linhas.tsx          cartões das listas (aviso, atestado, autorização, conversa)
    perfil-aluno.tsx    dados, horários e perfis vinculados
    animacao.tsx        toque e entrada suave
    mensagem.tsx        aviso rápido embaixo da tela
    icone.tsx
  dados/
    tipos.ts            formato de cada informação
    demonstracao.ts     dados fictícios da apresentação
    permissoes.ts       regras de negócio (quem vê e faz o quê)
    consultas.ts        contadores e buscas
    banco.tsx           dados + ações (publicar, enviar, decidir...)
  utilidades/formatar.ts  datas, máscaras e rótulos
  tema.ts               cores, letras, espaços e animações
```

Documentação de produto e design: [PRODUCT.md](PRODUCT.md), [DESIGN.md](DESIGN.md). Mapa do código: `graphify-out/graph.html`.

## Créditos

Logo SENAI: [SENAI_logo_2024.png](https://commons.wikimedia.org/wiki/File:SENAI_logo_2024.png), Wikimedia Commons, licença CC BY-SA 4.0. Recortada em `assets/senai-mark.png`. O logo "MEU SENAI" (`assets/meu-senai-logo*.png`) junta essa marca com "MEU" na fonte Exo 2 ExtraBold (SIL OFL), inclinada 10° para combinar com o letreiro; gerado por `scripts/gerar-logo.py`. A marca SENAI pertence à CNI/SENAI; uso aqui restrito ao projeto acadêmico.

## Limitações conhecidas (MVP)

- Sem servidor: cada aparelho tem sua própria cópia dos dados.
- Senhas de demonstração em texto puro, apenas para a apresentação.
- Notificações dentro do app (sem push do sistema).
