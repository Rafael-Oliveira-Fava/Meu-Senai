/**
 * ALUNO (RF03) — a família vê o perfil do aluno; a equipe vê a lista de
 * alunos por turma, com busca por nome, turma ou matrícula.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { SectionList, Text, TextInput, View } from 'react-native';

import { Aparecer } from '../../../componentes/animacao';
import { Filtro, LinhaFiltros } from '../../../componentes/controles';
import { Avatar, BarraTopo, Cartao, Tela } from '../../../componentes/estrutura';
import { Icone } from '../../../componentes/icone';
import { Vazio } from '../../../componentes/indicadores';
import { PerfilAluno } from '../../../componentes/perfil-aluno';
import { useBanco, useUsuario } from '../../../dados/banco';
import { alunosVisiveis, ehFamilia } from '../../../dados/permissoes';
import type { Aluno } from '../../../dados/tipos';
import { primeiroNome } from '../../../utilidades/formatar';
import { cor, espaco, raio, tipografia } from '../../../tema';

export default function TelaAluno() {
  const { db } = useBanco();
  const usuario = useUsuario();
  const alunos = alunosVisiveis(db, usuario);
  const [escolhidoId, setEscolhidoId] = useState(alunos[0]?.id);
  const [busca, setBusca] = useState('');

  // Família: perfil do aluno (com troca de filho, se tiver mais de um).
  if (ehFamilia(usuario)) {
    const aluno = alunos.find((a) => a.id === escolhidoId) ?? alunos[0];
    return (
      <View style={{ flex: 1 }}>
        <BarraTopo titulo={usuario.perfil === 'aluno' ? 'Meu perfil' : 'Aluno'} subtitulo={aluno?.curso} voltar={false} />
        <Tela>
          {alunos.length > 1 ? (
            <LinhaFiltros>
              {alunos.map((a) => (
                <Filtro key={a.id} texto={primeiroNome(a.nome)} ativo={a.id === aluno?.id} aoTocar={() => setEscolhidoId(a.id)} />
              ))}
            </LinhaFiltros>
          ) : null}
          {aluno ? (
            <PerfilAluno db={db} usuario={usuario} aluno={aluno} />
          ) : (
            <Vazio
              icone="account-question-outline"
              titulo="Nenhum aluno vinculado"
              texto="Peça à secretaria para vincular sua conta ao aluno."
            />
          )}
        </Tela>
      </View>
    );
  }

  // Equipe: lista agrupada por turma.
  const termo = busca.trim().toLowerCase();
  const encontrados = alunos.filter(
    (a) => !termo || a.nome.toLowerCase().includes(termo) || a.turma.toLowerCase().includes(termo) || a.matricula.includes(termo),
  );
  const turmas = [...new Set(encontrados.map((a) => a.turma))].sort();
  const secoes = turmas.map((turma) => ({ title: turma, data: encontrados.filter((a) => a.turma === turma) }));

  return (
    <View style={{ flex: 1, backgroundColor: cor.fundo }}>
      <BarraTopo
        titulo={usuario.perfil === 'professor' ? 'Minhas turmas' : 'Alunos'}
        subtitulo={`${alunos.length} ${alunos.length === 1 ? 'aluno' : 'alunos'}`}
        voltar={false}
      />
      <SectionList<Aluno>
        sections={secoes}
        keyExtractor={(a) => a.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{
          padding: espaco[4],
          gap: espaco[2],
          paddingBottom: espaco[8],
          width: '100%',
          maxWidth: 672,
          alignSelf: 'center',
        }}
        ListHeaderComponent={
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: espaco[2],
              backgroundColor: cor.superficie,
              borderRadius: raio.pilula,
              borderWidth: 1,
              borderColor: cor.borda,
              paddingHorizontal: espaco[4],
              minHeight: 52,
              marginBottom: espaco[2],
            }}
          >
            <Icone nome="magnify" cor={cor.suave} />
            <TextInput
              value={busca}
              onChangeText={setBusca}
              placeholder="Buscar por nome, turma ou matrícula"
              placeholderTextColor="#7A8494"
              accessibilityLabel="Buscar aluno"
              style={{ flex: 1, fontFamily: tipografia.corpo.fontFamily, fontSize: 16, color: cor.tinta, minHeight: 48 }}
            />
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text style={[tipografia.rotulo, { color: cor.suave, marginTop: espaco[3], marginBottom: espaco[1] }]} accessibilityRole="header">
            Turma {section.title}
          </Text>
        )}
        renderItem={({ item, index }) => (
          <Aparecer ordem={index}>
            <Cartao
              aoTocar={() => router.push(`/aluno/${item.id}`)}
              descricao={`${item.nome}, turma ${item.turma}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: espaco[3], paddingVertical: espaco[3] }}
            >
              <Avatar nome={item.nome} tamanho={44} tom="azul" />
              <View style={{ flex: 1 }}>
                <Text style={[tipografia.subtitulo, { color: cor.tinta }]}>{item.nome}</Text>
                <Text style={[tipografia.corpoPequeno, { color: cor.suave }]}>
                  {item.curso} · {item.responsavelIds.length} {item.responsavelIds.length === 1 ? 'responsável' : 'responsáveis'}
                </Text>
              </View>
              <Icone nome="chevron-right" cor={cor.bordaForte} />
            </Cartao>
          </Aparecer>
        )}
        ListEmptyComponent={
          <Vazio
            icone="account-search-outline"
            titulo="Nenhum aluno encontrado"
            texto="Confira a grafia ou busque pela turma, por exemplo MEC-2B."
          />
        }
      />
    </View>
  );
}
