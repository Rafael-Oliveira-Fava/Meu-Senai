/**
 * ESQUEMA — as colunas de cada tabela do MySQL e a conversão objeto ⇄ linha.
 * Usado pelo app (para saber o que mudou) e pelo servidor (para gravar no banco).
 * As tabelas em si são criadas por servidor/banco.sql.
 *
 * Tipos das colunas:
 *   texto / numero → valor guardado como está;
 *   booleano       → guardado como 0 ou 1;
 *   json           → listas e objetos pequenos (ex.: horários, mensagens).
 * Campo opcional vazio (undefined) vira NULL.
 */
import type { BancoDados } from './tipos';

type TipoColuna = 'texto' | 'numero' | 'booleano' | 'json';

/** Tabela → { coluna: tipo }. Precisa bater com servidor/banco.sql. */
export const TABELAS = {
  usuarios: {
    id: 'texto',
    nome: 'texto',
    email: 'texto',
    senha: 'texto',
    perfil: 'texto',
    alunoIds: 'json',
    turmas: 'json',
    parentesco: 'texto',
    telefone: 'texto',
  },
  alunos: {
    id: 'texto',
    usuarioId: 'texto',
    nome: 'texto',
    nascimento: 'texto',
    matricula: 'texto',
    curso: 'texto',
    turma: 'texto',
    turno: 'texto',
    horarios: 'json',
    responsavelIds: 'json',
  },
  avisos: {
    id: 'texto',
    protocolo: 'texto',
    titulo: 'texto',
    texto: 'texto',
    categoria: 'texto',
    publico: 'json',
    autorId: 'texto',
    criadoEm: 'texto',
    pedeCiencia: 'booleano',
    lidoPor: 'json',
    cientes: 'json',
  },
  atestados: {
    id: 'texto',
    protocolo: 'texto',
    alunoId: 'texto',
    enviadoPorId: 'texto',
    inicio: 'texto',
    fim: 'texto',
    motivo: 'texto',
    arquivoNome: 'texto',
    arquivoTamanho: 'numero',
    arquivoUri: 'texto',
    criadoEm: 'texto',
    situacao: 'texto',
    analisadoPorId: 'texto',
    analisadoEm: 'texto',
    observacao: 'texto',
  },
  autorizacoes: {
    id: 'texto',
    protocolo: 'texto',
    alunoId: 'texto',
    origem: 'texto',
    tipo: 'texto',
    titulo: 'texto',
    detalhes: 'texto',
    data: 'texto',
    hora: 'texto',
    buscaPor: 'texto',
    criadoPorId: 'texto',
    criadoEm: 'texto',
    situacao: 'texto',
    decididoPorId: 'texto',
    decididoEm: 'texto',
    observacao: 'texto',
  },
  chamados: {
    id: 'texto',
    protocolo: 'texto',
    assunto: 'texto',
    setor: 'texto',
    professorId: 'texto',
    alunoId: 'texto',
    criadoPorId: 'texto',
    criadoEm: 'texto',
    situacao: 'texto',
    mensagens: 'json',
  },
  notificacoes: {
    id: 'texto',
    usuarioId: 'texto',
    tipo: 'texto',
    titulo: 'texto',
    texto: 'texto',
    link: 'texto',
    criadoEm: 'texto',
    lida: 'booleano',
  },
} satisfies Record<string, Record<string, TipoColuna>>;

export type Tabela = keyof typeof TABELAS;
export const NOMES_TABELAS = Object.keys(TABELAS) as Tabela[];
export const ehTabela = (nome: unknown): nome is Tabela => typeof nome === 'string' && nome in TABELAS;
export const colunasDe = (tabela: Tabela) => Object.keys(TABELAS[tabela]);

/** Valor aceito pelo MySQL como parâmetro. */
type ValorSql = string | number | null;
export type Linha = Record<string, unknown>;

const colunas = (tabela: Tabela) => Object.entries(TABELAS[tabela]) as [string, TipoColuna][];

/** Objeto do app → valores das colunas (na ordem de `colunasDe`). */
export function paraLinha(tabela: Tabela, objeto: object): ValorSql[] {
  const o = objeto as Record<string, unknown>;
  return colunas(tabela).map(([campo, tipo]): ValorSql => {
    const valor = o[campo];
    if (valor === undefined || valor === null) return null;
    if (tipo === 'json') return JSON.stringify(valor);
    if (tipo === 'booleano') return valor ? 1 : 0;
    return valor as string | number;
  });
}

/** Linha lida do MySQL → objeto do app. */
export function deLinha<T>(tabela: Tabela, linha: Linha): T {
  const objeto: Record<string, unknown> = {};
  for (const [campo, tipo] of colunas(tabela)) {
    const valor = linha[campo];
    if (valor === null || valor === undefined) continue; // campo opcional vazio
    // O MySQL devolve JSON já convertido; o MariaDB devolve como texto.
    if (tipo === 'json') objeto[campo] = typeof valor === 'string' ? JSON.parse(valor) : valor;
    else if (tipo === 'booleano') objeto[campo] = Boolean(Number(valor));
    else if (tipo === 'numero') objeto[campo] = Number(valor);
    else objeto[campo] = valor;
  }
  return objeto as T;
}

/* ───────── O que mudou entre duas versões dos dados ───────── */

/** JSON com as chaves em ordem alfabética: o mesmo dado sempre vira o mesmo texto. */
function emOrdem(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(emOrdem);
  if (valor && typeof valor === 'object')
    return Object.fromEntries(
      Object.keys(valor)
        .sort()
        .map((k) => [k, emOrdem((valor as Record<string, unknown>)[k])]),
    );
  return valor;
}

/**
 * Uma linha resumida num texto, para comparar duas versões dela.
 * A senha fica de fora: ela existe só no servidor, o app não a recebe.
 */
export function resumo(tabela: Tabela, objeto: object): string {
  const { senha: _senha, ...resto } = objeto as Record<string, unknown>;
  return JSON.stringify(paraLinha(tabela, emOrdem(resto) as object));
}

/** Uma "foto" dos dados: id → resumo de cada linha. */
export type Foto = Record<Tabela, Map<string, string>>;

export function tirarFoto(d: BancoDados): Foto {
  const foto = {} as Foto;
  for (const tabela of NOMES_TABELAS) foto[tabela] = new Map(d[tabela].map((o) => [o.id, resumo(tabela, o)]));
  return foto;
}

/**
 * Pacote enviado ao servidor com só o que mudou.
 * `antes` é o resumo da linha como o app a conhecia (vazio = linha nova). O servidor só grava
 * se a linha no banco ainda estiver assim; senão, alguém mexeu nela ao mesmo tempo (conflito).
 */
export interface Mudancas {
  gravar: { tabela: Tabela; objeto: { id: string }; antes?: string }[];
  apagar: { tabela: Tabela; id: string }[];
  contadorProtocolo: number;
}

/** O que precisa ser gravado ou apagado para o banco passar de `antes` para `dados`. */
export function diferencas(antes: Foto, dados: BancoDados): Mudancas {
  const depois = tirarFoto(dados);
  const mudancas: Mudancas = { gravar: [], apagar: [], contadorProtocolo: dados.contadorProtocolo };
  for (const tabela of NOMES_TABELAS) {
    for (const objeto of dados[tabela]) {
      const anterior = antes[tabela].get(objeto.id);
      if (anterior !== depois[tabela].get(objeto.id)) mudancas.gravar.push({ tabela, objeto, antes: anterior });
    }
    for (const id of antes[tabela].keys()) {
      if (!depois[tabela].has(id)) mudancas.apagar.push({ tabela, id });
    }
  }
  return mudancas;
}

export const temMudancas = (m: Mudancas) => m.gravar.length > 0 || m.apagar.length > 0;
