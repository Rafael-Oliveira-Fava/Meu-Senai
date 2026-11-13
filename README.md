# Meu SENAI

Aplicativo mobile de comunicação entre o SENAI, alunos, responsáveis e equipe.
Feito com **Expo (React Native) + TypeScript**. Roda no Android, iOS e no navegador.

> Os dados ficam num banco **MySQL**, acessado por um pequeno servidor Node.js (`servidor/`). Não há integração com sistemas oficiais do SENAI.

## Como rodar

Você precisa do **Node.js** e do **MySQL** (com o **MySQL Workbench**) instalados.

**1. Criar o banco.** No MySQL Workbench, abra `servidor/banco.sql` (File → Open SQL Script) e execute tudo (botão do raio ⚡). Isso cria o banco `meusenai` e as tabelas.

**2. Configurar a senha do MySQL.** Copie `servidor/.env.exemplo` para `servidor/.env` e preencha `MYSQL_SENHA` (a mesma senha que você usa no Workbench).

**3. Instalar e ligar o servidor** (deixe este terminal aberto):

```bash
npm install
```

```bash
npm run servidor
```

Na primeira vez, ele grava os dados iniciais no banco.

**4. Abrir o app** (em outro terminal):

```bash
npx expo start
```

- **Celular:** instale o app **Expo Go** e leia o QR code. O celular precisa estar na mesma rede Wi-Fi do computador; o app encontra o servidor sozinho (mesmo IP do computador, porta 3333). Se o firewall perguntar, libere a porta 3333.
- **Navegador:** aperte `w` no terminal (ou rode `npm run web`).

Se o servidor estiver em outro endereço, crie um arquivo `.env` na raiz com `EXPO_PUBLIC_API_URL=http://IP-DO-SERVIDOR:3333`.

## Contas de teste

Senha de todas: `senai123`. Na tela de login, **segure o logo "MEU SENAI" por 2 segundos** para abrir o acesso rápido e entrar tocando no perfil.

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

No acesso rápido, **Restaurar dados iniciais** volta o banco ao estado inicial.

## O que o app cobre

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
| `npm run servidor` | Liga o servidor que conversa com o MySQL |
| `npm start` | Servidor Expo (app) |
| `npm run web` | Abre no navegador |
| `npm test` | Roda todos os testes automáticos (veja abaixo) |
| `npm run verificar` | Testa as regras de negócio e a conversão dos dados do banco |
| `npm run tipos` | Checagem de tipos (TypeScript) |
| `npm run formatar` | Formata o código (Prettier) |
| `npm run lint` | Procura erros comuns (ESLint) |

## Testes automáticos

```bash
npm test
```

| Onde | O que testa |
| --- | --- |
| `scripts/verificar-regras.ts` | Regras de negócio RN02–RN10 (quem vê e faz o quê) |
| `scripts/verificar-banco.ts` | Conversão dos dados para as tabelas e detecção do que mudou |
| `testes/formatar.test.ts` | Datas, máscaras dos campos, nomes e tamanhos |
| `testes/consultas.test.ts` | Pendências, contadores das abas e destinatários dos avisos |
| `testes/servidor.test.ts` | O servidor com MySQL de verdade: login, senhas, gravação, conflito, transação |

O teste do servidor cria um banco separado (`meusenai_teste`), usa a configuração do `servidor/.env` e apaga esse banco no fim, sem tocar no `meusenai`. Sem MySQL na máquina, ele é pulado com um aviso.

No GitHub, os testes rodam sozinhos em cada pull request (`.github/workflows/testes.yml`), com lint, checagem de tipos e um MySQL 8.

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
    demonstracao.ts     dados iniciais (gravados no banco no primeiro uso)
    permissoes.ts       regras de negócio (quem vê e faz o quê)
    consultas.ts        contadores e buscas
    banco.tsx           dados + ações (publicar, enviar, decidir...)
    esquema.ts          colunas das tabelas e conversão objeto ⇄ linha
    api.ts              conversa com o servidor
  utilidades/formatar.ts  datas, máscaras e rótulos
  tema.ts               cores, letras, espaços e animações
servidor/
  banco.sql             cria o banco e as tabelas (rodar no MySQL Workbench)
  index.ts              API (Express) que lê e grava no MySQL
  .env.exemplo          modelo da configuração do MySQL
```

## Banco de dados (MySQL)

```
App (celular/navegador)  ⇄  servidor/index.ts (Express, porta 3333)  ⇄  MySQL (banco meusenai)
```

Há uma tabela para cada tipo de informação (`usuarios`, `alunos`, `avisos`, `atestados`, `autorizacoes`, `chamados`, `notificacoes`) e uma tabela `config` com o último número de protocolo. Listas pequenas dentro de um registro (horários, mensagens da conversa, quem leu o aviso) ficam em colunas `JSON`. Veja tudo em `servidor/banco.sql`.

Como funciona:

1. Ao abrir, o app busca os dados no servidor (`GET /dados`). As senhas nunca saem do servidor; o login é conferido lá (`POST /entrar`).
2. As regras (quem pode o quê) continuam no app, em `src/dados/banco.tsx`. A cada ação, o app envia só as linhas que mudaram (`POST /sincronizar`), e o servidor grava numa transação: ou grava tudo, ou nada.
3. Se duas pessoas mudam o mesmo registro ao mesmo tempo (ex.: respondem a mesma conversa), o servidor grava só a primeira e recusa a segunda, em vez de apagar o que a primeira fez. O segundo aparelho recebe os dados novos e o aviso "Outra pessoa alterou isso ao mesmo tempo… faça de novo".
4. A cada 15 segundos o app busca os dados de novo, então o que outro aparelho fizer (ou o que você mudar pelo Workbench) aparece sozinho.
5. Só o usuário logado fica guardado no aparelho (AsyncStorage).

Para ver os dados, no Workbench rode por exemplo `SELECT * FROM meusenai.avisos;`.

As fotos e PDFs dos atestados e as fotos das pessoas ficam na tabela `arquivos` (rota `POST /arquivos`), então abrem em qualquer aparelho.

**Fotos de perfil:** cada pessoa tira a própria selfie em Minha conta → Trocar foto (câmera da frente, com prévia para confirmar). Quem está sem foto vê um aviso na tela inicial. As contas iniciais já começam com um avatar ilustrado com a camisa do SENAI (`servidor/fotos/`). Ao ligar, o servidor cria a coluna `usuarios.foto` em bancos antigos e coloca esses avatares em quem ainda não tem foto. Se o seu banco foi criado antes dessa tabela existir, rode o `servidor/banco.sql` de novo no Workbench: ele só cria o que falta e não apaga nada.

Para mudar uma tabela: altere `servidor/banco.sql` (ou rode um `ALTER TABLE` no Workbench) e a lista de colunas em `src/dados/esquema.ts`.

Documentação de produto e design: [PRODUCT.md](PRODUCT.md), [DESIGN.md](DESIGN.md).

## Créditos

Logo SENAI: [SENAI_logo_2024.png](https://commons.wikimedia.org/wiki/File:SENAI_logo_2024.png), Wikimedia Commons, licença CC BY-SA 4.0. O logo "MEU SENAI" (`assets/meu-senai-logo-white.png`) junta essa marca com "MEU" na fonte Exo 2 ExtraBold (SIL OFL), inclinada 10° para combinar com o letreiro. A marca SENAI pertence à CNI/SENAI; uso aqui restrito ao projeto acadêmico.

## Limitações conhecidas (MVP)

- O servidor confere o login, mas não confere as permissões de cada gravação (essas regras estão no app). Num sistema real, as regras iriam para o servidor, com login por token.
- Sem internet ou com o servidor desligado, o app não abre.
- Senhas de demonstração em texto puro, apenas para a apresentação.
- Notificações aparecem no celular enquanto o app está aberto ou em segundo plano (notificação local). Com o app fechado de vez, seria preciso push, que exige um build próprio pelo EAS. No Expo Go aparece um aviso amarelo da biblioteca de notificações: é esperado.
