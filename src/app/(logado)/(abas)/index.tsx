/**
 * INÍCIO — cabeçalho azul com logo e saudação, atalhos do perfil,
 * horário de hoje do aluno, o que precisa de atenção e os últimos comunicados.
 */
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Aparecer, Tocavel } from '../../../componentes/animacao';
import { Filtro, LinhaFiltros } from '../../../componentes/controles';
import { Avatar, Cartao, Logo, TituloSecao } from '../../../componentes/estrutura';
import { Icone, type NomeIcone } from '../../../componentes/icone';
import { Vazio } from '../../../componentes/indicadores';
import { LinhaAtestado, LinhaAutorizacao, LinhaAviso } from '../../../componentes/linhas';
import { useBanco, useUsuario } from '../../../dados/banco';
import {
  contarAvisosNaoLidos,
  contarChamadosAguardando,
  contarNotificacoesNaoLidas,
  pendencias,
  precisaCiencia,
} from '../../../dados/consultas';
import { alunosVisiveis, avisosVisiveis, ehEquipe, ehFamilia } from '../../../dados/permissoes';
import type { Aluno, Usuario } from '../../../dados/tipos';
import { DIAS_SEMANA, diaDeHoje, NOME_PERFIL, primeiroNome } from '../../../utilidades/formatar';
import { cor, espaco, raio, sombraForte, tipografia } from '../../../tema';

type Atalho = { nome: string; icone: NomeIcone; link: Href; contador?: number };
type Contadores = { avisos: number; pedidos: number; chamados: number; notificacoes: number };

/** Os 4 atalhos mudam conforme o perfil. */
function atalhosDo(u: Usuario, c: Contadores): Atalho[] {
  if (u.perfil === 'responsavel')
    return [
      { nome: 'Comunicados', icone: 'bullhorn-outline', link: '/avisos', contador: c.avisos },
      { nome: 'Enviar atestado', icone: 'medical-bag', link: '/atestado/novo' },
      { nome: 'Pedir saída', icone: 'exit-run', link: '/autorizacao/nova' },
      { nome: 'Falar com a escola', icone: 'chat-question-outline', link: '/suporte/novo', contador: c.chamados },
    ];
  if (u.perfil === 'aluno')
    return [
      { nome: 'Comunicados', icone: 'bullhorn-outline', link: '/avisos', contador: c.avisos },
      { nome: 'Meu horário', icone: 'clock-time-four-outline', link: '/aluno' },
      { nome: 'Notificações', icone: 'bell-outline', link: '/notificacoes', contador: c.notificacoes },
      { nome: 'Falar com a escola', icone: 'chat-question-outline', link: '/suporte/novo', contador: c.chamados },
    ];
  if (u.perfil === 'professor')
    return [
      { nome: 'Novo aviso', icone: 'bullhorn-outline', link: '/aviso/novo' },
      { nome: 'Pedir autorização', icone: 'file-sign', link: '/autorizacao/nova' },
      { nome: 'Minhas turmas', icone: 'account-group-outline', link: '/aluno' },
      { nome: 'Mensagens', icone: 'forum-outline', link: '/suporte', contador: c.chamados },
    ];
  return [
    { nome: 'Novo comunicado', icone: 'bullhorn-outline', link: '/aviso/novo' },
    { nome: 'Pedidos', icone: 'file-document-multiple-outline', link: '/pedidos', contador: c.pedidos },
    { nome: 'Alunos', icone: 'account-group-outline', link: '/aluno' },
    { nome: 'Mensagens', icone: 'forum-outline', link: '/suporte', contador: c.chamados },
  ];
}

export default function TelaInicio() {
  const { db } = useBanco();
  const usuario = useUsuario();
  const margens = useSafeAreaInsets();
  const alunos = alunosVisiveis(db, usuario);
  const [alunoId, setAlunoId] = useState(alunos[0]?.id);
  const aluno = ehFamilia(usuario) ? (alunos.find((a) => a.id === alunoId) ?? alunos[0]) : undefined;

  const avisos = avisosVisiveis(db, usuario);
  const aguardandoCiencia = avisos.filter((a) => precisaCiencia(a, usuario));
  const ultimos = avisos.filter((a) => !aguardandoCiencia.includes(a)).slice(0, 3);
  const pendente = pendencias(db, usuario);
  const totalAtencao = aguardandoCiencia.length + pendente.total;
  const notificacoes = contarNotificacoesNaoLidas(db, usuario);
  const atalhos = atalhosDo(usuario, {
    avisos: contarAvisosNaoLidos(db, usuario),
    pedidos: pendente.total,
    chamados: contarChamadosAguardando(db, usuario),
    notificacoes,
  });

  const subtitulo =
    usuario.perfil === 'responsavel' && aluno
      ? `Responsável por ${primeiroNome(aluno.nome)}`
      : usuario.perfil === 'aluno' && aluno
        ? `${aluno.curso} · ${aluno.turma}`
        : usuario.perfil === 'professor'
          ? `Professor · ${usuario.turmas?.join(', ')}`
          : NOME_PERFIL[usuario.perfil];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: cor.fundo }} contentContainerStyle={{ paddingBottom: espaco[8] }}>
      {/* Cabeçalho azul */}
      <View style={[estilos.cabecalho, { paddingTop: margens.top + espaco[3] }]}>
        <View style={estilos.coluna}>
          <View style={estilos.linhaLogo}>
            <Logo tamanho={18} />
            <Pressable
              onPress={() => router.push('/notificacoes')}
              accessibilityRole="button"
              accessibilityLabel={notificacoes ? `Notificações, ${notificacoes} não lidas` : 'Notificações'}
              style={({ pressed }) => [estilos.sino, pressed && { backgroundColor: 'rgba(255,255,255,0.18)' }]}
            >
              <Icone nome="bell-outline" cor={cor.sobrePrimaria} tamanho={24} />
              {notificacoes ? <Bolinha numero={notificacoes} borda={cor.primaria} /> : null}
            </Pressable>
          </View>
          <View style={estilos.linhaSaudacao}>
            <Pressable onPress={() => router.push('/conta')} accessibilityRole="button" accessibilityLabel="Minha conta" hitSlop={6}>
              <Avatar nome={usuario.nome} tamanho={52} anel />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={[tipografia.manchete, { color: cor.sobrePrimaria }]} numberOfLines={1}>
                Olá, {primeiroNome(usuario.nome)}
              </Text>
              <Text style={[tipografia.corpoPequeno, { color: cor.sobrePrimariaSuave }]} numberOfLines={1}>
                {subtitulo}
              </Text>
            </View>
          </View>
          {/* Responsável com mais de um filho escolhe qual acompanhar */}
          {usuario.perfil === 'responsavel' && alunos.length > 1 ? (
            <View style={{ marginTop: espaco[4] }}>
              <LinhaFiltros>
                {alunos.map((a) => (
                  <Filtro key={a.id} texto={primeiroNome(a.nome)} ativo={a.id === aluno?.id} aoTocar={() => setAlunoId(a.id)} />
                ))}
              </LinhaFiltros>
            </View>
          ) : null}
        </View>
      </View>

      <View style={[estilos.coluna, { paddingHorizontal: espaco[4] }]}>
        {/* Atalhos */}
        <Aparecer style={estilos.atalhos}>
          {atalhos.map((a) => (
            <Tocavel
              key={a.nome}
              onPress={() => router.push(a.link)}
              accessibilityRole="button"
              accessibilityLabel={a.nome}
              style={estilos.atalho}
              escala={0.95}
            >
              <View style={estilos.atalhoIcone}>
                <Icone nome={a.icone} tamanho={24} cor={cor.primaria} />
                {a.contador ? <Bolinha numero={a.contador} borda={cor.superficie} /> : null}
              </View>
              <Text style={[tipografia.rotuloPequeno, { color: cor.texto, textAlign: 'center', width: '100%' }]} numberOfLines={2}>
                {a.nome}
              </Text>
            </Tocavel>
          ))}
        </Aparecer>

        {aluno ? (
          <Aparecer ordem={1}>
            <CartaoHoje aluno={aluno} />
          </Aparecer>
        ) : null}

        {/* Precisa da sua atenção */}
        {totalAtencao > 0 ? (
          <View style={{ gap: espaco[3] }}>
            <TituloSecao contador={totalAtencao}>Precisa da sua atenção</TituloSecao>
            {aguardandoCiencia.map((a, i) => (
              <Aparecer key={a.id} ordem={i + 2}>
                <LinhaAviso db={db} usuario={usuario} aviso={a} />
              </Aparecer>
            ))}
            {pendente.autorizacoes.slice(0, 3).map((a, i) => (
              <Aparecer key={a.id} ordem={i + 3}>
                <LinhaAutorizacao db={db} autorizacao={a} usuario={usuario} />
              </Aparecer>
            ))}
            {pendente.atestados.slice(0, 3).map((a, i) => (
              <Aparecer key={a.id} ordem={i + 4}>
                <LinhaAtestado db={db} atestado={a} mostrarAluno />
              </Aparecer>
            ))}
          </View>
        ) : (
          <Aparecer ordem={2} style={estilos.emDia}>
            <Icone nome="check-circle-outline" cor={cor.verde} />
            <Text style={[tipografia.corpoPequeno, { color: cor.texto, flex: 1 }]}>Tudo em dia. Nada esperando sua resposta.</Text>
          </Aparecer>
        )}

        {/* Últimos comunicados */}
        <View style={{ gap: espaco[3] }}>
          <TituloSecao acao={{ texto: 'Ver todos', aoTocar: () => router.push('/avisos') }}>Últimos comunicados</TituloSecao>
          {ultimos.length ? (
            ultimos.map((a, i) => (
              <Aparecer key={a.id} ordem={i + 3}>
                <LinhaAviso db={db} usuario={usuario} aviso={a} />
              </Aparecer>
            ))
          ) : (
            <Cartao>
              <Vazio
                icone="bullhorn-outline"
                titulo="Nenhum comunicado ainda"
                texto={
                  ehEquipe(usuario)
                    ? 'Publique o primeiro comunicado para sua turma ou para toda a escola.'
                    : 'Quando a escola publicar um aviso, ele aparece aqui.'
                }
              />
            </Cartao>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

/** Bolinha vermelha com número (sino e atalhos). */
function Bolinha({ numero, borda }: { numero: number; borda: string }) {
  return (
    <View style={[estilos.bolinha, { borderColor: borda }]}>
      <Text style={[tipografia.rotuloPequeno, { color: '#fff', fontSize: 11 }]}>{numero > 9 ? '9+' : numero}</Text>
    </View>
  );
}

/** Cartão do aluno com a entrada e a saída de hoje (ou a próxima aula). */
function CartaoHoje({ aluno }: { aluno: Aluno }) {
  const hoje = aluno.horarios.find((h) => h.dia === diaDeHoje());
  const proxima = hoje ? null : proximaAula(aluno);
  return (
    <Cartao aoTocar={() => router.push(`/aluno/${aluno.id}`)} descricao="Ver perfil e horários do aluno" style={{ gap: espaco[3] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }}>
        <Avatar nome={aluno.nome} tamanho={40} tom="azul" />
        <View style={{ flex: 1 }}>
          <Text style={[tipografia.subtitulo, { color: cor.tinta }]} numberOfLines={1}>
            {aluno.nome}
          </Text>
          <Text style={[tipografia.corpoPequeno, { color: cor.suave }]} numberOfLines={1}>
            {aluno.curso} · Turma {aluno.turma}
          </Text>
        </View>
        <Icone nome="chevron-right" cor={cor.bordaForte} />
      </View>
      <View style={estilos.hoje}>
        {hoje ? (
          <>
            <Horario rotulo="Hoje · entrada" hora={hoje.entrada} />
            <View style={estilos.hojeDivisor} />
            <Horario rotulo="Saída" hora={hoje.saida} />
          </>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[2], flex: 1, paddingVertical: espaco[1] }}>
            <Icone nome="calendar-blank-outline" tamanho={20} cor={cor.suave} />
            <Text style={[tipografia.corpoPequeno, { color: cor.suave, flex: 1 }]}>
              Sem aula hoje.{proxima ? ` Próxima: ${proxima.dia}, ${proxima.entrada}.` : ''}
            </Text>
          </View>
        )}
      </View>
    </Cartao>
  );
}

function Horario({ rotulo, hora }: { rotulo: string; hora: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[tipografia.rotuloPequeno, { color: cor.suave }]}>{rotulo}</Text>
      <Text style={[tipografia.manchete, tipografia.numeros, { color: cor.tinta }]}>{hora}</Text>
    </View>
  );
}

/** Procura a próxima aula a partir de amanhã. */
function proximaAula(aluno: Aluno) {
  const hoje = new Date().getDay(); // 0 = domingo, 1 = segunda...
  for (let i = 1; i <= 7; i++) {
    const indice = (hoje + i) % 7;
    if (indice === 0) continue; // domingo não tem aula
    const dia = DIAS_SEMANA[indice - 1];
    const horario = aluno.horarios.find((h) => h.dia === dia.id);
    if (horario) return { dia: dia.nome, entrada: horario.entrada };
  }
  return null;
}

const estilos = StyleSheet.create({
  coluna: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: espaco[4] },
  cabecalho: {
    backgroundColor: cor.primaria,
    paddingHorizontal: espaco[4],
    paddingBottom: 64,
    borderBottomLeftRadius: raio.folha,
    borderBottomRightRadius: raio.folha,
  },
  linhaLogo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: espaco[4] },
  linhaSaudacao: { flexDirection: 'row', alignItems: 'center', gap: espaco[3] },
  sino: {
    width: 48,
    height: 48,
    borderRadius: raio.pilula,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  bolinha: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: raio.pilula,
    backgroundColor: cor.vermelho,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
  },
  atalhos: {
    marginTop: -40,
    backgroundColor: cor.superficie,
    borderRadius: raio.folha,
    paddingVertical: espaco[4],
    paddingHorizontal: espaco[2],
    flexDirection: 'row',
    ...sombraForte,
  },
  atalho: { flex: 1, minWidth: 0, alignItems: 'center', gap: espaco[2], paddingHorizontal: 2, minHeight: 88 },
  atalhoIcone: {
    width: 52,
    height: 52,
    borderRadius: raio.pilula,
    backgroundColor: cor.primariaClara,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emDia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco[3],
    backgroundColor: cor.verdeClaro,
    borderRadius: raio.campo,
    paddingHorizontal: espaco[4],
    paddingVertical: espaco[3],
  },
  hoje: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: cor.superficieAlt,
    borderRadius: raio.campo,
    padding: espaco[3],
    borderWidth: 1,
    borderColor: cor.borda,
  },
  hojeDivisor: { width: 1, alignSelf: 'stretch', backgroundColor: cor.borda, marginHorizontal: espaco[3] },
});
