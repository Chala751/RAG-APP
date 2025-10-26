import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="w-full bg-white shadow-md py-3 px-6 flex justify-between items-center">
      {/* Logo / Title */}
      <h1 className="text-2xl font-bold text-blue-700">CSEC ASTU RAG</h1>

      {/* Right Side - Admin Button */}
      <div>
        <Link
          to="/admin/login"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Admin Login
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
