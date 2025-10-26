import { createContext, useContext, useState } from "react";

const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [answer, setAnswer] = useState("");
  const [query, setQuery] = useState("");

  return (
    <SearchContext.Provider
      value={{ query, setQuery, results, setResults, answer, setAnswer, loading, setLoading }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => useContext(SearchContext);
