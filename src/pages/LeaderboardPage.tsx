import { useState } from 'react';
import { Trophy, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { Leaderboard } from '../components/Leaderboard';

export function LeaderboardPage() {
  const { records, snippets, players } = useAppStore();
  const [selectedSnippetId, setSelectedSnippetId] = useState<string | null>(null);

  return (
    <div className="page-enter pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 mb-4">
            <Trophy className="w-8 h-8 text-yellow-400" />
          </div>
          <h1 className="text-3xl font-bold text-cyber-text mb-2">排行榜</h1>
          <p className="text-cyber-textMuted">看看谁是最快的代码打字员</p>
        </div>

        {players.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <User size={16} className="text-cyber-secondary" />
              <span className="text-sm text-cyber-textMuted">玩家面板</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {players.map((p) => (
                <Link
                  key={p.name}
                  to={`/player/${encodeURIComponent(p.name)}`}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium border border-cyber-border text-cyber-textMuted hover:border-cyber-primary/50 hover:text-cyber-primary bg-cyber-card transition-all"
                >
                  {p.name}
                  <span className="ml-1.5 text-xs text-cyber-textMuted/70">{p.totalGames}局</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <Leaderboard
          records={records}
          snippets={snippets}
          selectedSnippetId={selectedSnippetId}
          onSelectSnippet={setSelectedSnippetId}
        />
      </div>
    </div>
  );
}
