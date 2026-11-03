import { clearAuthStorage, getAuth, saveLoginReturnTarget } from "../utils/auth.js";
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",

  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config.authToken = token;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    if (error.response?.status === 401 && error.config?.authToken && error.config.authToken === localStorage.getItem("token")) {
      const from = { pathname: window.location.pathname, search: window.location.search, state: window.history.state?.usr };
      const owner = getAuth().user?.id;
      clearAuthStorage();
      saveLoginReturnTarget(from, owner);

      // Không reload liên tục nếu đang ở login
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
