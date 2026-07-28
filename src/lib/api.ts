const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

const getStoredAccessToken = (): string | null => {
  return accessToken;
};

const setAccessToken = (token: string | null) => {
  accessToken = token;
};

const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getStoredAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && token) {
    const newToken = await handleTokenRefresh();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: "include",
      });
      if (!retryResponse.ok) {
        const errorBody = await retryResponse.json().catch(() => ({}));
        throw new ApiError(errorBody.message || "Request failed", retryResponse.status);
      }
      return retryResponse.json();
    }
    throw new ApiError("Session expired. Please log in again.", 401);
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new ApiError(errorBody.message || "Request failed", response.status);
  }

  return response.json();
};

const handleTokenRefresh = async (): Promise<string | null> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        setAccessToken(null);
        return null;
      }

      const data = await response.json();
      const newToken = data.data.accessToken;
      setAccessToken(newToken);
      return newToken;
    } catch {
      setAccessToken(null);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await apiRequest<{
      success: boolean;
      data: {
        user: any;
        accessToken: string;
        isFirstLogin: boolean;
        forcePasswordChange: boolean;
      };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setAccessToken(response.data.accessToken);
    return response.data;
  },

  logout: async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } finally {
      setAccessToken(null);
    }
  },

  getMe: async () => {
    const response = await apiRequest<{ success: boolean; data: { user: any } }>("/auth/me");
    return response.data.user;
  },

  refreshToken: handleTokenRefresh,

  changePassword: async (currentPassword: string, newPassword: string) => {
    return apiRequest("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  signup: async (data: any) => {
    return apiRequest<{ success: boolean; data: { user: any; accountStatus: string; requiresApproval: boolean } }>(
      "/auth/signup",
      { method: "POST", body: JSON.stringify(data) }
    );
  },

  forgotPassword: async (email: string) => {
    return apiRequest("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (token: string, password: string) => {
    return apiRequest("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
  },
};

export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint),
  post: <T>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: "DELETE" }),
};

export const getAccessToken = (): string | null => accessToken;

export const initAuth = async (setUser: (user: any) => void, setLoading: (v: boolean) => void) => {
  try {
    // Try to silently refresh the access token from the httpOnly refresh token cookie
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.data?.accessToken) {
        setAccessToken(data.data.accessToken);
        const user = await authApi.getMe();
        setUser(user);
        return;
      }
    }

    // Refresh failed — user is not logged in
    setAccessToken(null);
    setUser(null);
  } catch {
    setAccessToken(null);
    setUser(null);
  } finally {
    setLoading(false);
  }
};

export const setInitialAccessToken = (token: string | null) => {
  setAccessToken(token);
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}
