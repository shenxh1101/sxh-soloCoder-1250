import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Play, Pause, User, Clock, Users, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useTournamentStore } from '../store/useTournamentStore';
import { useTypingGame } from '../hooks/useTypingGame';
import { CodeDisplay } from '../components/CodeDisplay';
import { StatsBar } from '../components/StatsBar';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import { TypingRecord, KeyError, FunctionStat } from '../types';

type CountdownState = 'none' | 'counting' | 'ready';

export function TournamentPlay() {
  const navigate = useNavigate();
  const { getSnippetById, saveRecord } = useAppStore();
  const { tournament, setPlayerRecord, nextPlayer, resetTournament } = useTournamentStore();
  
  const [playerFinished, setPlayerFinished] = useState(false);
  const [countdownState, setCountdownState] = useState<CountdownState>('none');
  const [countdown, setCountdown] = useState(3);
  const [gameResetKey, setGameResetKey] = useState(0);

  const currentPlayer = tournament?.players[tournament.currentPlayerIndex];
  const snippet = tournament ? getSnippetById(tournament.snippetId) : undefined;

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
    if (!snippet || !tournament || !currentPlayer) return;
    
    const record = saveRecord({
      snippetId: snippet.id,
      snippetTitle: snippet.title,
      playerName: currentPlayer.name,
      ...stats,
    });
    
    setPlayerRecord(tournament.currentPlayerIndex, record);
    setPlayerFinished(true);
  }, [snippet, tournament, currentPlayer, saveRecord, setPlayerRecord]);

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
    if (gameResetKey > 0) {
      reset();
    }
  }, [gameResetKey, reset]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirm('确定要退出比赛吗？')) {
          resetTournament();
          navigate('/');
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, resetTournament]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (playerFinished) return;
      if (countdownState !== 'none' && countdownState !== 'ready') return;
      handleKeyDown(e);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKeyDown, playerFinished, countdownState]);

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

  const handleNextPlayer = () => {
    const isLastPlayer = tournament && tournament.currentPlayerIndex >= tournament.players.length - 1;
    
    if (isLastPlayer) {
      navigate('/tournament/result');
    } else {
      nextPlayer();
      setPlayerFinished(false);
      setCountdownState('none');
      setCountdown(3);
      setGameResetKey(k => k + 1);
    }
  };

  const handleBack = () => {
    if (confirm('确定要退出比赛吗？')) {
      resetTournament();
      navigate('/');
    }
  };

  if (!tournament || !snippet || !currentPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-cyber-textMuted mb-4">比赛未初始化</p>
          <button onClick={() => navigate('/tournament')} className="btn-cyber btn-cyber-primary">
            创建比赛
          </button>
        </div>
      </div>
    );
  }

  const isIdle = status === 'idle' && countdownState === 'none' && !playerFinished;
  const isCounting = countdownState === 'counting';

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen pt-20 pb-6 flex flex-col">
      <div className="flex-shrink-0 px-6 py-3 border-b border-cyber-border bg-cyber-bg/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-cyber-textMuted hover:text-cyber-primary transition-colors"
          >
            <ArrowLeft size={20} />
            <span>退出比赛</span>
          </button>
          
          <div className="text-center">
            <h1 className="font-semibold text-cyber-text">{snippet.title}</h1>
            <div className="flex items-center gap-3 justify-center mt-1">
              <span className="text-xs text-cyber-textMuted flex items-center gap-1">
                <Users size={12} />
                第 {tournament.currentPlayerIndex + 1}/{tournament.players.length} 位
              </span>
              <span className="text-xs text-cyber-secondary flex items-center gap-1">
                <User size={12} />
                {currentPlayer.name}
              </span>
            </div>
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
            
            {!playerFinished && (
              <button
                onClick={() => {
                  setPlayerFinished(false);
                  setCountdownState('none');
                  setCountdown(3);
                  setGameResetKey(k => k + 1);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-cyber-textMuted hover:text-cyber-text hover:bg-cyber-card transition-colors"
              >
                <RotateCcw size={18} />
                <span className="text-sm">重试</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 px-6 py-3 bg-cyber-card/30 border-b border-cyber-border/50">
        <div className="max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto pb-1">
          {tournament.players.map((player, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg flex-shrink-0 transition-all ${
                index === tournament.currentPlayerIndex
                  ? 'bg-cyber-primary/20 border border-cyber-primary/50'
                  : player.finished
                  ? 'bg-cyber-success/10 border border-cyber-success/30'
                  : 'bg-cyber-bg border border-cyber-border'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                index === tournament.currentPlayerIndex
                  ? 'bg-cyber-primary text-black'
                  : player.finished
                  ? 'bg-cyber-success text-black'
                  : 'bg-cyber-border text-cyber-textMuted'
              }`}>
                {player.finished ? '✓' : index + 1}
              </span>
              <span className={`text-sm font-medium ${
                index === tournament.currentPlayerIndex
                  ? 'text-cyber-primary'
                  : player.finished
                  ? 'text-cyber-success'
                  : 'text-cyber-textMuted'
              }`}>
                {player.name}
              </span>
              {player.record && (
                <span className="text-xs text-cyber-textMuted">
                  {player.record.accuracy.toFixed(0)}%
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-6 py-6">
        {playerFinished ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="card-neon p-10 text-center max-w-md animate-fadeInUp">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cyber-success/20 to-cyber-primary/20 border-2 border-cyber-success/50 mb-6">
                <Play className="w-10 h-10 text-cyber-success ml-1" />
              </div>
              <h2 className="text-2xl font-bold text-cyber-text mb-2">完成！</h2>
              <p className="text-cyber-textMuted mb-6">{currentPlayer.name} 已完成挑战</p>
              
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center">
                  <p className="text-xs text-cyber-textMuted mb-1">速度</p>
                  <p className="text-2xl font-bold text-cyber-primary">{cpm}</p>
                  <p className="text-xs text-cyber-textMuted">CPM</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-cyber-textMuted mb-1">正确率</p>
                  <p className="text-2xl font-bold text-cyber-success">{accuracy.toFixed(1)}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-cyber-textMuted mb-1">用时</p>
                  <p className="text-2xl font-bold text-cyber-secondary">{formatTime(elapsedTime)}</p>
                </div>
              </div>

              <button
                onClick={handleNextPlayer}
                className="btn-cyber btn-cyber-primary w-full py-4 text-lg flex items-center justify-center gap-2"
              >
                {tournament.currentPlayerIndex >= tournament.players.length - 1 ? (
                  '查看比赛结果'
                ) : (
                  <>
                    下一位玩家
                    <ChevronRight size={20} />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <>
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
                <div className="grid grid-cols-3 gap-4">
                  <div className="card-neon p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-cyber-textMuted mb-1">
                      <Clock size={16} />
                      <span className="text-xs uppercase tracking-wider">代码长度</span>
                    </div>
                    <div className="text-3xl font-bold text-cyber-primary">{totalChars}</div>
                    <div className="text-xs text-cyber-textMuted">字符</div>
                  </div>
                  <div className="card-neon p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-cyber-textMuted mb-1">
                      <Users size={16} />
                      <span className="text-xs uppercase tracking-wider">参赛人数</span>
                    </div>
                    <div className="text-3xl font-bold text-cyber-secondary">{tournament.players.length}</div>
                    <div className="text-xs text-cyber-textMuted">人</div>
                  </div>
                  <div className="card-neon p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-cyber-textMuted mb-1">
                      <User size={16} />
                      <span className="text-xs uppercase tracking-wider">当前玩家</span>
                    </div>
                    <div className="text-3xl font-bold text-cyber-success truncate">{currentPlayer.name}</div>
                    <div className="text-xs text-cyber-textMuted">准备就绪</div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 min-h-0 mb-6 relative">
              {isCounting && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-cyber-bg/80 backdrop-blur-sm rounded-xl border border-cyber-primary/30">
                  <div className="text-center">
                    <div className="text-sm text-cyber-textMuted mb-2">{currentPlayer.name} 准备</div>
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
                    <button onClick={resume} className="btn-cyber btn-cyber-primary">
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
                      <span>{currentPlayer.name}，开始挑战（3秒倒计时）</span>
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
          </>
        )}
      </div>
    </div>
  );
}
