import { useEffect, useRef, useMemo } from 'react';
import { CharState, GameStatus } from '../types';

interface CodeDisplayProps {
  charStates: CharState[];
  currentIndex: number;
  status: GameStatus;
  code: string;
}

interface LineInfo {
  lineNumber: number;
  startIndex: number;
  endIndex: number;
  content: string;
  isCurrent: boolean;
  isContext: boolean;
  charStates: CharState[];
}

export function CodeDisplay({ charStates, currentIndex, status, code }: CodeDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentLineRef = useRef<HTMLDivElement>(null);

  const lines = useMemo((): LineInfo[] => {
    const result: LineInfo[] = [];
    let lineStart = 0;
    let lineNumber = 1;

    const displayCode = status === 'idle' ? code : charStates.map(c => c.char).join('');
    
    for (let i = 0; i <= displayCode.length; i++) {
      if (i === displayCode.length || displayCode[i] === '\n') {
        const lineContent = displayCode.substring(lineStart, i);
        const lineCharStates = status === 'idle'
          ? lineContent.split('').map(c => ({ char: c, status: 'pending' as const }))
          : charStates.slice(lineStart, i);
        
        result.push({
          lineNumber,
          startIndex: lineStart,
          endIndex: i,
          content: lineContent,
          isCurrent: false,
          isContext: false,
          charStates: lineCharStates,
        });
        
        lineStart = i + 1;
        lineNumber++;
      }
    }

    let currentLineIndex = 0;
    for (let i = 0; i < result.length; i++) {
      if (currentIndex >= result[i].startIndex && currentIndex <= result[i].endIndex) {
        currentLineIndex = i;
        result[i].isCurrent = true;
        break;
      }
    }

    if (status === 'playing' || status === 'paused') {
      if (currentLineIndex > 0) {
        result[currentLineIndex - 1].isContext = true;
      }
      if (currentLineIndex < result.length - 1) {
        result[currentLineIndex + 1].isContext = true;
      }
    }

    return result;
  }, [charStates, currentIndex, status, code]);

  useEffect(() => {
    if (currentLineRef.current && containerRef.current && (status === 'playing' || status === 'paused')) {
      const container = containerRef.current;
      const currentLine = currentLineRef.current;
      const lineTop = currentLine.offsetTop;
      const targetScroll = lineTop - container.clientHeight / 2 + currentLine.clientHeight / 2;
      container.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
    }
  }, [currentIndex, status]);

  const renderChar = (charState: CharState, globalIndex: number, isCurrentLine: boolean) => {
    const isCurrent = globalIndex === currentIndex && (status === 'playing' || status === 'paused');
    const { char } = charState;
    let { status: charStatus } = charState;

    if (status === 'idle') {
      charStatus = 'pending';
    }

    let colorClass = 'text-cyber-textMuted';
    let bgClass = '';
    let extraClass = '';

    if (charStatus === 'correct') {
      colorClass = 'text-cyber-success';
    } else if (charStatus === 'incorrect') {
      colorClass = 'text-cyber-error';
      bgClass = 'bg-red-900/30';
      extraClass = 'animate-shake';
    } else if (isCurrent || charStatus === 'current') {
      bgClass = 'bg-cyber-primary/30';
      colorClass = 'text-cyber-primary';
    } else if (isCurrentLine && status === 'idle') {
      colorClass = 'text-cyber-text/90';
    } else if (isCurrentLine) {
      colorClass = charStatus === 'pending' ? 'text-cyber-text/70' : colorClass;
    }

    if (char === '\t') {
      return (
        <span
          key={globalIndex}
          ref={isCurrent ? (el: any) => { if (el) { (el as any).dataset.current = 'true'; } } : undefined}
          className={`relative ${isCurrent ? 'bg-cyber-primary/20' : ''}`}
        >
          {isCurrent && (
            <span className="absolute -left-0.5 -top-0.5 h-6 w-0.5 bg-cyber-primary animate-blink shadow-neon-cyan" />
          )}
          <span className="text-cyber-textMuted/20">→   </span>
        </span>
      );
    }

    if (char === ' ') {
      return (
        <span
          key={globalIndex}
          ref={isCurrent ? (el: any) => { if (el) { (el as any).dataset.current = 'true'; } } : undefined}
          className={`relative ${isCurrent ? 'bg-cyber-primary/30' : charStatus === 'incorrect' ? 'bg-red-900/40' : ''}`}
        >
          {isCurrent && (
            <span className="absolute -left-0.5 -top-0.5 h-6 w-0.5 bg-cyber-primary animate-blink shadow-neon-cyan z-10" />
          )}
          &nbsp;
        </span>
      );
    }

    return (
      <span
        key={globalIndex}
        ref={isCurrent ? (el: any) => { if (el) { (el as any).dataset.current = 'true'; } } : undefined}
        className={`relative inline-block ${colorClass} ${bgClass} ${extraClass} transition-colors duration-75`}
      >
        {isCurrent && (
          <span className="absolute -left-0.5 -top-0.5 h-6 w-0.5 bg-cyber-primary animate-blink shadow-neon-cyan z-10" />
        )}
        {char}
      </span>
    );
  };

  const renderLine = (line: LineInfo) => {
    const shouldShow = status === 'idle' || line.isCurrent || line.isContext;
    const hasPrevHidden = status !== 'idle' && line.lineNumber > 1 && !lines[line.lineNumber - 2]?.isCurrent && !lines[line.lineNumber - 2]?.isContext;
    const hasNextHidden = status !== 'idle' && line.lineNumber < lines.length && !lines[line.lineNumber]?.isCurrent && !lines[line.lineNumber]?.isContext;

    if (!shouldShow) {
      if (line.isCurrent || (line.lineNumber > 1 && lines[line.lineNumber - 2]?.isCurrent) || (line.lineNumber < lines.length && lines[line.lineNumber]?.isCurrent)) {
      } else {
        return null;
      }
    }

    const isFirstVisible = shouldShow && status !== 'idle' && (
      line.lineNumber === 1 ||
      (line.lineNumber > 1 && !lines[line.lineNumber - 2]?.isCurrent && !lines[line.lineNumber - 2]?.isContext)
    );
    const isLastVisible = shouldShow && status !== 'idle' && (
      line.lineNumber === lines.length ||
      (line.lineNumber < lines.length && !lines[line.lineNumber]?.isCurrent && !lines[line.lineNumber]?.isContext)
    );

    return (
      <div key={line.lineNumber}>
        {isFirstVisible && line.lineNumber > 1 && (
          <div className="flex items-center py-1 px-2 text-cyber-textMuted/40 text-xs">
            <span className="w-8 text-right mr-4 opacity-50">...</span>
            <span>↑ 上方省略</span>
          </div>
        )}
        <div
          ref={line.isCurrent ? currentLineRef : undefined}
          className={`
            flex items-start px-2 py-0.5 rounded transition-all duration-150
            ${line.isCurrent ? 'bg-cyber-primary/10 border-l-2 border-cyber-primary shadow-neon-cyan' : ''}
            ${line.isContext && !line.isCurrent ? 'opacity-60' : ''}
            ${status === 'idle' ? '' : (!line.isCurrent && !line.isContext ? 'hidden' : '')}
          `}
        >
          <span className={`
            w-8 text-right mr-4 select-none text-sm font-mono flex-shrink-0
            ${line.isCurrent ? 'text-cyber-primary' : 'text-cyber-textMuted/40'}
          `}>
            {line.lineNumber}
          </span>
          <pre className="whitespace-pre-wrap break-words font-mono text-base leading-relaxed flex-1">
            {line.charStates.map((cs, i) => renderChar(cs, line.startIndex + i, line.isCurrent))}
          </pre>
        </div>
        {isLastVisible && line.lineNumber < lines.length && (
          <div className="flex items-center py-1 px-2 text-cyber-textMuted/40 text-xs">
            <span className="w-8 text-right mr-4 opacity-50">...</span>
            <span>↓ 下方省略</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`
        w-full h-full overflow-auto font-mono text-base leading-relaxed
        bg-cyber-bgAlt rounded-xl border
        ${status === 'idle' ? 'border-cyber-primary/30' : 'border-cyber-border'}
        transition-colors duration-300
      `}
    >
      <div className="py-4">
        {lines.map(line => renderLine(line))}
      </div>
    </div>
  );
}
