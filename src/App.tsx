import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Home } from "./pages/Home";
import { Practice } from "./pages/Practice";
import { CustomCode } from "./pages/CustomCode";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { useAppStore } from "./store/useAppStore";

export default function App() {
  const loadData = useAppStore((state) => state.loadData);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <Router>
      <div className="min-h-screen bg-cyber-bg">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/practice/:id" element={<Practice />} />
          <Route path="/custom" element={<CustomCode />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
    </Router>
  );
}
