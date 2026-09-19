import { create } from "zustand";

type UiState = {
  formOpen: boolean;
  openForm: () => void;
  closeForm: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  formOpen: false,
  openForm: () => set({ formOpen: true }),
  closeForm: () => set({ formOpen: false }),
}))