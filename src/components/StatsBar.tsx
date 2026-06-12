import { Clock, Zap, Target, Hash } from 'lucide-react';

interface StatsBarProps {
  cpm: number;
  accuracy: number;
  elapsedTime: number;
  totalChars: number;
  currentIndex: number;
}

export function StatsBar({ cpm, accuracy, elapsedTime, totalChars, currentIndex }: StatsBarProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = totalChars > 0 ? (currentIndex / totalChars) * 100 : 0;
  const remaining = Math.max(0, totalChars - currentIndex);

  return (
    <div className="w-full">
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="card-neon p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-cyber-textMuted mb-1">
            <Zap size={16} />
            <span className="text-xs uppercase tracking-wider">速度</span>
          </div>
          <div className="text-3xl font-bold text-cyber-primary text-glow-cyan">
            {cpm}
          </div>
          <div className="text-xs text-cyber-textMuted">CPM</div>
        </div>

        <div className="card-neon p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-cyber-textMuted mb-1">
            <Target size={16} />
            <span className="text-xs uppercase tracking-wider">正确率</span>
          </div>
          <div className={`text-3xl font-bold ${accuracy >= 95 ? 'text-cyber-success text-glow-green' : accuracy >= 80 ? 'text-cyber-warning' : 'text-cyber-error text-glow-red'}`}>
            {accuracy.toFixed(1)}%
          </div>
          <div className="text-xs text-cyber-textMuted">准确率</div>
        </div>

        <div className="card-neon p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-cyber-textMuted mb-1">
            <Clock size={16} />
            <span className="text-xs uppercase tracking-wider">用时</span>
          </div>
          <div className="text-3xl font-bold text-cyber-secondary text-glow-purple">
            {formatTime(elapsedTime)}
          </div>
          <div className="text-xs text-cyber-textMuted">已用时间</div>
        </div>

        <div className="card-neon p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-cyber-textMuted mb-1">
            <Hash size={16} />
            <span className="text-xs uppercase tracking-wider">进度</span>
          </div>
          <div className="text-3xl font-bold text-cyber-text">
            {currentIndex}
            <span className="text-lg text-cyber-textMuted">/{totalChars}</span>
          </div>
          <div className="text-xs text-cyber-textMuted">剩余 {remaining} 字</div>
        </div>
      </div>

      <div className="w-full h-2 bg-cyber-bgAlt rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyber-primary to-cyber-secondary transition-all duration-300 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
