/**
 * LINHAS — os cartões que aparecem nas listas: aviso, atestado,
 * autorização e conversa do suporte. Tocar abre o detalhe.
 */
import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { alunoPorId, naoLido, precisaCiencia, usuarioPorId } from '../dados/consultas';
import { podeDecidir } from '../dados/permissoes';
import type { Atestado, Autorizacao, Aviso, BancoDados, CategoriaAviso, Chamado, Usuario } from '../dados/tipos';
import {
  dataCurta,
  dataRelativa,
  NOME_CATEGORIA,
  NOME_SETOR,
  NOME_TIPO_AUTORIZACAO,
  primeiroNome,
  tempoAtras,
} from '../utilidades/formatar';
import { cor, espaco, raio, tipografia } from '../tema';
import { Cartao } from './estrutura';
import { Icone, type NomeIcone } from './icone';
import { Etiqueta, EtiquetaChamado, EtiquetaSituacao, PontoNaoLido } from './indicadores';

/** "Todos", "Turma MEC-2B" ou "Individual · Pedro". */
export function descreverPublico(db: BancoDados, aviso: Aviso) {
  const p = aviso.publico;
  if (p.tipo === 'individual') return `Individual · ${primeiroNome(alunoPorId(db, p.alunoId)?.nome ?? 'Aluno')}`;
  if (p.tipo === 'turma') return `Turma ${p.turma}`;
  return { todos: 'Todos', alunos: 'Alunos', responsaveis: 'Responsáveis', equipe: 'Equipe' }[p.para];
}

const ICONE_CATEGORIA: Record<CategoriaAviso, NomeIcone> = {
  informativo: 'information-outline',
  evento: 'calendar-star',
  calendario: 'calendar-blank-outline',
  pedagogico: 'book-open-variant',
  disciplinar: 'alert-octagon-outline',
  urgente: 'alert-outline',
};

/** Disciplinar e urgente aparecem em vermelho. */
export const ehAvisoSerio = (a: Aviso) => a.categoria === 'urgente' || a.categoria === 'disciplinar';

export function LinhaAviso({ db, usuario, aviso }: { db: BancoDados; usuario: Usuario; aviso: Aviso }) {
  const novo = naoLido(aviso, usuario);
  const serio = ehAvisoSerio(aviso);
  return (
    <Cartao
      aoTocar={() => router.push(`/aviso/${aviso.id}`)}
      descricao={`${novo ? 'Não lido. ' : ''}${aviso.titulo}`}
      style={{ gap: espaco[2] }}
    >
      <View style={estilos.linha}>
        <View style={[estilos.iconePequeno, serio && { backgroundColor: cor.vermelhoClaro }]}>
          <Icone nome={ICONE_CATEGORIA[aviso.categoria]} tamanho={18} cor={serio ? cor.vermelho : cor.primaria} />
        </View>
        <Text style={[tipografia.rotuloPequeno, { color: serio ? cor.sobreVermelhoClaro : cor.suave, flex: 1 }]} numberOfLines={1}>
          {NOME_CATEGORIA[aviso.categoria]} · {descreverPublico(db, aviso)}
        </Text>
        <Text style={[tipografia.rotuloPequeno, { color: cor.suave }]}>{tempoAtras(aviso.criadoEm)}</Text>
        {novo ? <PontoNaoLido /> : null}
      </View>
      <Text style={[tipografia.subtitulo, { color: cor.tinta }, novo && { fontFamily: tipografia.titulo.fontFamily }]} numberOfLines={2}>
        {aviso.titulo}
      </Text>
      <Text style={[tipografia.corpoPequeno, { color: cor.suave }]} numberOfLines={2}>
        {aviso.texto.replace(/\n+/g, ' ')}
      </Text>
      <View style={estilos.rodape}>
        <Text style={[tipografia.rotuloPequeno, { color: cor.suave }]}>{usuarioPorId(db, aviso.autorId)?.nome ?? ''}</Text>
        {precisaCiencia(aviso, usuario) ? <Etiqueta tom="vermelho" icone="draw-pen" texto="Confirme a ciência" /> : null}
      </View>
    </Cartao>
  );
}

/** Molde comum das linhas de pedido: ícone redondo + textos + etiqueta + protocolo. */
function LinhaPedido(p: {
  link: Href;
  icone: NomeIcone;
  destaque?: boolean;
  sobretitulo?: string;
  titulo: string;
  subtitulo: string;
  etiqueta: ReactNode;
  protocolo: string;
}) {
  return (
    <Cartao aoTocar={() => router.push(p.link)} descricao={p.titulo} style={estilos.pedido}>
      <View style={[estilos.iconeGrande, p.destaque && { backgroundColor: cor.vermelhoClaro }]}>
        <Icone nome={p.icone} cor={p.destaque ? cor.vermelho : cor.primaria} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        {p.sobretitulo ? (
          <Text style={[tipografia.rotuloPequeno, { color: cor.suave }]} numberOfLines={1}>
            {p.sobretitulo}
          </Text>
        ) : null}
        <Text style={[tipografia.subtitulo, { color: cor.tinta }]} numberOfLines={1}>
          {p.titulo}
        </Text>
        <Text style={[tipografia.corpoPequeno, { color: cor.suave }]} numberOfLines={1}>
          {p.subtitulo}
        </Text>
        <View style={estilos.rodape}>
          {p.etiqueta}
          <Text style={[tipografia.rotuloPequeno, { color: cor.suave }]}>Nº {p.protocolo}</Text>
        </View>
      </View>
    </Cartao>
  );
}

export function LinhaAtestado({ db, atestado, mostrarAluno }: { db: BancoDados; atestado: Atestado; mostrarAluno?: boolean }) {
  const periodo =
    atestado.inicio === atestado.fim ? dataCurta(atestado.inicio) : `${dataCurta(atestado.inicio)} a ${dataCurta(atestado.fim)}`;
  const aluno = mostrarAluno ? `${alunoPorId(db, atestado.alunoId)?.nome} · ` : '';
  return (
    <LinhaPedido
      link={`/atestado/${atestado.id}`}
      icone="medical-bag"
      titulo={`Atestado · ${periodo}`}
      subtitulo={aluno + (atestado.motivo || atestado.arquivoNome)}
      etiqueta={<EtiquetaSituacao situacao={atestado.situacao} textos={{ aprovado: 'Aceito', pendente: 'Em análise' }} />}
      protocolo={atestado.protocolo}
    />
  );
}

export function LinhaAutorizacao({ db, autorizacao: a, usuario }: { db: BancoDados; autorizacao: Autorizacao; usuario: Usuario }) {
  const daEscola = a.origem === 'escola';
  const esperaMinhaResposta = podeDecidir(usuario, a);
  const textos = daEscola
    ? { aprovado: 'Autorizado', recusado: 'Não autorizado', pendente: 'Aguardando responsável' }
    : { pendente: 'Em análise' };
  return (
    <LinhaPedido
      link={`/autorizacao/${a.id}`}
      icone={a.tipo === 'saida_antecipada' ? 'exit-run' : 'bus-school'}
      destaque={esperaMinhaResposta}
      sobretitulo={`${NOME_TIPO_AUTORIZACAO[a.tipo]} · ${dataRelativa(a.data)}${a.hora ? `, ${a.hora}` : ''}`}
      titulo={a.titulo}
      subtitulo={`${alunoPorId(db, a.alunoId)?.nome} · ${daEscola ? 'Pedido da escola' : 'Pedido da família'}`}
      etiqueta={
        esperaMinhaResposta ? (
          <Etiqueta tom="vermelho" icone="hand-pointing-right" texto="Sua resposta" />
        ) : (
          <EtiquetaSituacao situacao={a.situacao} textos={textos} />
        )
      }
      protocolo={a.protocolo}
    />
  );
}

export function LinhaChamado({ db, chamado: c, usuario }: { db: BancoDados; chamado: Chamado; usuario: Usuario }) {
  const ultima = c.mensagens[c.mensagens.length - 1];
  const autorUltima = ultima ? usuarioPorId(db, ultima.autorId) : undefined;
  const destino = c.setor === 'professor' ? `Prof. ${usuarioPorId(db, c.professorId ?? '')?.nome ?? ''}` : NOME_SETOR[c.setor];
  const quem = c.criadoPorId === usuario.id ? `Para ${destino}` : `De ${usuarioPorId(db, c.criadoPorId)?.nome ?? ''}`;
  const prefixo = autorUltima?.id === usuario.id ? 'Você: ' : autorUltima ? `${primeiroNome(autorUltima.nome)}: ` : '';
  return (
    <LinhaPedido
      link={`/suporte/${c.id}`}
      icone="forum-outline"
      sobretitulo={`${quem} · ${tempoAtras(ultima?.em ?? c.criadoEm)}`}
      titulo={c.assunto}
      subtitulo={prefixo + (ultima?.texto ?? '')}
      etiqueta={<EtiquetaChamado situacao={c.situacao} />}
      protocolo={c.protocolo}
    />
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco[2] },
  rodape: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: espaco[2], marginTop: 4 },
  pedido: { flexDirection: 'row', gap: espaco[3], alignItems: 'flex-start' },
  iconePequeno: {
    width: 28,
    height: 28,
    borderRadius: raio.pilula,
    backgroundColor: cor.primariaClara,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconeGrande: {
    width: 44,
    height: 44,
    borderRadius: raio.pilula,
    backgroundColor: cor.primariaClara,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
