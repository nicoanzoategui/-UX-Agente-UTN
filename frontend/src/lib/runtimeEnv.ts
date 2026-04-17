/** En Docker/PaaS las variables Vite se inyectan vía `public/runtime-config.js` (window.__ENV). */

export type RuntimeEnv = {
    VITE_API_URL?: string;
    VITE_GOOGLE_CLIENT_ID?: string;
    VITE_AUTH_DISABLED?: string;
};

declare global {
    interface Window {
        __ENV?: RuntimeEnv;
    }
}

export function getApiBaseUrl(): string {
    const w = typeof window !== 'undefined' ? window.__ENV?.VITE_API_URL : undefined;
    const v = import.meta.env.VITE_API_URL;
    return String(w || v || 'http://localhost:3001').replace(/\/$/, '');
}

export function getGoogleClientId(): string {
    const w = typeof window !== 'undefined' ? window.__ENV?.VITE_GOOGLE_CLIENT_ID : undefined;
    return String(w || import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
}

export function isAuthDisabledRuntime(): boolean {
    const w = typeof window !== 'undefined' ? window.__ENV?.VITE_AUTH_DISABLED : undefined;
    const raw = w ?? import.meta.env.VITE_AUTH_DISABLED;
    return raw === '1' || raw === 'true';
}
