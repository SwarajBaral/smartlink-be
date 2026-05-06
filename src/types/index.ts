export type Bindings = {
  NODE_ENV?: string;
  FRONTEND_URL?: string;
  PUBLIC_BASE_URL?: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_PRIVATE_KEY: string;
  FIREBASE_CLIENT_EMAIL: string;
};

export type Variables = {
  user: { uid: string; email?: string };
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
}
