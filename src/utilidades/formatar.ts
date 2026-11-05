/**
 * FORMATAR — textos prontos para mostrar na tela: rótulos, datas, máscaras.
 */
import type { CategoriaAviso, DiaSemana, Perfil, Setor, TipoAutorizacao } from '../dados/tipos';

/* ───────────── Rótulos ───────────── */

export const NOME_PERFIL: Record<Perfil, string> = {
  aluno: 'Aluno',
  responsavel: 'Responsável',
  professor: 'Professor',
  coordenador: 'Coordenação',
  diretor: 'Direção',
  secretaria: 'Secretaria',
};

export const NOME_SETOR: Record<Setor, string> = {
  secretaria: 'Secretaria',
  coordenador: 'Coordenação',
  professor: 'Professor',
  diretor: 'Direção',
};

export const NOME_CATEGORIA: Record<CategoriaAviso, string> = {
  informativo: 'Informativo',
  evento: 'Evento',
  calendario: 'Calendário',
  pedagogico: 'Pedagógico',
  disciplinar: 'Disciplinar',
  urgente: 'Urgente',
};

export const NOME_TIPO_AUTORIZACAO: Record<TipoAutorizacao, string> = {
  saida_antecipada: 'Saída antecipada',
  atividade_externa: 'Atividade externa',
  outro: 'Outro',
};

export const DIAS_SEMANA: { id: DiaSemana; nome: string }[] = [
  { id: 'seg', nome: 'Segunda' },
  { id: 'ter', nome: 'Terça' },
  { id: 'qua', nome: 'Quarta' },
  { id: 'qui', nome: 'Quinta' },
  { id: 'sex', nome: 'Sexta' },
  { id: 'sab', nome: 'Sábado' },
];

/* ───────────── Datas ───────────── */

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const doisDigitos = (n: number) => String(n).padStart(2, '0');

/** Dia da semana de hoje (domingo = null, porque não há aula). */
export const diaDeHoje = (): DiaSemana | null => ([null, 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as const)[new Date().getDay()];

/** "2026-11-01" → Date. */
function lerDia(texto: string) {
  const [ano, mes, dia] = texto.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

/** Date → "2026-11-01". */
const paraDia = (d: Date) => `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`;

/** "2026-11-01" → "01/11/2026". */
export function dataCompleta(texto: string) {
  const d = lerDia(texto);
  return `${doisDigitos(d.getDate())}/${doisDigitos(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** "2026-11-01" → "1 nov". */
export function dataCurta(texto: string) {
  const d = lerDia(texto);
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
}

/** "Hoje", "Amanhã", "Ontem" ou "1 nov". */
export function dataRelativa(texto: string) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const diferenca = Math.round((lerDia(texto).getTime() - hoje.getTime()) / 86400000); // em dias
  if (diferenca === 0) return 'Hoje';
  if (diferenca === 1) return 'Amanhã';
  if (diferenca === -1) return 'Ontem';
  return dataCurta(texto);
}

/** ISO → "1 nov, 08:40". */
export function dataHora(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MESES[d.getMonth()]}, ${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}`;
}

/** ISO → "agora", "há 5 min", "há 3 h", "ontem", "há 4 dias" ou "1 nov". */
export function tempoAtras(iso: string) {
  const minutos = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutos < 1) return 'agora';
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  const dias = Math.round(horas / 24);
  if (dias === 1) return 'ontem';
  if (dias < 7) return `há ${dias} dias`;
  const d = new Date(iso);
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
}

/** Hoje + N dias, já no formato dos campos: "01/11/2026". */
export function diaMais(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return dataCompleta(paraDia(d));
}

export function idade(nascimento: string) {
  const n = lerDia(nascimento);
  const hoje = new Date();
  const fezAniversario = hoje.getMonth() > n.getMonth() || (hoje.getMonth() === n.getMonth() && hoje.getDate() >= n.getDate());
  return hoje.getFullYear() - n.getFullYear() - (fezAniversario ? 0 : 1);
}

/* ───────────── Nomes e tamanhos ───────────── */

/** "Larissa Santos" → "LS". */
export function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
}

export const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0];

/** 184320 → "180 KB". */
export function tamanhoArquivo(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
}

/* ───────────── Máscaras dos campos ───────────── */

const soNumeros = (texto: string, maximo: number) => texto.replace(/\D/g, '').slice(0, maximo);

/** Digitando "01112026" mostra "01/11/2026". */
export function mascaraData(texto: string) {
  const d = soNumeros(texto, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** "01/11/2026" → "2026-11-01", ou null se a data não existe. */
export function lerDataDigitada(texto: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  if (!m) return null;
  const [, dia, mes, ano] = m;
  const d = new Date(Number(ano), Number(mes) - 1, Number(dia));
  if (d.getMonth() !== Number(mes) - 1 || d.getDate() !== Number(dia)) return null; // ex.: 31/02
  return `${ano}-${mes}-${dia}`;
}

/** Digitando "1030" mostra "10:30". */
export function mascaraHora(texto: string) {
  const d = soNumeros(texto, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}:${d.slice(2)}`;
}

export function horaValida(texto: string) {
  const m = /^(\d{2}):(\d{2})$/.exec(texto);
  return !!m && Number(m[1]) < 24 && Number(m[2]) < 60;
}

/** Digitando "11987654321" mostra "(11) 98765-4321". */
export function mascaraTelefone(texto: string) {
  const d = soNumeros(texto, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
