-- ============================================================
-- MEU SENAI — banco de dados MySQL
-- Abra este arquivo no MySQL Workbench e execute tudo (raio ⚡).
-- Ele cria o banco "meusenai" e as tabelas. Os dados de
-- demonstração são colocados pelo servidor na primeira vez
-- que ele liga (npm run servidor).
-- ============================================================

CREATE DATABASE IF NOT EXISTS meusenai
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE meusenai;

-- Contas de acesso dos 6 perfis (RF01, RF02).
CREATE TABLE IF NOT EXISTS usuarios (
  id          VARCHAR(40)  NOT NULL PRIMARY KEY,
  nome        VARCHAR(120) NOT NULL,
  email       VARCHAR(120) NOT NULL UNIQUE,
  senha       VARCHAR(120) NOT NULL,          -- demonstração: texto puro
  perfil      VARCHAR(20)  NOT NULL,          -- aluno, responsavel, professor, coordenador, diretor, secretaria
  alunoIds    JSON         NOT NULL,          -- alunos ligados à conta
  turmas      JSON         NULL,              -- turmas do professor
  parentesco  VARCHAR(40)  NULL,
  telefone    VARCHAR(20)  NULL
);

-- Dados do aluno (RF03) e até 2 responsáveis (RF04).
CREATE TABLE IF NOT EXISTS alunos (
  id              VARCHAR(40)  NOT NULL PRIMARY KEY,
  usuarioId       VARCHAR(40)  NOT NULL,
  nome            VARCHAR(120) NOT NULL,
  nascimento      VARCHAR(10)  NOT NULL,      -- "2009-05-14"
  matricula       VARCHAR(30)  NOT NULL,
  curso           VARCHAR(120) NOT NULL,
  turma           VARCHAR(30)  NOT NULL,
  turno           VARCHAR(30)  NOT NULL,
  horarios        JSON         NOT NULL,      -- [{ dia, entrada, saida }]
  responsavelIds  JSON         NOT NULL,
  foto            VARCHAR(100) NULL,          -- endereço da foto em "arquivos", ex.: /arquivos/<id>
  INDEX idx_alunos_turma (turma)
);

-- Comunicados gerais, de turma e avisos individuais (RF05, RF06).
CREATE TABLE IF NOT EXISTS avisos (
  id           VARCHAR(40)  NOT NULL PRIMARY KEY,
  protocolo    VARCHAR(20)  NOT NULL,
  titulo       VARCHAR(200) NOT NULL,
  texto        TEXT         NOT NULL,
  categoria    VARCHAR(20)  NOT NULL,
  publico      JSON         NOT NULL,         -- { tipo: geral | turma | individual, ... }
  autorId      VARCHAR(40)  NOT NULL,
  criadoEm     VARCHAR(30)  NOT NULL,         -- data e hora ISO
  pedeCiencia  BOOLEAN      NOT NULL,
  lidoPor      JSON         NOT NULL,
  cientes      JSON         NOT NULL
);

-- Atestados enviados pelos responsáveis (RF08).
CREATE TABLE IF NOT EXISTS atestados (
  id              VARCHAR(40)  NOT NULL PRIMARY KEY,
  protocolo       VARCHAR(20)  NOT NULL,
  alunoId         VARCHAR(40)  NOT NULL,
  enviadoPorId    VARCHAR(40)  NOT NULL,
  inicio          VARCHAR(10)  NOT NULL,
  fim             VARCHAR(10)  NOT NULL,
  motivo          TEXT         NOT NULL,
  arquivoNome     VARCHAR(200) NOT NULL,
  arquivoTamanho  INT          NULL,
  arquivoUri      TEXT         NULL,
  criadoEm        VARCHAR(30)  NOT NULL,
  situacao        VARCHAR(20)  NOT NULL,      -- pendente, aprovado, recusado
  analisadoPorId  VARCHAR(40)  NULL,
  analisadoEm     VARCHAR(30)  NULL,
  observacao      TEXT         NULL,
  INDEX idx_atestados_aluno (alunoId)
);

-- Arquivos enviados pelo app (foto ou PDF do atestado).
-- O atestado guarda o endereço do arquivo em "arquivoUri", ex.: /arquivos/<id>.
CREATE TABLE IF NOT EXISTS arquivos (
  id        VARCHAR(40)  NOT NULL PRIMARY KEY,
  nome      VARCHAR(200) NOT NULL,
  tipo      VARCHAR(100) NOT NULL,              -- image/jpeg, application/pdf...
  tamanho   INT          NOT NULL,
  conteudo  LONGBLOB     NOT NULL,
  enviadoEm VARCHAR(30)  NOT NULL
);

-- Autorizações: saída antecipada, atividade externa... (RF09).
CREATE TABLE IF NOT EXISTS autorizacoes (
  id             VARCHAR(40)  NOT NULL PRIMARY KEY,
  protocolo      VARCHAR(20)  NOT NULL,
  alunoId        VARCHAR(40)  NOT NULL,
  origem         VARCHAR(20)  NOT NULL,       -- responsavel ou escola
  tipo           VARCHAR(30)  NOT NULL,
  titulo         VARCHAR(200) NOT NULL,
  detalhes       TEXT         NOT NULL,
  data           VARCHAR(10)  NOT NULL,
  hora           VARCHAR(5)   NULL,
  buscaPor       VARCHAR(120) NULL,
  criadoPorId    VARCHAR(40)  NOT NULL,
  criadoEm       VARCHAR(30)  NOT NULL,
  situacao       VARCHAR(20)  NOT NULL,
  decididoPorId  VARCHAR(40)  NULL,
  decididoEm     VARCHAR(30)  NULL,
  observacao     TEXT         NULL,
  INDEX idx_autorizacoes_aluno (alunoId)
);

-- Central de suporte (RF10–RF12). As mensagens da conversa ficam em JSON.
CREATE TABLE IF NOT EXISTS chamados (
  id           VARCHAR(40)  NOT NULL PRIMARY KEY,
  protocolo    VARCHAR(20)  NOT NULL,
  assunto      VARCHAR(200) NOT NULL,
  setor        VARCHAR(20)  NOT NULL,
  professorId  VARCHAR(40)  NULL,
  alunoId      VARCHAR(40)  NULL,
  criadoPorId  VARCHAR(40)  NOT NULL,
  criadoEm     VARCHAR(30)  NOT NULL,
  situacao     VARCHAR(20)  NOT NULL,         -- aberto, respondido, encerrado
  mensagens    JSON         NOT NULL          -- [{ id, autorId, texto, em }]
);

-- Notificações dentro do app (RF07).
CREATE TABLE IF NOT EXISTS notificacoes (
  id         VARCHAR(40)  NOT NULL PRIMARY KEY,
  usuarioId  VARCHAR(40)  NOT NULL,
  tipo       VARCHAR(20)  NOT NULL,
  titulo     VARCHAR(200) NOT NULL,
  texto      TEXT         NOT NULL,
  link       VARCHAR(200) NOT NULL,
  criadoEm   VARCHAR(30)  NOT NULL,
  lida       BOOLEAN      NOT NULL,
  INDEX idx_notificacoes_usuario (usuarioId)
);

-- Valores soltos, ex.: o último número de protocolo usado.
CREATE TABLE IF NOT EXISTS config (
  chave  VARCHAR(40)  NOT NULL PRIMARY KEY,
  valor  VARCHAR(200) NOT NULL
);

-- Consultas úteis para conferir os dados no Workbench:
-- SELECT nome, email, perfil FROM usuarios;
-- SELECT protocolo, titulo, criadoEm FROM avisos ORDER BY criadoEm DESC;
-- SELECT protocolo, situacao, motivo FROM atestados;
