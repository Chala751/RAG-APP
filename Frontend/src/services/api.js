import axios from "axios";

// Base API instance for general routes
const api = axios.create({
   baseURL:"https://rag-app-5c2q.onrender.com",
  //baseURL: "http://localhost:5000/api", // your backend base URL
});

// Base API URL for admin routes
const ADMIN_API_URL = "http://localhost:5000/api/admin";

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
    const response = await axios.post(`${ADMIN_API_URL}/login`, { email, password });
    return response.data;
  } catch (error) {
    console.error("Admin login API error:", error);
    throw error;
  }
};

// Upload text (requires token)
export const uploadText = async (text) => {
  const token = localStorage.getItem("adminToken");
  return await axios.post(
    "http://localhost:5000/api/upload-text",
    { text },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

// ===== Get All Uploaded Documents =====
export const getAllDocuments = async () => {
  const token = localStorage.getItem("adminToken");
  try {
    const response = await axios.get("http://localhost:5000/api", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Get documents API error:", error);
    throw error;
  }
};

// ===== Delete Document by ID =====
export const deleteDocument = async (id) => {
  const token = localStorage.getItem("adminToken");
  try {
    const response = await axios.delete(
      `http://localhost:5000/api/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error("Delete document API error:", error);
    throw error;
  }
};

