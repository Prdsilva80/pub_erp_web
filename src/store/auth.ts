import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types";
import api from "@/lib/api";

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    setTokens: (access: string, refresh: string) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,

            login: async (email, password) => {
                const { data } = await api.post("/auth/login", { email, password });
                localStorage.setItem("access_token", data.access_token);
                localStorage.setItem("refresh_token", data.refresh_token);
                const me = await api.get("/auth/me", {
                    headers: { Authorization: `Bearer ${data.access_token}` },
                });
                set({
                    accessToken: data.access_token,
                    refreshToken: data.refresh_token,
                    user: me.data,
                    isAuthenticated: true,
                });
            },

            logout: () => {
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
            },

            setTokens: (access, refresh) => {
                localStorage.setItem("access_token", access);
                localStorage.setItem("refresh_token", refresh);
                set({ accessToken: access, refreshToken: refresh, isAuthenticated: true });
            },
        }),
        { name: "puberp-auth" }
    )
);