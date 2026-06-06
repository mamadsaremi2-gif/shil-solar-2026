import { create } from "zustand";

export const useAIStore = create((set) => ({
  loading: false,
  result: null,
  error: null,

  setLoading: (loading) =>
    set({ loading }),

  setResult: (result) =>
    set({
      result,
      error: null,
      loading: false,
    }),

  setError: (error) =>
    set({
      error,
      loading: false,
    }),
}));
