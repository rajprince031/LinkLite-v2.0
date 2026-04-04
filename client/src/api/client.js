import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_LOCALHOST_API ||
  "";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const attachToken = (token) =>
  token
    ? {
        headers: {
          Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
        },
      }
    : {};
