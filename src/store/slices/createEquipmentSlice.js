export const createInitialEquipmentState = () => ({
  selected: {
    panelId: null,
    batteryId: null,
    inverterId: null,
    protectionIds: [],
    cableIds: [],
  },
  filters: {
    panels: '',
    batteries: '',
    inverters: '',
    protections: '',
    cables: '',
  },
  suggestions: {},
});

export const createEquipmentSlice = (set) => ({
  equipment: createInitialEquipmentState(),

  selectEquipment: (key, value) =>
    set((state) => ({
      equipment: {
        ...state.equipment,
        selected: {
          ...state.equipment.selected,
          [key]: value,
        },
      },
    }), false, 'equipment/select'),

  setEquipmentFilter: (type, query) =>
    set((state) => ({
      equipment: {
        ...state.equipment,
        filters: {
          ...state.equipment.filters,
          [type]: query,
        },
      },
    }), false, 'equipment/setFilter'),

  setEquipmentSuggestion: (type, suggestion) =>
    set((state) => ({
      equipment: {
        ...state.equipment,
        suggestions: {
          ...state.equipment.suggestions,
          [type]: suggestion,
        },
      },
    }), false, 'equipment/setSuggestion'),

  resetEquipment: () => set({ equipment: createInitialEquipmentState() }, false, 'equipment/reset'),
});
