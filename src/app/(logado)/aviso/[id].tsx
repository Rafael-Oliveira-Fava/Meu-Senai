/**
 * DETALHE DO AVISO (RF06) — marca como lido ao abrir. No aviso individual,
 * o responsável confirma "Estou ciente"; a equipe acompanha quem leu e confirmou.
 * Quem publicou pode corrigir ou apagar o aviso e lembrar quem ainda não confirmou.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Aparecer } from '../../../componentes/animacao';
import { confirmar } from '../../../componentes/confirmar';
import { Botao, Campo } from '../../../componentes/controles';
import { Avatar, BarraTopo, Bloqueado, Cartao, Divisor, Tela } from '../../../componentes/estrutura';
import { Icone } from '../../../componentes/icone';
import { Etiqueta, FaixaErro } from '../../../componentes/indicadores';
import { descreverPublico, ehAvisoSerio } from '../../../componentes/linhas';
import { useMensagem } from '../../../componentes/mensagem';
import { useBanco, useUsuario } from '../../../dados/banco';
import { alunoPorId, precisaCiencia, usuarioPorId } from '../../../dados/consultas';
import { destinatariosDoAviso, ehEquipe, podeEditarAviso, podeLembrarCiencia, podeVerAviso } from '../../../dados/permissoes';
import { dataHora, NOME_CATEGORIA, NOME_PERFIL } from '../../../utilidades/formatar';
import { cor, espaco, raio, tipografia } from '../../../tema';

export default function TelaAviso() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, marcarAvisoLido, darCiencia, editarAviso, apagarAviso, lembrarCiencia } = useBanco();
  const usuario = useUsuario();
  const mostrar = useMensagem();
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const aviso = db.avisos.find((a) => a.id === id);
  const permitido = !!aviso && podeVerAviso(db, usuario, aviso); // RN06

  useEffect(() => {
    if (permitido) marcarAvisoLido(id);
  }, [permitido, id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!aviso || !permitido)
    return <Bloqueado barra="Aviso" titulo="Aviso indisponível" texto="Este aviso não existe ou não foi enviado para você." />;

  const autor = usuarioPorId(db, aviso.autorId);
  const minhaCiencia = aviso.cientes.find((c) => c.usuarioId === usuario.id);
  const serio = ehAvisoSerio(aviso);
  const destinatarios = destinatariosDoAviso(db, aviso);
  const responsaveis = aviso.publico.tipo === 'individual' ? (alunoPorId(db, aviso.publico.alunoId)?.responsavelIds ?? []) : [];
  const faltamConfirmar = responsaveis.filter((rid) => !aviso.cientes.some((c) => c.usuarioId === rid)).length;
  const ehAutor = podeEditarAviso(usuario, aviso);

  const comecarEdicao = () => {
    setTitulo(aviso.titulo);
    setTexto(aviso.texto);
    setErro(null);
    setEditando(true);
  };
  const salvarEdicao = () => {
    const resultado = editarAviso(aviso.id, { titulo, texto });
    if (!resultado.ok) return setErro(resultado.erro);
    setEditando(false);
    mostrar('Aviso corrigido. Os destinatários foram avisados.');
  };
  const apagar = () =>
    confirmar('Apagar aviso?', 'O aviso some para todos os destinatários. Isso não pode ser desfeito.', () => {
      const resultado = apagarAviso(aviso.id);
      if (!resultado.ok) return mostrar(resultado.erro, 'erro');
      mostrar('Aviso apagado.');
      if (router.canGoBack()) router.back();
      else router.replace('/avisos');
    });
  const lembrar = () => {
    const resultado = lembrarCiencia(aviso.id);
    mostrar(resultado.ok ? 'Lembrete enviado a quem ainda não confirmou.' : resultado.erro, resultado.ok ? 'ok' : 'erro');
  };

  const rodape = precisaCiencia(aviso, usuario) ? (
    <View style={{ gap: espaco[2] }}>
      <Text style={[tipografia.corpoPequeno, { color: cor.suave, textAlign: 'center' }]}>
        A escola pede que você confirme que leu este aviso.
      </Text>
      <Botao
        texto="Estou ciente"
        icone="draw-pen"
        largo
        aoTocar={() => {
          darCiencia(aviso.id);
          mostrar('Ciência registrada. A escola foi avisada.');
        }}
      />
    </View>
  ) : undefined;

  return (
    <>
      <BarraTopo titulo={aviso.publico.tipo === 'individual' ? 'Aviso individual' : 'Comunicado'} subtitulo={`Nº ${aviso.protocolo}`} />
      <Tela rodape={rodape}>
        <Aparecer>
          <Cartao style={{ gap: espaco[3] }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco[2] }}>
              <Etiqueta
                tom={serio ? 'vermelho' : 'azul'}
                icone={serio ? 'alert-octagon-outline' : 'tag-outline'}
                texto={NOME_CATEGORIA[aviso.categoria]}
              />
              <Etiqueta
                icone={aviso.publico.tipo === 'individual' ? 'account-lock-outline' : 'account-multiple-outline'}
                texto={descreverPublico(db, aviso)}
              />
            </View>
            <Text style={[tipografia.manchete, { color: cor.tinta }]} accessibilityRole="header">
              {aviso.titulo}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3] }}>
              <Avatar nome={autor?.nome ?? '?'} tamanho={36} tom="azul" foto={autor?.foto} />
              <View style={{ flex: 1 }}>
                <Text style={[tipografia.rotulo, { color: cor.tinta }]}>{autor?.nome}</Text>
                <Text style={[tipografia.corpoPequeno, { color: cor.suave }]}>
                  {autor ? NOME_PERFIL[autor.perfil] : ''} · {dataHora(aviso.criadoEm)}
                </Text>
              </View>
            </View>
            <Divisor />
            <Text style={[tipografia.corpo, { color: cor.texto }]} selectable>
              {aviso.texto}
            </Text>
          </Cartao>
        </Aparecer>

        {minhaCiencia ? (
          <Aparecer ordem={1} style={estilos.ciente}>
            <Icone nome="check-decagram" cor={cor.verde} />
            <Text style={[tipografia.corpoPequeno, { color: cor.verde, flex: 1 }]}>
              Você confirmou ciência em {dataHora(minhaCiencia.em)}.
            </Text>
          </Aparecer>
        ) : null}

        {/* Acompanhamento: só a equipe vê */}
        {ehEquipe(usuario) ? (
          <Aparecer ordem={2}>
            <Cartao style={{ gap: espaco[3] }}>
              <Text style={[tipografia.subtitulo, { color: cor.tinta }]}>Acompanhamento</Text>
              <View style={{ flexDirection: 'row', gap: espaco[3] }}>
                <Numero rotulo="Destinatários" valor={destinatarios.length} />
                <Numero rotulo="Leram" valor={aviso.lidoPor.filter((id) => destinatarios.some((u) => u.id === id)).length} />
                {aviso.pedeCiencia ? <Numero rotulo="Confirmaram" valor={`${aviso.cientes.length}/${responsaveis.length}`} /> : null}
              </View>
              {podeLembrarCiencia(usuario, aviso) && faltamConfirmar > 0 ? (
                <Botao texto="Lembrar quem não confirmou" icone="bell-ring-outline" variante="suave" aoTocar={lembrar} largo />
              ) : null}
              {aviso.pedeCiencia
                ? responsaveis.map((rid) => {
                    const r = usuarioPorId(db, rid);
                    const ciencia = aviso.cientes.find((c) => c.usuarioId === rid);
                    return (
                      <View key={rid} style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[2] }}>
                        <Icone nome={ciencia ? 'check-circle' : 'clock-outline'} tamanho={18} cor={ciencia ? cor.verde : cor.ambar} />
                        <Text style={[tipografia.corpoPequeno, { color: cor.texto, flex: 1 }]}>
                          {r?.nome} ({r?.parentesco}) · {ciencia ? `ciente em ${dataHora(ciencia.em)}` : 'ainda não confirmou'}
                        </Text>
                      </View>
                    );
                  })
                : null}
            </Cartao>
          </Aparecer>
        ) : null}

        {/* Corrigir ou apagar: só quem publicou */}
        {ehAutor && editando ? (
          <Cartao style={{ gap: espaco[3] }}>
            <Text style={[tipografia.subtitulo, { color: cor.tinta }]}>Corrigir aviso</Text>
            <FaixaErro mensagem={erro} />
            <Campo rotulo="Título" obrigatorio value={titulo} onChangeText={setTitulo} maxLength={90} />
            <Campo rotulo="Mensagem" obrigatorio value={texto} onChangeText={setTexto} multiline />
            <View style={{ flexDirection: 'row', gap: espaco[3] }}>
              <View style={{ flex: 1 }}>
                <Botao texto="Cancelar" variante="contorno" aoTocar={() => setEditando(false)} largo />
              </View>
              <View style={{ flex: 1 }}>
                <Botao texto="Salvar" icone="check" aoTocar={salvarEdicao} largo />
              </View>
            </View>
          </Cartao>
        ) : ehAutor ? (
          <View style={{ flexDirection: 'row', gap: espaco[3] }}>
            <View style={{ flex: 1 }}>
              <Botao texto="Corrigir" icone="pencil-outline" variante="contorno" aoTocar={comecarEdicao} largo />
            </View>
            <View style={{ flex: 1 }}>
              <Botao texto="Apagar" icone="delete-outline" variante="perigo" aoTocar={apagar} largo />
            </View>
          </View>
        ) : null}
      </Tela>
    </>
  );
}

function Numero({ rotulo, valor }: { rotulo: string; valor: number | string }) {
  return (
    <View style={estilos.numero}>
      <Text style={[tipografia.manchete, tipografia.numeros, { color: cor.tinta }]}>{valor}</Text>
      <Text style={[tipografia.rotuloPequeno, { color: cor.suave }]}>{rotulo}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  ciente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco[2],
    backgroundColor: cor.verdeClaro,
    borderRadius: raio.campo,
    padding: espaco[3],
  },
  numero: {
    flex: 1,
    backgroundColor: cor.superficieAlt,
    borderRadius: raio.campo,
    padding: espaco[3],
    borderWidth: 1,
    borderColor: cor.borda,
  },
});
