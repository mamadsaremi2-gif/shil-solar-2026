import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  loading: false,
  authenticated: false,

  setUser: (user) =>
    set({
      user,
      authenticated: !!user,
    }),

  setLoading: (loading) =>
    set({
      loading,
    }),

  logout: () =>
    set({
      user: null,
      authenticated: false,
    }),
}));
