/**
 * CENTRAL DE SUPORTE (RF10, RF12) — conversas em andamento e encerradas.
 * A equipe separa as mensagens recebidas das que ela mesma enviou.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, View } from 'react-native';

import { Aparecer } from '../../../componentes/animacao';
import { BotaoFlutuante, Filtro, LinhaFiltros } from '../../../componentes/controles';
import { BarraTopo } from '../../../componentes/estrutura';
import { Vazio } from '../../../componentes/indicadores';
import { LinhaChamado } from '../../../componentes/linhas';
import { useBanco, useUsuario } from '../../../dados/banco';
import { atende, chamadosVisiveis, ehEquipe } from '../../../dados/permissoes';
import { cor, espaco } from '../../../tema';

type TipoFiltro = 'abertos' | 'recebidos' | 'enviados' | 'encerrados';

export default function TelaSuporte() {
  const { db } = useBanco();
  const usuario = useUsuario();
  const equipe = ehEquipe(usuario);
  const [filtro, setFiltro] = useState<TipoFiltro>(equipe ? 'recebidos' : 'abertos');

  const lista = chamadosVisiveis(db, usuario).filter((c) => {
    if (filtro === 'encerrados') return c.situacao === 'encerrado';
    if (c.situacao === 'encerrado') return false;
    if (filtro === 'recebidos') return atende(usuario, c);
    if (filtro === 'enviados') return c.criadoPorId === usuario.id;
    return true;
  });

  return (
    <View style={{ flex: 1, backgroundColor: cor.fundo }}>
      <BarraTopo
        titulo="Central de suporte"
        subtitulo={equipe ? 'Mensagens das famílias e alunos' : 'Dúvidas para secretaria, coordenação, professores e direção'}
        voltar={false}
      />
      <FlatList
        data={lista}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{
          padding: espaco[4],
          gap: espaco[3],
          paddingBottom: 120,
          width: '100%',
          maxWidth: 672,
          alignSelf: 'center',
        }}
        ListHeaderComponent={
          <LinhaFiltros>
            {equipe ? (
              <>
                <Filtro texto="Recebidas" ativo={filtro === 'recebidos'} aoTocar={() => setFiltro('recebidos')} />
                <Filtro texto="Enviadas" ativo={filtro === 'enviados'} aoTocar={() => setFiltro('enviados')} />
              </>
            ) : (
              <Filtro texto="Em andamento" ativo={filtro === 'abertos'} aoTocar={() => setFiltro('abertos')} />
            )}
            <Filtro texto="Encerradas" ativo={filtro === 'encerrados'} aoTocar={() => setFiltro('encerrados')} />
          </LinhaFiltros>
        }
        renderItem={({ item, index }) => (
          <Aparecer ordem={index}>
            <LinhaChamado db={db} chamado={item} usuario={usuario} />
          </Aparecer>
        )}
        ListEmptyComponent={
          <Vazio
            icone="chat-question-outline"
            titulo={
              filtro === 'encerrados'
                ? 'Nenhuma conversa encerrada'
                : equipe && filtro === 'recebidos'
                  ? 'Nenhuma mensagem recebida'
                  : 'Nenhuma solicitação aberta'
            }
            texto="Escolha o setor certo e envie sua dúvida. Você acompanha a resposta aqui, com número de protocolo."
            acao={{ texto: 'Nova solicitação', aoTocar: () => router.push('/suporte/novo') }}
          />
        }
      />
      <BotaoFlutuante texto="Nova solicitação" icone="message-plus-outline" aoTocar={() => router.push('/suporte/novo')} />
    </View>
  );
}
