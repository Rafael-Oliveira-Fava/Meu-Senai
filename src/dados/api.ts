/**
 * API — conversa do app com o servidor (servidor/index.ts), que grava no MySQL.
 *
 * Endereço do servidor:
 *   1. EXPO_PUBLIC_API_URL, se existir (ex.: no arquivo .env da raiz);
 *   2. senão, o mesmo computador que roda o `npx expo start`, na porta 3333
 *      (assim o celular com Expo Go acha o servidor sozinho, na mesma rede Wi-Fi).
 */
import Constants from 'expo-constants';

import type { Mudancas } from './esquema';
import type { BancoDados } from './tipos';

const computadorDev = Constants.expoConfig?.hostUri?.split(':')[0];
export const URL_API = process.env.EXPO_PUBLIC_API_URL ?? `http://${computadorDev ?? 'localhost'}:3333`;

/** Erro devolvido pelo servidor. `conflito`: outra pessoa alterou o mesmo registro antes. */
export type ErroServidor = Error & { conflito?: boolean };

function erroServidor(mensagem: string, conflito: boolean): ErroServidor {
  return Object.assign(new Error(mensagem), { conflito });
}

async function chamar<T>(caminho: string, corpo?: unknown): Promise<T> {
  const resposta = await fetch(`${URL_API}${caminho}`, {
    method: corpo === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const json = await resposta.json().catch(() => ({}));
  // 401 do login é uma resposta normal ("senha errada"), não uma falha.
  if (!resposta.ok && resposta.status !== 401)
    throw erroServidor(json.erro ?? `Erro ${resposta.status} no servidor`, resposta.status === 409);
  return json as T;
}

export const api = {
  buscarDados: () => chamar<BancoDados>('/dados'),
  entrar: (email: string, senha: string) =>
    chamar<{ ok: true; usuarioId: string } | { ok: false; erro: string }>('/entrar', { email, senha }),
  sincronizar: (mudancas: Mudancas) => chamar<{ ok: true }>('/sincronizar', mudancas),
  trocarSenha: (usuarioId: string, senhaAtual: string, novaSenha: string) =>
    chamar<{ ok: true }>('/trocar-senha', { usuarioId, senhaAtual, novaSenha }),

  /** Envia a foto ou o PDF do atestado e devolve o endereço dele no servidor (ex.: /arquivos/abc). */
  async enviarArquivo(arquivo: { uri: string; nome: string; tipo: string }): Promise<string> {
    // Lê o arquivo escolhido (no celular ou no navegador) e manda os bytes como estão.
    const conteudo = await (await fetch(arquivo.uri)).blob();
    const resposta = await fetch(`${URL_API}/arquivos?nome=${encodeURIComponent(arquivo.nome)}`, {
      method: 'POST',
      headers: { 'Content-Type': arquivo.tipo },
      body: conteudo,
    });
    const json = await resposta.json().catch(() => ({}));
    if (!resposta.ok) throw erroServidor(json.erro ?? 'Não foi possível enviar o arquivo.', false);
    return json.uri as string;
  },
};

/** Endereço completo para abrir um arquivo guardado no servidor. */
export const enderecoArquivo = (uri: string) => (uri.startsWith('/arquivos/') ? `${URL_API}${uri}` : uri);
