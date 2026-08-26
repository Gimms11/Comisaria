import { create } from 'zustand';
import { Officer } from '../types';
import { api } from '../services/api';

interface AuthState {
  officer: Officer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  officer: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: true,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const tokens = await api.login(credentials);
      localStorage.setItem('access_token', tokens.access_token);
      localStorage.setItem('refresh_token', tokens.refresh_token);

      const officer = await api.getMe();
      set({ officer, isAuthenticated: true, isLoading: false, error: null });
    } catch (err: any) {
      set({ error: err.message || 'Credenciales inválidas', isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ officer: null, isAuthenticated: false, isLoading: false, error: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ officer: null, isAuthenticated: false, isLoading: false });
      return;
    }
    try {
      const officer = await api.getMe();
      set({ officer, isAuthenticated: true, isLoading: false });
    } catch (e) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      set({ officer: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
