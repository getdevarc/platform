import { create } from "zustand";
import { api, ApiResponse } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  target_domain?: string;
  resume_text?: string;
  career_answers?: Record<string, unknown>;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  onboardingComplete: boolean;

  login: (credentials: Record<string, unknown>) => Promise<void>;
  register: (data: Record<string, unknown>) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  isAuthenticated: false,
  loading: true,
  onboardingComplete: false,

  login: async (credentials: Record<string, unknown>) => {
    set({ loading: true });
    try {
      const res = await api.post<ApiResponse<{ token: string }>>("/auth/login", credentials);
      const { token } = res.data.data;

      localStorage.setItem("token", token);

      // After login, fetch user profile
      const userRes = await api.get<ApiResponse<User>>("/auth/me");
      const user = userRes.data.data;
      const onboardingComplete = !!(user.role && user.target_domain);

      set({
        token,
        user,
        isAuthenticated: true,
        loading: false,
        onboardingComplete
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  register: async (data: Record<string, unknown>) => {
    set({ loading: true });
    try {
      await api.post<ApiResponse<Record<string, unknown>>>("/auth/register", data);
      set({ loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null, isAuthenticated: false, loading: false, onboardingComplete: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      set({ loading: false, isAuthenticated: false });
      return;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      try {
        const res = await api.get<ApiResponse<User>>("/auth/me", {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const user = res.data.data;
        const onboardingComplete = !!(user.role && user.target_domain);
        set({ user, isAuthenticated: true, loading: false, onboardingComplete });
      } catch (err) {
        clearTimeout(timeout);
        const errObject = err as Record<string, unknown> | null;
        if (errObject?.name === "AbortError" || errObject?.code === "ERR_CANCELED") {
          // Backend timed out — treat as unauthenticated
          console.warn("[DevArc] /auth/me timed out after 5s, logging out.");
        }
        localStorage.removeItem("token");
        set({ user: null, token: null, isAuthenticated: false, loading: false, onboardingComplete: false });
      }
    } finally {
      // Safety net: ensure loading is always resolved
      set((state) => (state.loading ? { loading: false } : {}));
    }
  },

  updateUser: (user: User) => {
    const onboardingComplete = !!(user.role && user.target_domain);
    set({ user, onboardingComplete });
  },
}));
