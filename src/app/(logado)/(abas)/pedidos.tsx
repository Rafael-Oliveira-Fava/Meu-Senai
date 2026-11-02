/**
 * PEDIDOS (RF08, RF09) — autorizações e atestados, com filtro "Só pendentes".
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, View } from 'react-native';

import { Aparecer } from '../../../componentes/animacao';
import { Botao, Filtro, LinhaFiltros } from '../../../componentes/controles';
import { BarraTopo } from '../../../componentes/estrutura';
import { Vazio } from '../../../componentes/indicadores';
import { LinhaAtestado, LinhaAutorizacao } from '../../../componentes/linhas';
import { useBanco, useUsuario } from '../../../dados/banco';
import { pendencias } from '../../../dados/consultas';
import {
  atestadosVisiveis,
  autorizacoesVisiveis,
  ehFamilia,
  podeEnviarAtestado,
  podePedirAutorizacao,
  podePedirSaida,
} from '../../../dados/permissoes';
import { cor, espaco } from '../../../tema';

type Aba = 'autorizacoes' | 'atestados';

export default function TelaPedidos() {
  const { db } = useBanco();
  const usuario = useUsuario();
  const [aba, setAba] = useState<Aba>('autorizacoes');
  const [soPendentes, setSoPendentes] = useState(false);
  const pendente = pendencias(db, usuario);
  const verAutorizacoes = aba === 'autorizacoes';

  const filtrar = <T extends { situacao: string }>(lista: T[]) => lista.filter((x) => !soPendentes || x.situacao === 'pendente');
  const autorizacoes = filtrar(autorizacoesVisiveis(db, usuario));
  const atestados = filtrar(atestadosVisiveis(db, usuario));

  // Botão de criar: depende da aba e do perfil.
  const podeCriar = verAutorizacoes ? podePedirSaida(usuario) || podePedirAutorizacao(usuario) : podeEnviarAtestado(usuario);
  const textoCriar = verAutorizacoes ? (ehFamilia(usuario) ? 'Pedir saída antecipada' : 'Pedir autorização à família') : 'Enviar atestado';

  return (
    <View style={{ flex: 1, backgroundColor: cor.fundo }}>
      <BarraTopo
        titulo="Pedidos"
        subtitulo={pendente.total ? `${pendente.total} aguardando você` : 'Atestados e autorizações'}
        voltar={false}
      />
      <FlatList<{ id: string }>
        data={verAutorizacoes ? autorizacoes : atestados}
        keyExtractor={(x) => x.id}
        contentContainerStyle={{
          padding: espaco[4],
          gap: espaco[3],
          paddingBottom: espaco[8],
          width: '100%',
          maxWidth: 672,
          alignSelf: 'center',
        }}
        ListHeaderComponent={
          <View style={{ gap: espaco[3] }}>
            <LinhaFiltros>
              <Filtro
                texto="Autorizações"
                ativo={verAutorizacoes}
                aoTocar={() => setAba('autorizacoes')}
                contador={verAutorizacoes ? undefined : pendente.autorizacoes.length}
              />
              <Filtro
                texto="Atestados"
                ativo={!verAutorizacoes}
                aoTocar={() => setAba('atestados')}
                contador={verAutorizacoes ? pendente.atestados.length : undefined}
              />
              <Filtro texto="Só pendentes" icone="filter-variant" ativo={soPendentes} aoTocar={() => setSoPendentes((v) => !v)} />
            </LinhaFiltros>
            {podeCriar ? (
              <Botao
                texto={textoCriar}
                icone="plus"
                variante="suave"
                aoTocar={() => router.push(verAutorizacoes ? '/autorizacao/nova' : '/atestado/novo')}
                largo
              />
            ) : null}
          </View>
        }
        renderItem={({ index }) => (
          <Aparecer ordem={index}>
            {verAutorizacoes ? (
              <LinhaAutorizacao db={db} autorizacao={autorizacoes[index]} usuario={usuario} />
            ) : (
              <LinhaAtestado db={db} atestado={atestados[index]} mostrarAluno={!ehFamilia(usuario)} />
            )}
          </Aparecer>
        )}
        ListEmptyComponent={
          <Vazio
            icone={verAutorizacoes ? 'file-sign' : 'medical-bag'}
            titulo={soPendentes ? 'Nada pendente' : verAutorizacoes ? 'Nenhuma autorização' : 'Nenhum atestado'}
            texto={
              verAutorizacoes
                ? 'Pedidos de saída antecipada e autorizações para atividades aparecem aqui com a situação de cada um.'
                : 'Atestados médicos enviados pelos responsáveis aparecem aqui até serem analisados pela secretaria.'
            }
          />
        }
      />
    </View>
  );
}
