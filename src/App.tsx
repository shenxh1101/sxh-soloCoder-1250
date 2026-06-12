import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Home } from "./pages/Home";
import { Practice } from "./pages/Practice";
import { CustomCode } from "./pages/CustomCode";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { TournamentSetup } from "./pages/TournamentSetup";
import { TournamentPlay } from "./pages/TournamentPlay";
import { TournamentResult } from "./pages/TournamentResult";
import { RecordDetail } from "./pages/RecordDetail";
import { PlayerProfile } from "./pages/PlayerProfile";
import { Training } from "./pages/Training";
import { TrainingArchive } from "./pages/TrainingArchive";
import { useAppStore } from "./store/useAppStore";
import { useTournamentStore } from "./store/useTournamentStore";

function LoadActiveTournament() {
  const location = useLocation();
  const loadTournament = useTournamentStore((s) => s.loadTournament);
  const tournament = useTournamentStore((s) => s.tournament);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    if (id) {
      loadTournament(id);
      return;
    }
    if (!tournament && (location.pathname.startsWith("/tournament"))) {
      useTournamentStore.getState().loadActiveTournament();
    }
  }, [location.search, location.pathname, loadTournament, tournament]);

  return null;
}

export default function App() {
  const loadData = useAppStore((state) => state.loadData);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <Router>
      <LoadActiveTournament />
      <div className="min-h-screen bg-cyber-bg">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/practice/:id" element={<Practice />} />
          <Route path="/custom" element={<CustomCode />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/record/:id" element={<RecordDetail />} />
          <Route path="/player/:name?" element={<PlayerProfile />} />
          <Route path="/training/:name" element={<Training />} />
          <Route path="/training-archive/:name" element={<TrainingArchive />} />
          <Route path="/tournament" element={<TournamentSetup />} />
          <Route path="/tournament/play" element={<TournamentPlay />} />
          <Route path="/tournament/result" element={<TournamentResult />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
    </Router>
  );
}
