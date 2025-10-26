import { Link } from "react-router-dom";
import { User } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="w-full bg-white shadow-md py-3 px-6 flex justify-between items-center">
      {/* ===== Logo / Title ===== */}
      <h1 className="text-2xl font-bold text-blue-700">CSEC ASTU RAG</h1>

      {/* ===== Right Side - Admin Login Button ===== */}
      <div>
        <Link
          to="/admin/login"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <User className="w-5 h-5" /> {/* 👤 Icon */}
          <span>Admin</span>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
