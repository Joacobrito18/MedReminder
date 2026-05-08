export type User = {
  username: string;
  password: string;
  createdAt: string;
};

export type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; user: User };
