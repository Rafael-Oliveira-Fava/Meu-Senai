/**
 * NOTIFICAÇÕES (RF07) — avisos novos, respostas e decisões sobre pedidos.
 * Tocar marca como lida e abre a tela relacionada.
 */
import { router, type Href } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Aparecer } from '../../componentes/animacao';
import { BarraTopo } from '../../componentes/estrutura';
import { Icone, type NomeIcone } from '../../componentes/icone';
import { PontoNaoLido, Vazio } from '../../componentes/indicadores';
import { useBanco, useUsuario } from '../../dados/banco';
import type { TipoNotificacao } from '../../dados/tipos';
import { tempoAtras } from '../../utilidades/formatar';
import { cor, espaco, raio, tipografia } from '../../tema';

const ICONE: Record<TipoNotificacao, NomeIcone> = {
  aviso: 'bullhorn-outline',
  atestado: 'medical-bag',
  autorizacao: 'file-sign',
  suporte: 'forum-outline',
  vinculo: 'account-plus-outline',
};

export default function TelaNotificacoes() {
  const { db, marcarNotificacaoLida, marcarTodasLidas } = useBanco();
  const usuario = useUsuario();
  const lista = db.notificacoes.filter((n) => n.usuarioId === usuario.id).sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  const naoLidas = lista.filter((n) => !n.lida).length;

  return (
    <View style={{ flex: 1, backgroundColor: cor.fundo }}>
      <BarraTopo
        titulo="Notificações"
        subtitulo={naoLidas ? `${naoLidas} não ${naoLidas === 1 ? 'lida' : 'lidas'}` : 'Tudo lido'}
        direita={
          naoLidas ? (
            <Pressable onPress={marcarTodasLidas} accessibilityRole="button" style={estilos.marcarTodas}>
              <Text style={[tipografia.rotulo, { color: cor.sobrePrimaria }]}>Marcar todas</Text>
            </Pressable>
          ) : null
        }
      />
      <FlatList
        data={lista}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{
          padding: espaco[4],
          gap: espaco[2],
          paddingBottom: espaco[8],
          width: '100%',
          maxWidth: 672,
          alignSelf: 'center',
        }}
        renderItem={({ item, index }) => (
          <Aparecer ordem={index}>
            <Pressable
              onPress={() => {
                marcarNotificacaoLida(item.id);
                router.push(item.link as Href);
              }}
              accessibilityRole="button"
              accessibilityLabel={`${item.lida ? '' : 'Não lida. '}${item.titulo}: ${item.texto}`}
              style={({ pressed }) => [estilos.linha, !item.lida && estilos.naoLida, pressed && { opacity: 0.85 }]}
            >
              <View style={[estilos.icone, !item.lida && { backgroundColor: cor.primaria }]}>
                <Icone nome={ICONE[item.tipo]} tamanho={20} cor={item.lida ? cor.primaria : cor.sobrePrimaria} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[tipografia.subtitulo, { color: cor.tinta }, !item.lida && { fontFamily: tipografia.titulo.fontFamily }]}>
                  {item.titulo}
                </Text>
                <Text style={[tipografia.corpoPequeno, { color: cor.suave }]} numberOfLines={2}>
                  {item.texto}
                </Text>
                <Text style={[tipografia.rotuloPequeno, { color: cor.suave }]}>{tempoAtras(item.criadoEm)}</Text>
              </View>
              {!item.lida ? <PontoNaoLido descricao="Não lida" /> : null}
            </Pressable>
          </Aparecer>
        )}
        ListEmptyComponent={
          <Vazio
            icone="bell-check-outline"
            titulo="Sem notificações"
            texto="Você é avisado aqui quando chegar um comunicado, uma resposta ou uma decisão sobre seus pedidos."
          />
        }
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  marcarTodas: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: espaco[4],
    borderRadius: raio.pilula,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco[3],
    backgroundColor: cor.superficie,
    borderRadius: raio.cartao,
    padding: espaco[4],
    borderWidth: 1,
    borderColor: cor.borda,
  },
  naoLida: { borderColor: '#BBD0EE', backgroundColor: '#F7FAFF' },
  icone: {
    width: 40,
    height: 40,
    borderRadius: raio.pilula,
    backgroundColor: cor.primariaClara,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
