import { Trophy, Zap, Target, Clock, AlertTriangle, Code, TrendingDown } from 'lucide-react';
import { TypingRecord, FunctionStat, KeyError } from '../types';

interface ReportDetailProps {
  record: TypingRecord;
  onReplay: () => void;
  onBack: () => void;
}

export function ReportDetail({ record, onReplay, onBack }: ReportDetailProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getGrade = (accuracy: number): { label: string; color: string } => {
    if (accuracy >= 98) return { label: 'S', color: 'text-yellow-400' };
    if (accuracy >= 95) return { label: 'A', color: 'text-cyber-success' };
    if (accuracy >= 90) return { label: 'B', color: 'text-cyber-primary' };
    if (accuracy >= 80) return { label: 'C', color: 'text-cyber-warning' };
    return { label: 'D', color: 'text-cyber-error' };
  };

  const grade = getGrade(record.accuracy);
  const sortedErrors = [...record.errors].sort((a, b) => b.count - a.count).slice(0, 10);
  const maxErrorCount = sortedErrors[0]?.count || 1;

  const sortedFunctions = [...record.functionStats]
    .filter((f) => f.totalChars > 0)
    .sort((a, b) => a.accuracy - b.accuracy);

  const displayChar = (char: string): string => {
    if (char === '\n') return '↵';
    if (char === '\t') return '→';
    if (char === ' ') return '␣';
    return char;
  };

  return (
    <div className="page-enter">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cyber-primary/20 to-cyber-secondary/20 border-2 border-cyber-primary/50 mb-4">
          <Trophy className="w-10 h-10 text-cyber-primary" />
        </div>
        <h2 className="text-3xl font-bold text-cyber-text mb-2">挑战完成！</h2>
        <p className="text-cyber-textMuted">{record.snippetTitle}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card-neon p-5 text-center">
          <div className={`text-6xl font-bold mb-2 ${grade.color}`}>
            {grade.label}
          </div>
          <div className="text-sm text-cyber-textMuted">评级</div>
        </div>

        <div className="card-neon p-5 text-center">
          <Zap className="w-6 h-6 text-cyber-primary mx-auto mb-2" />
          <div className="text-3xl font-bold text-cyber-primary">{record.cpm}</div>
          <div className="text-sm text-cyber-textMuted">CPM</div>
        </div>

        <div className="card-neon p-5 text-center">
          <Target className="w-6 h-6 text-cyber-success mx-auto mb-2" />
          <div className="text-3xl font-bold text-cyber-success">{record.accuracy.toFixed(1)}%</div>
          <div className="text-sm text-cyber-textMuted">正确率</div>
        </div>

        <div className="card-neon p-5 text-center">
          <Clock className="w-6 h-6 text-cyber-secondary mx-auto mb-2" />
          <div className="text-3xl font-bold text-cyber-secondary">{formatTime(record.totalTime)}</div>
          <div className="text-sm text-cyber-textMuted">总用时</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="card-neon p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-cyber-error" />
            <h3 className="font-semibold text-cyber-text">错误键位统计</h3>
          </div>
          
          {sortedErrors.length > 0 ? (
            <div className="space-y-2">
              {sortedErrors.map((error, index) => (
                <ErrorBar key={index} error={error} maxCount={maxErrorCount} displayChar={displayChar} />
              ))}
            </div>
          ) : (
            <p className="text-cyber-textMuted text-center py-4">完美！没有错误 🎉</p>
          )}
        </div>

        <div className="card-neon p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-cyber-warning" />
            <h3 className="font-semibold text-cyber-text">函数正确率分析</h3>
          </div>
          
          {sortedFunctions.length > 0 ? (
            <div className="space-y-3">
              {sortedFunctions.slice(0, 8).map((func, index) => (
                <FunctionAccuracyBar key={index} func={func} />
              ))}
            </div>
          ) : (
            <p className="text-cyber-textMuted text-center py-4">未检测到函数</p>
          )}
        </div>
      </div>

      <div className="card-neon p-5 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Code className="w-5 h-5 text-cyber-primary" />
          <h3 className="font-semibold text-cyber-text">详细统计</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-cyber-textMuted">总字符数</p>
            <p className="text-lg font-semibold text-cyber-text">{record.totalChars}</p>
          </div>
          <div>
            <p className="text-cyber-textMuted">正确字符</p>
            <p className="text-lg font-semibold text-cyber-success">{record.correctChars}</p>
          </div>
          <div>
            <p className="text-cyber-textMuted">错误次数</p>
            <p className="text-lg font-semibold text-cyber-error">{record.errorCount}</p>
          </div>
          <div>
            <p className="text-cyber-textMuted">玩家</p>
            <p className="text-lg font-semibold text-cyber-primary">{record.playerName}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 justify-center">
        <button onClick={onBack} className="btn-cyber px-8">
          返回题库
        </button>
        <button onClick={onReplay} className="btn-cyber btn-cyber-primary px-8">
          再来一次
        </button>
      </div>
    </div>
  );
}

function ErrorBar({ error, maxCount, displayChar }: { error: KeyError; maxCount: number; displayChar: (c: string) => string }) {
  const percentage = (error.count / maxCount) * 100;
  
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 w-24 flex-shrink-0">
        <span className="px-2 py-1 bg-cyber-bg rounded text-cyber-text font-mono text-sm">
          {displayChar(error.expected)}
        </span>
        <span className="text-cyber-textMuted">→</span>
        <span className="px-2 py-1 bg-cyber-error/20 rounded text-cyber-error font-mono text-sm">
          {displayChar(error.typed)}
        </span>
      </div>
      <div className="flex-1 h-6 bg-cyber-bg rounded overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyber-error/80 to-cyber-error/40 rounded transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-right text-sm text-cyber-textMuted">{error.count}</span>
    </div>
  );
}

function FunctionAccuracyBar({ func }: { func: FunctionStat }) {
  const getBarColor = (accuracy: number): string => {
    if (accuracy >= 95) return 'from-cyber-success to-cyber-success/50';
    if (accuracy >= 80) return 'from-cyber-warning to-cyber-warning/50';
    return 'from-cyber-error to-cyber-error/50';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-mono text-cyber-text">{func.name}()</span>
        <span className={`text-sm font-medium ${func.accuracy >= 90 ? 'text-cyber-success' : func.accuracy >= 70 ? 'text-cyber-warning' : 'text-cyber-error'}`}>
          {func.accuracy.toFixed(1)}%
        </span>
      </div>
      <div className="h-2 bg-cyber-bg rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${getBarColor(func.accuracy)} rounded-full transition-all duration-500`}
          style={{ width: `${func.accuracy}%` }}
        />
      </div>
    </div>
  );
}
