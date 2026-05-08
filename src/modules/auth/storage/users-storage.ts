import AsyncStorage from '@react-native-async-storage/async-storage';

import { User } from '@/modules/auth/types';

const USERS_KEY = '@medreminder:users';
const SESSION_KEY = '@medreminder:session';

type Session = { username: string };

export const getUsers = async (): Promise<User[]> => {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as User[]) : [];
  } catch {
    return [];
  }
};

export const findUser = async (username: string): Promise<User | null> => {
  const users = await getUsers();
  return users.find((u) => u.username === username) ?? null;
};

export const createUser = async (username: string, password: string): Promise<User> => {
  const users = await getUsers();
  if (users.some((u) => u.username === username)) {
    throw new Error('USERNAME_TAKEN');
  }
  const user: User = {
    username,
    password,
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
  return user;
};

export const validateCredentials = async (
  username: string,
  password: string,
): Promise<User | null> => {
  const user = await findUser(username);
  if (!user || user.password !== password) return null;
  return user;
};

export const getSession = async (): Promise<User | null> => {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as Session;
    return findUser(session.username);
  } catch {
    return null;
  }
};

export const saveSession = async (username: string): Promise<void> => {
  const session: Session = { username };
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const clearSession = async (): Promise<void> => {
  await AsyncStorage.removeItem(SESSION_KEY);
};
