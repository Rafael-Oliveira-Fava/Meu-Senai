/**
 * TROCAR SENHA (RF01) — o usuário confirma a senha atual e escolhe uma nova.
 * A senha é conferida e trocada no servidor; o app nunca recebe a senha guardada.
 */
import { router } from 'expo-router';
import { useState } from 'react';

import { Botao, Campo } from '../../componentes/controles';
import { BarraTopo, Tela } from '../../componentes/estrutura';
import { FaixaErro } from '../../componentes/indicadores';
import { useMensagem } from '../../componentes/mensagem';
import { api } from '../../dados/api';
import { useUsuario } from '../../dados/banco';

export default function TelaTrocarSenha() {
  const usuario = useUsuario();
  const mostrar = useMensagem();
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [repetida, setRepetida] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    if (salvando) return;
    setErro(null);
    if (!atual || !nova) return setErro('Preencha a senha atual e a nova.');
    if (nova.length < 6) return setErro('A nova senha precisa ter pelo menos 6 caracteres.');
    if (nova !== repetida) return setErro('As duas senhas novas não são iguais.');
    setSalvando(true);
    try {
      await api.trocarSenha(usuario.id, atual, nova);
      mostrar('Senha trocada. Use a nova senha no próximo acesso.');
      router.back();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível trocar a senha.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <BarraTopo titulo="Trocar senha" subtitulo={usuario.email} />
      <Tela rodape={<Botao texto="Salvar nova senha" icone="lock-check" aoTocar={salvar} carregando={salvando} largo />}>
        <FaixaErro mensagem={erro} />
        <Campo rotulo="Senha atual" obrigatorio value={atual} onChangeText={setAtual} secureTextEntry autoComplete="current-password" />
        <Campo
          rotulo="Nova senha"
          obrigatorio
          value={nova}
          onChangeText={setNova}
          secureTextEntry
          autoComplete="new-password"
          dica="Pelo menos 6 caracteres."
        />
        <Campo
          rotulo="Repita a nova senha"
          obrigatorio
          value={repetida}
          onChangeText={setRepetida}
          secureTextEntry
          autoComplete="new-password"
        />
      </Tela>
    </>
  );
}
