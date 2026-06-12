import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, Home, RotateCcw, ChevronDown, ChevronUp, Zap, Target, Clock, AlertTriangle, TrendingDown } from 'lucide-react';
import { useTournamentStore } from '../store/useTournamentStore';
import { ReportDetail } from '../components/ReportDetail';
import { TournamentPlayer } from '../types';

export function TournamentResult() {
  const navigate = useNavigate();
  const { tournament, resetTournament, getRankedPlayers } = useTournamentStore();
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <p className="text-cyber-textMuted mb-4">没有进行中的比赛</p>
          <button onClick={() => navigate('/tournament')} className="btn-cyber btn-cyber-primary">
            创建新比赛
          </button>
        </div>
      </div>
    );
  }

  const rankedPlayers = getRankedPlayers();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 via-yellow-500/10 to-transparent border-yellow-500/50';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 via-gray-400/10 to-transparent border-gray-400/50';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 via-amber-600/10 to-transparent border-amber-600/50';
      default:
        return 'bg-cyber-card border-cyber-border';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-8 h-8 text-yellow-400" />;
      case 2:
        return <Medal className="w-8 h-8 text-gray-400" />;
      case 3:
        return <Medal className="w-8 h-8 text-amber-600" />;
      default:
        return <span className="w-8 h-8 text-cyber-textMuted text-lg font-bold flex items-center justify-center">{rank}</span>;
    }
  };

  const toggleExpand = (playerName: string) => {
    setExpandedPlayer(expandedPlayer === playerName ? null : playerName);
  };

  const handleNewTournament = () => {
    resetTournament();
    navigate('/tournament');
  };

  return (
    <div className="page-enter pt-24 pb-12 min-h-screen">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50 mb-4">
            <Trophy className="w-10 h-10 text-yellow-400" />
          </div>
          <h1 className="text-3xl font-bold text-cyber-text mb-2">比赛结束！</h1>
          <p className="text-cyber-textMuted">{tournament.snippetTitle}</p>
        </div>

        <div className="space-y-3 mb-10">
          {rankedPlayers.map((player, index) => {
            const rank = index + 1;
            const isExpanded = expandedPlayer === player.name;
            
            return (
              <div key={player.name} className={`rounded-xl border overflow-hidden transition-all ${getRankStyle(rank)}`}>
                <div
                  className="p-4 flex items-center cursor-pointer"
                  onClick={() => toggleExpand(player.name)}
                >
                  <div className="flex-shrink-0 w-12 flex items-center justify-center">
                    {getRankIcon(rank)}
                  </div>

                  <div className="flex-1 ml-2">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-lg font-semibold text-cyber-text">{player.name}</span>
                      {rank === 1 && (
                        <span className="px-2 py-0.5 text-xs rounded bg-yellow-500/20 text-yellow-400 font-medium">
                          🏆 冠军
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-cyber-primary">
                        <Zap size={14} />
                        {player.record?.cpm} CPM
                      </span>
                      <span className="flex items-center gap-1 text-cyber-success">
                        <Target size={14} />
                        {player.record?.accuracy.toFixed(1)}%
                      </span>
                      <span className="flex items-center gap-1 text-cyber-secondary">
                        <Clock size={14} />
                        {player.record ? formatTime(player.record.totalTime) : '-'}
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-cyber-textMuted">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {isExpanded && player.record && (
                  <div className="border-t border-cyber-border/50 p-4 bg-cyber-bgAlt/50">
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-sm font-semibold text-cyber-text mb-3 flex items-center gap-2">
                          <AlertTriangle size={16} className="text-cyber-error" />
                          错误键位 Top 5
                        </h4>
                        <div className="space-y-1.5">
                          {player.record.errors.slice(0, 5).map((err, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <span className="w-5 text-cyber-textMuted">{i + 1}.</span>
                              <span className="px-1.5 py-0.5 bg-cyber-bg rounded text-cyber-text font-mono">
                                {err.expected === '\n' ? '↵' : err.expected === '\t' ? 'Tab' : err.expected === ' ' ? '␣' : err.expected}
                              </span>
                              <span className="text-cyber-textMuted">→</span>
                              <span className="px-1.5 py-0.5 bg-cyber-error/20 rounded text-cyber-error font-mono">
                                {err.typed === '\n' ? '↵' : err.typed === '\t' ? 'Tab' : err.typed === ' ' ? '␣' : err.typed}
                              </span>
                              <span className="ml-auto text-cyber-textMuted">×{err.count}</span>
                            </div>
                          ))}
                          {player.record.errors.length === 0 && (
                            <p className="text-cyber-textMuted text-sm">完美！没有错误</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-cyber-text mb-3 flex items-center gap-2">
                          <TrendingDown size={16} className="text-cyber-warning" />
                          薄弱函数
                        </h4>
                        <div className="space-y-2">
                          {player.record.functionStats
                            .filter(f => f.totalChars > 0)
                            .sort((a, b) => a.accuracy - b.accuracy)
                            .slice(0, 5)
                            .map((func, i) => (
                              <div key={i}>
                                <div className="flex items-center justify-between text-sm mb-1">
                                  <span className="font-mono text-cyber-text">{func.name}()</span>
                                  <span className={`${func.accuracy >= 90 ? 'text-cyber-success' : func.accuracy >= 70 ? 'text-cyber-warning' : 'text-cyber-error'}`}>
                                    {func.accuracy.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="h-1.5 bg-cyber-bg rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      func.accuracy >= 90 ? 'bg-cyber-success' : func.accuracy >= 70 ? 'bg-cyber-warning' : 'bg-cyber-error'
                                    }`}
                                    style={{ width: `${func.accuracy}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          {player.record.functionStats.filter(f => f.totalChars > 0).length === 0 && (
                            <p className="text-cyber-textMuted text-sm">未检测到函数</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3 text-center text-sm">
                      <div className="p-2 bg-cyber-bg rounded-lg">
                        <p className="text-cyber-textMuted text-xs mb-0.5">总字符</p>
                        <p className="font-semibold text-cyber-text">{player.record.totalChars}</p>
                      </div>
                      <div className="p-2 bg-cyber-bg rounded-lg">
                        <p className="text-cyber-textMuted text-xs mb-0.5">正确</p>
                        <p className="font-semibold text-cyber-success">{player.record.correctChars}</p>
                      </div>
                      <div className="p-2 bg-cyber-bg rounded-lg">
                        <p className="text-cyber-textMuted text-xs mb-0.5">错误</p>
                        <p className="font-semibold text-cyber-error">{player.record.errorCount}</p>
                      </div>
                      <div className="p-2 bg-cyber-bg rounded-lg">
                        <p className="text-cyber-textMuted text-xs mb-0.5">用时</p>
                        <p className="font-semibold text-cyber-secondary">{formatTime(player.record.totalTime)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => {
              resetTournament();
              navigate('/');
            }}
            className="btn-cyber px-8 flex items-center gap-2"
          >
            <Home size={18} />
            返回首页
          </button>
          <button
            onClick={handleNewTournament}
            className="btn-cyber btn-cyber-primary px-8 flex items-center gap-2"
          >
            <RotateCcw size={18} />
            新比赛
          </button>
        </div>
      </div>
    </div>
  );
}
