import type { AuthorizationType, NoticeCategory, Role, SupportTarget, TicketStatus, Weekday } from '../data/types';

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export const ROLE_LABEL: Record<Role, string> = {
  aluno: 'Aluno',
  responsavel: 'Responsável',
  professor: 'Professor',
  coordenador: 'Coordenação',
  diretor: 'Direção',
  secretaria: 'Secretaria',
};

export const TARGET_LABEL: Record<SupportTarget, string> = {
  secretaria: 'Secretaria',
  coordenador: 'Coordenação',
  professor: 'Professor',
  diretor: 'Direção',
};

export const CATEGORY_LABEL: Record<NoticeCategory, string> = {
  informativo: 'Informativo',
  evento: 'Evento',
  calendario: 'Calendário',
  pedagogico: 'Pedagógico',
  disciplinar: 'Disciplinar',
  urgente: 'Urgente',
};

export const AUTH_TYPE_LABEL: Record<AuthorizationType, string> = {
  saida_antecipada: 'Saída antecipada',
  atividade_externa: 'Atividade externa',
  outro: 'Outro',
};

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  aberto: 'Aguardando resposta',
  respondido: 'Respondido',
  encerrado: 'Encerrado',
};

export const WEEKDAYS: { id: Weekday; short: string; long: string }[] = [
  { id: 'seg', short: 'Seg', long: 'Segunda' },
  { id: 'ter', short: 'Ter', long: 'Terça' },
  { id: 'qua', short: 'Qua', long: 'Quarta' },
  { id: 'qui', short: 'Qui', long: 'Quinta' },
  { id: 'sex', short: 'Sex', long: 'Sexta' },
  { id: 'sab', short: 'Sáb', long: 'Sábado' },
];

export function todayWeekday(): Weekday | null {
  const map: (Weekday | null)[] = [null, 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  return map[new Date().getDay()];
}

/** yyyy-mm-dd → Date at local midnight. */
export function parseDay(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toDayString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDay(s: string) {
  const d = parseDay(s);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function formatDayShort(s: string) {
  const d = parseDay(s);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function relativeDay(s: string) {
  const d = parseDay(s);
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - t.getTime()) / 86400000);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  if (diff === -1) return 'Ontem';
  return formatDayShort(s);
}

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const days = Math.round(h / 24);
  if (days === 1) return 'ontem';
  if (days < 7) return `há ${days} dias`;
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0];
}

export function age(birth: string) {
  const b = parseDay(birth);
  const n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
  return a;
}

export function fileSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
}

/** Masks typed digits into dd/mm/aaaa. */
export function maskDate(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** dd/mm/aaaa → yyyy-mm-dd, or null if invalid. */
export function parseMaskedDate(s: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  if (d.getMonth() !== Number(mm) - 1 || d.getDate() !== Number(dd)) return null;
  return `${yyyy}-${mm}-${dd}`;
}

export function maskTime(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}:${d.slice(2)}`;
}

export function validTime(s: string) {
  const m = /^(\d{2}):(\d{2})$/.exec(s);
  return !!m && Number(m[1]) < 24 && Number(m[2]) < 60;
}

export function maskPhone(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
