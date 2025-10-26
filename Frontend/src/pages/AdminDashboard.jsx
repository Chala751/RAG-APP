import { useState, useEffect } from "react";
import { useAdmin } from "../context/AdminContext";
import { uploadText, getAllDocuments, deleteDocument } from "../services/api";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Loader2, Trash2, LogOut, FileText } from "lucide-react";

const AdminDashboard = () => {
  const [text, setText] = useState("");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { logout } = useAdmin();
  const navigate = useNavigate();

  // ===== Fetch documents on load =====
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await getAllDocuments();
      setDocuments(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  };

  // ===== Upload Text =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return toast.error("Please enter some text!");
    try {
      setUploading(true);
      await uploadText(text);
      toast.success("Text uploaded successfully!");
      setText("");
      fetchDocuments();
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload text");
    } finally {
      setUploading(false);
    }
  };

  // ===== Delete Document =====
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await deleteDocument(id);
      toast.success("Document deleted!");
      setDocuments((prev) => prev.filter((doc) => doc._id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete document");
    }
  };

  // ===== Logout =====
  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully!");
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 p-6">
      {/* Header */}
      <header className="flex justify-between items-center bg-white/30 backdrop-blur-md border border-white/40 p-4 rounded-xl shadow-md mb-8">
        <h1 className="text-3xl font-bold text-blue-800 tracking-tight">
          Admin Dashboard
        </h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all shadow-md cursor-pointer"
        >
          <LogOut size={18} />
          Logout
        </button>
      </header>

      {/* Upload Section */}
      <section className="max-w-2xl mx-auto bg-white/70 backdrop-blur-md border border-white/50 p-6 rounded-2xl shadow-lg mb-10">
        <h2 className="text-2xl font-semibold text-blue-800 mb-4 flex items-center gap-2">
          <FileText size={22} />
          Upload New Text
        </h2>
        <form onSubmit={handleSubmit}>
          <textarea
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text about CSEC ASTU here..."
            className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-blue-400 focus:outline-none resize-none"
          />
          <button
            type="submit"
            disabled={uploading}
            className={`w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-all font-medium shadow-md cursor-pointer ${
              uploading ? "opacity-80 cursor-not-allowed" : ""
            }`}
          >
            {uploading ? <Loader2 className="animate-spin" size={18} /> : "Upload"}
          </button>
        </form>
      </section>

      {/* Documents Section */}
      <section className="max-w-5xl mx-auto bg-white/70 backdrop-blur-md border border-white/50 p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-blue-900">Uploaded Documents</h2>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-blue-200/50 animate-pulse rounded-md"></div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <p className="text-gray-600 text-center py-6">No documents uploaded yet.</p>
        ) : (
          <ul className="space-y-4">
            {documents.map((doc) => (
              <li
                key={doc._id}
                className="flex justify-between items-center bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-4 transition-all shadow-sm"
              >
                <p className="text-gray-800 w-3/4 line-clamp-2">{doc.text}</p>
                <button
                  onClick={() => handleDelete(doc._id)}
                  className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-all shadow-md cursor-pointer"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;
