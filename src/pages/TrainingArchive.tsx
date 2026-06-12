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
  const { players, currentPlayer, setCurrentPlayer, getRecordsForPlayer, getRecordById } = useAppStore();

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

                const meta = record.trainingMeta;
                const isKeys = meta?.targetType === 'keys';
                const isFunc = meta?.targetType === 'function';

                // 解析目标薄弱点（兼容老数据：从标题推断）
                let targetText = '';
                let targetDetail = '';
                if (meta?.targetType === 'keys' && meta.targetKey) {
                  targetText = `薄弱键位：${displayChar(meta.targetKey)}`;
                  if (meta.targetKeyTyped) {
                    targetDetail = `常误按为 ${displayChar(meta.targetKeyTyped)}`;
                  }
                } else if (meta?.targetType === 'function' && meta.targetFunction) {
                  targetText = `薄弱函数：${meta.targetFunction}()`;
                } else {
                  const titleMatch = record.snippetTitle.match(/^专项训练\s*-\s*(.+)$/);
                  if (titleMatch) targetText = titleMatch[1];
                }

                // 正式挑战前后对比
                const playerAll = getRecordsForPlayer(resolvedName);
                const beforeChallenge = meta?.beforeChallengeId
                  ? getRecordById(meta.beforeChallengeId)
                  : null;
                const afterChallenge = playerAll
                  .filter(
                    (r) =>
                      r.recordType === 'challenge' &&
                      r.timestamp > record.timestamp &&
                      r.id !== meta?.beforeChallengeId
                  )
                  .sort((a, b) => a.timestamp - b.timestamp)[0];

                // 计算同一个键/函数在前后 challenge 中的变化
                const targetKeyBeforeCount = (() => {
                  if (!isKeys || !meta?.targetKey || !beforeChallenge) return null;
                  const match = beforeChallenge.errors.find(
                    (e) =>
                      e.expected === meta.targetKey &&
                      (meta.targetKeyTyped ? e.typed === meta.targetKeyTyped : true)
                  );
                  return match ? match.count : 0;
                })();
                const targetKeyAfterCount = (() => {
                  if (!isKeys || !meta?.targetKey || !afterChallenge) return null;
                  const match = afterChallenge.errors.find(
                    (e) =>
                      e.expected === meta.targetKey &&
                      (meta.targetKeyTyped ? e.typed === meta.targetKeyTyped : true)
                  );
                  return match ? match.count : 0;
                })();

                const targetFuncBeforeAcc = (() => {
                  if (!isFunc || !meta?.targetFunction || !beforeChallenge) return null;
                  const f = beforeChallenge.functionStats.find((s) => s.name === meta.targetFunction);
                  return f && f.totalChars > 0 ? f.accuracy : null;
                })();
                const targetFuncAfterAcc = (() => {
                  if (!isFunc || !meta?.targetFunction || !afterChallenge) return null;
                  const f = afterChallenge.functionStats.find((s) => s.name === meta.targetFunction);
                  return f && f.totalChars > 0 ? f.accuracy : null;
                })();

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
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold border ${
                              isKeys
                                ? 'bg-cyber-error/15 text-cyber-error border-cyber-error/30'
                                : isFunc
                                  ? 'bg-cyber-secondary/15 text-cyber-secondary border-cyber-secondary/30'
                                  : 'bg-cyber-primary/15 text-cyber-primary border-cyber-primary/30'
                            }`}
                          >
                            {isKeys ? '薄弱键位专项' : isFunc ? '薄弱函数专项' : '专项训练'}
                          </span>
                          {targetText && (
                            <span className="text-sm text-cyber-text font-mono">{targetText}</span>
                          )}
                        </div>
                        {targetDetail && (
                          <p className="text-xs text-cyber-textMuted mb-1">{targetDetail}</p>
                        )}
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

                    {/* 正式挑战前后对比时间线 */}
                    {(beforeChallenge || afterChallenge) && (
                      <div className="mb-5 p-4 rounded-xl bg-gradient-to-br from-cyber-bgAlt/50 to-transparent border border-cyber-border/50">
                        <h4 className="text-sm font-semibold text-cyber-text mb-3 flex items-center gap-2">
                          <Target size={15} className="text-cyber-primary" />
                          正式挑战变化对比
                          {(targetKeyBeforeCount !== null || targetFuncBeforeAcc !== null) && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyber-primary/15 text-cyber-primary border border-cyber-primary/30 font-normal">
                              训练目标
                            </span>
                          )}
                        </h4>
                        <div className="grid md:grid-cols-3 gap-3 items-stretch">
                          <Link
                            to={beforeChallenge ? `/record/${beforeChallenge.id}` : '#'}
                            className={`p-3 rounded-lg border bg-cyber-bg transition-all ${
                              beforeChallenge
                                ? 'border-cyber-border hover:border-cyber-primary/60 cursor-pointer'
                                : 'border-dashed border-cyber-border/40 opacity-60'
                            }`}
                          >
                            <div className="text-[10px] uppercase tracking-wider text-cyber-textMuted mb-1 flex items-center gap-1">
                              {beforeChallenge ? (
                                <>训练前正式挑战 <ChevronRight size={10} /></>
                              ) : (
                                '训练前挑战'
                              )}
                            </div>
                            {beforeChallenge ? (
                              <div className="space-y-1">
                                <p className="text-sm font-semibold text-cyber-primary">
                                  {beforeChallenge.cpm} CPM ·{' '}
                                  <span className="font-mono">{beforeChallenge.accuracy.toFixed(1)}%</span>
                                </p>
                                {targetKeyBeforeCount !== null && (
                                  <p className="text-xs">
                                    目标键错误：
                                    <span className="text-cyber-error font-mono ml-1">
                                      {targetKeyBeforeCount} 次
                                    </span>
                                  </p>
                                )}
                                {targetFuncBeforeAcc !== null && (
                                  <p className="text-xs">
                                    目标函数：
                                    <span
                                      className={`font-mono ml-1 ${
                                        targetFuncBeforeAcc >= 90
                                          ? 'text-cyber-success'
                                          : targetFuncBeforeAcc >= 70
                                            ? 'text-cyber-warning'
                                            : 'text-cyber-error'
                                      }`}
                                    >
                                      {targetFuncBeforeAcc.toFixed(1)}%
                                    </span>
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-cyber-textMuted/70">训练前无正式挑战</p>
                            )}
                          </Link>

                          <div className="p-3 rounded-lg border border-dashed border-cyber-primary/30 bg-cyber-primary/5 flex flex-col items-center justify-center text-center">
                            <Dumbbell size={18} className="text-cyber-primary mb-1" />
                            <p className="text-[11px] text-cyber-primary font-medium">
                              专项训练 {record.cpm} CPM
                            </p>
                            <p className="text-[10px] text-cyber-textMuted mt-0.5">
                              {record.accuracy.toFixed(1)}% 正确率
                            </p>
                          </div>

                          <Link
                            to={afterChallenge ? `/record/${afterChallenge.id}` : '#'}
                            className={`p-3 rounded-lg border bg-cyber-bg transition-all ${
                              afterChallenge
                                ? 'border-cyber-border hover:border-cyber-success/60 cursor-pointer'
                                : 'border-dashed border-cyber-border/40 opacity-60'
                            }`}
                          >
                            <div className="text-[10px] uppercase tracking-wider text-cyber-textMuted mb-1 flex items-center gap-1">
                              {afterChallenge ? (
                                <>训练后正式挑战 <ChevronRight size={10} /></>
                              ) : (
                                '训练后挑战'
                              )}
                            </div>
                            {afterChallenge ? (
                              <div className="space-y-1">
                                <p className="text-sm font-semibold text-cyber-success">
                                  {afterChallenge.cpm} CPM ·{' '}
                                  <span className="font-mono">{afterChallenge.accuracy.toFixed(1)}%</span>
                                </p>
                                {targetKeyAfterCount !== null && targetKeyBeforeCount !== null && (
                                  <p className="text-xs">
                                    目标键错误：
                                    <span
                                      className={`font-mono ml-1 ${
                                        targetKeyAfterCount < targetKeyBeforeCount
                                          ? 'text-cyber-success'
                                          : targetKeyAfterCount > targetKeyBeforeCount
                                            ? 'text-cyber-error'
                                            : 'text-cyber-textMuted'
                                      }`}
                                    >
                                      {targetKeyAfterCount} 次
                                      {targetKeyBeforeCount - targetKeyAfterCount !== 0 && (
                                        <span className="ml-1">
                                          ({targetKeyAfterCount < targetKeyBeforeCount ? '↓' : '↑'}{' '}
                                          {Math.abs(targetKeyBeforeCount - targetKeyAfterCount)})
                                        </span>
                                      )}
                                    </span>
                                  </p>
                                )}
                                {targetKeyAfterCount !== null && targetKeyBeforeCount === null && (
                                  <p className="text-xs">
                                    目标键错误：
                                    <span className="text-cyber-error font-mono ml-1">
                                      {targetKeyAfterCount} 次
                                    </span>
                                  </p>
                                )}
                                {targetFuncAfterAcc !== null && targetFuncBeforeAcc !== null && (
                                  <p className="text-xs">
                                    目标函数：
                                    <span
                                      className={`font-mono ml-1 ${
                                        targetFuncAfterAcc >= 90
                                          ? 'text-cyber-success'
                                          : targetFuncAfterAcc >= 70
                                            ? 'text-cyber-warning'
                                            : 'text-cyber-error'
                                      }`}
                                    >
                                      {targetFuncAfterAcc.toFixed(1)}%
                                      {Math.abs(targetFuncAfterAcc - targetFuncBeforeAcc) >= 0.5 && (
                                        <span className="ml-1">
                                          ({targetFuncAfterAcc > targetFuncBeforeAcc ? '↑' : '↓'}{' '}
                                          {Math.abs(targetFuncAfterAcc - targetFuncBeforeAcc).toFixed(1)}
                                          %)
                                        </span>
                                      )}
                                    </span>
                                  </p>
                                )}
                                {targetFuncAfterAcc !== null && targetFuncBeforeAcc === null && (
                                  <p className="text-xs">
                                    目标函数：
                                    <span
                                      className={`font-mono ml-1 ${
                                        targetFuncAfterAcc >= 90
                                          ? 'text-cyber-success'
                                          : targetFuncAfterAcc >= 70
                                            ? 'text-cyber-warning'
                                            : 'text-cyber-error'
                                      }`}
                                    >
                                      {targetFuncAfterAcc.toFixed(1)}%
                                    </span>
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-cyber-textMuted/70">
                                等待下次正式挑战，效果将在这里显示
                              </p>
                            )}
                          </Link>
                        </div>
                      </div>
                    )}

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
