/**
 * DADOS INICIAIS — gravados no banco na primeira vez que o servidor liga
 * (e de novo em "Restaurar dados iniciais").
 * As datas são calculadas a partir de hoje, então os dados sempre parecem atuais.
 */
import type { BancoDados } from './tipos';

export const SENHA_DEMO = 'senai123';

/** Data e hora de "N dias atrás", no formato ISO. */
function diasAtras(dias: number, hora = 9, minuto = 0) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  d.setHours(hora, minuto, 0, 0);
  return d.toISOString();
}

/** Dia "hoje + N" no formato 2026-11-01. */
function dia(deslocamento: number) {
  const d = new Date();
  d.setDate(d.getDate() + deslocamento);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Atalhos da tela de login. */
export const CONTAS_DEMO = [
  { email: 'larissa@familia.demo', nome: 'Larissa Santos', descricao: 'Responsável · mãe do Pedro' },
  { email: 'pedro@aluno.demo', nome: 'Pedro Santos', descricao: 'Aluno · Mecânica' },
  { email: 'fernanda@senai.demo', nome: 'Fernanda Rocha', descricao: 'Coordenadora' },
  { email: 'juliana@senai.demo', nome: 'Juliana Costa', descricao: 'Secretaria' },
  { email: 'ricardo@senai.demo', nome: 'Ricardo Alves', descricao: 'Professor' },
  { email: 'paulo@senai.demo', nome: 'Paulo Mendes', descricao: 'Diretor' },
  { email: 'claudia@familia.demo', nome: 'Cláudia Lima', descricao: 'Responsável · mãe da Ana' },
  { email: 'ana@aluno.demo', nome: 'Ana Beatriz Lima', descricao: 'Aluna · Eletrotécnica' },
];

export function criarDadosDemonstracao(): BancoDados {
  const senha = SENHA_DEMO;
  return {
    contadorProtocolo: 152,

    usuarios: [
      { id: 'u-pedro', nome: 'Pedro Henrique Santos', email: 'pedro@aluno.demo', senha, perfil: 'aluno', alunoIds: ['s-pedro'] },
      { id: 'u-ana', nome: 'Ana Beatriz Lima', email: 'ana@aluno.demo', senha, perfil: 'aluno', alunoIds: ['s-ana'] },
      {
        id: 'u-larissa',
        nome: 'Larissa Santos',
        email: 'larissa@familia.demo',
        senha,
        perfil: 'responsavel',
        alunoIds: ['s-pedro'],
        parentesco: 'Mãe',
        telefone: '(11) 98765-4321',
      },
      {
        id: 'u-marcos',
        nome: 'Marcos Santos',
        email: 'marcos@familia.demo',
        senha,
        perfil: 'responsavel',
        alunoIds: ['s-pedro'],
        parentesco: 'Pai',
        telefone: '(11) 97654-3210',
      },
      {
        id: 'u-claudia',
        nome: 'Cláudia Lima',
        email: 'claudia@familia.demo',
        senha,
        perfil: 'responsavel',
        alunoIds: ['s-ana'],
        parentesco: 'Mãe',
        telefone: '(11) 96543-2109',
      },
      { id: 'u-ricardo', nome: 'Ricardo Alves', email: 'ricardo@senai.demo', senha, perfil: 'professor', alunoIds: [], turmas: ['MEC-2B'] },
      { id: 'u-sonia', nome: 'Sônia Martins', email: 'sonia@senai.demo', senha, perfil: 'professor', alunoIds: [], turmas: ['ELT-1A'] },
      { id: 'u-fernanda', nome: 'Fernanda Rocha', email: 'fernanda@senai.demo', senha, perfil: 'coordenador', alunoIds: [] },
      { id: 'u-paulo', nome: 'Paulo Mendes', email: 'paulo@senai.demo', senha, perfil: 'diretor', alunoIds: [] },
      { id: 'u-juliana', nome: 'Juliana Costa', email: 'juliana@senai.demo', senha, perfil: 'secretaria', alunoIds: [] },
    ],

    alunos: [
      {
        id: 's-pedro',
        usuarioId: 'u-pedro',
        nome: 'Pedro Henrique Santos',
        nascimento: '2010-03-14',
        matricula: '2025.0418-7',
        curso: 'Técnico em Mecânica',
        turma: 'MEC-2B',
        turno: 'Manhã',
        horarios: [
          { dia: 'seg', entrada: '07:30', saida: '12:40' },
          { dia: 'ter', entrada: '07:30', saida: '12:40' },
          { dia: 'qua', entrada: '07:30', saida: '12:40' },
          { dia: 'qui', entrada: '07:30', saida: '12:40' },
          { dia: 'sex', entrada: '07:30', saida: '11:50' },
        ],
        responsavelIds: ['u-larissa', 'u-marcos'],
      },
      {
        id: 's-ana',
        usuarioId: 'u-ana',
        nome: 'Ana Beatriz Lima',
        nascimento: '2009-08-02',
        matricula: '2026.0112-3',
        curso: 'Técnico em Eletrotécnica',
        turma: 'ELT-1A',
        turno: 'Tarde',
        horarios: [
          { dia: 'seg', entrada: '13:00', saida: '17:30' },
          { dia: 'ter', entrada: '13:00', saida: '18:20' },
          { dia: 'qua', entrada: '13:00', saida: '17:30' },
          { dia: 'qui', entrada: '13:00', saida: '18:20' },
        ],
        responsavelIds: ['u-claudia'],
      },
    ],

    avisos: [
      {
        id: 'n-feriado',
        protocolo: '2026/0140',
        titulo: 'Feriado de 15 de novembro: não haverá aula',
        texto:
          'Informamos que no feriado da Proclamação da República não haverá atividades na unidade. As aulas retornam normalmente no dia útil seguinte.\n\nA secretaria também estará fechada nesse dia.',
        categoria: 'calendario',
        publico: { tipo: 'geral', para: 'todos' },
        autorId: 'u-paulo',
        criadoEm: diasAtras(2, 10, 15),
        pedeCiencia: false,
        lidoPor: ['u-pedro'],
        cientes: [],
      },
      {
        id: 'n-visita',
        protocolo: '2026/0146',
        titulo: 'Visita técnica à fábrica parceira',
        texto:
          'A turma MEC-2B fará visita técnica na próxima sexta-feira. Saída da unidade às 08:00 e retorno previsto às 11:30.\n\nÉ obrigatório o uso de calçado fechado e calça comprida. A participação depende da autorização do responsável no aplicativo.',
        categoria: 'pedagogico',
        publico: { tipo: 'turma', turma: 'MEC-2B' },
        autorId: 'u-ricardo',
        criadoEm: diasAtras(1, 14, 5),
        pedeCiencia: false,
        lidoPor: [],
        cientes: [],
      },
      {
        id: 'n-suspensao',
        protocolo: '2026/0149',
        titulo: 'Comunicado de suspensão de 1 dia',
        texto:
          'Prezados responsáveis,\n\nComunicamos a suspensão do aluno Pedro Henrique Santos por 1 (um) dia letivo, em razão de descumprimento das normas de segurança na oficina (operação de torno sem óculos de proteção, após advertência verbal).\n\nO aluno deverá retornar no dia seguinte à suspensão. Solicitamos o comparecimento de um responsável à coordenação para conversa, em horário a combinar pela central de suporte.',
        categoria: 'disciplinar',
        publico: { tipo: 'individual', alunoId: 's-pedro' },
        autorId: 'u-fernanda',
        criadoEm: diasAtras(0, 8, 40),
        pedeCiencia: true,
        lidoPor: [],
        cientes: [],
      },
      {
        id: 'n-mostra',
        protocolo: '2026/0137',
        titulo: 'Mostra de projetos integradores',
        texto:
          'A Mostra de Projetos Integradores acontece no fim do mês, no pátio da unidade, das 9h às 16h. Familiares são bem-vindos. Cada turma apresentará seu protótipo.',
        categoria: 'evento',
        publico: { tipo: 'geral', para: 'todos' },
        autorId: 'u-fernanda',
        criadoEm: diasAtras(5, 16, 30),
        pedeCiencia: false,
        lidoPor: ['u-larissa', 'u-pedro'],
        cientes: [],
      },
      {
        id: 'n-rematricula',
        protocolo: '2026/0131',
        titulo: 'Prazo de rematrícula 2027',
        texto:
          'O período de rematrícula para 2027 está aberto. Responsáveis devem conferir os dados cadastrais e confirmar a rematrícula na secretaria até o fim do mês.',
        categoria: 'informativo',
        publico: { tipo: 'geral', para: 'responsaveis' },
        autorId: 'u-juliana',
        criadoEm: diasAtras(8, 11, 0),
        pedeCiencia: false,
        lidoPor: ['u-larissa'],
        cientes: [],
      },
      {
        id: 'n-elt-epi',
        protocolo: '2026/0144',
        titulo: 'Uso obrigatório de EPI no laboratório',
        texto:
          'A partir desta semana, o acesso ao laboratório de instalações elétricas exige luvas isolantes e óculos de proteção. Os EPIs são fornecidos pela unidade.',
        categoria: 'urgente',
        publico: { tipo: 'turma', turma: 'ELT-1A' },
        autorId: 'u-sonia',
        criadoEm: diasAtras(3, 13, 10),
        pedeCiencia: false,
        lidoPor: [],
        cientes: [],
      },
    ],

    atestados: [
      {
        id: 'c-1',
        protocolo: '2026/0138',
        alunoId: 's-pedro',
        enviadoPorId: 'u-larissa',
        inicio: dia(-12),
        fim: dia(-11),
        motivo: 'Consulta e repouso por virose.',
        arquivoNome: 'atestado-ubs.pdf',
        arquivoTamanho: 184320,
        criadoEm: diasAtras(11, 19, 20),
        situacao: 'aprovado',
        analisadoPorId: 'u-juliana',
        analisadoEm: diasAtras(10, 9, 5),
        observacao: 'Faltas abonadas.',
      },
      {
        id: 'c-2',
        protocolo: '2026/0150',
        alunoId: 's-ana',
        enviadoPorId: 'u-claudia',
        inicio: dia(-1),
        fim: dia(-1),
        motivo: 'Consulta odontológica.',
        arquivoNome: 'declaracao-dentista.jpg',
        arquivoTamanho: 412000,
        criadoEm: diasAtras(0, 7, 55),
        situacao: 'pendente',
      },
    ],

    autorizacoes: [
      {
        id: 'a-visita',
        protocolo: '2026/0147',
        alunoId: 's-pedro',
        origem: 'escola',
        tipo: 'atividade_externa',
        titulo: 'Autorização para visita técnica',
        detalhes: 'Visita técnica à fábrica parceira com a turma MEC-2B. Transporte da unidade, acompanhada pelo professor Ricardo Alves.',
        data: dia(5),
        hora: '08:00',
        criadoPorId: 'u-ricardo',
        criadoEm: diasAtras(1, 14, 10),
        situacao: 'pendente',
      },
      {
        id: 'a-saida',
        protocolo: '2026/0142',
        alunoId: 's-pedro',
        origem: 'responsavel',
        tipo: 'saida_antecipada',
        titulo: 'Saída antecipada para consulta médica',
        detalhes: 'Consulta com ortopedista às 11h.',
        data: dia(-4),
        hora: '10:20',
        buscaPor: 'Larissa Santos (mãe)',
        criadoPorId: 'u-larissa',
        criadoEm: diasAtras(5, 20, 0),
        situacao: 'aprovado',
        decididoPorId: 'u-fernanda',
        decididoEm: diasAtras(4, 7, 40),
        observacao: 'Liberado na portaria.',
      },
      {
        id: 'a-ana',
        protocolo: '2026/0151',
        alunoId: 's-ana',
        origem: 'responsavel',
        tipo: 'saida_antecipada',
        titulo: 'Saída antecipada',
        detalhes: 'Compromisso familiar.',
        data: dia(1),
        hora: '16:00',
        buscaPor: 'Cláudia Lima (mãe)',
        criadoPorId: 'u-claudia',
        criadoEm: diasAtras(0, 8, 10),
        situacao: 'pendente',
      },
    ],

    chamados: [
      {
        id: 't-1',
        protocolo: '2026/0139',
        assunto: 'Segunda via da carteirinha',
        setor: 'secretaria',
        alunoId: 's-pedro',
        criadoPorId: 'u-larissa',
        criadoEm: diasAtras(3, 18, 30),
        situacao: 'respondido',
        mensagens: [
          {
            id: 'm-1',
            autorId: 'u-larissa',
            texto: 'Boa noite. O Pedro perdeu a carteirinha. Como solicito a segunda via?',
            em: diasAtras(3, 18, 30),
          },
          {
            id: 'm-2',
            autorId: 'u-juliana',
            texto: 'Olá, Larissa. A segunda via pode ser retirada na secretaria em até 5 dias úteis. Já abrimos o pedido.',
            em: diasAtras(2, 9, 12),
          },
        ],
      },
      {
        id: 't-2',
        protocolo: '2026/0148',
        assunto: 'Dúvida sobre a nota do projeto',
        setor: 'professor',
        professorId: 'u-ricardo',
        alunoId: 's-pedro',
        criadoPorId: 'u-pedro',
        criadoEm: diasAtras(1, 16, 45),
        situacao: 'aberto',
        mensagens: [
          {
            id: 'm-3',
            autorId: 'u-pedro',
            texto: 'Professor, posso refazer a parte do relatório do projeto integrador?',
            em: diasAtras(1, 16, 45),
          },
        ],
      },
    ],

    notificacoes: [
      {
        id: 'nt-1',
        usuarioId: 'u-larissa',
        tipo: 'aviso',
        titulo: 'Aviso individual',
        texto: 'Comunicado de suspensão de 1 dia',
        link: '/aviso/n-suspensao',
        criadoEm: diasAtras(0, 8, 40),
        lida: false,
      },
      {
        id: 'nt-2',
        usuarioId: 'u-marcos',
        tipo: 'aviso',
        titulo: 'Aviso individual',
        texto: 'Comunicado de suspensão de 1 dia',
        link: '/aviso/n-suspensao',
        criadoEm: diasAtras(0, 8, 40),
        lida: false,
      },
      {
        id: 'nt-3',
        usuarioId: 'u-pedro',
        tipo: 'aviso',
        titulo: 'Aviso individual',
        texto: 'Comunicado de suspensão de 1 dia',
        link: '/aviso/n-suspensao',
        criadoEm: diasAtras(0, 8, 40),
        lida: false,
      },
      {
        id: 'nt-4',
        usuarioId: 'u-larissa',
        tipo: 'autorizacao',
        titulo: 'Autorização solicitada',
        texto: 'Autorização para visita técnica',
        link: '/autorizacao/a-visita',
        criadoEm: diasAtras(1, 14, 10),
        lida: false,
      },
      {
        id: 'nt-5',
        usuarioId: 'u-larissa',
        tipo: 'suporte',
        titulo: 'Secretaria respondeu',
        texto: 'Segunda via da carteirinha',
        link: '/suporte/t-1',
        criadoEm: diasAtras(2, 9, 12),
        lida: true,
      },
      {
        id: 'nt-6',
        usuarioId: 'u-juliana',
        tipo: 'atestado',
        titulo: 'Novo atestado',
        texto: 'Ana Beatriz Lima · Consulta odontológica',
        link: '/atestado/c-2',
        criadoEm: diasAtras(0, 7, 55),
        lida: false,
      },
      {
        id: 'nt-7',
        usuarioId: 'u-fernanda',
        tipo: 'autorizacao',
        titulo: 'Pedido de saída antecipada',
        texto: 'Ana Beatriz Lima · amanhã às 16:00',
        link: '/autorizacao/a-ana',
        criadoEm: diasAtras(0, 8, 10),
        lida: false,
      },
      {
        id: 'nt-8',
        usuarioId: 'u-ricardo',
        tipo: 'suporte',
        titulo: 'Nova mensagem de aluno',
        texto: 'Dúvida sobre a nota do projeto',
        link: '/suporte/t-2',
        criadoEm: diasAtras(1, 16, 45),
        lida: false,
      },
    ],
  };
}
