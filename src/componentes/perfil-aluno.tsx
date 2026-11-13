/**
 * PERFIL DO ALUNO (RF03, RF04) — dados do aluno, dias e horários da semana
 * e os perfis vinculados (o próprio aluno + até 2 responsáveis).
 */
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { api } from '../dados/api';
import { useBanco } from '../dados/banco';
import { usuarioPorId } from '../dados/consultas';
import { MAX_RESPONSAVEIS, podeVincularResponsavel } from '../dados/permissoes';
import type { Aluno, BancoDados, Usuario } from '../dados/tipos';
import { dataCompleta, DIAS_SEMANA, diaDeHoje, idade } from '../utilidades/formatar';
import { cor, espaco, raio, tipografia } from '../tema';
import { Aparecer } from './animacao';
import { confirmar } from './confirmar';
import { Botao } from './controles';
import { Avatar, Cartao, Divisor, TituloSecao } from './estrutura';
import { Icone } from './icone';
import { Etiqueta, LinhaInfo } from './indicadores';
import { useMensagem } from './mensagem';

export function PerfilAluno({ db, usuario, aluno }: { db: BancoDados; usuario: Usuario; aluno: Aluno }) {
  const { desvincularResponsavel, definirFotoAluno } = useBanco();
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const mostrar = useMensagem();
  const hoje = diaDeHoje();
  const responsaveis = aluno.responsavelIds.map((id) => usuarioPorId(db, id)).filter((u): u is Usuario => !!u);
  const contaDoAluno = usuarioPorId(db, aluno.usuarioId);
  const vagas = MAX_RESPONSAVEIS - responsaveis.length;
  const secretaria = podeVincularResponsavel(usuario);

  /** Secretaria escolhe uma foto da galeria (recortada em quadrado) e envia para o servidor. */
  const escolherFoto = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    if (r.canceled || !r.assets?.length) return;
    const a = r.assets[0];
    setEnviandoFoto(true);
    try {
      const foto = await api.enviarArquivo({ uri: a.uri, nome: a.fileName ?? 'foto.jpg', tipo: a.mimeType ?? 'image/jpeg' });
      const resultado = definirFotoAluno(aluno.id, foto);
      mostrar(resultado.ok ? 'Foto atualizada.' : resultado.erro, resultado.ok ? 'ok' : 'erro');
    } catch (e) {
      mostrar(e instanceof Error && e.message ? e.message : 'Não foi possível enviar a foto.', 'erro');
    } finally {
      setEnviandoFoto(false);
    }
  };

  const desvincular = (r: Usuario) =>
    confirmar('Desvincular responsável?', `${r.nome} deixará de acompanhar ${aluno.nome} pelo aplicativo.`, () => {
      const resultado = desvincularResponsavel(aluno.id, r.id);
      mostrar(resultado.ok ? `${r.nome} foi desvinculado.` : resultado.erro, resultado.ok ? 'ok' : 'erro');
    });
  // Sábado só aparece se o aluno tiver aula nesse dia.
  const dias = DIAS_SEMANA.filter((d) => d.id !== 'sab' || aluno.horarios.some((h) => h.dia === 'sab'));

  return (
    <View style={{ gap: espaco[4] }}>
      <Aparecer>
        <Cartao style={{ alignItems: 'center', gap: espaco[2], paddingVertical: espaco[6] }}>
          {secretaria ? (
            <Pressable
              onPress={escolherFoto}
              disabled={enviandoFoto}
              accessibilityRole="button"
              accessibilityLabel={aluno.foto ? 'Trocar foto do aluno' : 'Adicionar foto do aluno'}
              style={{ opacity: enviandoFoto ? 0.5 : 1 }}
            >
              <Avatar nome={aluno.nome} tamanho={72} tom="azul" anel foto={aluno.foto} />
              <View style={estilos.camera}>
                <Icone nome="camera" tamanho={16} cor={cor.sobrePrimaria} />
              </View>
            </Pressable>
          ) : (
            <Avatar nome={aluno.nome} tamanho={72} tom="azul" anel foto={aluno.foto} />
          )}
          {secretaria && aluno.foto ? (
            <Pressable onPress={() => definirFotoAluno(aluno.id, undefined)} accessibilityRole="button" hitSlop={8}>
              <Text style={[tipografia.rotuloPequeno, { color: cor.vermelho }]}>Remover foto</Text>
            </Pressable>
          ) : null}
          <Text style={[tipografia.manchete, { color: cor.tinta, textAlign: 'center' }]}>{aluno.nome}</Text>
          <Text style={[tipografia.corpo, { color: cor.suave, textAlign: 'center' }]}>
            {aluno.curso} · Turma {aluno.turma}
          </Text>
          <Etiqueta
            tom="azul"
            icone="card-account-details-outline"
            texto={`Matrícula ${aluno.matricula}`}
            style={{ alignSelf: 'center' }}
          />
        </Cartao>
      </Aparecer>

      <Aparecer ordem={1}>
        <Cartao style={{ paddingVertical: espaco[1] }}>
          <LinhaInfo icone="account-outline" rotulo="Nome completo" valor={aluno.nome} />
          <LinhaInfo
            icone="cake-variant-outline"
            rotulo="Nascimento"
            valor={`${dataCompleta(aluno.nascimento)} (${idade(aluno.nascimento)} anos)`}
          />
          <LinhaInfo icone="school-outline" rotulo="Curso" valor={aluno.curso} />
          <LinhaInfo icone="google-classroom" rotulo="Turma" valor={aluno.turma} />
          <LinhaInfo icone="weather-sunset-up" rotulo="Turno" valor={aluno.turno} ultima />
        </Cartao>
      </Aparecer>

      <TituloSecao>Dias e horários</TituloSecao>
      <Aparecer ordem={2}>
        <Cartao style={{ padding: 0, overflow: 'hidden' }}>
          <View style={[estilos.linhaHorario, { backgroundColor: cor.superficieAlt, minHeight: 40 }]}>
            <Text style={[tipografia.rotuloPequeno, estilos.colunaDia, { color: cor.suave }]}>Dia</Text>
            <Text style={[tipografia.rotuloPequeno, estilos.colunaHora, { color: cor.suave }]}>Entrada</Text>
            <Text style={[tipografia.rotuloPequeno, estilos.colunaHora, { color: cor.suave }]}>Saída</Text>
          </View>
          {dias.map((d) => {
            const horario = aluno.horarios.find((h) => h.dia === d.id);
            const ehHoje = d.id === hoje;
            return (
              <View key={d.id}>
                <Divisor />
                <View
                  style={[estilos.linhaHorario, ehHoje && { backgroundColor: cor.primariaClara }]}
                  accessibilityLabel={`${d.nome}: ${horario ? `entrada ${horario.entrada}, saída ${horario.saida}` : 'sem aula'}${ehHoje ? ', hoje' : ''}`}
                >
                  <View style={[estilos.colunaDia, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                    <Text style={[tipografia.subtitulo, { color: horario ? cor.tinta : cor.suave }]}>{d.nome}</Text>
                    {ehHoje ? <Etiqueta tom="escuro" texto="Hoje" /> : null}
                  </View>
                  {horario ? (
                    <>
                      <Text style={[tipografia.subtitulo, tipografia.numeros, estilos.colunaHora, { color: cor.tinta }]}>
                        {horario.entrada}
                      </Text>
                      <Text style={[tipografia.subtitulo, tipografia.numeros, estilos.colunaHora, { color: cor.tinta }]}>
                        {horario.saida}
                      </Text>
                    </>
                  ) : (
                    <Text style={[tipografia.corpoPequeno, { color: cor.suave, flex: 2 }]}>Sem aula</Text>
                  )}
                </View>
              </View>
            );
          })}
        </Cartao>
      </Aparecer>

      <TituloSecao>Perfis vinculados</TituloSecao>
      <Aparecer ordem={3}>
        <Cartao style={{ gap: espaco[3] }}>
          <Text style={[tipografia.corpoPequeno, { color: cor.suave }]}>
            Até 3 perfis de acesso por aluno: o próprio aluno e até {MAX_RESPONSAVEIS} responsáveis.
          </Text>
          <View style={{ gap: espaco[1] }}>
            {contaDoAluno ? <Pessoa nome={contaDoAluno.nome} detalhe="Aluno" email={contaDoAluno.email} /> : null}
            {responsaveis.map((r) => (
              <Pessoa
                key={r.id}
                nome={r.nome}
                detalhe={`${r.parentesco ?? 'Responsável'}${r.telefone ? ` · ${r.telefone}` : ''}`}
                email={r.email}
                aoDesvincular={secretaria ? () => desvincular(r) : undefined}
              />
            ))}
            {Array.from({ length: vagas }, (_, i) => (
              <View key={i} style={estilos.vaga}>
                <Icone nome="account-plus-outline" tamanho={20} cor={cor.suave} />
                <Text style={[tipografia.corpoPequeno, { color: cor.suave, flex: 1 }]}>Vaga para responsável disponível</Text>
              </View>
            ))}
          </View>
          <Text style={[tipografia.rotuloPequeno, { color: cor.suave, textAlign: 'right' }]}>
            {1 + responsaveis.length} de {1 + MAX_RESPONSAVEIS} perfis em uso
          </Text>
          {secretaria && vagas > 0 ? (
            <Botao
              texto="Vincular responsável"
              icone="account-plus"
              variante="suave"
              aoTocar={() => router.push({ pathname: '/aluno/vincular', params: { id: aluno.id } })}
              largo
            />
          ) : null}
        </Cartao>
      </Aparecer>
    </View>
  );
}

function Pessoa({ nome, detalhe, email, aoDesvincular }: { nome: string; detalhe: string; email: string; aoDesvincular?: () => void }) {
  return (
    <View style={estilos.pessoa}>
      <Avatar nome={nome} tamanho={40} tom="azul" />
      <View style={{ flex: 1 }}>
        <Text style={[tipografia.subtitulo, { color: cor.tinta }]} numberOfLines={1}>
          {nome}
        </Text>
        <Text style={[tipografia.corpoPequeno, { color: cor.suave }]} numberOfLines={1}>
          {detalhe}
        </Text>
        <Text style={[tipografia.corpoPequeno, { color: cor.suave }]} numberOfLines={1}>
          {email}
        </Text>
      </View>
      {aoDesvincular ? (
        <Pressable
          onPress={aoDesvincular}
          accessibilityRole="button"
          accessibilityLabel={`Desvincular ${nome}`}
          hitSlop={8}
          style={({ pressed }) => [estilos.desvincular, pressed && { backgroundColor: cor.vermelhoClaro }]}
        >
          <Icone nome="link-variant-off" tamanho={20} cor={cor.vermelho} />
        </Pressable>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  linhaHorario: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: espaco[4], minHeight: 52 },
  colunaDia: { flex: 1.4 },
  colunaHora: { flex: 1, textAlign: 'right' },
  pessoa: { flexDirection: 'row', alignItems: 'center', gap: espaco[3], paddingVertical: espaco[2] },
  camera: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: cor.primaria,
    borderWidth: 2,
    borderColor: cor.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  desvincular: { width: 44, height: 44, borderRadius: raio.pilula, alignItems: 'center', justifyContent: 'center' },
  vaga: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco[3],
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: cor.bordaForte,
    borderRadius: raio.campo,
    padding: espaco[3],
    minHeight: 52,
  },
});
