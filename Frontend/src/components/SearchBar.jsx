import { useState } from "react";
import { searchQuery } from "../services/api";
import { useSearch } from "../context/SearchContext";
import { toast } from "react-hot-toast";

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
    } catch (err) {
      toast.error("Something went wrong!");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex gap-3 items-center justify-center mt-10">
      <input
        type="text"
        placeholder="Ask about CSEC ASTU..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-[70%] md:w-[50%] border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
      >
        Search
      </button>
    </form>
  );
};

export default SearchBar;
