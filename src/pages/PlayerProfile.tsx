import { useMemo } from 'react';
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
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const displayChar = (char: string) => {
  if (char === '\n') return '↵';
  if (char === '\t') return '→';
  if (char === ' ') return '␣';
  return char;
};

function TrendArrow({ current, previous }: { current: number; previous: number }) {
  if (current > previous) return <span className="text-cyber-success text-xs">↑</span>;
  if (current < previous) return <span className="text-cyber-error text-xs">↓</span>;
  return <span className="text-cyber-textMuted text-xs">→</span>;
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

export function PlayerProfile() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { records, players, currentPlayer, setCurrentPlayer } = useAppStore();

  const resolvedName = useMemo(() => {
    if (name) return decodeURIComponent(name);
    if (currentPlayer) return currentPlayer;
    if (players.length > 0) return players[0].name;
    return '';
  }, [name, currentPlayer, players]);

  const playerRecords = useMemo(
    () =>
      records
        .filter((r) => r.playerName === resolvedName)
        .sort((a, b) => a.timestamp - b.timestamp),
    [records, resolvedName]
  );

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

  const topErrors = useMemo(() => {
    const errorMap = new Map<string, number>();
    playerRecords.forEach((r) => {
      r.errors.forEach((err) => {
        const key = `${err.expected}→${err.typed}`;
        errorMap.set(key, (errorMap.get(key) || 0) + err.count);
      });
    });
    return Array.from(errorMap.entries())
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [playerRecords]);

  const weakFunctions = useMemo(() => {
    const funcMap = new Map<string, { totalAccuracy: number; count: number }>();
    playerRecords.forEach((r) => {
      r.functionStats.forEach((fs) => {
        if (fs.totalChars > 0) {
          const existing = funcMap.get(fs.name) || { totalAccuracy: 0, count: 0 };
          funcMap.set(fs.name, {
            totalAccuracy: existing.totalAccuracy + fs.accuracy,
            count: existing.count + 1,
          });
        }
      });
    });
    return Array.from(funcMap.entries())
      .map(([name, data]) => ({
        name,
        avgAccuracy: Math.round((data.totalAccuracy / data.count) * 10) / 10,
      }))
      .sort((a, b) => a.avgAccuracy - b.avgAccuracy)
      .slice(0, 5);
  }, [playerRecords]);

  const maxCpm = useMemo(
    () => Math.max(...trend.map((t) => t.cpm), 100),
    [trend]
  );

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
          <div>
            <h1 className="text-3xl font-bold text-cyber-text">{resolvedName}</h1>
            <p className="text-cyber-textMuted text-sm">玩家档案</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card-neon p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={16} className="text-cyber-secondary" />
              <span className="text-xs text-cyber-textMuted">总场次</span>
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
              <TrendingUp size={16} className="text-cyber-warning" />
              <span className="text-xs text-cyber-textMuted">记录数</span>
            </div>
            <p className="text-2xl font-bold text-cyber-warning font-mono">
              {playerRecords.length}
            </p>
          </div>
        </div>

        {trend.length > 0 && (
          <div className="card-neon p-6 mb-8">
            <h2 className="text-xl font-bold text-cyber-text mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-cyber-secondary" />
              趋势（最近 {trend.length} 次）
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
              最常错键位 Top 5
            </h3>
            {topErrors.length > 0 ? (
              <div className="space-y-2">
                {topErrors.map((err, i) => {
                  const [expected, typed] = err.key.split('→');
                  const maxCount = topErrors[0].count;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-5 text-cyber-textMuted text-sm">{i + 1}.</span>
                      <div className="flex items-center gap-2 w-24">
                        <span className="px-2 py-0.5 bg-cyber-bg rounded font-mono text-sm text-cyber-text">
                          {displayChar(expected)}
                        </span>
                        <span className="text-cyber-textMuted text-xs">→</span>
                        <span className="px-2 py-0.5 bg-cyber-error/20 rounded font-mono text-sm text-cyber-error">
                          {displayChar(typed)}
                        </span>
                      </div>
                      <div className="flex-1 h-4 bg-cyber-bg rounded overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyber-error/80 to-cyber-error/40 rounded"
                          style={{ width: `${(err.count / maxCount) * 100}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-sm text-cyber-textMuted">
                        {err.count}
                      </span>
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
              最薄弱函数（平均正确率最低）
            </h3>
            {weakFunctions.length > 0 ? (
              <div className="space-y-2.5">
                {weakFunctions.map((func, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-mono text-cyber-text">{func.name}()</span>
                      <span
                        className={`font-medium ${
                          func.avgAccuracy >= 90
                            ? 'text-cyber-success'
                            : func.avgAccuracy >= 70
                              ? 'text-cyber-warning'
                              : 'text-cyber-error'
                        }`}
                      >
                        {func.avgAccuracy.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-cyber-bg rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          func.avgAccuracy >= 90
                            ? 'bg-cyber-success'
                            : func.avgAccuracy >= 70
                              ? 'bg-cyber-warning'
                              : 'bg-cyber-error'
                        }`}
                        style={{ width: `${func.avgAccuracy}%` }}
                      />
                    </div>
                  </div>
                ))}
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
            开始训练
          </Link>
          <Link to="/leaderboard" className="btn-cyber flex items-center gap-2">
            <Trophy size={18} />
            排行榜
          </Link>
        </div>
      </div>
    </div>
  );
}
