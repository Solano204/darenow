/**
 * FlashList en Jest (R5). El `jestSetup` de @shopify/flash-list 2.0.2 cambia `FlashList` por un
 * `RecyclerView` que ese paquete ya no exporta (queda `undefined`); aqui solo se simulan las
 * medidas nativas: una ventana de 400 × 900 y filas de 100 de alto. La lista real se monta y
 * virtualiza con esas medidas.
 */
import { jest } from '@jest/globals';

jest.mock('@shopify/flash-list/dist/recyclerview/utils/measureLayout', () => {
  const original = jest.requireActual<object>('@shopify/flash-list/dist/recyclerview/utils/measureLayout');
  return {
    ...original,
    measureParentSize: () => ({ x: 0, y: 0, width: 400, height: 900 }),
    measureFirstChildLayout: () => ({ x: 0, y: 0, width: 400, height: 900 }),
    measureItemLayout: () => ({ x: 0, y: 0, width: 400, height: 100 }),
  };
});
