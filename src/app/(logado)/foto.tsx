/**
 * MINHA FOTO — a pessoa tira uma selfie com a câmera da frente, confere
 * e confirma. A foto vai para o servidor e aparece para a escola.
 */
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Platform, Text, View } from 'react-native';

import { Botao } from '../../componentes/controles';
import { Avatar, BarraTopo, Cartao, Tela } from '../../componentes/estrutura';
import { FaixaErro } from '../../componentes/indicadores';
import { useMensagem } from '../../componentes/mensagem';
import { api } from '../../dados/api';
import { useBanco, useUsuario } from '../../dados/banco';
import { cor, espaco, tipografia } from '../../tema';

type Selfie = { uri: string; nome: string; tipo: string };

export default function TelaMinhaFoto() {
  const { trocarMinhaFoto } = useBanco();
  const usuario = useUsuario();
  const mostrar = useMensagem();
  const [selfie, setSelfie] = useState<Selfie | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const tirarSelfie = async () => {
    setErro(null);
    if (Platform.OS !== 'web') {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) return setErro('Permita o uso da câmera nas configurações do celular para tirar a foto.');
    }
    const r = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (r.canceled || !r.assets?.length) return;
    const a = r.assets[0];
    setSelfie({ uri: a.uri, nome: a.fileName ?? 'selfie.jpg', tipo: a.mimeType ?? 'image/jpeg' });
  };

  const confirmar = async () => {
    if (!selfie || salvando) return;
    setSalvando(true);
    try {
      const foto = await api.enviarArquivo(selfie);
      const resultado = trocarMinhaFoto(foto);
      if (!resultado.ok) return setErro(resultado.erro);
      mostrar('Foto atualizada.');
      router.back();
    } catch (e) {
      setErro(e instanceof Error && e.message ? e.message : 'Não foi possível enviar a foto. Tente de novo.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <BarraTopo titulo="Minha foto" subtitulo="Ajuda a escola a identificar você" />
      <Tela
        rodape={
          selfie ? (
            <View style={{ flexDirection: 'row', gap: espaco[3] }}>
              <View style={{ flex: 1 }}>
                <Botao texto="Tirar outra" icone="camera-retake-outline" variante="contorno" aoTocar={tirarSelfie} largo />
              </View>
              <View style={{ flex: 1 }}>
                <Botao texto="Usar esta foto" icone="check" aoTocar={confirmar} carregando={salvando} largo />
              </View>
            </View>
          ) : (
            <Botao texto="Tirar selfie" icone="camera-front" aoTocar={tirarSelfie} largo />
          )
        }
      >
        <FaixaErro mensagem={erro} />
        <Cartao style={{ alignItems: 'center', gap: espaco[4], paddingVertical: espaco[6] }}>
          {selfie ? (
            <Image
              source={{ uri: selfie.uri }}
              style={{ width: 200, height: 200, borderRadius: 100 }}
              accessibilityLabel="Prévia da selfie"
            />
          ) : (
            <Avatar nome={usuario.nome} tamanho={200} tom="azul" foto={usuario.foto} />
          )}
          <Text style={[tipografia.corpo, { color: cor.texto, textAlign: 'center' }]}>
            {selfie
              ? 'Ficou boa? Confirme para usar esta foto.'
              : 'Tire uma selfie de frente, com o rosto bem iluminado e sem óculos escuros.'}
          </Text>
        </Cartao>
      </Tela>
    </>
  );
}
