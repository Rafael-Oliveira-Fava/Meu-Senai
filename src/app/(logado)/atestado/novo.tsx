/**
 * ENVIAR ATESTADO (RF08) — o responsável anexa a foto ou o PDF,
 * informa o período e a secretaria recebe para análise.
 */
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Botao, Campo, Filtro, ListaOpcoes } from '../../../componentes/controles';
import { BarraTopo, Bloqueado, Tela } from '../../../componentes/estrutura';
import { Icone } from '../../../componentes/icone';
import { FaixaErro } from '../../../componentes/indicadores';
import { useMensagem } from '../../../componentes/mensagem';
import { useBanco, useUsuario } from '../../../dados/banco';
import { alunosVisiveis, podeEnviarAtestado } from '../../../dados/permissoes';
import { diaMais, lerDataDigitada, mascaraData, tamanhoArquivo } from '../../../utilidades/formatar';
import { cor, espaco, raio, tipografia } from '../../../tema';

type Arquivo = { nome: string; tamanho?: number; uri: string };

const LIMITE_ARQUIVO = 10 * 1024 * 1024; // 10 MB

export default function TelaEnviarAtestado() {
  const { db, enviarAtestado } = useBanco();
  const usuario = useUsuario();
  const mostrar = useMensagem();
  const alunos = alunosVisiveis(db, usuario);
  const [alunoId, setAlunoId] = useState<string | null>(alunos[0]?.id ?? null);
  const [inicio, setInicio] = useState(diaMais(0));
  const [fim, setFim] = useState(diaMais(0));
  const [motivo, setMotivo] = useState('');
  const [arquivo, setArquivo] = useState<Arquivo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (!podeEnviarAtestado(usuario))
    return (
      <Bloqueado
        barra="Enviar atestado"
        titulo="Só responsáveis enviam atestados"
        texto="Peça ao seu responsável para enviar o atestado pelo aplicativo."
      />
    );

  const escolherArquivo = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (r.canceled || !r.assets?.length) return;
      const a = r.assets[0];
      if (a.size && a.size > LIMITE_ARQUIVO) return setErro('O arquivo passa de 10 MB. Envie uma foto menor ou um PDF.');
      setArquivo({ nome: a.name, tamanho: a.size ?? undefined, uri: a.uri });
      setErro(null);
    } catch {
      setErro('Não foi possível abrir o arquivo. Tente de novo.');
    }
  };

  const enviar = () => {
    setErro(null);
    const dataInicio = lerDataDigitada(inicio);
    const dataFim = lerDataDigitada(fim);
    if (!alunoId) return setErro('Escolha o aluno.');
    if (!dataInicio || !dataFim) return setErro('Confira as datas no formato dd/mm/aaaa.');
    if (!arquivo) return setErro('Anexe a foto ou o PDF do atestado.');
    setEnviando(true);
    setTimeout(() => {
      const resultado = enviarAtestado({
        alunoId,
        inicio: dataInicio,
        fim: dataFim,
        motivo,
        arquivoNome: arquivo.nome,
        arquivoTamanho: arquivo.tamanho,
        arquivoUri: arquivo.uri,
      });
      setEnviando(false);
      if (!resultado.ok) return setErro(resultado.erro);
      mostrar('Atestado enviado para a secretaria.');
      router.replace(`/atestado/${resultado.id}`);
    }, 400);
  };

  const escolherPeriodo = (dias: number) => {
    setInicio(diaMais(dias));
    setFim(diaMais(dias));
  };

  return (
    <>
      <BarraTopo titulo="Enviar atestado" subtitulo="A secretaria analisa e abona as faltas" />
      <Tela rodape={<Botao texto={enviando ? 'Enviando…' : 'Enviar atestado'} icone="send" aoTocar={enviar} carregando={enviando} largo />}>
        <FaixaErro mensagem={erro} />
        {alunos.length > 1 ? (
          <ListaOpcoes
            rotulo="Aluno"
            valor={alunoId}
            aoEscolher={setAlunoId}
            opcoes={alunos.map((a) => ({ id: a.id, nome: a.nome, dica: a.turma }))}
          />
        ) : null}

        <View style={{ gap: 6 }}>
          <Text style={[tipografia.rotulo, { color: cor.texto }]}>
            Arquivo do atestado<Text style={{ color: cor.vermelho }}> *</Text>
          </Text>
          <Pressable
            onPress={escolherArquivo}
            accessibilityRole="button"
            accessibilityLabel={arquivo ? `Arquivo ${arquivo.nome}. Toque para trocar.` : 'Anexar foto ou PDF'}
            style={({ pressed }) => [estilos.anexo, arquivo && estilos.anexoPreenchido, pressed && { opacity: 0.85 }]}
          >
            <View style={[estilos.anexoIcone, arquivo && { backgroundColor: cor.verdeClaro }]}>
              <Icone nome={arquivo ? 'file-check-outline' : 'paperclip'} cor={arquivo ? cor.verde : cor.primaria} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[tipografia.subtitulo, { color: cor.tinta }]} numberOfLines={1}>
                {arquivo ? arquivo.nome : 'Anexar foto ou PDF'}
              </Text>
              <Text style={[tipografia.corpoPequeno, { color: cor.suave }]}>
                {arquivo ? `${tamanhoArquivo(arquivo.tamanho)} · toque para trocar` : 'JPG, PNG ou PDF até 10 MB'}
              </Text>
            </View>
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', gap: espaco[3] }}>
          <View style={{ flex: 1 }}>
            <Campo
              rotulo="Primeiro dia"
              obrigatorio
              value={inicio}
              onChangeText={(t) => setInicio(mascaraData(t))}
              keyboardType="number-pad"
              placeholder="dd/mm/aaaa"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Campo
              rotulo="Último dia"
              obrigatorio
              value={fim}
              onChangeText={(t) => setFim(mascaraData(t))}
              keyboardType="number-pad"
              placeholder="dd/mm/aaaa"
            />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: espaco[2] }}>
          <Filtro texto="Hoje" ativo={inicio === diaMais(0) && fim === diaMais(0)} aoTocar={() => escolherPeriodo(0)} />
          <Filtro texto="Ontem" ativo={inicio === diaMais(-1) && fim === diaMais(-1)} aoTocar={() => escolherPeriodo(-1)} />
        </View>

        <Campo
          rotulo="Observação"
          value={motivo}
          onChangeText={setMotivo}
          placeholder="Ex.: consulta médica, repouso de 2 dias"
          multiline
          dica="Não é preciso informar o diagnóstico."
        />
      </Tela>
    </>
  );
}

const estilos = StyleSheet.create({
  anexo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco[3],
    padding: espaco[4],
    borderRadius: raio.campo,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: cor.bordaForte,
    backgroundColor: cor.superficie,
    minHeight: 72,
  },
  anexoPreenchido: { borderStyle: 'solid', borderColor: '#9FD3B3', backgroundColor: '#F6FBF8' },
  anexoIcone: {
    width: 44,
    height: 44,
    borderRadius: raio.pilula,
    backgroundColor: cor.primariaClara,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
