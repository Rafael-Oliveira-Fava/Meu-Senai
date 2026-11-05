/**
 * TOQUE ÚNICO — evita que dois toques rápidos no "Enviar" criem o mesmo pedido duas vezes.
 *
 * Uso: const { liberado, travar } = useToqueUnico();
 *      const enviar = () => {
 *        if (!liberado()) return;
 *        ...valida e envia...
 *        travar(); // só depois de enviar com sucesso: um erro não bloqueia a próxima tentativa
 *      };
 */
import { useRef } from 'react';

export function useToqueUnico(intervaloMs = 1500) {
  const travadoAte = useRef(0);
  return {
    liberado: () => Date.now() >= travadoAte.current,
    travar: () => {
      travadoAte.current = Date.now() + intervaloMs;
    },
  };
}
