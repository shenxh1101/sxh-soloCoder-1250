import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  User,
  Zap,
  Target,
  Trophy,
  TrendingUp,
  AlertTriangle,
  Code,
  Play,
  ArrowLeft,
  Users,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  ListChecks,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { TypingRecord } from '../types';

const displayChar = (char: string) => {
  if (char === '\n') return '↵';
  if (char === '\t') return '⇥';
  if (char === ' ') return '␣';
  return char;
};

function TrendArrow({ current, previous }: { current: number; previous: number }) {
  if (current > previous) return <span className="text-cyber-success text-xs" title="变好">↑</span>;
  if (current < previous) return <span className="text-cyber-error text-xs" title="变差">↓</span>;
  return <span className="text-cyber-textMuted text-xs" title="持平">→</span>;
}

function MiniBarChart({
  items,
  colorClass,
  maxValue,
}: {
  items: { value: number; id: string }[];
  colorClass: string;
  maxValue: number;
}) {
  const safeMax = Math.max(maxValue, 1);
  return (
    <div className="flex items-end gap-1.5 h-24">
      {items.map((item) => (
        <Link
          key={item.id}
          to={`/record/${item.id}`}
          className="flex-1 flex flex-col items-center justify-end h-full group"
        >
          <div
            className={`w-full rounded-t ${colorClass} transition-all group-hover:opacity-80 min-h-[2px]`}
            style={{ height: `${(item.value / safeMax) * 100}%` }}
          />
        </Link>
      ))}
    </div>
  );
}

interface ErrorTrendItem {
  key: string;
  expected: string;
  typed: string;
  totalCount: number;
  perRecord: { recordId: string; count: number; date: string }[];
}

interface FunctionTrendItem {
  name: string;
  avgAccuracy: number;
  perRecord: { recordId: string; accuracy: number; date: string }[];
}

function buildErrorTrends(records: TypingRecord[]): ErrorTrendItem[] {
  const map = new Map<string, ErrorTrendItem>();

  records.forEach((r) => {
    const date = new Date(r.timestamp).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    r.errors.forEach((err) => {
      const key = `${err.expected}→${err.typed}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          key,
          expected: err.expected,
          typed: err.typed,
          totalCount: err.count,
          perRecord: [{ recordId: r.id, count: err.count, date }],
        });
      } else {
        existing.totalCount += err.count;
        existing.perRecord.push({ recordId: r.id, count: err.count, date });
      }
    });
  });

  return Array.from(map.values()).sort((a, b) => b.totalCount - a.totalCount);
}

function buildFunctionTrends(records: TypingRecord[]): FunctionTrendItem[] {
  const map = new Map<string, FunctionTrendItem>();

  records.forEach((r) => {
    const date = new Date(r.timestamp).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    r.functionStats.forEach((fs) => {
      if (fs.totalChars === 0) return;
      const existing = map.get(fs.name);
      if (!existing) {
        map.set(fs.name, {
          name: fs.name,
          avgAccuracy: fs.accuracy,
          perRecord: [{ recordId: r.id, accuracy: fs.accuracy, date }],
        });
      } else {
        const len = existing.perRecord.length;
        existing.avgAccuracy = (existing.avgAccuracy * len + fs.accuracy) / (len + 1);
        existing.perRecord.push({ recordId: r.id, accuracy: fs.accuracy, date });
      }
    });
  });

  return Array.from(map.values())
    .map((f) => ({ ...f, avgAccuracy: Math.round(f.avgAccuracy * 10) / 10 }))
    .sort((a, b) => a.avgAccuracy - b.avgAccuracy);
}

export function PlayerProfile() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { getRecordsForPlayer, players, currentPlayer, setCurrentPlayer } = useAppStore();
  const [expandedError, setExpandedError] = useState<string | null>(null);
  const [expandedFunc, setExpandedFunc] = useState<string | null>(null);

  const resolvedName = useMemo(() => {
    if (name) return decodeURIComponent(name);
    if (currentPlayer) return currentPlayer;
    if (players.length > 0) return players[0].name;
    return '';
  }, [name, currentPlayer, players]);

  const playerRecords = useMemo(
    () => (resolvedName ? getRecordsForPlayer(resolvedName, 'challenge') : []),
    [resolvedName, getRecordsForPlayer]
  );
  const allPlayerRecords = useMemo(
    () => (resolvedName ? getRecordsForPlayer(resolvedName) : []),
    [resolvedName, getRecordsForPlayer]
  );
  const trainingCount = allPlayerRecords.length - playerRecords.length;

  const playerInfo = useMemo(
    () => players.find((p) => p.name === resolvedName),
    [players, resolvedName]
  );

  const trend = useMemo(
    () =>
      playerRecords.slice(-10).map((r) => ({
        id: r.id,
        cpm: r.cpm,
        accuracy: r.accuracy,
        date: new Date(r.timestamp).toLocaleDateString('zh-CN', {
          month: 'short',
          day: 'numeric',
        }),
        snippetTitle: r.snippetTitle,
      })),
    [playerRecords]
  );

  const errorTrends = useMemo(() => buildErrorTrends(playerRecords), [playerRecords]);
  const functionTrends = useMemo(() => buildFunctionTrends(playerRecords), [playerRecords]);

  const topErrorTrends = errorTrends.slice(0, 10);
  const topFuncTrends = functionTrends.slice(0, 10);
  const maxCpm = useMemo(() => Math.max(...trend.map((t) => t.cpm), 100), [trend]);

  const handlePlayerSwitch = (playerName: string) => {
    setCurrentPlayer(playerName);
    navigate(`/player/${encodeURIComponent(playerName)}`);
  };

  if (!resolvedName) {
    return (
      <div className="page-enter min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <p className="text-cyber-textMuted mb-4">暂无玩家数据</p>
          <Link to="/" className="btn-cyber">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter pt-24 pb-12 min-h-screen">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/leaderboard"
            className="flex items-center gap-2 text-cyber-textMuted hover:text-cyber-primary transition-colors"
          >
            <ArrowLeft size={20} />
            排行榜
          </Link>
        </div>

        {players.length > 1 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Users size={18} className="text-cyber-secondary" />
              <span className="text-sm text-cyber-textMuted">切换玩家</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {players.map((p) => (
                <button
                  key={p.name}
                  onClick={() => handlePlayerSwitch(p.name)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    p.name === resolvedName
                      ? 'border-2 border-cyber-primary text-cyber-primary bg-cyber-primary/10 shadow-neon-cyan'
                      : 'border border-cyber-border text-cyber-textMuted hover:border-cyber-primary/50 hover:text-cyber-text bg-cyber-card'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyber-primary/20 to-cyber-secondary/20 border border-cyber-primary/30 flex items-center justify-center">
            <User className="w-7 h-7 text-cyber-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-cyber-text">{resolvedName}</h1>
            <p className="text-cyber-textMuted text-sm">玩家档案 · 仅显示正式挑战记录</p>
          </div>
          <Link
            to={`/training-archive/${encodeURIComponent(resolvedName)}`}
            className="flex items-center gap-2 text-sm text-cyber-secondary hover:text-cyber-secondary/80 border border-cyber-secondary/40 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Dumbbell size={14} />
            训练档案 ({trainingCount})
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card-neon p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={16} className="text-cyber-secondary" />
              <span className="text-xs text-cyber-textMuted">挑战场次</span>
            </div>
            <p className="text-2xl font-bold text-cyber-text font-mono">
              {playerInfo?.totalGames ?? playerRecords.length}
            </p>
          </div>
          <div className="card-neon p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-cyber-primary" />
              <span className="text-xs text-cyber-textMuted">最佳 CPM</span>
            </div>
            <p className="text-2xl font-bold text-cyber-primary font-mono">
              {playerInfo?.bestCpm ?? 0}
            </p>
          </div>
          <div className="card-neon p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target size={16} className="text-cyber-success" />
              <span className="text-xs text-cyber-textMuted">最佳正确率</span>
            </div>
            <p className="text-2xl font-bold text-cyber-success font-mono">
              {playerInfo?.bestAccuracy ?? 0}%
            </p>
          </div>
          <div className="card-neon p-4">
            <div className="flex items-center gap-2 mb-2">
              <ListChecks size={16} className="text-cyber-warning" />
              <span className="text-xs text-cyber-textMuted">训练场次</span>
            </div>
            <Link
              to={`/training-archive/${encodeURIComponent(resolvedName)}`}
              className="text-2xl font-bold text-cyber-warning font-mono hover:underline"
            >
              {trainingCount}
            </Link>
          </div>
        </div>

        {trend.length > 0 && (
          <div className="card-neon p-6 mb-8">
            <h2 className="text-xl font-bold text-cyber-text mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-cyber-secondary" />
              趋势（最近 {trend.length} 次正式挑战）
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm text-cyber-primary font-semibold mb-3 flex items-center gap-2">
                  <Zap size={14} />
                  CPM 趋势
                </h3>
                <MiniBarChart
                  items={trend.map((t) => ({ value: t.cpm, id: t.id }))}
                  colorClass="bg-cyber-primary"
                  maxValue={maxCpm}
                />
                <div className="flex gap-1.5 mt-1">
                  {trend.map((point, i) => (
                    <div key={point.id} className="flex-1 text-center">
                      {i > 0 ? (
                        <TrendArrow current={point.cpm} previous={trend[i - 1].cpm} />
                      ) : (
                        <span className="text-cyber-textMuted text-xs">·</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-1.5 mt-2">
                  {trend.map((point) => (
                    <Link
                      key={point.id}
                      to={`/record/${point.id}`}
                      className="flex-1 text-center text-[10px] text-cyber-textMuted hover:text-cyber-primary transition-colors truncate"
                      title={point.snippetTitle}
                    >
                      {point.date}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm text-cyber-success font-semibold mb-3 flex items-center gap-2">
                  <Target size={14} />
                  正确率趋势
                </h3>
                <MiniBarChart
                  items={trend.map((t) => ({ value: t.accuracy, id: t.id }))}
                  colorClass="bg-cyber-success"
                  maxValue={100}
                />
                <div className="flex gap-1.5 mt-1">
                  {trend.map((point, i) => (
                    <div key={point.id} className="flex-1 text-center">
                      {i > 0 ? (
                        <TrendArrow current={point.accuracy} previous={trend[i - 1].accuracy} />
                      ) : (
                        <span className="text-cyber-textMuted text-xs">·</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-1.5 mt-2">
                  {trend.map((point) => (
                    <Link
                      key={point.id}
                      to={`/record/${point.id}`}
                      className="flex-1 text-center text-[10px] text-cyber-textMuted hover:text-cyber-primary transition-colors truncate"
                      title={point.snippetTitle}
                    >
                      {point.date}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-cyber-border pt-4">
              <h3 className="text-sm text-cyber-textMuted mb-3">详细记录</h3>
              <div className="space-y-1">
                {trend
                  .slice()
                  .reverse()
                  .map((point, i) => (
                    <Link
                      key={point.id}
                      to={`/record/${point.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-cyber-bg transition-colors"
                    >
                      <span className="w-16 text-xs text-cyber-textMuted">{point.date}</span>
                      <span className="flex-1 text-sm text-cyber-text truncate">
                        {point.snippetTitle}
                      </span>
                      <span className="text-sm text-cyber-primary font-mono w-12 text-right">
                        {point.cpm}
                      </span>
                      <span
                        className={`text-sm font-mono w-14 text-right ${
                          point.accuracy >= 95
                            ? 'text-cyber-success'
                            : point.accuracy >= 80
                              ? 'text-cyber-warning'
                              : 'text-cyber-error'
                        }`}
                      >
                        {point.accuracy.toFixed(0)}%
                      </span>
                      {i < trend.length - 1 && (
                        <span className="w-4">
                          <TrendArrow
                            current={point.cpm}
                            previous={trend[trend.length - 1 - i - 1].cpm}
                          />
                        </span>
                      )}
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="card-neon p-5">
            <h3 className="font-semibold text-cyber-text mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-cyber-error" />
              常错键位趋势（最近 {topErrorTrends.length} 项）
            </h3>
            {topErrorTrends.length > 0 ? (
              <div className="space-y-2">
                {topErrorTrends.map((err, i) => {
                  const maxCount = topErrorTrends[0].totalCount;
                  const isExpanded = expandedError === err.key;
                  const lastIdx = err.perRecord.length - 1;
                  const prevIdx = lastIdx - 1;
                  return (
                    <div key={err.key} className="rounded-lg bg-cyber-bg/50 overflow-hidden">
                      <div
                        className="flex items-center gap-2 p-3 cursor-pointer hover:bg-cyber-bg transition-colors"
                        onClick={() => setExpandedError(isExpanded ? null : err.key)}
                      >
                        <span className="w-5 text-cyber-textMuted text-xs">{i + 1}.</span>
                        <div className="flex items-center gap-1.5 w-24">
                          <span className="px-1.5 py-0.5 bg-cyber-card rounded font-mono text-xs text-cyber-text">
                            {displayChar(err.expected)}
                          </span>
                          <span className="text-cyber-textMuted text-xs">→</span>
                          <span className="px-1.5 py-0.5 bg-cyber-error/20 rounded font-mono text-xs text-cyber-error">
                            {displayChar(err.typed)}
                          </span>
                        </div>
                        <div className="flex-1 h-2 bg-cyber-bg rounded overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyber-error/80 to-cyber-error/40"
                            style={{ width: `${(err.totalCount / maxCount) * 100}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs text-cyber-textMuted font-mono">
                          ×{err.totalCount}
                        </span>
                        {lastIdx >= 0 && prevIdx >= 0 && (
                          <span className="w-4 text-center">
                            <TrendArrow
                              current={err.perRecord[lastIdx].count}
                              previous={err.perRecord[prevIdx].count}
                            />
                          </span>
                        )}
                        <button className="text-cyber-textMuted">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="px-3 pb-3 pt-1 border-t border-cyber-border/30">
                          <p className="text-[10px] text-cyber-textMuted mb-2">
                            出现的局次（最新在右）
                          </p>
                          <div className="flex items-end gap-1 h-16">
                            {err.perRecord.slice(-10).map((pr, idx, arr) => {
                              const maxRec = Math.max(...err.perRecord.map((r) => r.count), 1);
                              return (
                                <Link
                                  key={pr.recordId}
                                  to={`/record/${pr.recordId}`}
                                  className="flex-1 flex flex-col items-center justify-end h-full group"
                                  title={`${pr.date}: ${pr.count}次`}
                                >
                                  <div
                                    className="w-full bg-cyber-error/60 rounded-t min-h-[2px] group-hover:bg-cyber-error transition-colors"
                                    style={{ height: `${(pr.count / maxRec) * 100}%` }}
                                  />
                                  {idx === arr.length - 1 && arr.length > 1 && (
                                    <div className="absolute w-4 -ml-4">
                                      {idx > 0 && (
                                        <TrendArrow
                                          current={pr.count}
                                          previous={arr[idx - 1].count}
                                        />
                                      )}
                                    </div>
                                  )}
                                </Link>
                              );
                            })}
                          </div>
                          <div className="flex gap-1 mt-1">
                            {err.perRecord.slice(-10).map((pr) => (
                              <Link
                                key={pr.recordId}
                                to={`/record/${pr.recordId}`}
                                className="flex-1 text-center text-[9px] text-cyber-textMuted hover:text-cyber-primary truncate"
                              >
                                {pr.date}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-cyber-textMuted text-sm">历史记录中没有错误 🎉</p>
            )}
          </div>

          <div className="card-neon p-5">
            <h3 className="font-semibold text-cyber-text mb-4 flex items-center gap-2">
              <Code size={18} className="text-cyber-warning" />
              薄弱函数趋势（{topFuncTrends.length} 个）
            </h3>
            {topFuncTrends.length > 0 ? (
              <div className="space-y-2">
                {topFuncTrends.map((func, i) => {
                  const isExpanded = expandedFunc === func.name;
                  const lastIdx = func.perRecord.length - 1;
                  const prevIdx = lastIdx - 1;
                  const colorClass =
                    func.avgAccuracy >= 90
                      ? 'text-cyber-success'
                      : func.avgAccuracy >= 70
                        ? 'text-cyber-warning'
                        : 'text-cyber-error';
                  const barColor =
                    func.avgAccuracy >= 90
                      ? 'bg-cyber-success'
                      : func.avgAccuracy >= 70
                        ? 'bg-cyber-warning'
                        : 'bg-cyber-error';
                  return (
                    <div key={func.name} className="rounded-lg bg-cyber-bg/50 overflow-hidden">
                      <div
                        className="flex items-center gap-2 p-3 cursor-pointer hover:bg-cyber-bg transition-colors"
                        onClick={() => setExpandedFunc(isExpanded ? null : func.name)}
                      >
                        <span className="w-5 text-cyber-textMuted text-xs">{i + 1}.</span>
                        <span className="font-mono text-xs text-cyber-text flex-1 min-w-0 truncate">
                          {func.name}()
                        </span>
                        <div className="flex-1 h-2 bg-cyber-bg rounded-full overflow-hidden hidden sm:block">
                          <div
                            className={`h-full rounded-full ${barColor}`}
                            style={{ width: `${func.avgAccuracy}%` }}
                          />
                        </div>
                        <span className={`w-14 text-right text-xs font-mono font-medium ${colorClass}`}>
                          {func.avgAccuracy.toFixed(1)}%
                        </span>
                        <span className="w-10 text-center text-[10px] text-cyber-textMuted">
                          {func.perRecord.length}局
                        </span>
                        {lastIdx >= 0 && prevIdx >= 0 && (
                          <span className="w-4 text-center">
                            <TrendArrow
                              current={func.perRecord[lastIdx].accuracy}
                              previous={func.perRecord[prevIdx].accuracy}
                            />
                          </span>
                        )}
                        <button className="text-cyber-textMuted">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="px-3 pb-3 pt-1 border-t border-cyber-border/30">
                          <p className="text-[10px] text-cyber-textMuted mb-2">
                            正确率变化（最近局，最新在右）
                          </p>
                          <div className="flex items-end gap-1 h-16">
                            {func.perRecord.slice(-10).map((pr) => (
                              <Link
                                key={pr.recordId}
                                to={`/record/${pr.recordId}`}
                                className="flex-1 flex flex-col items-center justify-end h-full group"
                                title={`${pr.date}: ${pr.accuracy.toFixed(1)}%`}
                              >
                                <div
                                  className={`w-full rounded-t min-h-[2px] transition-colors ${
                                    pr.accuracy >= 90
                                      ? 'bg-cyber-success/70 group-hover:bg-cyber-success'
                                      : pr.accuracy >= 70
                                        ? 'bg-cyber-warning/70 group-hover:bg-cyber-warning'
                                        : 'bg-cyber-error/70 group-hover:bg-cyber-error'
                                  }`}
                                  style={{ height: `${pr.accuracy}%` }}
                                />
                              </Link>
                            ))}
                          </div>
                          <div className="flex gap-1 mt-1">
                            {func.perRecord.slice(-10).map((pr) => (
                              <Link
                                key={pr.recordId}
                                to={`/record/${pr.recordId}`}
                                className="flex-1 text-center text-[9px] text-cyber-textMuted hover:text-cyber-primary truncate"
                              >
                                {pr.date}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-cyber-textMuted text-sm">历史记录中未检测到函数</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <Link
            to={`/training/${encodeURIComponent(resolvedName)}`}
            className="btn-cyber-primary btn-cyber flex items-center gap-2"
          >
            <Play size={18} />
            开始专项训练
          </Link>
          <Link to="/leaderboard" className="btn-cyber flex items-center gap-2">
            <Trophy size={18} />
            排行榜
          </Link>
          <Link
            to={`/training-archive/${encodeURIComponent(resolvedName)}`}
            className="btn-cyber flex items-center gap-2"
          >
            <Dumbbell size={18} />
            训练档案
          </Link>
        </div>
      </div>
    </div>
  );
}
