/**
 * ÍCONE — todos os ícones vêm da mesma biblioteca (Material Community Icons),
 * para manter o mesmo traço no app inteiro.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { cor } from '../tema';

export type NomeIcone = ComponentProps<typeof MaterialCommunityIcons>['name'];

export function Icone({ nome, tamanho = 22, cor: corIcone = cor.texto }: { nome: NomeIcone; tamanho?: number; cor?: string }) {
  return <MaterialCommunityIcons name={nome} size={tamanho} color={corIcone} />;
}
