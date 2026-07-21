import axios from "axios";
import { logger } from "./logger";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor for JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  logger.debug("api-client", `HTTP Request Outbound: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Interceptor to capture correlation IDs from response headers
api.interceptors.response.use(
  (response) => {
    const rxId = response.headers["x-request-id"];
    logger.info("api-client", `HTTP Response Success: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      requestId: rxId
    });
    return response;
  },
  (error) => {
    const rxId = error.response?.headers["x-request-id"];
    const status = error.response?.status;
    const details = error.response?.data?.error || error.message;

    logger.error("api-client", `HTTP Response Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status,
      requestId: rxId,
      error: details
    });
    return Promise.reject(error);
  }
);

// Unified response wrapper to match backend API Standardization
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
  message?: string;
  requestId?: string | null;
  timestamp?: string;
  code?: string;
  errors?: Array<{ field: string; message: string }>;
}
