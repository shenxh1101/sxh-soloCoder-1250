import { useEffect, useRef } from 'react';
import { CharState } from '../types';

interface CodeDisplayProps {
  charStates: CharState[];
  currentIndex: number;
}

export function CodeDisplay({ charStates, currentIndex }: CodeDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentCharRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (currentCharRef.current && containerRef.current) {
      const container = containerRef.current;
      const currentChar = currentCharRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const charRect = currentChar.getBoundingClientRect();
      
      const scrollTop = currentChar.offsetTop - container.clientHeight / 2;
      container.scrollTop = Math.max(0, scrollTop);
    }
  }, [currentIndex]);

  const renderChar = (charState: CharState, index: number) => {
    const isCurrent = index === currentIndex;
    const { char, status } = charState;

    let colorClass = 'text-cyber-textMuted';
    let bgClass = '';
    let extraClass = '';

    if (status === 'correct') {
      colorClass = 'text-cyber-success';
    } else if (status === 'incorrect') {
      colorClass = 'text-cyber-error bg-red-900/30';
      extraClass = 'animate-shake';
    } else if (isCurrent || status === 'current') {
      bgClass = 'bg-cyber-primary/20';
      colorClass = 'text-cyber-primary';
    }

    if (char === '\n') {
      return (
        <span
          key={index}
          ref={isCurrent ? currentCharRef : undefined}
          className={`inline-block w-0 ${isCurrent ? 'relative' : ''}`}
        >
          {isCurrent && (
            <span className="absolute -left-0.5 -top-0.5 h-6 w-0.5 bg-cyber-primary animate-blink shadow-neon-cyan" />
          )}
          <span className="text-cyber-textMuted/30">↵</span>
          <br />
        </span>
      );
    }

    if (char === '\t') {
      return (
        <span
          key={index}
          ref={isCurrent ? currentCharRef : undefined}
          className={`relative ${isCurrent ? 'bg-cyber-primary/20' : ''}`}
        >
          {isCurrent && (
            <span className="absolute -left-0.5 -top-0.5 h-6 w-0.5 bg-cyber-primary animate-blink shadow-neon-cyan" />
          )}
          <span className="text-cyber-textMuted/30">→   </span>
        </span>
      );
    }

    if (char === ' ') {
      return (
        <span
          key={index}
          ref={isCurrent ? currentCharRef : undefined}
          className={`relative ${isCurrent ? 'bg-cyber-primary/30' : status === 'incorrect' ? 'bg-red-900/40' : ''}`}
        >
          {isCurrent && (
            <span className="absolute -left-0.5 -top-0.5 h-6 w-0.5 bg-cyber-primary animate-blink shadow-neon-cyan" />
          )}
          &nbsp;
        </span>
      );
    }

    return (
      <span
        key={index}
        ref={isCurrent ? currentCharRef : undefined}
        className={`relative inline-block ${colorClass} ${bgClass} ${extraClass} transition-colors duration-75`}
      >
        {isCurrent && (
          <span className="absolute -left-0.5 -top-0.5 h-6 w-0.5 bg-cyber-primary animate-blink shadow-neon-cyan z-10" />
        )}
        {char}
      </span>
    );
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-auto p-6 font-mono text-base leading-relaxed bg-cyber-bgAlt rounded-xl border border-cyber-border"
    >
      <pre className="whitespace-pre-wrap break-words">
        {charStates.map((charState, index) => renderChar(charState, index))}
      </pre>
    </div>
  );
}
