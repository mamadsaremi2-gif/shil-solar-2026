export const SHIL_STORE_VERSION = 1;
export const SHIL_STORE_NAME = 'shil-central-store-v1';

export function partializeShilState(state) {
  return {
    project: state.project,
    equipment: state.equipment,
    auth: state.auth,
  };
}
