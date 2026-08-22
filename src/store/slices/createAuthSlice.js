export const createInitialAuthState = () => ({
  user: null,
  role: 'guest',
  permissions: [],
  isAuthenticated: false,
});

export const createAuthSlice = (set) => ({
  auth: createInitialAuthState(),

  setAuthUser: (user, role = 'user', permissions = []) =>
    set({ auth: { user, role, permissions, isAuthenticated: Boolean(user) } }, false, 'auth/setUser'),

  logout: () => set({ auth: createInitialAuthState() }, false, 'auth/logout'),
});
