/**
 * DETALHE DA AUTORIZAÇÃO (RF09) — mostra o pedido e a decisão.
 * Pedido da escola: o responsável responde "Autorizo / Não autorizo".
 * Pedido da família: a gestão aprova ou recusa (recusa exige explicação).
 * Quem pediu pode cancelar enquanto está pendente; pedido sem resposta vence na data.
 */
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Aparecer } from '../../../componentes/animacao';
import { confirmar } from '../../../componentes/confirmar';
import { Botao, BotoesDecisao, Campo } from '../../../componentes/controles';
import { BarraTopo, Bloqueado, Cartao, Tela } from '../../../componentes/estrutura';
import { Icone } from '../../../componentes/icone';
import { EtiquetaSituacao, FaixaErro, LinhaInfo } from '../../../componentes/indicadores';
import { useMensagem } from '../../../componentes/mensagem';
import { useBanco, useUsuario } from '../../../dados/banco';
import { alunoPorId, usuarioPorId } from '../../../dados/consultas';
import { autorizacaoVencida, autorizacoesVisiveis, podeCancelar, podeDecidir } from '../../../dados/permissoes';
import { dataCompleta, dataHora, NOME_PERFIL, NOME_TIPO_AUTORIZACAO } from '../../../utilidades/formatar';
import { cor, espaco, tipografia } from '../../../tema';

export default function TelaAutorizacao() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, decidirAutorizacao, cancelarAutorizacao } = useBanco();
  const usuario = useUsuario();
  const mostrar = useMensagem();
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const a = autorizacoesVisiveis(db, usuario).find((x) => x.id === id); // RN08

  if (!a)
    return (
      <Bloqueado
        barra="Autorização"
        titulo="Autorização indisponível"
        texto="Este pedido não existe ou não está disponível para sua conta."
      />
    );

  const aluno = alunoPorId(db, a.alunoId);
  const autor = usuarioPorId(db, a.criadoPorId);
  const decisor = a.decididoPorId ? usuarioPorId(db, a.decididoPorId) : undefined;
  const daEscola = a.origem === 'escola';
  const textos = daEscola
    ? { aprovado: 'Autorizado pelo responsável', recusado: 'Não autorizado', pendente: 'Aguardando o responsável' }
    : { aprovado: 'Aprovado · liberado na portaria', pendente: 'Em análise pela coordenação' };

  const vencida = autorizacaoVencida(a);
  const cancelar = () =>
    confirmar('Cancelar pedido?', 'Quem ia decidir será avisado de que o pedido foi cancelado.', () => {
      const resultado = cancelarAutorizacao(a.id);
      if (!resultado.ok) return setErro(resultado.erro);
      mostrar('Pedido cancelado.');
    });

  const decidir = (decisao: 'aprovado' | 'recusado') => {
    const resultado = decidirAutorizacao(a.id, decisao, observacao);
    if (!resultado.ok) return setErro(resultado.erro);
    setErro(null);
    if (daEscola) mostrar(decisao === 'aprovado' ? 'Você autorizou. A escola foi avisada.' : 'Resposta enviada à escola.');
    else mostrar(decisao === 'aprovado' ? 'Saída aprovada. A família foi avisada.' : 'Pedido recusado. A família foi avisada.');
  };

  return (
    <>
      <BarraTopo titulo={NOME_TIPO_AUTORIZACAO[a.tipo]} subtitulo={`Nº ${a.protocolo}`} />
      <Tela
        rodape={
          podeDecidir(usuario, a) ? (
            <BotoesDecisao
              recusar={daEscola ? 'Não autorizo' : 'Recusar'}
              aprovar={daEscola ? 'Autorizo' : 'Aprovar saída'}
              aoDecidir={decidir}
            />
          ) : podeCancelar(usuario, a) ? (
            <Botao texto="Cancelar pedido" icone="cancel" variante="perigo" aoTocar={cancelar} largo />
          ) : undefined
        }
      >
        <Aparecer>
          <Cartao style={{ gap: espaco[3] }}>
            <EtiquetaSituacao situacao={a.situacao} textos={textos} vencida={vencida} />
            <Text style={[tipografia.manchete, { color: cor.tinta }]}>{a.titulo}</Text>
            {a.detalhes ? <Text style={[tipografia.corpo, { color: cor.texto }]}>{a.detalhes}</Text> : null}
          </Cartao>
        </Aparecer>
        <Aparecer ordem={1}>
          <Cartao style={{ paddingVertical: espaco[1] }}>
            <LinhaInfo icone="account-outline" rotulo="Aluno" valor={`${aluno?.nome} · ${aluno?.turma}`} />
            <LinhaInfo icone="calendar" rotulo="Data" valor={dataCompleta(a.data)} />
            {a.hora ? <LinhaInfo icone="clock-outline" rotulo="Horário" valor={a.hora} /> : null}
            {a.buscaPor ? <LinhaInfo icone="account-arrow-right-outline" rotulo="Quem busca" valor={a.buscaPor} /> : null}
            <LinhaInfo
              icone="send-outline"
              rotulo="Pedido por"
              valor={`${autor?.nome} (${autor ? NOME_PERFIL[autor.perfil] : ''}) · ${dataHora(a.criadoEm)}`}
              ultima
            />
          </Cartao>
        </Aparecer>

        {vencida ? (
          <Aparecer ordem={2}>
            <Cartao style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[2] }}>
              <Icone nome="calendar-remove" cor={cor.suave} />
              <Text style={[tipografia.corpoPequeno, { color: cor.suave, flex: 1 }]}>
                A data deste pedido já passou sem resposta. Se ainda precisar, faça um novo pedido.
              </Text>
            </Cartao>
          </Aparecer>
        ) : null}

        {/* Decisão já tomada (ou pedido cancelado) */}
        {a.situacao !== 'pendente' && decisor ? (
          <Aparecer ordem={2}>
            <Cartao style={{ gap: espaco[2] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[2] }}>
                <Icone
                  nome={a.situacao === 'aprovado' ? 'check-decagram' : a.situacao === 'cancelado' ? 'cancel' : 'close-octagon-outline'}
                  cor={a.situacao === 'aprovado' ? cor.verde : a.situacao === 'cancelado' ? cor.suave : cor.vermelho}
                />
                <Text style={[tipografia.rotulo, { color: cor.tinta, flex: 1 }]}>
                  {a.situacao === 'cancelado' ? 'Cancelado' : daEscola ? 'Respondido' : 'Decidido'} por {decisor.nome} ·{' '}
                  {a.decididoEm ? dataHora(a.decididoEm) : ''}
                </Text>
              </View>
              {a.observacao ? <Text style={[tipografia.corpo, { color: cor.texto }]}>{a.observacao}</Text> : null}
            </Cartao>
          </Aparecer>
        ) : null}

        {!podeDecidir(usuario, a) && erro ? <FaixaErro mensagem={erro} /> : null}
        {podeDecidir(usuario, a) ? (
          <>
            <FaixaErro mensagem={erro} />
            <Campo
              rotulo={daEscola ? 'Observação para a escola' : 'Mensagem para a família'}
              value={observacao}
              onChangeText={setObservacao}
              placeholder={daEscola ? 'Opcional' : 'Obrigatória ao recusar. Ex.: liberado na portaria com documento.'}
              multiline
            />
          </>
        ) : null}
      </Tela>
    </>
  );
}
