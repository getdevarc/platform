import { create } from "zustand";

interface LoaderState {
    isLoading: boolean;
    message: string;
    show: (msg?: string) => void;
    hide: () => void;
}

export const useLoaderStore = create<LoaderState>((set) => ({
    isLoading: false,
    message: "",
    show: (msg = "Loading...") => set({ isLoading: true, message: msg }),
    hide: () => set({ isLoading: false, message: "" }),
}));
