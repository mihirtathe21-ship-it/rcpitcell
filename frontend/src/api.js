import axios from "axios";

const api = axios.create({
<<<<<<< HEAD
  baseURL: import.meta.env.VITE_API_URL || "/api",
=======
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
>>>>>>> 8b4b0c78174a7dcc72d1491f6ea5380f3a883eb6
  withCredentials: false,
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ✅ Important Fix for File Upload
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const isAuthRoute = url.includes("/auth/");

    // Auto logout only if unauthorized
    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem("token"); 
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;