import { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Zap, Target, Clock, TrendingUp, AlertTriangle, Code } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { ReportDetail } from '../components/ReportDetail';
import { TypingRecord, KeyError, FunctionStat } from '../types';

interface TrendPoint {
  id: string;
  cpm: number;
  accuracy: number;
  date: string;
  snippetTitle: string;
}

interface PlayerHistory {
  records: TypingRecord[];
  avgCpm: number;
  avgAccuracy: number;
  trend: TrendPoint[];
  topErrors: { key: string; count: number }[];
  weakFunctions: { name: string; avgAccuracy: number }[];
}

export function RecordDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { records } = useAppStore();

  const currentRecord = records.find(r => r.id === id);

  const playerHistory = useMemo<PlayerHistory | null>(() => {
    if (!currentRecord) return null;

    const playerRecords = records
      .filter(r => r.playerName === currentRecord.playerName)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (playerRecords.length === 0) return null;

    const avgCpm = Math.round(
      playerRecords.reduce((sum, r) => sum + r.cpm, 0) / playerRecords.length
    );
    const avgAccuracy = Math.round(
      (playerRecords.reduce((sum, r) => sum + r.accuracy, 0) / playerRecords.length) * 10
    ) / 10;

    const trend = playerRecords.slice(-10).map(r => ({
      id: r.id,
      cpm: r.cpm,
      accuracy: r.accuracy,
      date: new Date(r.timestamp).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
      snippetTitle: r.snippetTitle,
    }));

    const errorMap = new Map<string, number>();
    playerRecords.forEach(r => {
      r.errors.forEach(err => {
        const key = `${err.expected}→${err.typed}`;
        errorMap.set(key, (errorMap.get(key) || 0) + err.count);
      });
    });
    const topErrors = Array.from(errorMap.entries())
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const funcMap = new Map<string, { totalAccuracy: number; count: number }>();
    playerRecords.forEach(r => {
      r.functionStats.forEach(fs => {
        if (fs.totalChars > 0) {
          const existing = funcMap.get(fs.name) || { totalAccuracy: 0, count: 0 };
          funcMap.set(fs.name, {
            totalAccuracy: existing.totalAccuracy + fs.accuracy,
            count: existing.count + 1,
          });
        }
      });
    });
    const weakFunctions = Array.from(funcMap.entries())
      .map(([name, data]) => ({
        name,
        avgAccuracy: Math.round((data.totalAccuracy / data.count) * 10) / 10,
      }))
      .sort((a, b) => a.avgAccuracy - b.avgAccuracy)
      .slice(0, 5);

    return {
      records: playerRecords,
      avgCpm,
      avgAccuracy,
      trend,
      topErrors,
      weakFunctions,
    };
  }, [currentRecord, records]);

  if (!currentRecord) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <p className="text-cyber-textMuted mb-4">记录不存在</p>
          <button onClick={() => navigate('/leaderboard')} className="btn-cyber">
            返回排行榜
          </button>
        </div>
      </div>
    );
  }

  const maxCpm = Math.max(...playerHistory?.trend.map(t => t.cpm) || [100], 100);
  const displayChar = (char: string) => {
    if (char === '\n') return '↵';
    if (char === '\t') return '→';
    if (char === ' ') return '␣';
    return char;
  };

  return (
    <div className="page-enter pt-24 pb-12 min-h-screen">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/leaderboard')}
            className="flex items-center gap-2 text-cyber-textMuted hover:text-cyber-primary transition-colors"
          >
            <ArrowLeft size={20} />
            返回排行榜
          </button>
        </div>

        <div className="mb-10">
          <ReportDetail
            record={currentRecord}
            onReplay={() => navigate(`/practice/${currentRecord.snippetId}`)}
            onBack={() => navigate('/leaderboard')}
          />
        </div>

        {playerHistory && (
          <div className="border-t border-cyber-border pt-10">
            <div className="flex items-center gap-3 mb-8">
              <TrendingUp className="w-7 h-7 text-cyber-secondary" />
              <h2 className="text-2xl font-bold text-cyber-text">
                {currentRecord.playerName} 的历史趋势
              </h2>
              <span className="px-3 py-1 bg-cyber-card rounded-full text-sm text-cyber-textMuted">
                共 {playerHistory.records.length} 次挑战
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="card-neon p-5">
                <h3 className="font-semibold text-cyber-text mb-4 flex items-center gap-2">
                  <Zap size={18} className="text-cyber-primary" />
                  速度与正确率趋势（最近 {playerHistory.trend.length} 次）
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-cyber-textMuted">平均 CPM</span>
                      <span className="text-cyber-primary font-semibold">{playerHistory.avgCpm}</span>
                    </div>
                    <div className="h-2 bg-cyber-bg rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyber-primary to-cyber-primary/60 rounded-full"
                        style={{ width: `${(playerHistory.avgCpm / (maxCpm * 1.3)) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-cyber-textMuted">平均正确率</span>
                      <span className="text-cyber-success font-semibold">{playerHistory.avgAccuracy}%</span>
                    </div>
                    <div className="h-2 bg-cyber-bg rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyber-success to-cyber-success/60 rounded-full"
                        style={{ width: `${playerHistory.avgAccuracy}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  {playerHistory.trend.slice().reverse().map((point, i) => (
                    <Link
                      key={point.id}
                      to={`/record/${point.id}`}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                        point.id === currentRecord.id
                          ? 'bg-cyber-primary/10 border border-cyber-primary/30'
                          : 'hover:bg-cyber-bg'
                      }`}
                    >
                      <span className="w-16 text-xs text-cyber-textMuted">{point.date}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-cyber-text truncate">{point.snippetTitle}</p>
                      </div>
                      <span className="text-sm text-cyber-primary font-mono w-12 text-right">
                        {point.cpm}
                      </span>
                      <span className={`text-sm font-mono w-14 text-right ${
                        point.accuracy >= 95 ? 'text-cyber-success' : point.accuracy >= 80 ? 'text-cyber-warning' : 'text-cyber-error'
                      }`}>
                        {point.accuracy.toFixed(0)}%
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="card-neon p-5">
                  <h3 className="font-semibold text-cyber-text mb-4 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-cyber-error" />
                    最常错键位 Top 5
                  </h3>
                  {playerHistory.topErrors.length > 0 ? (
                    <div className="space-y-2">
                      {playerHistory.topErrors.map((err, i) => {
                        const [expected, typed] = err.key.split('→');
                        const maxCount = playerHistory.topErrors[0].count;
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
                            <span className="w-10 text-right text-sm text-cyber-textMuted">{err.count}</span>
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
                  {playerHistory.weakFunctions.length > 0 ? (
                    <div className="space-y-2.5">
                      {playerHistory.weakFunctions.map((func, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-mono text-cyber-text">{func.name}()</span>
                            <span className={`font-medium ${
                              func.avgAccuracy >= 90 ? 'text-cyber-success' : func.avgAccuracy >= 70 ? 'text-cyber-warning' : 'text-cyber-error'
                            }`}>
                              {func.avgAccuracy.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-cyber-bg rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                func.avgAccuracy >= 90 ? 'bg-cyber-success' : func.avgAccuracy >= 70 ? 'bg-cyber-warning' : 'bg-cyber-error'
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
