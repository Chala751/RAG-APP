import axios from "axios";

// Use environment variable for base URL
const BASE_URL = import.meta.env.VITE_API_URL;

// Create a single axios instance
const api = axios.create({
  baseURL: BASE_URL,
});

// ===== Search API =====
export const searchQuery = async (query) => {
  try {
    const response = await api.post("/search", { query });
    return response.data;
  } catch (error) {
    console.error("Search API error:", error);
    throw error;
  }
};

// ===== Admin Login API =====
export const adminLogin = async (email, password) => {
  try {
    const response = await api.post("/admin/login", { email, password });
    return response.data;
  } catch (error) {
    console.error("Admin login API error:", error);
    throw error;
  }
};

// ===== Upload text =====
export const uploadText = async (text) => {
  const token = localStorage.getItem("adminToken");
  try {
    const response = await api.post(
      "/upload-text",
      { text },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error("Upload text API error:", error);
    throw error;
  }
};

// ===== Get All Documents =====
export const getAllDocuments = async () => {
  const token = localStorage.getItem("adminToken");
  try {
    const response = await api.get("/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Get documents API error:", error);
    throw error;
  }
};

// ===== Delete Document =====
export const deleteDocument = async (id) => {
  const token = localStorage.getItem("adminToken");
  try {
    const response = await api.delete(`/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Delete document API error:", error);
    throw error;
  }
};
