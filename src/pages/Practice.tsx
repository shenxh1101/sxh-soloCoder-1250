import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Play, Pause, Clock, Target, Zap, Timer, Dumbbell, User } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useTypingGame } from '../hooks/useTypingGame';
import { CodeDisplay } from '../components/CodeDisplay';
import { StatsBar } from '../components/StatsBar';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import { ReportDetail } from '../components/ReportDetail';
import { TypingRecord, KeyError, FunctionStat, RecordType } from '../types';

type CountdownState = 'none' | 'counting' | 'ready';

export function Practice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPlayerName = searchParams.get('player');
  const urlRecordType = searchParams.get('type') as RecordType | null;
  const backTo = searchParams.get('backTo');

  const { getSnippetById, currentPlayer, saveRecord, setCurrentRecord, getRecordsForPlayer } = useAppStore();
  const snippet = id ? getSnippetById(id) : undefined;

  const activePlayer = useMemo(() => urlPlayerName || currentPlayer, [urlPlayerName, currentPlayer]);
  const activeRecordType: RecordType = useMemo(() => {
    if (urlRecordType === 'training') return 'training';
    return 'challenge';
  }, [urlRecordType]);

  const [finishedRecord, setFinishedRecord] = useState<TypingRecord | null>(null);
  const [countdownState, setCountdownState] = useState<CountdownState>('none');
  const [countdown, setCountdown] = useState(3);

  const handleComplete = useCallback((stats: {
    cpm: number;
    accuracy: number;
    totalTime: number;
    totalChars: number;
    correctChars: number;
    errorCount: number;
    errors: KeyError[];
    functionStats: FunctionStat[];
  }) => {
    if (!snippet) return;

    const record = saveRecord({
      snippetId: snippet.id,
      snippetTitle: snippet.title,
      playerName: activePlayer,
      recordType: activeRecordType,
      ...stats,
    });

    setCurrentRecord(record);
    setFinishedRecord(record);
  }, [snippet, activePlayer, activeRecordType, saveRecord, setCurrentRecord]);

  const {
    status,
    currentIndex,
    charStates,
    elapsedTime,
    correctChars,
    totalChars,
    cpm,
    accuracy,
    handleKeyDown,
    startGame,
    reset,
    pause,
    resume,
  } = useTypingGame({ snippet, onComplete: handleComplete });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate('/');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (finishedRecord) return;
      if (countdownState !== 'none' && countdownState !== 'ready') return;
      handleKeyDown(e);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKeyDown, finishedRecord, countdownState]);

  useEffect(() => {
    if (countdownState === 'counting') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setCountdownState('ready');
        startGame();
      }
    }
  }, [countdownState, countdown, startGame]);

  const handleStart = () => {
    setCountdown(3);
    setCountdownState('counting');
  };

  const handleReplay = () => {
    setFinishedRecord(null);
    setCountdownState('none');
    setCountdown(3);
    reset();
  };

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate('/');
    }
  };

  if (!snippet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-cyber-textMuted mb-4">代码片段不存在</p>
          <button onClick={handleBack} className="btn-cyber">
            返回题库
          </button>
        </div>
      </div>
    );
  }

  if (finishedRecord) {
    return (
      <div className="min-h-screen pt-24 pb-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="mb-4 flex items-center justify-center gap-2">
            {finishedRecord.recordType === 'training' ? (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-cyber-secondary/15 text-cyber-secondary border border-cyber-secondary/30 flex items-center gap-1">
                <Dumbbell size={12} />
                专项训练
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-cyber-primary/15 text-cyber-primary border border-cyber-primary/30 flex items-center gap-1">
                <Zap size={12} />
                正式挑战
              </span>
            )}
          </div>
          <ReportDetail
            record={finishedRecord}
            onReplay={handleReplay}
            onBack={handleBack}
          />
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => navigate(`/record/${finishedRecord.id}`)}
              className="text-cyber-secondary hover:text-cyber-secondary/80 text-sm flex items-center gap-1 transition-colors"
            >
              <Timer size={16} />
              查看历史趋势分析
            </button>
            {finishedRecord.recordType === 'training' ? (
              <button
                onClick={() => navigate(`/training-archive/${encodeURIComponent(finishedRecord.playerName)}`)}
                className="text-cyber-primary hover:text-cyber-primary/80 text-sm flex items-center gap-1 transition-colors"
              >
                <Dumbbell size={16} />
                查看训练档案
              </button>
            ) : (
              <button
                onClick={() => navigate(`/player/${encodeURIComponent(finishedRecord.playerName)}`)}
                className="text-cyber-primary hover:text-cyber-primary/80 text-sm flex items-center gap-1 transition-colors"
              >
                <User size={16} />
                查看玩家面板
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isIdle = status === 'idle' && countdownState === 'none';
  const isCounting = countdownState === 'counting';

  return (
    <div className="min-h-screen pt-20 pb-6 flex flex-col">
      <div className="flex-shrink-0 px-6 py-3 border-b border-cyber-border bg-cyber-bg/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-cyber-textMuted hover:text-cyber-primary transition-colors"
          >
            <ArrowLeft size={20} />
            <span>返回</span>
          </button>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <h1 className="font-semibold text-cyber-text">{snippet.title}</h1>
              {activeRecordType === 'training' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyber-secondary/15 text-cyber-secondary border border-cyber-secondary/30">
                  专项训练
                </span>
              )}
            </div>
            <p className="text-xs text-cyber-textMuted capitalize">{snippet.language}</p>
          </div>
          
          <div className="flex items-center gap-2">
            {status === 'playing' ? (
              <button
                onClick={pause}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-cyber-textMuted hover:text-cyber-text hover:bg-cyber-card transition-colors"
              >
                <Pause size={18} />
                <span className="text-sm">暂停</span>
              </button>
            ) : status === 'paused' ? (
              <button
                onClick={resume}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-cyber-primary hover:bg-cyber-primary/10 transition-colors"
              >
                <Play size={18} />
                <span className="text-sm">继续</span>
              </button>
            ) : null}
            
            <button
              onClick={handleReplay}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-cyber-textMuted hover:text-cyber-text hover:bg-cyber-card transition-colors"
            >
              <RotateCcw size={18} />
              <span className="text-sm">重置</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-6 py-6">
        <div className="mb-6">
          {status !== 'idle' || countdownState !== 'none' ? (
            <StatsBar
              cpm={cpm}
              accuracy={accuracy}
              elapsedTime={elapsedTime}
              totalChars={totalChars}
              currentIndex={currentIndex}
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card-neon p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-cyber-textMuted mb-1">
                  <Dumbbell size={16} />
                  <span className="text-xs uppercase tracking-wider">类型</span>
                </div>
                <div className={`text-2xl font-bold ${activeRecordType === 'training' ? 'text-cyber-secondary' : 'text-cyber-primary'}`}>
                  {activeRecordType === 'training' ? '训练' : '挑战'}
                </div>
                <div className="text-xs text-cyber-textMuted">
                  {activeRecordType === 'training' ? '不计入排行' : '计入排行榜'}
                </div>
              </div>
              <div className="card-neon p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-cyber-textMuted mb-1">
                  <Clock size={16} />
                  <span className="text-xs uppercase tracking-wider">代码长度</span>
                </div>
                <div className="text-2xl font-bold text-cyber-primary">
                  {totalChars}
                </div>
                <div className="text-xs text-cyber-textMuted">字符</div>
              </div>
              <div className="card-neon p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-cyber-textMuted mb-1">
                  <Zap size={16} />
                  <span className="text-xs uppercase tracking-wider">预估时间</span>
                </div>
                <div className="text-2xl font-bold text-cyber-secondary">
                  ~{Math.max(1, Math.ceil(totalChars / 300))}
                </div>
                <div className="text-xs text-cyber-textMuted">分钟</div>
              </div>
              <div className="card-neon p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-cyber-textMuted mb-1">
                  <Target size={16} />
                  <span className="text-xs uppercase tracking-wider">玩家</span>
                </div>
                <div className="text-2xl font-bold text-cyber-success">
                  {activePlayer}
                </div>
                <div className="text-xs text-cyber-textMuted">
                  {urlPlayerName && urlPlayerName !== currentPlayer ? '专项指定' : '准备就绪'}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0 mb-6 relative">
          {isCounting && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-cyber-bg/80 backdrop-blur-sm rounded-xl border border-cyber-primary/30">
              <div className="text-center">
                <div className="text-9xl font-bold text-cyber-primary animate-pulse text-glow-cyan">
                  {countdown}
                </div>
                <div className="mt-4 text-xl text-cyber-textMuted">
                  {countdown === 0 ? '开始！' : '准备...'}
                </div>
              </div>
            </div>
          )}

          {status === 'paused' ? (
            <div className="h-full flex items-center justify-center bg-cyber-bgAlt/50 rounded-xl border border-cyber-border">
              <div className="text-center">
                <Pause className="w-16 h-16 text-cyber-primary mx-auto mb-4" />
                <p className="text-xl font-semibold text-cyber-text mb-2">已暂停</p>
                <p className="text-cyber-textMuted mb-6">点击继续按钮恢复</p>
                <button
                  onClick={resume}
                  className="btn-cyber btn-cyber-primary"
                >
                  继续练习
                </button>
              </div>
            </div>
          ) : isIdle ? (
            <div className="h-full flex flex-col">
              <div className="flex-1 min-h-0 mb-4">
                <CodeDisplay
                  charStates={charStates}
                  currentIndex={0}
                  status={status}
                  code={snippet.code}
                />
              </div>
              <div className="flex justify-center">
                <button
                  onClick={handleStart}
                  className="btn-cyber btn-cyber-primary px-10 py-4 text-lg flex items-center gap-3 animate-glow"
                >
                  <Play size={24} />
                  <span>开始挑战（3秒倒计时）</span>
                </button>
              </div>
            </div>
          ) : (
            <CodeDisplay
              charStates={charStates}
              currentIndex={currentIndex}
              status={status}
              code={snippet.code}
            />
          )}
        </div>

        <div className="flex-shrink-0">
          <VirtualKeyboard />
        </div>
      </div>
    </div>
  );
}
