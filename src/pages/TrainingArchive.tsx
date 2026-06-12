import { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Dumbbell,
  ArrowLeft,
  Users,
  Zap,
  Target,
  Clock,
  AlertTriangle,
  Code,
  Play,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  ListChecks,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { KeyError, FunctionStat, TypingRecord } from '../types';

const displayChar = (char: string) => {
  if (char === '\n') return '↵';
  if (char === '\t') return 'Tab';
  if (char === ' ') return '␣';
  return char;
};

interface AggregatedData {
  errorTypes: Set<string>;
  totalErrorCount: number;
  weakFunctionCount: number;
  avgFunctionAccuracy: number;
}

function aggregateRecordData(records: TypingRecord[]): AggregatedData {
  const errorTypes = new Set<string>();
  let totalErrorCount = 0;
  const funcMap = new Map<string, { totalAccuracy: number; count: number }>();

  records.forEach((r) => {
    r.errors.forEach((err) => {
      const key = `${err.expected}→${err.typed}`;
      errorTypes.add(key);
      totalErrorCount += err.count;
    });
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

  const funcEntries = Array.from(funcMap.entries());
  const weakFunctionCount = funcEntries.filter(
    ([, data]) => data.totalAccuracy / data.count < 90
  ).length;
  const avgFunctionAccuracy =
    funcEntries.length > 0
      ? funcEntries.reduce((sum, [, data]) => sum + data.totalAccuracy / data.count, 0) /
        funcEntries.length
      : 100;

  return {
    errorTypes,
    totalErrorCount,
    weakFunctionCount,
    avgFunctionAccuracy,
  };
}

function getTopErrors(errors: KeyError[], limit: number = 3) {
  return [...errors]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function getWeakFunctions(functionStats: FunctionStat[], limit: number = 3) {
  return functionStats
    .filter((f) => f.totalChars > 0)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, limit);
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export function TrainingArchive() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { players, currentPlayer, setCurrentPlayer, getRecordsForPlayer } = useAppStore();

  const resolvedName = useMemo(() => {
    if (name) return decodeURIComponent(name);
    if (currentPlayer) return currentPlayer;
    if (players.length > 0) return players[0].name;
    return '';
  }, [name, currentPlayer, players]);

  const trainingRecords = useMemo(() => {
    return getRecordsForPlayer(resolvedName, 'training');
  }, [getRecordsForPlayer, resolvedName]);

  const sortedRecordsDesc = useMemo(() => {
    return [...trainingRecords].sort((a, b) => b.timestamp - a.timestamp);
  }, [trainingRecords]);

  const summary = useMemo(() => {
    const count = trainingRecords.length;
    if (count === 0) {
      return { count, avgCpm: 0, avgAccuracy: 0, lastDate: null as Date | null };
    }
    const totalCpm = trainingRecords.reduce((sum, r) => sum + r.cpm, 0);
    const totalAccuracy = trainingRecords.reduce((sum, r) => sum + r.accuracy, 0);
    const lastTimestamp = Math.max(...trainingRecords.map((r) => r.timestamp));
    return {
      count,
      avgCpm: Math.round(totalCpm / count),
      avgAccuracy: Math.round((totalAccuracy / count) * 10) / 10,
      lastDate: new Date(lastTimestamp),
    };
  }, [trainingRecords]);

  const handlePlayerSwitch = (playerName: string) => {
    setCurrentPlayer(playerName);
    navigate(`/training-archive/${encodeURIComponent(playerName)}`);
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
            to={`/player/${encodeURIComponent(resolvedName)}`}
            className="flex items-center gap-2 text-cyber-textMuted hover:text-cyber-primary transition-colors"
          >
            <ArrowLeft size={20} />
            返回玩家面板
          </Link>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyber-warning/20 to-cyber-error/20 border border-cyber-warning/30 flex items-center justify-center">
              <Dumbbell className="w-7 h-7 text-cyber-warning" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-cyber-text">训练档案 - {resolvedName}</h1>
              <p className="text-cyber-textMuted text-sm mt-1">
                共 {summary.count} 次训练
                {summary.lastDate &&
                  ` · 最近训练 ${summary.lastDate.toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}`}
              </p>
            </div>
          </div>
          <Link
            to={`/training/${encodeURIComponent(resolvedName)}`}
            className="btn-cyber-primary btn-cyber flex items-center gap-2"
          >
            <Play size={18} />
            继续训练
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

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="card-neon p-5">
            <div className="flex items-center gap-2 mb-3">
              <ListChecks size={16} className="text-cyber-secondary" />
              <span className="text-xs text-cyber-textMuted">训练总次数</span>
            </div>
            <p className="text-3xl font-bold text-cyber-text font-mono">{summary.count}</p>
          </div>
          <div className="card-neon p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-cyber-primary" />
              <span className="text-xs text-cyber-textMuted">平均 CPM</span>
            </div>
            <p className="text-3xl font-bold text-cyber-primary font-mono">{summary.avgCpm}</p>
          </div>
          <div className="card-neon p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target size={16} className="text-cyber-success" />
              <span className="text-xs text-cyber-textMuted">平均正确率</span>
            </div>
            <p className="text-3xl font-bold text-cyber-success font-mono">
              {summary.avgAccuracy}%
            </p>
          </div>
        </div>

        {sortedRecordsDesc.length === 0 ? (
          <div className="card-neon p-12 text-center">
            <Dumbbell className="w-16 h-16 text-cyber-border mx-auto mb-4" />
            <p className="text-cyber-text text-lg mb-2">暂无训练记录</p>
            <p className="text-cyber-textMuted text-sm mb-6">
              开始专项训练，追踪你的薄弱点改进过程
            </p>
            <Link
              to={`/training/${encodeURIComponent(resolvedName)}`}
              className="btn-cyber btn-cyber-primary inline-flex items-center gap-2"
            >
              <Play size={18} />
              开始第一次训练
            </Link>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold text-cyber-text mb-5 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-cyber-secondary" />
              训练时间线
            </h2>
            <div className="space-y-5">
              {sortedRecordsDesc.map((record, idx) => {
                const recordIndex = trainingRecords.findIndex((r) => r.id === record.id);
                const previousRecord =
                  recordIndex > 0 ? trainingRecords[recordIndex - 1] : null;
                const beforeRecords = trainingRecords.slice(0, recordIndex);

                const beforeData = aggregateRecordData(beforeRecords);
                const afterData = aggregateRecordData([record]);

                const cpmImproved = previousRecord ? record.cpm > previousRecord.cpm : null;
                const cpmSame = previousRecord ? record.cpm === previousRecord.cpm : null;
                const errorsDecreased = previousRecord
                  ? record.errorCount < previousRecord.errorCount
                  : null;
                const errorsSame = previousRecord
                  ? record.errorCount === previousRecord.errorCount
                  : null;

                const errorTypeDiff = beforeData.errorTypes.size - afterData.errorTypes.size;
                const weakFuncDiff = beforeData.weakFunctionCount - afterData.weakFunctionCount;
                const funcAccDiff = afterData.avgFunctionAccuracy - beforeData.avgFunctionAccuracy;

                const beforeTopErrors = (() => {
                  const errMap = new Map<string, number>();
                  beforeRecords.forEach((r) => {
                    r.errors.forEach((err) => {
                      const key = `${err.expected}→${err.typed}`;
                      errMap.set(key, (errMap.get(key) || 0) + err.count);
                    });
                  });
                  return Array.from(errMap.entries())
                    .map(([key, count]) => {
                      const [expected, typed] = key.split('→');
                      return { expected, typed, count };
                    })
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 3);
                })();

                const beforeWeakFuncs = (() => {
                  const funcMap = new Map<string, { totalAccuracy: number; count: number }>();
                  beforeRecords.forEach((r) => {
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
                    .slice(0, 3);
                })();

                const afterTopErrors = getTopErrors(record.errors, 3);
                const afterWeakFuncs = getWeakFunctions(record.functionStats, 3);

                return (
                  <div key={record.id} className="card-neon p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-cyber-text truncate">
                          {record.snippetTitle}
                        </h3>
                        <p className="text-sm text-cyber-textMuted mt-1">
                          {new Date(record.timestamp).toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {previousRecord && (
                          <>
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                                cpmImproved
                                  ? 'bg-cyber-success/15 text-cyber-success border border-cyber-success/30'
                                  : cpmSame
                                    ? 'bg-cyber-textMuted/10 text-cyber-textMuted border border-cyber-border'
                                    : 'bg-cyber-error/15 text-cyber-error border border-cyber-error/30'
                              }`}
                            >
                              {cpmImproved ? (
                                <TrendingUp size={12} />
                              ) : cpmSame ? (
                                <span>→</span>
                              ) : (
                                <TrendingDown size={12} />
                              )}
                              CPM {cpmImproved ? '↑' : cpmSame ? '持平' : '↓'}
                            </span>
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                                errorsDecreased
                                  ? 'bg-cyber-success/15 text-cyber-success border border-cyber-success/30'
                                  : errorsSame
                                    ? 'bg-cyber-textMuted/10 text-cyber-textMuted border border-cyber-border'
                                    : 'bg-cyber-warning/15 text-cyber-warning border border-cyber-warning/30'
                              }`}
                            >
                              {errorsDecreased ? (
                                <TrendingUp size={12} />
                              ) : errorsSame ? (
                                <span>→</span>
                              ) : (
                                <TrendingDown size={12} />
                              )}
                              错误 {errorsDecreased ? '↓' : errorsSame ? '持平' : '↑'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-5">
                      <div className="bg-cyber-bg rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <Zap size={13} className="text-cyber-primary" />
                          <span className="text-[11px] text-cyber-textMuted">CPM</span>
                        </div>
                        <p className="text-xl font-bold text-cyber-primary font-mono">
                          {record.cpm}
                        </p>
                      </div>
                      <div className="bg-cyber-bg rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <Target size={13} className="text-cyber-success" />
                          <span className="text-[11px] text-cyber-textMuted">正确率</span>
                        </div>
                        <p
                          className={`text-xl font-bold font-mono ${
                            record.accuracy >= 95
                              ? 'text-cyber-success'
                              : record.accuracy >= 80
                                ? 'text-cyber-warning'
                                : 'text-cyber-error'
                          }`}
                        >
                          {record.accuracy.toFixed(1)}%
                        </p>
                      </div>
                      <div className="bg-cyber-bg rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <Clock size={13} className="text-cyber-secondary" />
                          <span className="text-[11px] text-cyber-textMuted">用时</span>
                        </div>
                        <p className="text-xl font-bold text-cyber-secondary font-mono">
                          {formatTime(record.totalTime)}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-cyber-border pt-5">
                      <h4 className="text-sm font-semibold text-cyber-text mb-4 flex items-center gap-2">
                        <Code size={15} className="text-cyber-warning" />
                        薄弱点对比
                      </h4>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-cyber-bg rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-cyber-textMuted uppercase tracking-wider">
                              训练前（累计 {beforeRecords.length} 次）
                            </span>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center gap-1.5 mb-2">
                                <AlertTriangle size={12} className="text-cyber-error" />
                                <span className="text-xs text-cyber-textMuted">常错键位</span>
                              </div>
                              {beforeTopErrors.length > 0 ? (
                                <div className="space-y-1.5">
                                  {beforeTopErrors.map((err, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center justify-between text-xs px-2 py-1 bg-cyber-card rounded"
                                    >
                                      <span className="font-mono">
                                        <span className="text-cyber-text">
                                          {displayChar(err.expected)}
                                        </span>
                                        <span className="text-cyber-textMuted mx-1">→</span>
                                        <span className="text-cyber-error">
                                          {displayChar(err.typed)}
                                        </span>
                                      </span>
                                      <span className="text-cyber-textMuted">×{err.count}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-cyber-textMuted/60">无记录</p>
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5 mb-2">
                                <Code size={12} className="text-cyber-warning" />
                                <span className="text-xs text-cyber-textMuted">薄弱函数</span>
                              </div>
                              {beforeWeakFuncs.length > 0 ? (
                                <div className="space-y-1.5">
                                  {beforeWeakFuncs.map((func, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center justify-between text-xs px-2 py-1 bg-cyber-card rounded"
                                    >
                                      <span className="font-mono text-cyber-text">
                                        {func.name}()
                                      </span>
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
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-cyber-textMuted/60">无记录</p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="bg-cyber-bg rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-cyber-primary uppercase tracking-wider">
                              本次训练
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {errorTypeDiff > 0 && (
                                <span className="px-1.5 py-0.5 text-[10px] rounded bg-cyber-success/15 text-cyber-success border border-cyber-success/30">
                                  错误类型减少 {errorTypeDiff} 种
                                </span>
                              )}
                              {weakFuncDiff > 0 && (
                                <span className="px-1.5 py-0.5 text-[10px] rounded bg-cyber-success/15 text-cyber-success border border-cyber-success/30">
                                  薄弱函数减少 {weakFuncDiff} 个
                                </span>
                              )}
                              {funcAccDiff > 0.5 && (
                                <span className="px-1.5 py-0.5 text-[10px] rounded bg-cyber-success/15 text-cyber-success border border-cyber-success/30">
                                  函数准确率 +{funcAccDiff.toFixed(1)}%
                                </span>
                              )}
                              {funcAccDiff < -0.5 && (
                                <span className="px-1.5 py-0.5 text-[10px] rounded bg-cyber-error/15 text-cyber-error border border-cyber-error/30">
                                  函数准确率 {funcAccDiff.toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center gap-1.5 mb-2">
                                <AlertTriangle size={12} className="text-cyber-error" />
                                <span className="text-xs text-cyber-textMuted">常错键位</span>
                              </div>
                              {afterTopErrors.length > 0 ? (
                                <div className="space-y-1.5">
                                  {afterTopErrors.map((err, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center justify-between text-xs px-2 py-1 bg-cyber-card rounded"
                                    >
                                      <span className="font-mono">
                                        <span className="text-cyber-text">
                                          {displayChar(err.expected)}
                                        </span>
                                        <span className="text-cyber-textMuted mx-1">→</span>
                                        <span className="text-cyber-error">
                                          {displayChar(err.typed)}
                                        </span>
                                      </span>
                                      <span className="text-cyber-textMuted">×{err.count}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-cyber-success">
                                  完美！无错误 ✨
                                </p>
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5 mb-2">
                                <Code size={12} className="text-cyber-warning" />
                                <span className="text-xs text-cyber-textMuted">薄弱函数</span>
                              </div>
                              {afterWeakFuncs.length > 0 ? (
                                <div className="space-y-1.5">
                                  {afterWeakFuncs.map((func, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center justify-between text-xs px-2 py-1 bg-cyber-card rounded"
                                    >
                                      <span className="font-mono text-cyber-text">
                                        {func.name}()
                                      </span>
                                      <span
                                        className={`font-medium ${
                                          func.accuracy >= 90
                                            ? 'text-cyber-success'
                                            : func.accuracy >= 70
                                              ? 'text-cyber-warning'
                                              : 'text-cyber-error'
                                        }`}
                                      >
                                        {func.accuracy.toFixed(1)}%
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-cyber-textMuted/60">未检测到函数</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-cyber-border flex justify-end">
                      <Link
                        to={`/record/${record.id}`}
                        className="inline-flex items-center gap-1.5 text-sm text-cyber-primary hover:text-cyber-primary/80 transition-colors"
                      >
                        查看详情
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
