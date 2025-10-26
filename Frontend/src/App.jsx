import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
//import About from "./pages/About";
import { SearchProvider } from "./context/SearchContext";
import { Toaster } from "react-hot-toast";

const App = () => {
  return (
    <SearchProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </BrowserRouter>
    </SearchProvider>
  );
};

export default App;

