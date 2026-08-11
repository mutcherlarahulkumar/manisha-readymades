/**
 * Admin authentication context.
 *
 * The bearer token lives in `localStorage`, so the signed-in state is only
 * knowable in the browser. The provider therefore starts in a `loading` state
 * and confirms the token against `/api/auth/me` on mount — a token that was
 * revoked or has expired is discarded rather than trusted.
 *
 * @module hooks/useAuth
 */
import { useRouter } from 'next/router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { api, getToken, setToken } from '@/lib/http';
import type { Admin, AdminRole } from '@/types/models';

/** The signed-in admin, or `null` when signed out. */
type CurrentAdmin = Pick<Admin, '_id' | 'name' | 'email' | 'role'> | null;

/** Value exposed by {@link useAuth}. */
interface AuthContextValue {
  admin: CurrentAdmin;
  /** True until the stored token has been checked against the server. */
  isLoading: boolean;
  /** True when a verified admin is signed in. */
  isAuthenticated: boolean;
  /**
   * Signs in and stores the returned token.
   *
   * @param email - Admin email address.
   * @param password - Admin password.
   * @throws {HttpError} 401 on bad credentials, 403 when deactivated.
   */
  login: (email: string, password: string) => Promise<void>;
  /** Discards the token and returns to the login page. */
  logout: () => void;
  /**
   * Checks whether the signed-in admin holds one of the given roles.
   *
   * @param roles - Roles to test against.
   * @returns Whether the current admin qualifies.
   */
  hasRole: (roles: readonly AdminRole[]) => boolean;
}

/** Shape of the login endpoint's response. */
interface LoginResponse {
  token: string;
  expiresIn: number;
  admin: NonNullable<CurrentAdmin>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Provides admin authentication state to the admin dashboard.
 *
 * @param props.children - The tree that may read the auth context.
 * @returns The provider element.
 */
export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const router = useRouter();
  const [admin, setAdmin] = useState<CurrentAdmin>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession(): Promise<void> {
      if (!getToken()) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        const current = await api<NonNullable<CurrentAdmin>>('/api/auth/me');
        if (!cancelled) setAdmin(current);
      } catch {
        // Expired or tampered token — treat as signed out.
        setToken(null);
        if (!cancelled) setAdmin(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const result = await api<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
      anonymous: true,
    });
    setToken(result.token);
    setAdmin(result.admin);
  }, []);

  const logout = useCallback((): void => {
    setToken(null);
    setAdmin(null);
    void router.push('/admin/login');
  }, [router]);

  const hasRole = useCallback(
    (roles: readonly AdminRole[]): boolean => admin !== null && roles.includes(admin.role),
    [admin],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ admin, isLoading, isAuthenticated: admin !== null, login, logout, hasRole }),
    [admin, isLoading, login, logout, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Reads the admin authentication context.
 *
 * @returns The current auth state and actions.
 * @throws {Error} When called outside {@link AuthProvider}.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
