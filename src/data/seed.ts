import type { DbState } from './types';

/**
 * Demo data for the TCC presentation. Every person, class and message here is
 * fictional. Dates are generated relative to "now" so the demo always looks current.
 */

const DEMO_PASSWORD = 'senai123';

function ago(days: number, hour = 9, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function day(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${dd}`;
}

export const DEMO_ACCOUNTS: { email: string; label: string; hint: string }[] = [
  { email: 'larissa@familia.demo', label: 'Larissa Santos', hint: 'Responsável · mãe do Pedro' },
  { email: 'pedro@aluno.demo', label: 'Pedro Santos', hint: 'Aluno · Mecânica' },
  { email: 'fernanda@senai.demo', label: 'Fernanda Rocha', hint: 'Coordenadora' },
  { email: 'juliana@senai.demo', label: 'Juliana Costa', hint: 'Secretaria' },
  { email: 'ricardo@senai.demo', label: 'Ricardo Alves', hint: 'Professor' },
  { email: 'paulo@senai.demo', label: 'Paulo Mendes', hint: 'Diretor' },
  { email: 'claudia@familia.demo', label: 'Cláudia Lima', hint: 'Responsável · mãe da Ana' },
  { email: 'ana@aluno.demo', label: 'Ana Beatriz Lima', hint: 'Aluna · Eletrotécnica' },
];

export { DEMO_PASSWORD };

export function createSeed(): DbState {
  return {
    version: 1,
    counters: { protocol: 152 },
    users: [
      { id: 'u-pedro', name: 'Pedro Henrique Santos', email: 'pedro@aluno.demo', password: DEMO_PASSWORD, role: 'aluno', studentIds: ['s-pedro'] },
      { id: 'u-ana', name: 'Ana Beatriz Lima', email: 'ana@aluno.demo', password: DEMO_PASSWORD, role: 'aluno', studentIds: ['s-ana'] },
      { id: 'u-larissa', name: 'Larissa Santos', email: 'larissa@familia.demo', password: DEMO_PASSWORD, role: 'responsavel', studentIds: ['s-pedro'], kinship: 'Mãe', phone: '(11) 98765-4321' },
      { id: 'u-marcos', name: 'Marcos Santos', email: 'marcos@familia.demo', password: DEMO_PASSWORD, role: 'responsavel', studentIds: ['s-pedro'], kinship: 'Pai', phone: '(11) 97654-3210' },
      { id: 'u-claudia', name: 'Cláudia Lima', email: 'claudia@familia.demo', password: DEMO_PASSWORD, role: 'responsavel', studentIds: ['s-ana'], kinship: 'Mãe', phone: '(11) 96543-2109' },
      { id: 'u-ricardo', name: 'Ricardo Alves', email: 'ricardo@senai.demo', password: DEMO_PASSWORD, role: 'professor', studentIds: [], turmas: ['MEC-2B'] },
      { id: 'u-sonia', name: 'Sônia Martins', email: 'sonia@senai.demo', password: DEMO_PASSWORD, role: 'professor', studentIds: [], turmas: ['ELT-1A'] },
      { id: 'u-fernanda', name: 'Fernanda Rocha', email: 'fernanda@senai.demo', password: DEMO_PASSWORD, role: 'coordenador', studentIds: [] },
      { id: 'u-paulo', name: 'Paulo Mendes', email: 'paulo@senai.demo', password: DEMO_PASSWORD, role: 'diretor', studentIds: [] },
      { id: 'u-juliana', name: 'Juliana Costa', email: 'juliana@senai.demo', password: DEMO_PASSWORD, role: 'secretaria', studentIds: [] },
    ],
    students: [
      {
        id: 's-pedro',
        userId: 'u-pedro',
        name: 'Pedro Henrique Santos',
        birthDate: '2010-03-14',
        registration: '2025.0418-7',
        course: 'Técnico em Mecânica',
        turma: 'MEC-2B',
        shift: 'Manhã',
        schedule: [
          { day: 'seg', entry: '07:30', exit: '12:40' },
          { day: 'ter', entry: '07:30', exit: '12:40' },
          { day: 'qua', entry: '07:30', exit: '12:40' },
          { day: 'qui', entry: '07:30', exit: '12:40' },
          { day: 'sex', entry: '07:30', exit: '11:50' },
        ],
        guardianIds: ['u-larissa', 'u-marcos'],
      },
      {
        id: 's-ana',
        userId: 'u-ana',
        name: 'Ana Beatriz Lima',
        birthDate: '2009-08-02',
        registration: '2026.0112-3',
        course: 'Técnico em Eletrotécnica',
        turma: 'ELT-1A',
        shift: 'Tarde',
        schedule: [
          { day: 'seg', entry: '13:00', exit: '17:30' },
          { day: 'ter', entry: '13:00', exit: '18:20' },
          { day: 'qua', entry: '13:00', exit: '17:30' },
          { day: 'qui', entry: '13:00', exit: '18:20' },
        ],
        guardianIds: ['u-claudia'],
      },
    ],
    notices: [
      {
        id: 'n-feriado',
        protocol: '2026/0140',
        title: 'Feriado de 15 de novembro: não haverá aula',
        body: 'Informamos que no feriado da Proclamação da República não haverá atividades na unidade. As aulas retornam normalmente no dia útil seguinte.\n\nA secretaria também estará fechada nesse dia.',
        category: 'calendario',
        audience: { kind: 'geral', to: 'todos' },
        authorId: 'u-paulo',
        createdAt: ago(2, 10, 15),
        requiresAck: false,
        readBy: ['u-pedro'],
        ackBy: [],
      },
      {
        id: 'n-visita',
        protocol: '2026/0146',
        title: 'Visita técnica à fábrica parceira',
        body: 'A turma MEC-2B fará visita técnica na próxima sexta-feira. Saída da unidade às 08:00 e retorno previsto às 11:30.\n\nÉ obrigatório o uso de calçado fechado e calça comprida. A participação depende da autorização do responsável no aplicativo.',
        category: 'pedagogico',
        audience: { kind: 'turma', turma: 'MEC-2B' },
        authorId: 'u-ricardo',
        createdAt: ago(1, 14, 5),
        requiresAck: false,
        readBy: [],
        ackBy: [],
      },
      {
        id: 'n-suspensao',
        protocol: '2026/0149',
        title: 'Comunicado de suspensão de 1 dia',
        body: 'Prezados responsáveis,\n\nComunicamos a suspensão do aluno Pedro Henrique Santos por 1 (um) dia letivo, em razão de descumprimento das normas de segurança na oficina (operação de torno sem óculos de proteção, após advertência verbal).\n\nO aluno deverá retornar no dia seguinte à suspensão. Solicitamos o comparecimento de um responsável à coordenação para conversa, em horário a combinar pela central de suporte.',
        category: 'disciplinar',
        audience: { kind: 'individual', studentId: 's-pedro' },
        authorId: 'u-fernanda',
        createdAt: ago(0, 8, 40),
        requiresAck: true,
        readBy: [],
        ackBy: [],
      },
      {
        id: 'n-mostra',
        protocol: '2026/0137',
        title: 'Mostra de projetos integradores',
        body: 'A Mostra de Projetos Integradores acontece no fim do mês, no pátio da unidade, das 9h às 16h. Familiares são bem-vindos. Cada turma apresentará seu protótipo.',
        category: 'evento',
        audience: { kind: 'geral', to: 'todos' },
        authorId: 'u-fernanda',
        createdAt: ago(5, 16, 30),
        requiresAck: false,
        readBy: ['u-larissa', 'u-pedro'],
        ackBy: [],
      },
      {
        id: 'n-rematricula',
        protocol: '2026/0131',
        title: 'Prazo de rematrícula 2027',
        body: 'O período de rematrícula para 2027 está aberto. Responsáveis devem conferir os dados cadastrais e confirmar a rematrícula na secretaria até o fim do mês.',
        category: 'informativo',
        audience: { kind: 'geral', to: 'responsaveis' },
        authorId: 'u-juliana',
        createdAt: ago(8, 11, 0),
        requiresAck: false,
        readBy: ['u-larissa'],
        ackBy: [],
      },
      {
        id: 'n-elt-epi',
        protocol: '2026/0144',
        title: 'Uso obrigatório de EPI no laboratório',
        body: 'A partir desta semana, o acesso ao laboratório de instalações elétricas exige luvas isolantes e óculos de proteção. Os EPIs são fornecidos pela unidade.',
        category: 'urgente',
        audience: { kind: 'turma', turma: 'ELT-1A' },
        authorId: 'u-sonia',
        createdAt: ago(3, 13, 10),
        requiresAck: false,
        readBy: [],
        ackBy: [],
      },
    ],
    certificates: [
      {
        id: 'c-1',
        protocol: '2026/0138',
        studentId: 's-pedro',
        senderId: 'u-larissa',
        startDate: day(-12),
        endDate: day(-11),
        reason: 'Consulta e repouso por virose.',
        fileName: 'atestado-ubs.pdf',
        fileSize: 184320,
        createdAt: ago(11, 19, 20),
        status: 'aprovado',
        reviewerId: 'u-juliana',
        reviewNote: 'Faltas abonadas.',
        reviewedAt: ago(10, 9, 5),
      },
      {
        id: 'c-2',
        protocol: '2026/0150',
        studentId: 's-ana',
        senderId: 'u-claudia',
        startDate: day(-1),
        endDate: day(-1),
        reason: 'Consulta odontológica.',
        fileName: 'declaracao-dentista.jpg',
        fileSize: 412000,
        createdAt: ago(0, 7, 55),
        status: 'pendente',
      },
    ],
    authorizations: [
      {
        id: 'a-visita',
        protocol: '2026/0147',
        studentId: 's-pedro',
        origin: 'escola',
        type: 'atividade_externa',
        title: 'Autorização para visita técnica',
        details: 'Visita técnica à fábrica parceira com a turma MEC-2B. Transporte da unidade, acompanhada pelo professor Ricardo Alves.',
        date: day(5),
        time: '08:00',
        createdById: 'u-ricardo',
        createdAt: ago(1, 14, 10),
        status: 'pendente',
      },
      {
        id: 'a-saida',
        protocol: '2026/0142',
        studentId: 's-pedro',
        origin: 'responsavel',
        type: 'saida_antecipada',
        title: 'Saída antecipada para consulta médica',
        details: 'Consulta com ortopedista às 11h.',
        date: day(-4),
        time: '10:20',
        pickupBy: 'Larissa Santos (mãe)',
        createdById: 'u-larissa',
        createdAt: ago(5, 20, 0),
        status: 'aprovado',
        decidedById: 'u-fernanda',
        decidedAt: ago(4, 7, 40),
        decisionNote: 'Liberado na portaria.',
      },
      {
        id: 'a-ana',
        protocol: '2026/0151',
        studentId: 's-ana',
        origin: 'responsavel',
        type: 'saida_antecipada',
        title: 'Saída antecipada',
        details: 'Compromisso familiar.',
        date: day(1),
        time: '16:00',
        pickupBy: 'Cláudia Lima (mãe)',
        createdById: 'u-claudia',
        createdAt: ago(0, 8, 10),
        status: 'pendente',
      },
    ],
    tickets: [
      {
        id: 't-1',
        protocol: '2026/0139',
        subject: 'Segunda via da carteirinha',
        target: 'secretaria',
        studentId: 's-pedro',
        createdById: 'u-larissa',
        createdAt: ago(3, 18, 30),
        status: 'respondido',
        messages: [
          { id: 'm-1', authorId: 'u-larissa', body: 'Boa noite. O Pedro perdeu a carteirinha. Como solicito a segunda via?', at: ago(3, 18, 30) },
          { id: 'm-2', authorId: 'u-juliana', body: 'Olá, Larissa. A segunda via pode ser retirada na secretaria em até 5 dias úteis. Já abrimos o pedido.', at: ago(2, 9, 12) },
        ],
      },
      {
        id: 't-2',
        protocol: '2026/0148',
        subject: 'Dúvida sobre a nota do projeto',
        target: 'professor',
        targetUserId: 'u-ricardo',
        studentId: 's-pedro',
        createdById: 'u-pedro',
        createdAt: ago(1, 16, 45),
        status: 'aberto',
        messages: [
          { id: 'm-3', authorId: 'u-pedro', body: 'Professor, posso refazer a parte do relatório do projeto integrador?', at: ago(1, 16, 45) },
        ],
      },
    ],
    notifications: [
      { id: 'nt-1', userId: 'u-larissa', kind: 'aviso', title: 'Aviso individual', body: 'Comunicado de suspensão de 1 dia', href: '/aviso/n-suspensao', createdAt: ago(0, 8, 40), read: false },
      { id: 'nt-2', userId: 'u-marcos', kind: 'aviso', title: 'Aviso individual', body: 'Comunicado de suspensão de 1 dia', href: '/aviso/n-suspensao', createdAt: ago(0, 8, 40), read: false },
      { id: 'nt-3', userId: 'u-pedro', kind: 'aviso', title: 'Aviso individual', body: 'Comunicado de suspensão de 1 dia', href: '/aviso/n-suspensao', createdAt: ago(0, 8, 40), read: false },
      { id: 'nt-4', userId: 'u-larissa', kind: 'autorizacao', title: 'Autorização solicitada', body: 'Autorização para visita técnica', href: '/autorizacao/a-visita', createdAt: ago(1, 14, 10), read: false },
      { id: 'nt-5', userId: 'u-larissa', kind: 'suporte', title: 'Secretaria respondeu', body: 'Segunda via da carteirinha', href: '/suporte/t-1', createdAt: ago(2, 9, 12), read: true },
      { id: 'nt-6', userId: 'u-juliana', kind: 'atestado', title: 'Novo atestado', body: 'Ana Beatriz Lima · Consulta odontológica', href: '/atestado/c-2', createdAt: ago(0, 7, 55), read: false },
      { id: 'nt-7', userId: 'u-fernanda', kind: 'autorizacao', title: 'Pedido de saída antecipada', body: 'Ana Beatriz Lima · amanhã às 16:00', href: '/autorizacao/a-ana', createdAt: ago(0, 8, 10), read: false },
      { id: 'nt-8', userId: 'u-ricardo', kind: 'suporte', title: 'Nova mensagem de aluno', body: 'Dúvida sobre a nota do projeto', href: '/suporte/t-2', createdAt: ago(1, 16, 45), read: false },
    ],
  };
}
