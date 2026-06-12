import { useState } from 'react';
import { Trophy } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Leaderboard } from '../components/Leaderboard';

export function LeaderboardPage() {
  const { records, snippets } = useAppStore();
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
