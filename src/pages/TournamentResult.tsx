import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, Home, RotateCcw, ChevronDown, ChevronUp, Zap, Target, Clock, AlertTriangle, TrendingDown, BarChart3, Award, Code } from 'lucide-react';
import { useTournamentStore } from '../store/useTournamentStore';
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
  const finishedPlayers = rankedPlayers.filter(p => p.record);

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

  const fastestPlayer = finishedPlayers.length > 0
    ? [...finishedPlayers].sort((a, b) => (b.record?.cpm ?? 0) - (a.record?.cpm ?? 0))[0]
    : null;

  const mostAccuratePlayer = finishedPlayers.length > 0
    ? [...finishedPlayers].sort((a, b) => (b.record?.accuracy ?? 0) - (a.record?.accuracy ?? 0))[0]
    : null;

  const maxCpm = Math.max(...finishedPlayers.map(p => p.record?.cpm ?? 0), 1);
  const maxAccuracy = 100;

  const allFunctionNames = [...new Set(
    finishedPlayers.flatMap(p =>
      (p.record?.functionStats ?? []).filter(f => f.totalChars > 0).map(f => f.name)
    )
  )];

  const functionLossMap = new Map<string, { name: string; player: string; loss: number }>();
  for (const p of finishedPlayers) {
    if (!p.record) continue;
    for (const fs of p.record.functionStats) {
      if (fs.totalChars === 0) continue;
      const loss = 100 - fs.accuracy;
      const existing = functionLossMap.get(fs.name);
      if (!existing || loss > existing.loss) {
        functionLossMap.set(fs.name, { name: fs.name, player: p.name, loss });
      }
    }
  }
  const functionLosses = Array.from(functionLossMap.values())
    .sort((a, b) => b.loss - a.loss)
    .slice(0, 5);

  const displayChar = (char: string) => {
    if (char === '\n') return '↵';
    if (char === '\t') return 'Tab';
    if (char === ' ') return '␣';
    return char;
  };

  return (
    <div className="page-enter pt-24 pb-12 min-h-screen">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50 mb-4">
            <Trophy className="w-10 h-10 text-yellow-400" />
          </div>
          <h1 className="text-3xl font-bold text-cyber-text mb-2">比赛结束！</h1>
          <p className="text-cyber-textMuted">{tournament.snippetTitle}</p>
        </div>

        {finishedPlayers.length >= 2 && (
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {fastestPlayer && fastestPlayer.record && (
              <div className="card-neon p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyber-primary/10 border border-cyber-primary/30 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-cyber-primary" />
                </div>
                <div>
                  <p className="text-xs text-cyber-textMuted mb-0.5">速度冠军</p>
                  <p className="text-lg font-bold text-cyber-primary">{fastestPlayer.name}</p>
                  <p className="text-sm text-cyber-textMuted">{fastestPlayer.record.cpm} CPM</p>
                </div>
                <Award className="w-6 h-6 text-yellow-400 ml-auto" />
              </div>
            )}
            {mostAccuratePlayer && mostAccuratePlayer.record && (
              <div className="card-neon p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyber-success/10 border border-cyber-success/30 flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-cyber-success" />
                </div>
                <div>
                  <p className="text-xs text-cyber-textMuted mb-0.5">正确率冠军</p>
                  <p className="text-lg font-bold text-cyber-success">{mostAccuratePlayer.name}</p>
                  <p className="text-sm text-cyber-textMuted">{mostAccuratePlayer.record.accuracy.toFixed(1)}%</p>
                </div>
                <Award className="w-6 h-6 text-yellow-400 ml-auto" />
              </div>
            )}
          </div>
        )}

        {finishedPlayers.length >= 2 && (
          <div className="card-neon p-6 mb-8">
            <h2 className="text-xl font-bold text-cyber-text mb-6 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-cyber-secondary" />
              玩家对比
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm text-cyber-primary font-semibold mb-3 flex items-center gap-2">
                  <Zap size={14} />
                  CPM 对比
                </h3>
                <div className="space-y-2">
                  {finishedPlayers.map((p) => {
                    const cpm = p.record?.cpm ?? 0;
                    const pct = (cpm / maxCpm) * 100;
                    const isFastest = p === fastestPlayer;
                    return (
                      <div key={p.name} className="flex items-center gap-3">
                        <span className={`w-20 text-sm font-medium truncate ${isFastest ? 'text-cyber-primary' : 'text-cyber-text'}`}>
                          {p.name}
                          {isFastest && <span className="ml-1">👑</span>}
                        </span>
                        <div className="flex-1 h-7 bg-cyber-bg rounded-lg overflow-hidden relative">
                          <div
                            className={`h-full rounded-lg transition-all ${isFastest ? 'bg-gradient-to-r from-cyber-primary to-cyber-primary/60' : 'bg-cyber-primary/30'}`}
                            style={{ width: `${pct}%` }}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-mono text-cyber-text">
                            {cpm}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-sm text-cyber-success font-semibold mb-3 flex items-center gap-2">
                  <Target size={14} />
                  正确率对比
                </h3>
                <div className="space-y-2">
                  {finishedPlayers.map((p) => {
                    const acc = p.record?.accuracy ?? 0;
                    const pct = (acc / maxAccuracy) * 100;
                    const isBest = p === mostAccuratePlayer;
                    return (
                      <div key={p.name} className="flex items-center gap-3">
                        <span className={`w-20 text-sm font-medium truncate ${isBest ? 'text-cyber-success' : 'text-cyber-text'}`}>
                          {p.name}
                          {isBest && <span className="ml-1">👑</span>}
                        </span>
                        <div className="flex-1 h-7 bg-cyber-bg rounded-lg overflow-hidden relative">
                          <div
                            className={`h-full rounded-lg transition-all ${isBest ? 'bg-gradient-to-r from-cyber-success to-cyber-success/60' : 'bg-cyber-success/30'}`}
                            style={{ width: `${pct}%` }}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-mono text-cyber-text">
                            {acc.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {allFunctionNames.length > 0 && (
                <div>
                  <h3 className="text-sm text-cyber-warning font-semibold mb-3 flex items-center gap-2">
                    <Code size={14} />
                    函数正确率对比
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-cyber-border">
                          <th className="text-left py-2 px-3 text-cyber-textMuted font-medium">函数</th>
                          {finishedPlayers.map(p => (
                            <th key={p.name} className="text-center py-2 px-3 text-cyber-textMuted font-medium">
                              {p.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {allFunctionNames.map(funcName => (
                          <tr key={funcName} className="border-b border-cyber-border/30">
                            <td className="py-2 px-3 font-mono text-cyber-text">{funcName}()</td>
                            {finishedPlayers.map(p => {
                              const fs = p.record?.functionStats.find(f => f.name === funcName && f.totalChars > 0);
                              const acc = fs?.accuracy;
                              return (
                                <td key={p.name} className="text-center py-2 px-3">
                                  {acc !== undefined ? (
                                    <span className={`font-mono ${
                                      acc >= 95 ? 'text-cyber-success' : acc >= 80 ? 'text-cyber-warning' : 'text-cyber-error'
                                    }`}>
                                      {acc.toFixed(1)}%
                                    </span>
                                  ) : (
                                    <span className="text-cyber-textMuted/50">-</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {functionLosses.length > 0 && (
                <div>
                  <h3 className="text-sm text-cyber-error font-semibold mb-3 flex items-center gap-2">
                    <TrendingDown size={14} />
                    最大失分函数
                  </h3>
                  <div className="space-y-2">
                    {functionLosses.map((fl, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2 bg-cyber-bg rounded-lg">
                        <span className="w-5 text-cyber-textMuted text-sm">{i + 1}.</span>
                        <span className="font-mono text-sm text-cyber-text">{fl.name}()</span>
                        <span className="text-cyber-textMuted text-xs">-</span>
                        <span className="text-sm text-cyber-error font-medium">{fl.player}</span>
                        <span className="ml-auto text-xs text-cyber-error/80">失分 {fl.loss.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <h2 className="text-xl font-bold text-cyber-text mb-4 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-400" />
          总榜
        </h2>

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
                                {displayChar(err.expected)}
                              </span>
                              <span className="text-cyber-textMuted">→</span>
                              <span className="px-1.5 py-0.5 bg-cyber-error/20 rounded text-cyber-error font-mono">
                                {displayChar(err.typed)}
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
