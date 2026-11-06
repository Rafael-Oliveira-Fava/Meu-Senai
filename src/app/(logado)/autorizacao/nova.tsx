/**
 * NOVA AUTORIZAÇÃO (RF09)
 * - Responsável: pede saída antecipada (data, horário e quem vai buscar).
 * - Equipe: pede autorização à família (visita técnica, saída, outro).
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Botao, Campo, Filtro, LinhaFiltros, ListaOpcoes } from '../../../componentes/controles';
import { BarraTopo, Bloqueado, Tela } from '../../../componentes/estrutura';
import { FaixaErro } from '../../../componentes/indicadores';
import { useMensagem } from '../../../componentes/mensagem';
import { useBanco, useUsuario } from '../../../dados/banco';
import { alunosVisiveis, podePedirAutorizacao, podePedirSaida } from '../../../dados/permissoes';
import type { TipoAutorizacao } from '../../../dados/tipos';
import { diaMais, horaValida, lerDataDigitada, mascaraData, mascaraHora, primeiroNome } from '../../../utilidades/formatar';
import { espaco } from '../../../tema';
import { useToqueUnico } from '../../../utilidades/toque-unico';

export default function TelaNovaAutorizacao() {
  const { db, criarAutorizacao } = useBanco();
  const usuario = useUsuario();
  const { liberado, travar } = useToqueUnico();
  const mostrar = useMensagem();
  const familia = podePedirSaida(usuario);
  const alunos = alunosVisiveis(db, usuario);

  const [alunoId, setAlunoId] = useState<string | null>(familia ? (alunos[0]?.id ?? null) : null);
  const [tipo, setTipo] = useState<TipoAutorizacao>(familia ? 'saida_antecipada' : 'atividade_externa');
  const [titulo, setTitulo] = useState(familia ? 'Saída antecipada' : '');
  const [detalhes, setDetalhes] = useState('');
  const [data, setData] = useState(diaMais(0));
  const [hora, setHora] = useState('');
  const [buscaPor, setBuscaPor] = useState(familia ? `${usuario.nome} (${(usuario.parentesco ?? 'responsável').toLowerCase()})` : '');
  const [erro, setErro] = useState<string | null>(null);

  if (!familia && !podePedirAutorizacao(usuario))
    return <Bloqueado barra="Autorização" titulo="Sem permissão" texto="Pedidos de saída são feitos pelo responsável no aplicativo." />;

  const saida = tipo === 'saida_antecipada';
  const nomeAluno = alunoId ? primeiroNome(alunos.find((a) => a.id === alunoId)?.nome ?? '') : 'o aluno';

  const enviar = () => {
    if (!liberado()) return; // evita pedido duplicado com dois toques rápidos
    setErro(null);
    const dia = lerDataDigitada(data);
    if (!alunoId) return setErro('Escolha o aluno.');
    if (!dia) return setErro('Confira a data no formato dd/mm/aaaa.');
    if (hora && !horaValida(hora)) return setErro('Confira o horário no formato hh:mm.');
    const resultado = criarAutorizacao({
      alunoId,
      tipo,
      titulo,
      detalhes,
      data: dia,
      hora: hora || undefined,
      buscaPor: saida ? buscaPor : undefined,
    });
    if (!resultado.ok) return setErro(resultado.erro);
    travar();
    mostrar(familia ? 'Pedido enviado para a coordenação.' : 'Pedido enviado aos responsáveis.');
    router.replace(`/autorizacao/${resultado.id}`);
  };

  return (
    <>
      <BarraTopo
        titulo={familia ? 'Pedir saída antecipada' : 'Pedir autorização'}
        subtitulo={familia ? 'A coordenação libera o aluno na portaria' : 'Os responsáveis respondem pelo aplicativo'}
      />
      <Tela rodape={<Botao texto="Enviar pedido" icone="send" aoTocar={enviar} largo />}>
        <FaixaErro mensagem={erro} />
        {alunos.length > 1 || !familia ? (
          <ListaOpcoes
            rotulo="Aluno"
            valor={alunoId}
            aoEscolher={setAlunoId}
            opcoes={alunos.map((a) => ({ id: a.id, nome: a.nome, dica: a.turma, icone: 'account-outline' as const }))}
          />
        ) : null}

        {!familia ? (
          <ListaOpcoes<TipoAutorizacao>
            rotulo="Tipo"
            valor={tipo}
            aoEscolher={setTipo}
            opcoes={[
              { id: 'atividade_externa', nome: 'Atividade externa', dica: 'Visita técnica, evento fora da unidade', icone: 'bus-school' },
              { id: 'saida_antecipada', nome: 'Saída antecipada', dica: 'Liberar o aluno antes do horário', icone: 'exit-run' },
              { id: 'outro', nome: 'Outro', dica: 'Uso de imagem, participação em projeto', icone: 'file-sign' },
            ]}
          />
        ) : null}

        <Campo
          rotulo="Título"
          obrigatorio
          value={titulo}
          onChangeText={setTitulo}
          placeholder={familia ? 'Saída antecipada' : 'Ex.: Visita técnica à fábrica parceira'}
        />
        <View style={{ flexDirection: 'row', gap: espaco[3] }}>
          <View style={{ flex: 1 }}>
            <Campo
              rotulo="Data"
              obrigatorio
              value={data}
              onChangeText={(t) => setData(mascaraData(t))}
              keyboardType="number-pad"
              placeholder="dd/mm/aaaa"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Campo
              rotulo="Horário"
              obrigatorio={saida}
              value={hora}
              onChangeText={(t) => setHora(mascaraHora(t))}
              keyboardType="number-pad"
              placeholder="hh:mm"
            />
          </View>
        </View>
        <LinhaFiltros>
          <Filtro texto="Hoje" ativo={data === diaMais(0)} aoTocar={() => setData(diaMais(0))} />
          <Filtro texto="Amanhã" ativo={data === diaMais(1)} aoTocar={() => setData(diaMais(1))} />
        </LinhaFiltros>
        {saida ? (
          <Campo
            rotulo="Quem vai buscar"
            obrigatorio
            value={buscaPor}
            onChangeText={setBuscaPor}
            placeholder="Nome e parentesco"
            dica={`A portaria confere o documento de quem buscar ${nomeAluno}.`}
          />
        ) : null}
        <Campo
          rotulo={familia ? 'Motivo' : 'Detalhes'}
          value={detalhes}
          onChangeText={setDetalhes}
          placeholder={familia ? 'Ex.: consulta médica às 11h' : 'Local, transporte, responsável pela atividade, o que levar'}
          multiline
        />
      </Tela>
    </>
  );
}
