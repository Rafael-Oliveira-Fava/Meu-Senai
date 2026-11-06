/**
 * NOVA SOLICITAÇÃO (RF10, RF11) — escolher o setor (secretaria, coordenação,
 * professor ou direção), o assunto e escrever a dúvida.
 */
import { router } from 'expo-router';
import { useState } from 'react';

import { Botao, Campo, ListaOpcoes } from '../../../componentes/controles';
import { BarraTopo, Tela } from '../../../componentes/estrutura';
import { FaixaErro } from '../../../componentes/indicadores';
import { useMensagem } from '../../../componentes/mensagem';
import { useBanco, useUsuario } from '../../../dados/banco';
import { alunosVisiveis, ehFamilia, SETORES } from '../../../dados/permissoes';
import type { Setor } from '../../../dados/tipos';
import { useToqueUnico } from '../../../utilidades/toque-unico';

const ICONE_SETOR = {
  secretaria: 'file-document-outline',
  coordenador: 'clipboard-account-outline',
  professor: 'human-male-board',
  diretor: 'office-building-outline',
} as const;

export default function TelaNovaSolicitacao() {
  const { db, abrirChamado } = useBanco();
  const usuario = useUsuario();
  const { liberado, travar } = useToqueUnico();
  const mostrar = useMensagem();
  const familia = ehFamilia(usuario);
  const alunos = alunosVisiveis(db, usuario);

  // Família vê só os professores das turmas dos seus alunos; equipe vê todos.
  const turmasDaFamilia = new Set(alunos.map((a) => a.turma));
  const professores = db.usuarios.filter(
    (u) => u.perfil === 'professor' && u.id !== usuario.id && (!familia || u.turmas?.some((t) => turmasDaFamilia.has(t))),
  );
  const setores = SETORES.filter((s) => s.id !== usuario.perfil && (s.id !== 'professor' || professores.length > 0));

  const [setor, setSetor] = useState<Setor | null>(null);
  const [professorId, setProfessorId] = useState<string | null>(null);
  const [alunoId, setAlunoId] = useState<string | null>(familia ? (alunos[0]?.id ?? null) : null);
  const [assunto, setAssunto] = useState('');
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const enviar = () => {
    if (!liberado()) return; // evita pedido duplicado com dois toques rápidos
    setErro(null);
    if (!setor) return setErro('Escolha para quem enviar.');
    const resultado = abrirChamado({ setor, assunto, texto, professorId: professorId ?? undefined, alunoId: alunoId ?? undefined });
    if (!resultado.ok) return setErro(resultado.erro);
    travar();
    mostrar('Solicitação enviada. Acompanhe a resposta na Central de suporte.');
    router.replace(`/suporte/${resultado.id}`);
  };

  return (
    <>
      <BarraTopo titulo="Nova solicitação" subtitulo="Central de suporte" />
      <Tela rodape={<Botao texto="Enviar" icone="send" aoTocar={enviar} largo />}>
        <FaixaErro mensagem={erro} />
        <ListaOpcoes<Setor>
          rotulo="Para quem"
          valor={setor}
          aoEscolher={(s) => {
            setSetor(s);
            if (s !== 'professor') setProfessorId(null);
          }}
          opcoes={setores.map((s) => ({ id: s.id, nome: s.nome, dica: s.dica, icone: ICONE_SETOR[s.id] }))}
        />
        {setor === 'professor' ? (
          <ListaOpcoes
            rotulo="Professor"
            valor={professorId}
            aoEscolher={setProfessorId}
            opcoes={professores.map((p) => ({
              id: p.id,
              nome: p.nome,
              dica: `Turmas ${p.turmas?.join(', ')}`,
              icone: 'account-tie-outline' as const,
            }))}
          />
        ) : null}
        {familia && alunos.length > 1 ? (
          <ListaOpcoes
            rotulo="Sobre qual aluno"
            valor={alunoId}
            aoEscolher={setAlunoId}
            opcoes={alunos.map((a) => ({ id: a.id, nome: a.nome, dica: a.turma }))}
          />
        ) : null}
        <Campo
          rotulo="Assunto"
          obrigatorio
          value={assunto}
          onChangeText={setAssunto}
          placeholder="Ex.: Segunda via do boletim"
          maxLength={80}
        />
        <Campo rotulo="Mensagem" obrigatorio value={texto} onChangeText={setTexto} placeholder="Descreva sua dúvida ou pedido." multiline />
      </Tela>
    </>
  );
}
