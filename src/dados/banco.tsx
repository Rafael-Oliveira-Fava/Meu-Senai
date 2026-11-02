/**
 * BANCO — os dados do app e todas as ações que alteram esses dados.
 *
 * Os dados ficam em memória e são salvos no aparelho com o AsyncStorage.
 * Toda ação segue o mesmo roteiro:
 *   1. confere a permissão (regras em permissoes.ts);
 *   2. valida os campos e devolve uma mensagem de erro clara;
 *   3. altera os dados;
 *   4. cria notificações para quem precisa saber.
 *
 * As telas usam `useBanco()` para ler os dados e chamar as ações.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { criarDadosDemonstracao, SENHA_DEMO } from './demonstracao';
import {
  atende,
  destinatariosDoAviso,
  MAX_RESPONSAVEIS,
  podeAnalisarAtestado,
  podeDecidir,
  podeEnviarAtestado,
  podePublicar,
  podePublicarGeral,
  podeVerAluno,
  podeVincularResponsavel,
  turmasPermitidas,
} from './permissoes';
import type {
  Aviso,
  BancoDados,
  CategoriaAviso,
  Chamado,
  Notificacao,
  Perfil,
  Publico,
  Setor,
  Situacao,
  TipoAutorizacao,
  Usuario,
} from './tipos';

// Chaves usadas para salvar no aparelho (v2 = campos em português).
const CHAVE_DADOS = 'meusenai:dados:v2';
const CHAVE_SESSAO = 'meusenai:sessao:v2';

/** Resultado de uma ação: sucesso (com o id criado) ou erro (com a mensagem para o usuário). */
type Resultado = { ok: true; id?: string } | { ok: false; erro: string };
const falha = (erro: string): Resultado => ({ ok: false, erro });

type Decisao = Exclude<Situacao, 'pendente'>;
type NovaNotificacao = Omit<Notificacao, 'id' | 'usuarioId' | 'criadoEm' | 'lida'>;

// Utilitários
const novoId = (prefixo: string) => `${prefixo}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const agora = () => new Date().toISOString();
const curto = (texto: string, minimo: number) => texto.trim().length < minimo;
const buscar = <T extends { id: string }>(lista: T[], id: string) => lista.find((x) => x.id === id);

/* ───────────── Ajudantes que alteram a cópia dos dados ───────────── */

/** Cria uma notificação para cada usuário da lista (sem repetir). */
function notificar(d: BancoDados, usuarioIds: string[], n: NovaNotificacao) {
  for (const usuarioId of new Set(usuarioIds)) {
    d.notificacoes.unshift({ ...n, id: novoId('nt'), usuarioId, criadoEm: agora(), lida: false });
  }
}

/** Próximo número de protocolo, ex.: "2026/0153". */
function proximoProtocolo(d: BancoDados) {
  d.contadorProtocolo += 1;
  return `${new Date().getFullYear()}/${String(d.contadorProtocolo).padStart(4, '0')}`;
}

const nomeDoAluno = (d: BancoDados, id: string) => buscar(d.alunos, id)?.nome ?? 'Aluno';
/** Aluno + responsáveis: quem recebe as respostas sobre pedidos da família. */
const familiaDe = (d: BancoDados, alunoId: string) => {
  const a = buscar(d.alunos, alunoId);
  return a ? [a.usuarioId, ...a.responsavelIds] : [];
};
const idsComPerfil = (d: BancoDados, ...perfis: Perfil[]) => d.usuarios.filter((u) => perfis.includes(u.perfil)).map((u) => u.id);
const atendentesDe = (d: BancoDados, c: Chamado) => d.usuarios.filter((u) => atende(u, c)).map((u) => u.id);

/* ───────────── O banco ───────────── */

function useCriarBanco() {
  const [db, setDb] = useState<BancoDados>(criarDadosDemonstracao);
  const [sessaoId, setSessaoId] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);

  // Cópia sempre atualizada dos dados, para validar antes de alterar.
  const dbAtual = useRef(db);
  useEffect(() => {
    dbAtual.current = db;
  }, [db]);

  // Ao abrir o app: carrega os dados e a sessão salvos no aparelho.
  useEffect(() => {
    Promise.all([AsyncStorage.getItem(CHAVE_DADOS), AsyncStorage.getItem(CHAVE_SESSAO)])
      .then(([dadosSalvos, sessaoSalva]) => {
        if (dadosSalvos) {
          const lidos = JSON.parse(dadosSalvos) as BancoDados;
          if (lidos.versao === 2) setDb(lidos);
        }
        if (sessaoSalva) setSessaoId(sessaoSalva);
      })
      .catch(() => {}) // dados corrompidos: segue com os dados de demonstração
      .finally(() => setPronto(true));
  }, []);

  // Salva sempre que os dados ou a sessão mudam.
  useEffect(() => {
    if (pronto) AsyncStorage.setItem(CHAVE_DADOS, JSON.stringify(db)).catch(() => {});
  }, [db, pronto]);
  useEffect(() => {
    if (!pronto) return;
    const salvar = sessaoId ? AsyncStorage.setItem(CHAVE_SESSAO, sessaoId) : AsyncStorage.removeItem(CHAVE_SESSAO);
    salvar.catch(() => {});
  }, [sessaoId, pronto]);

  const usuario = db.usuarios.find((u) => u.id === sessaoId) ?? null;

  /** Altera os dados de forma segura: trabalha numa cópia e depois substitui. */
  const alterar = (fn: (d: BancoDados) => void) =>
    setDb((anterior) => {
      const copia = structuredClone(anterior);
      fn(copia);
      return copia;
    });

  return {
    pronto,
    db,
    usuario,

    /* ── Sessão (RF01) ── */

    entrar(email: string, senha: string): Resultado {
      const conta = dbAtual.current.usuarios.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (!conta || conta.senha !== senha) return falha('E-mail ou senha incorretos. Confira e tente de novo.');
      setSessaoId(conta.id);
      return { ok: true };
    },

    sair: () => setSessaoId(null),

    restaurarDemonstracao: () => setDb(criarDadosDemonstracao()),

    /* ── Avisos (RF05, RF06) ── */

    marcarAvisoLido(id: string) {
      const aviso = buscar(dbAtual.current.avisos, id);
      if (!usuario || !aviso || aviso.lidoPor.includes(usuario.id)) return;
      alterar((d) => {
        buscar(d.avisos, id)?.lidoPor.push(usuario.id);
        // A notificação daquele aviso também passa a contar como lida.
        d.notificacoes.forEach((n) => {
          if (n.usuarioId === usuario.id && n.link === `/aviso/${id}`) n.lida = true;
        });
      });
    },

    /** "Estou ciente": só o responsável do aluno do aviso individual pode confirmar. */
    darCiencia(id: string) {
      const aviso = buscar(dbAtual.current.avisos, id);
      if (!usuario || !aviso || aviso.publico.tipo !== 'individual') return;
      if (usuario.perfil !== 'responsavel' || !usuario.alunoIds.includes(aviso.publico.alunoId)) return;
      alterar((d) => {
        const a = buscar(d.avisos, id)!;
        if (a.cientes.some((c) => c.usuarioId === usuario.id)) return;
        a.cientes.push({ usuarioId: usuario.id, em: agora() });
        if (!a.lidoPor.includes(usuario.id)) a.lidoPor.push(usuario.id);
        notificar(d, [a.autorId], {
          tipo: 'aviso',
          titulo: 'Ciência confirmada',
          texto: `${usuario.nome} confirmou: ${a.titulo}`,
          link: `/aviso/${id}`,
        });
      });
    },

    publicarAviso(dados: { titulo: string; texto: string; categoria: CategoriaAviso; publico: Publico; pedeCiencia: boolean }): Resultado {
      const p = dados.publico;
      if (!usuario || !podePublicar(usuario)) return falha('Seu perfil não pode publicar comunicados.');
      if (curto(dados.titulo, 4)) return falha('Escreva um título com pelo menos 4 letras.');
      if (curto(dados.texto, 10)) return falha('Escreva a mensagem com pelo menos 10 letras.');
      if (p.tipo === 'geral' && !podePublicarGeral(usuario)) return falha('Comunicados gerais são publicados pela gestão.');
      if (p.tipo === 'turma' && !turmasPermitidas(dbAtual.current, usuario).includes(p.turma))
        return falha('Você não pode publicar para esta turma.');
      if (p.tipo === 'individual' && !podeVerAluno(dbAtual.current, usuario, p.alunoId))
        return falha('Este aluno não está nas suas turmas.');

      const id = novoId('n');
      alterar((d) => {
        const aviso: Aviso = {
          id,
          protocolo: proximoProtocolo(d),
          titulo: dados.titulo.trim(),
          texto: dados.texto.trim(),
          categoria: dados.categoria,
          publico: p,
          autorId: usuario.id,
          criadoEm: agora(),
          pedeCiencia: p.tipo === 'individual' && dados.pedeCiencia,
          lidoPor: [],
          cientes: [],
        };
        d.avisos.unshift(aviso);
        notificar(
          d,
          destinatariosDoAviso(d, aviso).map((u) => u.id),
          {
            tipo: 'aviso',
            titulo: p.tipo === 'individual' ? 'Aviso individual' : 'Novo comunicado',
            texto: aviso.titulo,
            link: `/aviso/${id}`,
          },
        );
      });
      return { ok: true, id };
    },

    /* ── Atestados (RF08) ── */

    enviarAtestado(dados: {
      alunoId: string;
      inicio: string;
      fim: string;
      motivo: string;
      arquivoNome: string;
      arquivoTamanho?: number;
      arquivoUri?: string;
    }): Resultado {
      if (!usuario || !podeEnviarAtestado(usuario) || !usuario.alunoIds.includes(dados.alunoId))
        return falha('Apenas responsáveis vinculados podem enviar atestados deste aluno.');
      if (!dados.arquivoNome) return falha('Anexe a foto ou o PDF do atestado.');
      if (dados.fim < dados.inicio) return falha('A data final não pode ser antes da data inicial.');

      const id = novoId('c');
      alterar((d) => {
        const motivo = dados.motivo.trim();
        d.atestados.unshift({
          ...dados,
          motivo,
          id,
          protocolo: proximoProtocolo(d),
          enviadoPorId: usuario.id,
          criadoEm: agora(),
          situacao: 'pendente',
        });
        notificar(d, idsComPerfil(d, 'secretaria', 'coordenador'), {
          tipo: 'atestado',
          titulo: 'Novo atestado',
          texto: `${nomeDoAluno(d, dados.alunoId)} · ${motivo || 'Sem observação'}`,
          link: `/atestado/${id}`,
        });
      });
      return { ok: true, id };
    },

    analisarAtestado(id: string, decisao: Decisao, observacao: string): Resultado {
      if (!usuario || !podeAnalisarAtestado(usuario)) return falha('Seu perfil não pode analisar atestados.');
      if (decisao === 'recusado' && curto(observacao, 5)) return falha('Explique o motivo da recusa para a família.');
      alterar((d) => {
        const a = buscar(d.atestados, id);
        if (!a || a.situacao !== 'pendente') return;
        Object.assign(a, {
          situacao: decisao,
          analisadoPorId: usuario.id,
          analisadoEm: agora(),
          observacao: observacao.trim() || undefined,
        });
        notificar(d, familiaDe(d, a.alunoId), {
          tipo: 'atestado',
          titulo: decisao === 'aprovado' ? 'Atestado aceito' : 'Atestado recusado',
          texto: `Protocolo ${a.protocolo}`,
          link: `/atestado/${id}`,
        });
      });
      return { ok: true, id };
    },

    /* ── Autorizações (RF09) ── */

    /** O responsável pede saída antecipada, ou a equipe pede uma autorização à família. */
    criarAutorizacao(dados: {
      alunoId: string;
      tipo: TipoAutorizacao;
      titulo: string;
      detalhes: string;
      data: string;
      hora?: string;
      buscaPor?: string;
    }): Resultado {
      if (!usuario) return falha('Entre novamente.');
      if (usuario.perfil === 'aluno') return falha('Alunos não podem criar autorizações.');
      if (!podeVerAluno(dbAtual.current, usuario, dados.alunoId)) return falha('Aluno não vinculado à sua conta ou turma.');
      if (curto(dados.titulo, 4)) return falha('Dê um título ao pedido.');
      if (dados.tipo === 'saida_antecipada' && !dados.hora) return falha('Informe o horário de saída.');
      if (dados.tipo === 'saida_antecipada' && !dados.buscaPor?.trim()) return falha('Informe quem vai buscar o aluno.');

      const id = novoId('a');
      const daEscola = usuario.perfil !== 'responsavel';
      alterar((d) => {
        const titulo = dados.titulo.trim();
        d.autorizacoes.unshift({
          ...dados,
          titulo,
          detalhes: dados.detalhes.trim(),
          id,
          protocolo: proximoProtocolo(d),
          origem: daEscola ? 'escola' : 'responsavel',
          criadoPorId: usuario.id,
          criadoEm: agora(),
          situacao: 'pendente',
        });
        // Pedido da escola vai para os responsáveis; pedido da família vai para a gestão.
        notificar(d, daEscola ? (buscar(d.alunos, dados.alunoId)?.responsavelIds ?? []) : idsComPerfil(d, 'coordenador', 'secretaria'), {
          tipo: 'autorizacao',
          titulo: daEscola ? 'Autorização solicitada' : 'Pedido de saída antecipada',
          texto: `${nomeDoAluno(d, dados.alunoId)} · ${titulo}`,
          link: `/autorizacao/${id}`,
        });
      });
      return { ok: true, id };
    },

    decidirAutorizacao(id: string, decisao: Decisao, observacao: string): Resultado {
      const a = buscar(dbAtual.current.autorizacoes, id);
      if (!usuario || !a || !podeDecidir(usuario, a)) return falha('Você não pode decidir esta autorização.');
      if (decisao === 'recusado' && a.origem === 'responsavel' && curto(observacao, 5)) return falha('Explique o motivo para a família.');
      alterar((d) => {
        const x = buscar(d.autorizacoes, id)!;
        Object.assign(x, { situacao: decisao, decididoPorId: usuario.id, decididoEm: agora(), observacao: observacao.trim() || undefined });
        const daEscola = x.origem === 'escola';
        const verbo = daEscola ? (decisao === 'aprovado' ? 'autorizou' : 'não autorizou') : decisao === 'aprovado' ? 'aprovou' : 'recusou';
        notificar(d, daEscola ? [x.criadoPorId, ...idsComPerfil(d, 'coordenador')] : familiaDe(d, x.alunoId), {
          tipo: 'autorizacao',
          titulo: `${usuario.nome.split(' ')[0]} ${verbo}`,
          texto: `${nomeDoAluno(d, x.alunoId)} · ${x.titulo}`,
          link: `/autorizacao/${id}`,
        });
      });
      return { ok: true, id };
    },

    /* ── Central de suporte (RF10–RF12) ── */

    abrirChamado(dados: { assunto: string; setor: Setor; professorId?: string; alunoId?: string; texto: string }): Resultado {
      if (!usuario) return falha('Entre novamente.');
      if (dados.setor === 'professor' && !dados.professorId) return falha('Escolha o professor.');
      if (curto(dados.assunto, 4)) return falha('Escreva o assunto.');
      if (curto(dados.texto, 10)) return falha('Descreva sua dúvida com pelo menos 10 letras.');

      const id = novoId('t');
      alterar((d) => {
        const chamado: Chamado = {
          id,
          protocolo: proximoProtocolo(d),
          assunto: dados.assunto.trim(),
          setor: dados.setor,
          professorId: dados.setor === 'professor' ? dados.professorId : undefined,
          alunoId: dados.alunoId,
          criadoPorId: usuario.id,
          criadoEm: agora(),
          situacao: 'aberto',
          mensagens: [{ id: novoId('m'), autorId: usuario.id, texto: dados.texto.trim(), em: agora() }],
        };
        d.chamados.unshift(chamado);
        notificar(d, atendentesDe(d, chamado), {
          tipo: 'suporte',
          titulo: 'Nova solicitação',
          texto: chamado.assunto,
          link: `/suporte/${id}`,
        });
      });
      return { ok: true, id };
    },

    responderChamado(id: string, texto: string): Resultado {
      const c = buscar(dbAtual.current.chamados, id);
      if (!usuario || !c) return falha('Solicitação não encontrada.');
      const ehAtendente = atende(usuario, c);
      if (!ehAtendente && c.criadoPorId !== usuario.id) return falha('Você não participa desta conversa.');
      if (c.situacao === 'encerrado') return falha('Esta solicitação foi encerrada.');
      if (curto(texto, 2)) return falha('Escreva a mensagem.');
      alterar((d) => {
        const x = buscar(d.chamados, id)!;
        x.mensagens.push({ id: novoId('m'), autorId: usuario.id, texto: texto.trim(), em: agora() });
        x.situacao = ehAtendente ? 'respondido' : 'aberto';
        notificar(d, ehAtendente ? [x.criadoPorId] : atendentesDe(d, x), {
          tipo: 'suporte',
          titulo: ehAtendente ? 'Nova resposta' : 'Nova mensagem',
          texto: x.assunto,
          link: `/suporte/${id}`,
        });
      });
      return { ok: true, id };
    },

    encerrarChamado(id: string): Resultado {
      const c = buscar(dbAtual.current.chamados, id);
      if (!usuario || !c || (c.criadoPorId !== usuario.id && !atende(usuario, c))) return falha('Você não pode encerrar esta solicitação.');
      alterar((d) => {
        buscar(d.chamados, id)!.situacao = 'encerrado';
      });
      return { ok: true, id };
    },

    /* ── Notificações (RF07) ── */

    marcarNotificacaoLida(id: string) {
      alterar((d) => {
        const n = buscar(d.notificacoes, id);
        if (n) n.lida = true;
      });
    },

    marcarTodasLidas() {
      if (!usuario) return;
      alterar((d) => d.notificacoes.forEach((n) => n.usuarioId === usuario.id && (n.lida = true)));
    },

    /* ── Vínculo de responsáveis (RF04, RN03) ── */

    vincularResponsavel(alunoId: string, dados: { nome: string; email: string; parentesco: string; telefone: string }): Resultado {
      const email = dados.email.trim().toLowerCase();
      const aluno = buscar(dbAtual.current.alunos, alunoId);
      const contaExistente = dbAtual.current.usuarios.find((u) => u.email.toLowerCase() === email);
      if (!usuario || !podeVincularResponsavel(usuario)) return falha('Somente a secretaria vincula responsáveis.');
      if (!aluno) return falha('Aluno não encontrado.');
      if (aluno.responsavelIds.length >= MAX_RESPONSAVEIS) return falha(`Limite de ${MAX_RESPONSAVEIS} responsáveis por aluno atingido.`);
      if (dados.nome.trim().split(' ').length < 2) return falha('Informe nome e sobrenome.');
      if (!/^\S+@\S+\.\S+$/.test(email)) return falha('Informe um e-mail válido.');
      if (contaExistente && contaExistente.perfil !== 'responsavel') return falha('Este e-mail pertence a outro tipo de perfil.');
      if (contaExistente && aluno.responsavelIds.includes(contaExistente.id)) return falha('Este responsável já está vinculado.');

      alterar((d) => {
        const a = buscar(d.alunos, alunoId)!;
        // Reaproveita a conta se o e-mail já existe; senão cria uma nova.
        let responsavel = d.usuarios.find((u) => u.email.toLowerCase() === email);
        if (!responsavel) {
          responsavel = {
            id: novoId('u'),
            nome: dados.nome.trim(),
            email,
            senha: SENHA_DEMO,
            perfil: 'responsavel',
            alunoIds: [],
            parentesco: dados.parentesco.trim() || 'Responsável',
            telefone: dados.telefone.trim() || undefined,
          };
          d.usuarios.push(responsavel);
        }
        responsavel.alunoIds.push(alunoId);
        a.responsavelIds.push(responsavel.id);
        notificar(d, [responsavel.id, a.usuarioId], {
          tipo: 'vinculo',
          titulo: 'Responsável vinculado',
          texto: `${responsavel.nome} agora acompanha ${a.nome}`,
          link: `/aluno/${alunoId}`,
        });
      });
      return { ok: true };
    },
  };
}

/* ───────────── Acesso pelas telas ───────────── */

type Banco = ReturnType<typeof useCriarBanco>;
const ContextoBanco = createContext<Banco | null>(null);

export function ProvedorBanco({ children }: { children: ReactNode }) {
  return <ContextoBanco.Provider value={useCriarBanco()}>{children}</ContextoBanco.Provider>;
}

/** Dados e ações do app. */
export function useBanco() {
  const banco = useContext(ContextoBanco);
  if (!banco) throw new Error('useBanco precisa estar dentro de <ProvedorBanco>');
  return banco;
}

/** Usuário logado. Só usar em telas protegidas (o layout já redireciona quem não entrou). */
export function useUsuario(): Usuario {
  const { usuario } = useBanco();
  if (!usuario) throw new Error('Nenhum usuário logado');
  return usuario;
}
