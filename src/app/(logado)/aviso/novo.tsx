/**
 * NOVO AVISO (RF05, RF06) — a equipe escolhe o público (escola toda,
 * responsáveis, alunos, uma turma ou um aluno), a categoria e escreve a mensagem.
 */
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Botao, Campo, Filtro, Interruptor, ListaOpcoes } from '../../../componentes/controles';
import { BarraTopo, Bloqueado, Tela } from '../../../componentes/estrutura';
import type { NomeIcone } from '../../../componentes/icone';
import { FaixaErro } from '../../../componentes/indicadores';
import { useMensagem } from '../../../componentes/mensagem';
import { useBanco, useUsuario } from '../../../dados/banco';
import { alunosVisiveis, podePublicar, podePublicarGeral, turmasPermitidas } from '../../../dados/permissoes';
import type { CategoriaAviso, Publico } from '../../../dados/tipos';
import { NOME_CATEGORIA } from '../../../utilidades/formatar';
import { cor, espaco, tipografia } from '../../../tema';
import { useToqueUnico } from '../../../utilidades/toque-unico';

type Destino = 'todos' | 'responsaveis' | 'alunos' | 'turma' | 'individual';

export default function TelaNovoAviso() {
  const { db, publicarAviso } = useBanco();
  const usuario = useUsuario();
  const { liberado, travar } = useToqueUnico();
  const mostrar = useMensagem();
  const geral = podePublicarGeral(usuario);
  const turmas = turmasPermitidas(db, usuario);

  const [destino, setDestino] = useState<Destino | null>(geral ? 'todos' : 'turma');
  const [turma, setTurma] = useState<string | null>(turmas[0] ?? null);
  const [alunoId, setAlunoId] = useState<string | null>(null);
  const [categoria, setCategoria] = useState<CategoriaAviso>('informativo');
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [pedeCiencia, setPedeCiencia] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  if (!podePublicar(usuario))
    return <Bloqueado barra="Novo aviso" titulo="Sem permissão" texto="Somente a equipe da escola publica comunicados." />;

  // Gestão pode falar com a escola toda; professor só com turma ou aluno.
  const destinos: { id: Destino; nome: string; dica: string; icone: NomeIcone }[] = [
    ...(geral
      ? [
          { id: 'todos' as const, nome: 'Toda a escola', dica: 'Alunos, responsáveis e equipe', icone: 'school-outline' as const },
          {
            id: 'responsaveis' as const,
            nome: 'Somente responsáveis',
            dica: 'Pais e responsáveis de todos os alunos',
            icone: 'account-heart-outline' as const,
          },
          { id: 'alunos' as const, nome: 'Somente alunos', dica: 'Todos os alunos matriculados', icone: 'account-school-outline' as const },
        ]
      : []),
    { id: 'turma', nome: 'Uma turma', dica: 'Alunos e responsáveis da turma', icone: 'google-classroom' },
    {
      id: 'individual',
      nome: 'Um aluno (aviso individual)',
      dica: 'Só o aluno e seus responsáveis recebem',
      icone: 'account-lock-outline',
    },
  ];

  const publicar = () => {
    if (!liberado()) return; // evita pedido duplicado com dois toques rápidos
    setErro(null);
    if (!destino) return setErro('Escolha para quem enviar.');
    if (destino === 'turma' && !turma) return setErro('Escolha a turma.');
    if (destino === 'individual' && !alunoId) return setErro('Escolha o aluno que vai receber o aviso.');
    const publico: Publico =
      destino === 'turma'
        ? { tipo: 'turma', turma: turma! }
        : destino === 'individual'
          ? { tipo: 'individual', alunoId: alunoId! }
          : { tipo: 'geral', para: destino };

    const resultado = publicarAviso({ titulo, texto, categoria, publico, pedeCiencia });
    if (!resultado.ok) return setErro(resultado.erro);
    travar();
    mostrar(destino === 'individual' ? 'Aviso individual enviado.' : 'Comunicado publicado.');
    router.replace(`/aviso/${resultado.id}`);
  };

  return (
    <>
      <BarraTopo titulo="Novo aviso" subtitulo="Publicar comunicado ou aviso individual" />
      <Tela rodape={<Botao texto="Publicar" icone="send" aoTocar={publicar} largo />}>
        <FaixaErro mensagem={erro} />
        <ListaOpcoes rotulo="Para quem" valor={destino} aoEscolher={setDestino} opcoes={destinos} />

        {destino === 'turma' ? (
          <Grupo rotulo="Turma">
            {turmas.map((t) => (
              <Filtro key={t} texto={t} ativo={turma === t} aoTocar={() => setTurma(t)} />
            ))}
          </Grupo>
        ) : null}

        {destino === 'individual' ? (
          <>
            <ListaOpcoes
              rotulo="Aluno"
              valor={alunoId}
              aoEscolher={setAlunoId}
              opcoes={alunosVisiveis(db, usuario).map((a) => ({
                id: a.id,
                nome: a.nome,
                dica: `${a.turma} · ${a.responsavelIds.length} responsável(is)`,
                icone: 'account-outline' as const,
              }))}
            />
            <Interruptor
              rotulo="Pedir confirmação de ciência"
              dica="Os responsáveis tocam em 'Estou ciente' e você acompanha quem confirmou."
              valor={pedeCiencia}
              aoMudar={setPedeCiencia}
            />
          </>
        ) : null}

        <Grupo rotulo="Categoria">
          {(Object.keys(NOME_CATEGORIA) as CategoriaAviso[]).map((c) => (
            <Filtro key={c} texto={NOME_CATEGORIA[c]} ativo={categoria === c} aoTocar={() => setCategoria(c)} />
          ))}
        </Grupo>

        <Campo
          rotulo="Título"
          obrigatorio
          value={titulo}
          onChangeText={setTitulo}
          placeholder="Ex.: Reunião de pais na quinta-feira"
          maxLength={90}
          dica={`${titulo.length}/90`}
        />
        <Campo
          rotulo="Mensagem"
          obrigatorio
          value={texto}
          onChangeText={setTexto}
          placeholder="Escreva o comunicado com data, horário e o que a família precisa fazer."
          multiline
        />
      </Tela>
    </>
  );
}

/** Rótulo + filtros que quebram linha. */
function Grupo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={[tipografia.rotulo, { color: cor.texto }]}>{rotulo}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco[2] }}>{children}</View>
    </View>
  );
}
