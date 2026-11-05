/**
 * DETALHE DO ATESTADO (RF08) — a família acompanha a situação;
 * secretaria e coordenação aceitam ou recusam (recusa exige explicação).
 */
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Text, View } from 'react-native';

import { Aparecer } from '../../../componentes/animacao';
import { Botao, BotoesDecisao, Campo } from '../../../componentes/controles';
import { BarraTopo, Bloqueado, Cartao, Tela } from '../../../componentes/estrutura';
import { Icone } from '../../../componentes/icone';
import { EtiquetaSituacao, FaixaErro, LinhaInfo } from '../../../componentes/indicadores';
import { useMensagem } from '../../../componentes/mensagem';
import { enderecoArquivo } from '../../../dados/api';
import { useBanco, useUsuario } from '../../../dados/banco';
import { alunoPorId, usuarioPorId } from '../../../dados/consultas';
import { atestadosVisiveis, podeAnalisarAtestado } from '../../../dados/permissoes';
import { dataCompleta, dataHora, tamanhoArquivo } from '../../../utilidades/formatar';
import { cor, espaco, tipografia } from '../../../tema';

export default function TelaAtestado() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, analisarAtestado } = useBanco();
  const usuario = useUsuario();
  const mostrar = useMensagem();
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const atestado = atestadosVisiveis(db, usuario).find((a) => a.id === id); // RN07

  if (!atestado)
    return (
      <Bloqueado barra="Atestado" titulo="Atestado indisponível" texto="Este documento não existe ou não está disponível para sua conta." />
    );

  const analisador = atestado.analisadoPorId ? usuarioPorId(db, atestado.analisadoPorId) : undefined;
  const podeAnalisar = podeAnalisarAtestado(usuario) && atestado.situacao === 'pendente';

  const decidir = (decisao: 'aprovado' | 'recusado') => {
    const resultado = analisarAtestado(atestado.id, decisao, observacao);
    if (!resultado.ok) return setErro(resultado.erro);
    setErro(null);
    mostrar(decisao === 'aprovado' ? 'Atestado aceito. A família foi avisada.' : 'Atestado recusado. A família foi avisada.');
  };

  return (
    <>
      <BarraTopo titulo="Atestado médico" subtitulo={`Nº ${atestado.protocolo}`} />
      <Tela rodape={podeAnalisar ? <BotoesDecisao recusar="Recusar" aprovar="Aceitar" aoDecidir={decidir} /> : undefined}>
        <Aparecer>
          <Cartao style={{ gap: espaco[3] }}>
            <EtiquetaSituacao
              situacao={atestado.situacao}
              textos={{ aprovado: 'Aceito · faltas abonadas', pendente: 'Em análise pela secretaria' }}
            />
            <Text style={[tipografia.manchete, { color: cor.tinta }]}>{alunoPorId(db, atestado.alunoId)?.nome}</Text>
            <Text style={[tipografia.corpoPequeno, { color: cor.suave }]}>
              Enviado por {usuarioPorId(db, atestado.enviadoPorId)?.nome} em {dataHora(atestado.criadoEm)}
            </Text>
          </Cartao>
        </Aparecer>
        <Aparecer ordem={1}>
          <Cartao style={{ paddingVertical: espaco[1] }}>
            <LinhaInfo icone="calendar-start" rotulo="Primeiro dia" valor={dataCompleta(atestado.inicio)} />
            <LinhaInfo icone="calendar-end" rotulo="Último dia" valor={dataCompleta(atestado.fim)} />
            <LinhaInfo icone="text" rotulo="Observação" valor={atestado.motivo || 'Sem observação'} />
            <LinhaInfo
              icone="paperclip"
              rotulo="Arquivo"
              valor={`${atestado.arquivoNome}${atestado.arquivoTamanho ? ` · ${tamanhoArquivo(atestado.arquivoTamanho)}` : ''}`}
              ultima
            />
          </Cartao>
        </Aparecer>
        {atestado.arquivoUri ? (
          <Botao
            texto="Abrir arquivo"
            icone="open-in-new"
            variante="contorno"
            aoTocar={() =>
              Linking.openURL(enderecoArquivo(atestado.arquivoUri!)).catch(() => mostrar('Não foi possível abrir o arquivo.', 'erro'))
            }
          />
        ) : null}

        {/* Resultado da análise */}
        {atestado.situacao !== 'pendente' ? (
          <Aparecer ordem={2}>
            <Cartao style={{ gap: espaco[2] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[2] }}>
                <Icone nome="account-check-outline" cor={cor.suave} />
                <Text style={[tipografia.rotulo, { color: cor.tinta }]}>
                  Analisado por {analisador?.nome} · {atestado.analisadoEm ? dataHora(atestado.analisadoEm) : ''}
                </Text>
              </View>
              {atestado.observacao ? <Text style={[tipografia.corpo, { color: cor.texto }]}>{atestado.observacao}</Text> : null}
            </Cartao>
          </Aparecer>
        ) : null}

        {podeAnalisar ? (
          <>
            <FaixaErro mensagem={erro} />
            <Campo
              rotulo="Mensagem para a família"
              value={observacao}
              onChangeText={setObservacao}
              placeholder="Obrigatória ao recusar. Ex.: o atestado está ilegível, envie nova foto."
              multiline
            />
          </>
        ) : null}
      </Tela>
    </>
  );
}
