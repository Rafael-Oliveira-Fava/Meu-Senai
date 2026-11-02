/**
 * CONVERSA DO SUPORTE (RF12) — mensagens em balões, campo para responder
 * e botão para encerrar a solicitação.
 */
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Aparecer } from '../../../componentes/animacao';
import { Botao } from '../../../componentes/controles';
import { BarraTopo, Bloqueado, Cartao, Tela } from '../../../componentes/estrutura';
import { Icone } from '../../../componentes/icone';
import { EtiquetaChamado } from '../../../componentes/indicadores';
import { useMensagem } from '../../../componentes/mensagem';
import { useBanco, useUsuario } from '../../../dados/banco';
import { alunoPorId, usuarioPorId } from '../../../dados/consultas';
import { chamadosVisiveis } from '../../../dados/permissoes';
import { dataHora, NOME_PERFIL, NOME_SETOR } from '../../../utilidades/formatar';
import { cor, espaco, raio, tipografia } from '../../../tema';

export default function TelaConversa() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, responderChamado, encerrarChamado } = useBanco();
  const usuario = useUsuario();
  const mostrar = useMensagem();
  const [texto, setTexto] = useState('');
  const chamado = chamadosVisiveis(db, usuario).find((c) => c.id === id); // RN09

  if (!chamado)
    return (
      <Bloqueado barra="Solicitação" titulo="Conversa indisponível" texto="Esta solicitação não existe ou não foi enviada para você." />
    );

  const destino = chamado.setor === 'professor' ? `Prof. ${usuarioPorId(db, chamado.professorId ?? '')?.nome}` : NOME_SETOR[chamado.setor];
  const aluno = chamado.alunoId ? alunoPorId(db, chamado.alunoId) : undefined;
  const encerrado = chamado.situacao === 'encerrado';
  const souAutor = chamado.criadoPorId === usuario.id;

  const enviar = () => {
    const resultado = responderChamado(chamado.id, texto);
    if (!resultado.ok) return mostrar(resultado.erro, 'erro');
    setTexto('');
  };

  const encerrar = (mensagemOk: string) => {
    const resultado = encerrarChamado(chamado.id);
    mostrar(resultado.ok ? mensagemOk : resultado.erro, resultado.ok ? 'ok' : 'erro');
  };

  return (
    <View style={{ flex: 1 }}>
      <BarraTopo
        titulo={chamado.assunto}
        subtitulo={`Nº ${chamado.protocolo} · ${destino}`}
        direita={
          encerrado ? null : (
            <Pressable
              onPress={() => encerrar('Solicitação encerrada.')}
              accessibilityRole="button"
              accessibilityLabel="Encerrar solicitação"
              style={estilos.botaoEncerrar}
            >
              <Icone nome="check-circle-outline" cor={cor.sobrePrimaria} />
            </Pressable>
          )
        }
      />
      <Tela
        rodape={
          encerrado ? (
            <Text style={[tipografia.corpoPequeno, { color: cor.suave, textAlign: 'center' }]}>
              Conversa encerrada. Abra uma nova solicitação se precisar.
            </Text>
          ) : (
            <View style={estilos.escrever}>
              <TextInput
                value={texto}
                onChangeText={setTexto}
                placeholder="Escreva uma mensagem"
                placeholderTextColor="#7A8494"
                accessibilityLabel="Mensagem"
                multiline
                style={estilos.campo}
                selectionColor={cor.primaria}
              />
              <Pressable
                onPress={enviar}
                disabled={!texto.trim()}
                accessibilityRole="button"
                accessibilityLabel="Enviar mensagem"
                style={[estilos.enviar, !texto.trim() && { opacity: 0.4 }]}
              >
                <Icone nome="send" cor={cor.sobrePrimaria} />
              </Pressable>
            </View>
          )
        }
      >
        <Cartao style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3], flexWrap: 'wrap' }}>
          <EtiquetaChamado situacao={chamado.situacao} />
          <Text style={[tipografia.corpoPequeno, { color: cor.suave, flex: 1 }]}>
            Aberta em {dataHora(chamado.criadoEm)}
            {aluno ? ` · sobre ${aluno.nome}` : ''}
          </Text>
        </Cartao>

        {/* Balões: os meus à direita (azul), os dos outros à esquerda (branco) */}
        {chamado.mensagens.map((m, i) => {
          const autor = usuarioPorId(db, m.autorId);
          const minha = m.autorId === usuario.id;
          return (
            <Aparecer key={m.id} ordem={i} style={{ alignItems: minha ? 'flex-end' : 'flex-start' }}>
              <View style={[estilos.balao, minha ? estilos.balaoMeu : estilos.balaoOutro]}>
                {!minha ? (
                  <Text style={[tipografia.rotuloPequeno, { color: cor.primaria }]}>
                    {autor?.nome} · {autor ? NOME_PERFIL[autor.perfil] : ''}
                  </Text>
                ) : null}
                <Text style={[tipografia.corpo, { color: minha ? cor.sobrePrimaria : cor.tinta }]} selectable>
                  {m.texto}
                </Text>
                <Text style={[tipografia.rotuloPequeno, { color: minha ? cor.sobrePrimariaSuave : cor.suave, alignSelf: 'flex-end' }]}>
                  {dataHora(m.em)}
                </Text>
              </View>
            </Aparecer>
          );
        })}

        {!encerrado && souAutor && chamado.situacao === 'aberto' ? (
          <Text style={[tipografia.corpoPequeno, { color: cor.suave, textAlign: 'center' }]}>
            Enviado para {destino}. Você recebe uma notificação quando responderem.
          </Text>
        ) : null}
        {!encerrado && souAutor && chamado.situacao === 'respondido' ? (
          <Botao
            texto="Minha dúvida foi resolvida"
            variante="contorno"
            icone="check"
            aoTocar={() => encerrar('Obrigado! Solicitação encerrada.')}
          />
        ) : null}
      </Tela>
    </View>
  );
}

const estilos = StyleSheet.create({
  botaoEncerrar: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: raio.pilula,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  balao: { maxWidth: '86%', borderRadius: raio.cartao, paddingHorizontal: espaco[4], paddingVertical: espaco[3], gap: 4 },
  balaoMeu: { backgroundColor: cor.primaria, borderBottomRightRadius: 4 },
  balaoOutro: { backgroundColor: cor.superficie, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: cor.borda },
  escrever: { flexDirection: 'row', alignItems: 'flex-end', gap: espaco[2] },
  campo: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderRadius: raio.folha,
    borderWidth: 1,
    borderColor: cor.bordaForte,
    paddingHorizontal: espaco[4],
    paddingVertical: 12,
    fontFamily: tipografia.corpo.fontFamily,
    fontSize: 16,
    color: cor.tinta,
    backgroundColor: cor.superficie,
  },
  enviar: {
    width: 48,
    height: 48,
    borderRadius: raio.pilula,
    backgroundColor: cor.primaria,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
