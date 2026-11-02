/**
 * PERFIL DE UM ALUNO (RF03) — aberto pela lista da equipe ou pela tela inicial.
 * Só abre se o usuário puder ver esse aluno (RN04).
 */
import { useLocalSearchParams } from 'expo-router';

import { BarraTopo, Bloqueado, Tela } from '../../../componentes/estrutura';
import { PerfilAluno } from '../../../componentes/perfil-aluno';
import { useBanco, useUsuario } from '../../../dados/banco';
import { alunoPorId } from '../../../dados/consultas';
import { podeVerAluno } from '../../../dados/permissoes';

export default function TelaPerfilAluno() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db } = useBanco();
  const usuario = useUsuario();
  const aluno = alunoPorId(db, id);

  if (!aluno || !podeVerAluno(db, usuario, aluno.id))
    return <Bloqueado barra="Aluno" titulo="Acesso restrito" texto="Este perfil não está disponível para a sua conta." />;

  return (
    <>
      <BarraTopo titulo={aluno.nome} subtitulo={`Turma ${aluno.turma}`} />
      <Tela>
        <PerfilAluno db={db} usuario={usuario} aluno={aluno} />
      </Tela>
    </>
  );
}
