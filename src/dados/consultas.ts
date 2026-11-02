/**
 * CONSULTAS — buscas e contadores usados pelas telas
 * (bolinhas vermelhas nas abas, "Precisa da sua atenção" etc.).
 */
import {
  atende,
  atestadosVisiveis,
  autorizacoesVisiveis,
  avisosVisiveis,
  chamadosVisiveis,
  podeAnalisarAtestado,
  podeDecidir,
} from './permissoes';
import type { Aviso, BancoDados, Usuario } from './tipos';

export const usuarioPorId = (db: BancoDados, id: string) => db.usuarios.find((u) => u.id === id);
export const alunoPorId = (db: BancoDados, id: string) => db.alunos.find((a) => a.id === id);

/** Aviso ainda não lido por este usuário (o autor não conta). */
export const naoLido = (a: Aviso, u: Usuario) => a.autorId !== u.id && !a.lidoPor.includes(u.id);

/** Responsável ainda precisa tocar em "Estou ciente". */
export const precisaCiencia = (a: Aviso, u: Usuario) =>
  a.pedeCiencia && u.perfil === 'responsavel' && !a.cientes.some((c) => c.usuarioId === u.id);

export const contarAvisosNaoLidos = (db: BancoDados, u: Usuario) => avisosVisiveis(db, u).filter((a) => naoLido(a, u)).length;

/** Atestados e autorizações esperando a decisão deste usuário. */
export function pendencias(db: BancoDados, u: Usuario) {
  const autorizacoes = autorizacoesVisiveis(db, u).filter((a) => podeDecidir(u, a));
  const atestados = podeAnalisarAtestado(u) ? atestadosVisiveis(db, u).filter((a) => a.situacao === 'pendente') : [];
  return { autorizacoes, atestados, total: autorizacoes.length + atestados.length };
}

/** Conversas do suporte que esperam este usuário (resposta nova ou mensagem a responder). */
export function contarChamadosAguardando(db: BancoDados, u: Usuario) {
  return chamadosVisiveis(db, u).filter((c) => {
    if (c.situacao === 'encerrado') return false;
    if (atende(u, c)) return c.situacao === 'aberto';
    const ultima = c.mensagens[c.mensagens.length - 1];
    return c.criadoPorId === u.id && ultima?.autorId !== u.id && c.situacao === 'respondido';
  }).length;
}

export const contarNotificacoesNaoLidas = (db: BancoDados, u: Usuario) =>
  db.notificacoes.filter((n) => n.usuarioId === u.id && !n.lida).length;
