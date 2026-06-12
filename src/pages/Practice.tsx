import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Play, Pause } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useTypingGame } from '../hooks/useTypingGame';
import { CodeDisplay } from '../components/CodeDisplay';
import { StatsBar } from '../components/StatsBar';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import { ReportDetail } from '../components/ReportDetail';
import { TypingRecord, KeyError, FunctionStat } from '../types';

export function Practice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getSnippetById, currentPlayer, saveRecord, setCurrentRecord } = useAppStore();
  const snippet = id ? getSnippetById(id) : undefined;
  
  const [finishedRecord, setFinishedRecord] = useState<TypingRecord | null>(null);

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
      playerName: currentPlayer,
      ...stats,
    });
    
    setCurrentRecord(record);
    setFinishedRecord(record);
  }, [snippet, currentPlayer, saveRecord, setCurrentRecord]);

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
      handleKeyDown(e);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKeyDown, finishedRecord]);

  const handleReplay = () => {
    setFinishedRecord(null);
    reset();
  };

  const handleBack = () => {
    navigate('/');
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
        <div className="max-w-4xl mx-auto px-6">
          <ReportDetail
            record={finishedRecord}
            onReplay={handleReplay}
            onBack={handleBack}
          />
        </div>
      </div>
    );
  }

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
            <h1 className="font-semibold text-cyber-text">{snippet.title}</h1>
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
              onClick={reset}
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
          <StatsBar
            cpm={cpm}
            accuracy={accuracy}
            elapsedTime={elapsedTime}
            totalChars={totalChars}
            currentIndex={currentIndex}
          />
        </div>

        <div className="flex-1 min-h-0 mb-6">
          {status === 'paused' ? (
            <div className="h-full flex items-center justify-center bg-cyber-bgAlt/50 rounded-xl border border-cyber-border">
              <div className="text-center">
                <Pause className="w-16 h-16 text-cyber-primary mx-auto mb-4" />
                <p className="text-xl font-semibold text-cyber-text mb-2">已暂停</p>
                <p className="text-cyber-textMuted mb-6">按任意键或点击继续按钮恢复</p>
                <button
                  onClick={resume}
                  className="btn-cyber btn-cyber-primary"
                >
                  继续练习
                </button>
              </div>
            </div>
          ) : status === 'idle' ? (
            <div className="h-full flex items-center justify-center bg-cyber-bgAlt/50 rounded-xl border border-cyber-border relative overflow-hidden">
              <div className="absolute inset-0 bg-grid opacity-30" />
              <div className="relative text-center z-10">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyber-primary/20 to-cyber-secondary/20 flex items-center justify-center mx-auto mb-6 border border-cyber-primary/30">
                  <Play className="w-10 h-10 text-cyber-primary ml-1" />
                </div>
                <p className="text-2xl font-bold text-cyber-text mb-2">准备开始</p>
                <p className="text-cyber-textMuted mb-6">按下任意键开始打字</p>
                <div className="text-sm text-cyber-textMuted/70 space-y-1">
                  <p>• 准确输入代码中的每个字符</p>
                  <p>• 错误的字符会以红色高亮显示</p>
                  <p>• 按 ESC 返回题库</p>
                </div>
              </div>
            </div>
          ) : (
            <CodeDisplay charStates={charStates} currentIndex={currentIndex} />
          )}
        </div>

        <div className="flex-shrink-0">
          <VirtualKeyboard />
        </div>
      </div>
    </div>
  );
}
