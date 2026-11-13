/**
 * TIPOS — o formato de cada informação guardada pelo app.
 * Datas ficam como texto: "2026-11-01" (dia) ou ISO completo (data e hora).
 */

/** Os 6 perfis de acesso (RF02). */
export type Perfil = 'aluno' | 'responsavel' | 'professor' | 'coordenador' | 'diretor' | 'secretaria';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  /**
   * Só para a demonstração: senha em texto puro. Nunca fazer isso em produção.
   * Fica só no servidor: o app recebe os usuários sem a senha.
   */
  senha?: string;
  perfil: Perfil;
  /** Alunos ligados a esta conta (aluno: ele mesmo; responsável: seus filhos). */
  alunoIds: string[];
  turmas?: string[]; // turmas do professor
  parentesco?: string; // ex.: "Mãe"
  foto?: string; // selfie da pessoa, guardada no servidor, ex.: "/arquivos/abc"
  telefone?: string;
}

export type DiaSemana = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab';

export interface Horario {
  dia: DiaSemana;
  entrada: string; // "07:30"
  saida: string; // "12:40"
}

/** Dados do aluno (RF03). */
export interface Aluno {
  id: string;
  usuarioId: string; // conta do próprio aluno
  nome: string;
  nascimento: string;
  matricula: string;
  curso: string;
  turma: string;
  turno: string;
  horarios: Horario[];
  responsavelIds: string[]; // no máximo 2 (RN03)
}

/** Para quem o aviso vai. */
export type Publico =
  | { tipo: 'geral'; para: 'todos' | 'alunos' | 'responsaveis' | 'equipe' }
  | { tipo: 'turma'; turma: string }
  | { tipo: 'individual'; alunoId: string };

export type CategoriaAviso = 'informativo' | 'evento' | 'calendario' | 'pedagogico' | 'disciplinar' | 'urgente';

/** Comunicado geral, de turma ou aviso individual (RF05, RF06). */
export interface Aviso {
  id: string;
  protocolo: string;
  titulo: string;
  texto: string;
  categoria: CategoriaAviso;
  publico: Publico;
  autorId: string;
  criadoEm: string;
  /** Aviso individual que pede o "Estou ciente" dos responsáveis. */
  pedeCiencia: boolean;
  lidoPor: string[];
  cientes: { usuarioId: string; em: string }[];
}

/** `cancelado`: quem fez o pedido de autorização desistiu antes da decisão. */
export type Situacao = 'pendente' | 'aprovado' | 'recusado' | 'cancelado';

/** Atestado médico enviado pelo responsável (RF08). */
export interface Atestado {
  id: string;
  protocolo: string;
  alunoId: string;
  enviadoPorId: string;
  inicio: string;
  fim: string;
  motivo: string;
  arquivoNome: string;
  arquivoTamanho?: number;
  arquivoUri?: string;
  criadoEm: string;
  situacao: Situacao;
  analisadoPorId?: string;
  analisadoEm?: string;
  observacao?: string;
}

/**
 * Autorização (RF09).
 * origem "responsavel": a família pede (ex.: saída antecipada) e a escola decide.
 * origem "escola": a escola pede (ex.: visita técnica) e o responsável decide.
 */
export type OrigemAutorizacao = 'responsavel' | 'escola';
export type TipoAutorizacao = 'saida_antecipada' | 'atividade_externa' | 'outro';

export interface Autorizacao {
  id: string;
  protocolo: string;
  alunoId: string;
  origem: OrigemAutorizacao;
  tipo: TipoAutorizacao;
  titulo: string;
  detalhes: string;
  data: string;
  hora?: string;
  buscaPor?: string; // quem busca o aluno na saída antecipada
  criadoPorId: string;
  criadoEm: string;
  situacao: Situacao;
  decididoPorId?: string;
  decididoEm?: string;
  observacao?: string;
}

/** Setores que atendem a central de suporte (RF11). */
export type Setor = 'secretaria' | 'coordenador' | 'professor' | 'diretor';
export type SituacaoChamado = 'aberto' | 'respondido' | 'encerrado';

export interface Mensagem {
  id: string;
  autorId: string;
  texto: string;
  em: string;
}

/** Conversa da central de suporte (RF10–RF12). */
export interface Chamado {
  id: string;
  protocolo: string;
  assunto: string;
  setor: Setor;
  professorId?: string; // quando o setor é "professor"
  alunoId?: string;
  criadoPorId: string;
  criadoEm: string;
  situacao: SituacaoChamado;
  mensagens: Mensagem[];
}

export type TipoNotificacao = 'aviso' | 'atestado' | 'autorizacao' | 'suporte' | 'vinculo';

/** Notificação dentro do app (RF07). */
export interface Notificacao {
  id: string;
  usuarioId: string;
  tipo: TipoNotificacao;
  titulo: string;
  texto: string;
  link: string; // tela que abre ao tocar, ex.: "/aviso/n-feriado"
  criadoEm: string;
  lida: boolean;
}

/** Tudo o que o app guarda. */
export interface BancoDados {
  contadorProtocolo: number;
  usuarios: Usuario[];
  alunos: Aluno[];
  avisos: Aviso[];
  atestados: Atestado[];
  autorizacoes: Autorizacao[];
  chamados: Chamado[];
  notificacoes: Notificacao[];
}
