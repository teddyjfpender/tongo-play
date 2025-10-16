import { create } from 'zustand';

export type ViewMode = 'confidential' | 'public';

type State = {
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
  toggle: () => void;
};

export const useViewModeStore = create<State>((set, get) => ({
  mode: 'confidential',
  setMode: (mode) => set({ mode }),
  toggle: () => set({ mode: get().mode === 'confidential' ? 'public' : 'confidential' }),
}));

