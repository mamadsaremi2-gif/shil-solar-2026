import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { createProjectSlice } from './slices/createProjectSlice.js';
import { createEquipmentSlice } from './slices/createEquipmentSlice.js';
import { createUiSlice } from './slices/createUiSlice.js';
import { createAuthSlice } from './slices/createAuthSlice.js';
import { SHIL_STORE_NAME, SHIL_STORE_VERSION, partializeShilState } from './persistence/storePersistence.js';

const memoryStorage = (() => {
  let value = null;
  return {
    getItem: () => value,
    setItem: (_key, nextValue) => { value = nextValue; },
    removeItem: () => { value = null; },
  };
})();

const safeStorage = () => {
  if (typeof window === 'undefined' || !window.localStorage) return memoryStorage;
  return window.localStorage;
};

export const useShilStore = create(
  devtools(
    persist(
      (...args) => ({
        ...createProjectSlice(...args),
        ...createEquipmentSlice(...args),
        ...createUiSlice(...args),
        ...createAuthSlice(...args),
        resetAll: () => {
          const [, get] = args;
          get().resetProject();
          get().resetEquipment();
          get().resetUi();
          get().logout();
        },
      }),
      {
        name: SHIL_STORE_NAME,
        version: SHIL_STORE_VERSION,
        storage: createJSONStorage(safeStorage),
        partialize: partializeShilState,
      }
    ),
    { name: 'SHIL Central Store' }
  )
);

export default useShilStore;
