export const createInitialUiState = () => ({
  isMobileMenuOpen: false,
  activeModal: null,
  toastQueue: [],
  loading: {},
  lastError: null,
});

export const createUiSlice = (set) => ({
  ui: createInitialUiState(),

  setMobileMenuOpen: (isMobileMenuOpen) =>
    set((state) => ({ ui: { ...state.ui, isMobileMenuOpen } }), false, 'ui/setMobileMenuOpen'),

  setActiveModal: (activeModal) =>
    set((state) => ({ ui: { ...state.ui, activeModal } }), false, 'ui/setActiveModal'),

  setLoading: (key, value) =>
    set((state) => ({ ui: { ...state.ui, loading: { ...state.ui.loading, [key]: value } } }), false, 'ui/setLoading'),

  pushToast: (toast) =>
    set((state) => ({ ui: { ...state.ui, toastQueue: [...state.ui.toastQueue, { id: Date.now(), ...toast }] } }), false, 'ui/pushToast'),

  clearToasts: () => set((state) => ({ ui: { ...state.ui, toastQueue: [] } }), false, 'ui/clearToasts'),

  setLastError: (lastError) =>
    set((state) => ({ ui: { ...state.ui, lastError } }), false, 'ui/setLastError'),

  resetUi: () => set({ ui: createInitialUiState() }, false, 'ui/reset'),
});
