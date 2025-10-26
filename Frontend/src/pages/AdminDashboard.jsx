import { useState } from "react";
import { useAdmin } from "../context/AdminContext";
import { uploadText } from "../services/api";
import { toast } from "react-hot-toast";

const AdminDashboard = () => {
  const [text, setText] = useState("");
  const { admin, logout } = useAdmin();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return toast.error("Please enter some text!");

    try {
      await uploadText(text);
      toast.success("Text uploaded successfully!");
      setText("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload text");
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-700">
          Admin Dashboard
        </h1>
        <button
          onClick={logout}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-md max-w-lg mx-auto"
      >
        <h2 className="text-xl font-semibold mb-4">Upload Text</h2>
        <textarea
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text here..."
          className="w-full border rounded p-3 mb-4 focus:outline-blue-500"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Upload
        </button>
      </form>
    </div>
  );
};

export default AdminDashboard;
