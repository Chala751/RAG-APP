import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api", // your backend base URL
});

export const searchQuery = async (query) => {
  try {
    const response = await api.post("/search", { query });
    return response.data;
  } catch (error) {
    console.error("Search API error:", error);
    throw error;
  }
};
