/**
 * CONFIRMAR — pergunta "tem certeza?" antes de uma ação importante.
 * No navegador usa o confirm do próprio navegador.
 */
import { Alert, Platform } from 'react-native';

export function confirmar(titulo: string, mensagem: string, aoConfirmar: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${titulo}\n\n${mensagem}`)) aoConfirmar();
    return;
  }
  Alert.alert(titulo, mensagem, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Confirmar', style: 'destructive', onPress: aoConfirmar },
  ]);
}
