import { useSearch } from "../context/SearchContext";

const Results = () => {
  const { results, answer, loading, query } = useSearch();

  if (loading)
    return <p className="text-center mt-8 text-gray-600">Searching...</p>;

  return (
    <div className="max-w-3xl mx-auto mt-10 px-4">
      {/* === Display Question === */}
      {query && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Question:</h2>
          <p className="text-gray-700 bg-gray-50 border border-gray-200 p-3 rounded-lg">
            {query}
          </p>
        </div>
      )}

      {/* === Display AI Answer === */}
      {answer && (
        <div className="bg-blue-50 p-4 rounded-lg shadow">
          <h2 className="font-semibold text-blue-700 mb-2">Answer:</h2>
          <p className="text-gray-800">{answer}</p>
        </div>
      )}

      {/* === Related Documents === */}
      {results.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2 text-gray-800">
            Related Documents:
          </h3>
          <ul className="space-y-2">
            {results.map((r) => (
              <li
                key={r._id}
                className="border border-gray-200 p-3 rounded-lg bg-white shadow-sm hover:shadow transition-all duration-150"
              >
                <p className="text-gray-700">{r.text}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Similarity: {(r.similarity ?? r.score)?.toFixed(3)}
                </p>
                {r.scoreType && (
                  <p className="text-xs text-gray-400">Type: {r.scoreType}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Results;
