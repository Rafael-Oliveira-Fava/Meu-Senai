/**
 * AVISOS (RF05, RF06) — lista de comunicados e avisos com filtros.
 * A equipe vê o botão vermelho "Novo aviso".
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, View } from 'react-native';

import { Aparecer } from '../../../componentes/animacao';
import { BotaoFlutuante, Filtro, LinhaFiltros } from '../../../componentes/controles';
import { BarraTopo } from '../../../componentes/estrutura';
import { Vazio } from '../../../componentes/indicadores';
import { LinhaAviso } from '../../../componentes/linhas';
import { useBanco, useUsuario } from '../../../dados/banco';
import { naoLido, precisaCiencia } from '../../../dados/consultas';
import { avisosVisiveis, podePublicar } from '../../../dados/permissoes';
import { cor, espaco } from '../../../tema';

type TipoFiltro = 'todos' | 'naoLidos' | 'individuais' | 'gerais' | 'meus';

export default function TelaAvisos() {
  const { db } = useBanco();
  const usuario = useUsuario();
  const [filtro, setFiltro] = useState<TipoFiltro>('todos');
  const equipe = podePublicar(usuario);
  const todos = avisosVisiveis(db, usuario);
  const quantosNaoLidos = todos.filter((a) => naoLido(a, usuario)).length;

  const lista = todos.filter((a) => {
    if (filtro === 'naoLidos') return naoLido(a, usuario) || precisaCiencia(a, usuario);
    if (filtro === 'individuais') return a.publico.tipo === 'individual';
    if (filtro === 'gerais') return a.publico.tipo !== 'individual';
    if (filtro === 'meus') return a.autorId === usuario.id;
    return true;
  });

  return (
    <View style={{ flex: 1, backgroundColor: cor.fundo }}>
      <BarraTopo
        titulo="Avisos"
        subtitulo={quantosNaoLidos ? `${quantosNaoLidos} não ${quantosNaoLidos === 1 ? 'lido' : 'lidos'}` : 'Tudo em dia'}
        voltar={false}
      />
      <FlatList
        data={lista}
        keyExtractor={(a) => a.id}
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
            <Filtro texto="Todos" ativo={filtro === 'todos'} aoTocar={() => setFiltro('todos')} />
            <Filtro
              texto="Não lidos"
              ativo={filtro === 'naoLidos'}
              aoTocar={() => setFiltro('naoLidos')}
              contador={filtro === 'naoLidos' ? undefined : quantosNaoLidos}
            />
            <Filtro texto="Individuais" ativo={filtro === 'individuais'} aoTocar={() => setFiltro('individuais')} />
            <Filtro texto="Gerais" ativo={filtro === 'gerais'} aoTocar={() => setFiltro('gerais')} />
            {equipe ? <Filtro texto="Enviados por mim" ativo={filtro === 'meus'} aoTocar={() => setFiltro('meus')} /> : null}
          </LinhaFiltros>
        }
        renderItem={({ item, index }) => (
          <Aparecer ordem={index}>
            <LinhaAviso db={db} usuario={usuario} aviso={item} />
          </Aparecer>
        )}
        ListEmptyComponent={
          <Vazio
            icone={filtro === 'naoLidos' ? 'check-all' : 'bullhorn-outline'}
            titulo={filtro === 'naoLidos' ? 'Você leu tudo' : 'Nada por aqui'}
            texto={
              filtro === 'naoLidos'
                ? 'Novos comunicados e avisos aparecem aqui e no sino da tela inicial.'
                : 'Troque o filtro para ver outros comunicados.'
            }
            acao={filtro !== 'todos' ? { texto: 'Ver todos', aoTocar: () => setFiltro('todos') } : undefined}
          />
        }
      />
      {equipe ? <BotaoFlutuante texto="Novo aviso" icone="plus" aoTocar={() => router.push('/aviso/novo')} /> : null}
    </View>
  );
}
