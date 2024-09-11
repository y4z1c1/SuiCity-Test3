import "./App.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Game from "./components/Game";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

const App: React.FC = () => {
  return (
    <Router>
      {/* Wrap the whole content in a div to apply the blur */}
      <div>
        <Header />
        <Routes>
          {/* Home Page */}
          <Route path="/" element={<></>} />
        </Routes>
        <Game></Game>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
