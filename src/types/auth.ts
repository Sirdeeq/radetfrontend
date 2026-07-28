export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "ME"
  | "DEC"
  | "CM"
  | "PN"
  | "VLC"
  | "SUPERVISOR"
  | "USER";

export interface AuthUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organization?: { _id: string; name: string; code: string } | null;
  facility?: { _id: string; name: string; code: string } | null;
  caseManager?: string | null;
  phone?: string | null;
  avatar?: string | null;
  isActive: boolean;
  isFirstLogin: boolean;
  forcePasswordChange: boolean;
  lastLogin?: string | null;
  lastActive?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  isFirstLogin: boolean;
  forcePasswordChange: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: string[];
}
