import { create } from 'zustand';

interface User {
  id: number;
  username: string;
  email: string;
  bio: string;
  avatar_url: string;
  location: string;
  website: string;
  company: string;
  followers_count: number;
  following_count: number;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  setTokens: (access: string, refresh: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },
  setTokens: (access, refresh) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  },
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },
  loadFromStorage: () => {
    const raw = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    if (raw && token) {
      set({ user: JSON.parse(raw), isAuthenticated: true });
    }
  },
}));
