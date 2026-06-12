import { Trophy, Medal, Clock, Zap, Target, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TypingRecord, CodeSnippet } from '../types';

interface LeaderboardProps {
  records: TypingRecord[];
  snippets: CodeSnippet[];
  selectedSnippetId: string | null;
  onSelectSnippet: (id: string | null) => void;
}

export function Leaderboard({ records, snippets, selectedSnippetId, onSelectSnippet }: LeaderboardProps) {
  const navigate = useNavigate();
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRankStyle = (rank: number): string => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-yellow-500/5 border-yellow-500/50';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-400/5 border-gray-400/50';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-amber-600/5 border-amber-600/50';
      default:
        return 'bg-cyber-card border-cyber-border';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 text-cyber-textMuted text-sm font-medium">{rank}</span>;
    }
  };

  const filteredRecords = selectedSnippetId
    ? records.filter((r) => r.snippetId === selectedSnippetId)
    : records;

  const sortedRecords = [...filteredRecords].sort((a, b) => {
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    if (b.cpm !== a.cpm) return b.cpm - a.cpm;
    return a.totalTime - b.totalTime;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSelectSnippet(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            selectedSnippetId === null
              ? 'bg-cyber-primary/20 text-cyber-primary border border-cyber-primary/50'
              : 'bg-cyber-card text-cyber-textMuted border border-cyber-border hover:border-cyber-primary/30'
          }`}
        >
          全部
        </button>
        {snippets.map((snippet) => (
          <button
            key={snippet.id}
            onClick={() => onSelectSnippet(snippet.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all truncate max-w-[200px] ${
              selectedSnippetId === snippet.id
                ? 'bg-cyber-primary/20 text-cyber-primary border border-cyber-primary/50'
                : 'bg-cyber-card text-cyber-textMuted border border-cyber-border hover:border-cyber-primary/30'
            }`}
          >
            {snippet.title}
          </button>
        ))}
      </div>

      {sortedRecords.length > 0 ? (
        <div className="space-y-2">
          {sortedRecords.map((record, index) => (
            <div
              key={record.id}
              onClick={() => navigate(`/record/${record.id}`)}
              className={`p-4 rounded-xl border ${getRankStyle(index + 1)} transition-all hover:scale-[1.01] hover:border-cyber-primary/50 cursor-pointer`}
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                  {getRankIcon(index + 1)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-cyber-text truncate">
                      {record.playerName}
                    </span>
                    <span className="text-xs text-cyber-textMuted">
                      {record.snippetTitle}
                    </span>
                  </div>
                  <div className="text-xs text-cyber-textMuted">
                    {formatDate(record.timestamp)}
                  </div>
                </div>

                <div className="flex items-center gap-6 flex-shrink-0">
                  <div className="flex items-center gap-1 text-cyber-primary">
                    <Zap size={14} />
                    <span className="font-semibold">{record.cpm}</span>
                    <span className="text-xs text-cyber-textMuted">CPM</span>
                  </div>

                  <div className="flex items-center gap-1 text-cyber-success">
                    <Target size={14} />
                    <span className="font-semibold">{record.accuracy.toFixed(1)}%</span>
                  </div>

                  <div className="flex items-center gap-1 text-cyber-secondary">
                    <Clock size={14} />
                    <span className="font-mono">{formatTime(record.totalTime)}</span>
                  </div>

                  <ChevronRight size={18} className="text-cyber-textMuted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-cyber-border mx-auto mb-4" />
          <p className="text-cyber-textMuted">暂无成绩记录</p>
          <p className="text-sm text-cyber-textMuted/70">完成一次挑战后将显示在这里</p>
        </div>
      )}
    </div>
  );
}
