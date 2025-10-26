import SearchBar from "../components/SearchBar";
import Results from "../components/Results";

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold text-center pt-10 text-blue-700">CSEC ASTU RAG System</h1>
      <p className="text-center text-gray-600 mt-2">Ask anything about CSEC ASTU ✌️</p>

      <SearchBar />
      <Results />
    </div>
  );
};

export default Home;
