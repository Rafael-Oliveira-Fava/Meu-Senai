/**
 * INDICADORES — mostram estado: etiquetas de situação, bolinha de não lido,
 * faixa de erro, tela vazia e linha de informação.
 * Regra de acessibilidade: situação nunca só por cor; sempre ícone + palavra.
 */
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';

import type { Situacao, SituacaoChamado } from '../dados/tipos';
import { cor, espaco, raio, tipografia } from '../tema';
import { Botao } from './controles';
import { Icone, type NomeIcone } from './icone';

const TONS = {
  neutro: { fundo: '#EEF1F5', texto: cor.suave },
  azul: { fundo: cor.primariaClara, texto: cor.sobrePrimariaClara },
  verde: { fundo: cor.verdeClaro, texto: cor.verde },
  ambar: { fundo: cor.ambarClaro, texto: cor.ambar },
  vermelho: { fundo: cor.vermelhoClaro, texto: cor.sobreVermelhoClaro },
  escuro: { fundo: cor.tinta, texto: '#FFFFFF' },
};

/** Etiqueta pequena em pílula, com ícone opcional. */
export function Etiqueta({
  texto,
  tom = 'neutro',
  icone,
  style,
}: {
  texto: string;
  tom?: keyof typeof TONS;
  icone?: NomeIcone;
  style?: StyleProp<ViewStyle>;
}) {
  const t = TONS[tom];
  return (
    <View style={[estilos.etiqueta, { backgroundColor: t.fundo }, style]}>
      {icone ? <Icone nome={icone} tamanho={14} cor={t.texto} /> : null}
      <Text style={[tipografia.rotuloPequeno, { color: t.texto }]}>{texto}</Text>
    </View>
  );
}

/**
 * Situação de atestado/autorização. `textos` troca as palavras quando precisa.
 * `vencida`: pedido pendente cuja data já passou.
 */
export function EtiquetaSituacao({
  situacao,
  textos,
  vencida,
}: {
  situacao: Situacao;
  textos?: Partial<Record<Situacao, string>>;
  vencida?: boolean;
}) {
  if (vencida) return <Etiqueta icone="calendar-remove" texto="Vencido · sem resposta" />;
  if (situacao === 'cancelado') return <Etiqueta icone="cancel" texto={textos?.cancelado ?? 'Cancelado'} />;
  if (situacao === 'aprovado') return <Etiqueta tom="verde" icone="check-circle" texto={textos?.aprovado ?? 'Aprovado'} />;
  if (situacao === 'recusado') return <Etiqueta tom="vermelho" icone="close-circle" texto={textos?.recusado ?? 'Recusado'} />;
  return <Etiqueta tom="ambar" icone="clock-outline" texto={textos?.pendente ?? 'Pendente'} />;
}

export function EtiquetaChamado({ situacao }: { situacao: SituacaoChamado }) {
  if (situacao === 'respondido') return <Etiqueta tom="azul" icone="message-reply-text" texto="Respondido" />;
  if (situacao === 'encerrado') return <Etiqueta icone="check" texto="Encerrado" />;
  return <Etiqueta tom="ambar" icone="clock-outline" texto="Aguardando" />;
}

export function PontoNaoLido({ descricao = 'Não lido' }: { descricao?: string }) {
  return <View accessibilityLabel={descricao} style={estilos.ponto} />;
}

/** Faixa vermelha com a mensagem de erro do formulário. */
export function FaixaErro({ mensagem }: { mensagem: string | null }) {
  if (!mensagem) return null;
  return (
    <View style={estilos.erro} accessibilityLiveRegion="assertive" accessibilityRole="alert">
      <Icone nome="alert-circle" tamanho={20} cor={cor.vermelho} />
      <Text style={[tipografia.corpoPequeno, { color: cor.sobreVermelhoClaro, flex: 1 }]}>{mensagem}</Text>
    </View>
  );
}

/** Lista vazia: explica o que aparece ali e, se fizer sentido, oferece uma ação. */
export function Vazio({
  icone,
  titulo,
  texto,
  acao,
}: {
  icone: NomeIcone;
  titulo: string;
  texto: string;
  acao?: { texto: string; aoTocar: () => void };
}) {
  return (
    <View style={estilos.vazio}>
      <View style={estilos.vazioIcone}>
        <Icone nome={icone} tamanho={28} cor={cor.primaria} />
      </View>
      <Text style={[tipografia.subtitulo, { color: cor.tinta, textAlign: 'center' }]}>{titulo}</Text>
      <Text style={[tipografia.corpoPequeno, { color: cor.suave, textAlign: 'center', maxWidth: 300 }]}>{texto}</Text>
      {acao ? (
        <View style={{ marginTop: espaco[2] }}>
          <Botao texto={acao.texto} aoTocar={acao.aoTocar} variante="suave" />
        </View>
      ) : null}
    </View>
  );
}

/** Linha "ícone · rótulo · valor" usada nos detalhes (aluno, atestado, autorização). */
export function LinhaInfo({ icone, rotulo, valor, ultima }: { icone: NomeIcone; rotulo: string; valor: string; ultima?: boolean }) {
  return (
    <View style={[estilos.info, !ultima && estilos.infoSeparada]}>
      <Icone nome={icone} tamanho={20} cor={cor.suave} />
      <Text style={[tipografia.corpoPequeno, { color: cor.suave, width: 118 }]}>{rotulo}</Text>
      <Text style={[tipografia.corpo, { color: cor.tinta, flex: 1, fontFamily: tipografia.rotulo.fontFamily }]}>{valor}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  etiqueta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: raio.pilula,
    alignSelf: 'flex-start',
  },
  ponto: { width: 10, height: 10, borderRadius: raio.pilula, backgroundColor: cor.vermelho },
  erro: {
    flexDirection: 'row',
    gap: espaco[2],
    alignItems: 'center',
    backgroundColor: cor.vermelhoClaro,
    borderRadius: raio.campo,
    padding: espaco[3],
  },
  vazio: { alignItems: 'center', gap: espaco[2], paddingVertical: espaco[8], paddingHorizontal: espaco[4] },
  vazioIcone: {
    width: 56,
    height: 56,
    borderRadius: raio.pilula,
    backgroundColor: cor.primariaClara,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espaco[1],
  },
  info: { flexDirection: 'row', alignItems: 'center', gap: espaco[3], minHeight: 52, paddingVertical: espaco[2] },
  infoSeparada: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: cor.borda },
});
