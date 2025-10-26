import { Brain, Sparkles } from "lucide-react";
import SearchBar from "../components/SearchBar";
import Results from "../components/Results";
import Navbar from "../components/";

const Home = () => {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-100 flex flex-col items-center justify-start">
      {/* ===== Navbar ===== */}
      <Navbar />

      {/* ===== Hero Section ===== */}
      <section className="text-center mt-12 px-4 max-w-2xl">
        <div className="flex justify-center items-center gap-3 mb-4">
          <Brain className="text-blue-600 w-10 h-10 animate-pulse" />
          <h1 className="text-4xl font-extrabold text-blue-700 tracking-tight">
            CSEC ASTU <span className="text-blue-500">RAG System</span>
          </h1>
        </div>

        <p className="text-gray-600 text-lg mb-8">
          <Sparkles className="inline-block w-5 h-5 text-yellow-500 mb-1" />  
          Ask anything about{" "}
          <span className="font-semibold text-blue-600">CSEC ASTU</span> and get
          intelligent, contextual answers ✌️
        </p>
      </section>

      {/* ===== Search Bar ===== */}
      <section className="w-full flex justify-center px-4 mb-8">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg border border-gray-100 p-1 hover:shadow-xl transition-shadow duration-300">
          <SearchBar />
        </div>
      </section>

      {/* ===== Results Section ===== */}
      <section className="w-full max-w-2xl px-4 mb-10">
        <Results />
      </section>

      {/* ===== Footer ===== */}
      <footer className="text-sm text-gray-500 pb-6">
        © {new Date().getFullYear()} CSEC ASTU | Built with 💙 by Dev Team
      </footer>
    </main>
  );
};

export default Home;
