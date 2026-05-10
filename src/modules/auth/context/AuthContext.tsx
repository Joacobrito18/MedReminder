import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import {
  clearSession,
  createUser,
  getSession,
  saveSession,
  validateCredentials,
} from '@/modules/auth/storage/users-storage';
import { AuthState, User } from '@/modules/auth/types';

type AuthContextValue = {
  state: AuthState;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type Props = { children: ReactNode };

export const AuthProvider = ({ children }: Props) => {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    const restore = async () => {
      const user = await getSession();
      setState(user ? { status: 'signedIn', user } : { status: 'signedOut' });
    };
    restore();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const setSignedIn = (user: User) => setState({ status: 'signedIn', user });

    return {
      state,
      signIn: async (username, password) => {
        const user = await validateCredentials(username, password);
        if (!user) throw new Error('INVALID_CREDENTIALS');
        await saveSession(user.username);
        setSignedIn(user);
      },
      signUp: async (username, password) => {
        await createUser(username, password);
      },
      signOut: async () => {
        await clearSession();
        setState({ status: 'signedOut' });
      },
    };
  }, [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
