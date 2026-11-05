/**
 * PERMISSÕES — regras de negócio de quem vê e quem faz o quê (RN02 a RN10).
 *
 * Todas as telas leem os dados por estas funções, então um perfil nunca vê o
 * que não pode. O script `npm run verificar` testa estas regras.
 */
import { hoje } from '../utilidades/formatar';
import type { Aluno, Autorizacao, Aviso, BancoDados, Chamado, Perfil, Setor, Usuario } from './tipos';

/** Cada aluno tem no máximo 2 responsáveis (RN03). */
export const MAX_RESPONSAVEIS = 2;

const EQUIPE: Perfil[] = ['professor', 'coordenador', 'diretor', 'secretaria'];
const GESTAO: Perfil[] = ['coordenador', 'diretor', 'secretaria'];

export const ehEquipe = (u: Usuario) => EQUIPE.includes(u.perfil);
const ehGestao = (u: Usuario) => GESTAO.includes(u.perfil);
export const ehFamilia = (u: Usuario) => u.perfil === 'aluno' || u.perfil === 'responsavel';

/* ───────────── Alunos (RN04) ───────────── */

/** Família vê os seus alunos; professor, os das suas turmas; gestão, todos. */
export function alunosVisiveis(db: BancoDados, u: Usuario): Aluno[] {
  if (ehFamilia(u)) return db.alunos.filter((a) => u.alunoIds.includes(a.id));
  if (u.perfil === 'professor') return db.alunos.filter((a) => u.turmas?.includes(a.turma));
  return db.alunos;
}

export const podeVerAluno = (db: BancoDados, u: Usuario, alunoId: string) => alunosVisiveis(db, u).some((a) => a.id === alunoId);

/* ───────────── Avisos (RN05, RN06) ───────────── */

export function podeVerAviso(db: BancoDados, u: Usuario, aviso: Aviso): boolean {
  if (aviso.autorId === u.id) return true;
  const p = aviso.publico;

  if (p.tipo === 'geral') {
    if (p.para === 'todos') return true;
    if (p.para === 'alunos') return u.perfil === 'aluno' || ehEquipe(u);
    if (p.para === 'responsaveis') return u.perfil === 'responsavel' || ehEquipe(u);
    return ehEquipe(u); // "equipe"
  }

  if (p.tipo === 'turma') {
    if (ehGestao(u)) return true;
    if (u.perfil === 'professor') return !!u.turmas?.includes(p.turma);
    return alunosVisiveis(db, u).some((a) => a.turma === p.turma);
  }

  // Aviso individual: só o aluno, os responsáveis dele e a gestão (RN06).
  return ehGestao(u) || (ehFamilia(u) && u.alunoIds.includes(p.alunoId));
}

/** Avisos que o usuário pode ver, do mais novo para o mais antigo. */
export const avisosVisiveis = (db: BancoDados, u: Usuario) =>
  db.avisos.filter((a) => podeVerAviso(db, u, a)).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));

/** Quem recebe notificação de um aviso (a gestão só é notificada dos gerais). */
export const destinatariosDoAviso = (db: BancoDados, aviso: Aviso) =>
  db.usuarios.filter((u) => u.id !== aviso.autorId && podeVerAviso(db, u, aviso) && !(ehGestao(u) && aviso.publico.tipo !== 'geral'));

/** Quem publicou pode corrigir ou apagar o próprio aviso. */
export const podeEditarAviso = (u: Usuario, aviso: Aviso) => aviso.autorId === u.id;

/** Quem publicou e a gestão podem lembrar os responsáveis que ainda não confirmaram ciência. */
export const podeLembrarCiencia = (u: Usuario, aviso: Aviso) => aviso.pedeCiencia && (aviso.autorId === u.id || ehGestao(u));

/** Só a equipe publica; comunicado geral só a gestão (RN05). */
export const podePublicar = ehEquipe;
export const podePublicarGeral = ehGestao;

/** Turmas para as quais o usuário pode publicar. */
export function turmasPermitidas(db: BancoDados, u: Usuario): string[] {
  if (u.perfil === 'professor') return u.turmas ?? [];
  return [...new Set(db.alunos.map((a) => a.turma))].sort();
}

/* ───────────── Atestados (RN07) ───────────── */

export const podeEnviarAtestado = (u: Usuario) => u.perfil === 'responsavel';
export const podeAnalisarAtestado = (u: Usuario) => u.perfil === 'secretaria' || u.perfil === 'coordenador';

/** Família vê os do seu aluno; secretaria, coordenação e direção veem todos; professor não vê. */
export function atestadosVisiveis(db: BancoDados, u: Usuario) {
  const lista = ehFamilia(u)
    ? db.atestados.filter((a) => u.alunoIds.includes(a.alunoId))
    : podeAnalisarAtestado(u) || u.perfil === 'diretor'
      ? db.atestados
      : [];
  return [...lista].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

/* ───────────── Autorizações (RN08) ───────────── */

export function autorizacoesVisiveis(db: BancoDados, u: Usuario) {
  const lista = ehFamilia(u)
    ? db.autorizacoes.filter((a) => u.alunoIds.includes(a.alunoId))
    : u.perfil === 'professor'
      ? db.autorizacoes.filter((a) => a.criadoPorId === u.id || podeVerAluno(db, u, a.alunoId))
      : db.autorizacoes;
  return [...lista].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

/** Pedido pendente cuja data já passou: ninguém decide mais, aparece como "Vencido". */
export const autorizacaoVencida = (a: Autorizacao, dia = hoje()) => a.situacao === 'pendente' && a.data < dia;

/** Pedido da escola: o responsável decide. Pedido da família: a gestão decide. */
export function podeDecidir(u: Usuario, a: Autorizacao) {
  if (a.situacao !== 'pendente' || autorizacaoVencida(a)) return false;
  if (a.origem === 'escola') return u.perfil === 'responsavel' && u.alunoIds.includes(a.alunoId);
  return ehGestao(u);
}

/** Quem fez o pedido pode cancelar enquanto ninguém decidiu. */
export const podeCancelar = (u: Usuario, a: Autorizacao) => a.criadoPorId === u.id && a.situacao === 'pendente' && !autorizacaoVencida(a);

export const podePedirSaida = (u: Usuario) => u.perfil === 'responsavel';
export const podePedirAutorizacao = ehEquipe;

/* ───────────── Central de suporte (RN09) ───────────── */

export const SETORES: { id: Setor; nome: string; dica: string }[] = [
  { id: 'secretaria', nome: 'Secretaria', dica: 'Documentos, matrícula, carteirinha' },
  { id: 'coordenador', nome: 'Coordenação', dica: 'Frequência, conduta, reuniões' },
  { id: 'professor', nome: 'Professor', dica: 'Aulas, atividades e notas' },
  { id: 'diretor', nome: 'Direção', dica: 'Assuntos institucionais' },
];

/** O usuário é quem atende este chamado? (o setor escolhido ou o professor escolhido) */
export const atende = (u: Usuario, c: Chamado) => (c.setor === 'professor' ? u.id === c.professorId : u.perfil === c.setor);

const ultimaAtividade = (c: Chamado) => c.mensagens[c.mensagens.length - 1]?.em ?? c.criadoEm;

/** Chamados que o usuário abriu ou que ele atende, do mais recente para o mais antigo. */
export const chamadosVisiveis = (db: BancoDados, u: Usuario) =>
  db.chamados.filter((c) => c.criadoPorId === u.id || atende(u, c)).sort((a, b) => ultimaAtividade(b).localeCompare(ultimaAtividade(a)));

/* ───────────── Vínculo de responsáveis (RF04, RN03) ───────────── */

export const podeVincularResponsavel = (u: Usuario) => u.perfil === 'secretaria';
