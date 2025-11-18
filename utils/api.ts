import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "https://your-backend-api.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(["authToken", "user"]);
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: async (email: string, password: string, publicKey: string) => {
    const { data } = await api.post("/auth/signup", { email, password, publicKey });
    return data;
  },
  login: async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    return data;
  },
  verifyEmail: async (code: string) => {
    const { data } = await api.post("/auth/verify-email", { code });
    return data;
  },
  resendVerification: async () => {
    const { data } = await api.post("/auth/resend-verification");
    return data;
  },
  logout: async () => {
    await api.post("/auth/logout");
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    const { data } = await api.post("/auth/change-password", { currentPassword, newPassword });
    return data;
  },
  deleteAccount: async () => {
    await api.delete("/auth/delete-account");
  },
};

export const remindersAPI = {
  getAll: async (status: "active" | "archived" = "active") => {
    const { data } = await api.get(`/reminders?status=${status}`);
    return data;
  },
  create: async (reminder: any) => {
    const { data } = await api.post("/reminders", reminder);
    return data;
  },
  update: async (id: string, updates: any) => {
    const { data } = await api.patch(`/reminders/${id}`, updates);
    return data;
  },
  delete: async (id: string) => {
    await api.delete(`/reminders/${id}`);
  },
  archive: async (id: string) => {
    const { data } = await api.post(`/reminders/${id}/archive`);
    return data;
  },
  batchArchive: async (ids: string[]) => {
    const { data } = await api.post("/reminders/batch-archive", { ids });
    return data;
  },
  batchDelete: async (ids: string[]) => {
    await api.post("/reminders/batch-delete", { ids });
  },
};

export const settingsAPI = {
  get: async () => {
    const { data } = await api.get("/settings");
    return data;
  },
  update: async (settings: any) => {
    const { data } = await api.patch("/settings", settings);
    return data;
  },
};

export const exportAPI = {
  getData: async () => {
    const { data } = await api.get("/export");
    return data;
  },
};

export default api;
