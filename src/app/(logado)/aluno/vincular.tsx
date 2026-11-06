/**
 * VINCULAR RESPONSÁVEL (RF04, RN03) — só a secretaria; no máximo 2 por aluno.
 * Se o e-mail já tem conta de responsável, ela é reaproveitada.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { Botao, Campo, ListaOpcoes } from '../../../componentes/controles';
import { BarraTopo, Bloqueado, Cartao, Tela } from '../../../componentes/estrutura';
import { FaixaErro, Vazio } from '../../../componentes/indicadores';
import { useMensagem } from '../../../componentes/mensagem';
import { useBanco, useUsuario } from '../../../dados/banco';
import { alunoPorId } from '../../../dados/consultas';
import { MAX_RESPONSAVEIS, podeVincularResponsavel } from '../../../dados/permissoes';
import { mascaraTelefone, primeiroNome } from '../../../utilidades/formatar';
import { cor, tipografia } from '../../../tema';

type Parentesco = 'Mãe' | 'Pai' | 'Avó/Avô' | 'Responsável legal';

export default function TelaVincular() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, vincularResponsavel } = useBanco();
  const usuario = useUsuario();
  const mostrar = useMensagem();
  const aluno = alunoPorId(db, id);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [parentesco, setParentesco] = useState<Parentesco | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  if (!aluno || !podeVincularResponsavel(usuario))
    return (
      <Bloqueado barra="Vincular responsável" titulo="Acesso restrito" texto="Somente a secretaria vincula responsáveis aos alunos." />
    );

  const vagas = MAX_RESPONSAVEIS - aluno.responsavelIds.length;

  const vincular = () => {
    if (!parentesco) return setErro('Escolha o parentesco.');
    const resultado = vincularResponsavel(aluno.id, { nome, email, telefone, parentesco });
    if (!resultado.ok) return setErro(resultado.erro);
    mostrar(`${primeiroNome(nome)} vinculado a ${primeiroNome(aluno.nome)}.`);
    if (router.canGoBack()) router.back();
    else router.replace(`/aluno/${aluno.id}`);
  };

  return (
    <>
      <BarraTopo titulo="Vincular responsável" subtitulo={aluno.nome} />
      <Tela rodape={vagas > 0 ? <Botao texto="Vincular" icone="account-plus" aoTocar={vincular} largo /> : undefined}>
        {vagas <= 0 ? (
          <Vazio
            icone="account-multiple-check"
            titulo="Limite atingido"
            texto={`Este aluno já tem ${MAX_RESPONSAVEIS} responsáveis vinculados.`}
          />
        ) : (
          <>
            <Cartao>
              <Text style={[tipografia.corpoPequeno, { color: cor.suave }]}>
                O responsável recebe acesso aos comunicados, atestados, autorizações e suporte deste aluno. Vagas restantes: {vagas}.
              </Text>
            </Cartao>
            <FaixaErro mensagem={erro} />
            <Campo
              rotulo="Nome completo"
              obrigatorio
              value={nome}
              onChangeText={setNome}
              placeholder="Ex.: Marcos Santos"
              autoCapitalize="words"
            />
            <Campo
              rotulo="E-mail"
              obrigatorio
              value={email}
              onChangeText={setEmail}
              placeholder="email@exemplo.com"
              autoCapitalize="none"
              keyboardType="email-address"
              dica="Usado para entrar no aplicativo. A senha inicial é senai123: informe ao responsável."
            />
            <Campo
              rotulo="Telefone"
              value={telefone}
              onChangeText={(t) => setTelefone(mascaraTelefone(t))}
              placeholder="(11) 90000-0000"
              keyboardType="phone-pad"
            />
            <ListaOpcoes<Parentesco>
              rotulo="Parentesco"
              valor={parentesco}
              aoEscolher={setParentesco}
              opcoes={[
                { id: 'Mãe', nome: 'Mãe' },
                { id: 'Pai', nome: 'Pai' },
                { id: 'Avó/Avô', nome: 'Avó ou avô' },
                { id: 'Responsável legal', nome: 'Responsável legal' },
              ]}
            />
          </>
        )}
      </Tela>
    </>
  );
}
