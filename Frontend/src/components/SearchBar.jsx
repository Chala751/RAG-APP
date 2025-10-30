import { useState } from "react";
import { searchQuery } from "../services/api";
import { useSearch } from "../context/SearchContext";
import { toast } from "react-hot-toast";
import { Search } from "lucide-react";

const SearchBar = () => {
  const [input, setInput] = useState("");
  const { setResults, setAnswer, setLoading, setQuery } = useSearch();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!input.trim()) return toast.error("Please enter a question!");

    try {
      setLoading(true);
      setQuery(input);

      const data = await searchQuery(input);

      setResults(data.results || []);
      setAnswer(data.answer || "No answer found.");

      // ✅ Clear input after successful search
      setInput("");
    } catch (err) {
      toast.error("Something went wrong!");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSearch}
      className="relative flex items-center w-full max-w-xl mx-auto"
    >
      {/* Search Icon Inside Input */}
      <Search className="absolute left-4 text-gray-400 w-5 h-5 pointer-events-none" />

      <input
        type="text"
        placeholder="Ask about CSEC ASTU..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full pl-12 pr-24 py-3 rounded-2xl border border-gray-200 shadow-sm
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none
                   text-gray-700 placeholder-gray-400 transition-all duration-200"
      />

      <button
        type="submit"
        className="absolute right-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl
                   hover:bg-blue-700 active:scale-95 transition-all duration-200 cursor-pointer"
      >
        Search
      </button>
    </form>
  );
};

export default SearchBar;
