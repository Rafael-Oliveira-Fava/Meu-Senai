/**
 * MINHA CONTA — dados do usuário, nota de privacidade (LGPD), trocar senha e sair.
 */
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Botao } from '../../componentes/controles';
import { Avatar, BarraTopo, Cartao, Tela, TituloSecao } from '../../componentes/estrutura';
import { LinhaInfo } from '../../componentes/indicadores';
import { useBanco, useUsuario } from '../../dados/banco';
import { alunosVisiveis, ehFamilia } from '../../dados/permissoes';
import { NOME_PERFIL } from '../../utilidades/formatar';
import { cor, espaco, tipografia } from '../../tema';

export default function TelaConta() {
  const { db, sair } = useBanco();
  const usuario = useUsuario();
  const alunos = alunosVisiveis(db, usuario);

  return (
    <>
      <BarraTopo titulo="Minha conta" />
      <Tela>
        <Cartao style={{ alignItems: 'center', gap: espaco[2], paddingVertical: espaco[6] }}>
          <Avatar nome={usuario.nome} tamanho={72} tom="azul" anel />
          <Text style={[tipografia.manchete, { color: cor.tinta, textAlign: 'center' }]}>{usuario.nome}</Text>
          <Text style={[tipografia.corpo, { color: cor.suave }]}>{NOME_PERFIL[usuario.perfil]}</Text>
        </Cartao>
        <Cartao style={{ paddingVertical: espaco[1] }}>
          <LinhaInfo icone="email-outline" rotulo="E-mail" valor={usuario.email} />
          {usuario.telefone ? <LinhaInfo icone="phone-outline" rotulo="Telefone" valor={usuario.telefone} /> : null}
          {usuario.turmas?.length ? <LinhaInfo icone="google-classroom" rotulo="Turmas" valor={usuario.turmas.join(', ')} /> : null}
          {ehFamilia(usuario) ? (
            <LinhaInfo
              icone="account-child-outline"
              rotulo={usuario.perfil === 'aluno' ? 'Matrícula' : 'Alunos'}
              valor={usuario.perfil === 'aluno' ? (alunos[0]?.matricula ?? '') : alunos.map((a) => a.nome).join(', ')}
              ultima
            />
          ) : (
            <LinhaInfo icone="shield-account-outline" rotulo="Perfil" valor={NOME_PERFIL[usuario.perfil]} ultima />
          )}
        </Cartao>

        <TituloSecao>Privacidade</TituloSecao>
        <Cartao style={{ gap: espaco[2] }}>
          <Text style={[tipografia.corpo, { color: cor.texto }]}>
            Seus dados e os do aluno só aparecem para perfis autorizados: o próprio aluno, os responsáveis vinculados e a equipe da escola
            conforme a função de cada um (LGPD).
          </Text>
          <Text style={[tipografia.corpoPequeno, { color: cor.suave }]}>
            Os dados ficam no servidor da escola. Neste aparelho fica salva só a sua sessão.
          </Text>
        </Cartao>

        <View style={{ gap: espaco[3], marginTop: espaco[2] }}>
          <Botao texto="Trocar senha" icone="lock-reset" variante="suave" largo aoTocar={() => router.push('/senha')} />
          <Botao
            texto="Sair"
            icone="logout"
            variante="contorno"
            largo
            aoTocar={() => {
              sair();
              router.replace('/entrar');
            }}
          />
        </View>
      </Tela>
    </>
  );
}
