import { useState, useEffect, useCallback, useRef } from 'react';
import { CharState, KeyError, GameStatus, CodeSnippet, FunctionStat } from '../types';
import { extractFunctions, calculateFunctionStats } from '../utils/codeAnalyzer';

interface UseTypingGameOptions {
  snippet: CodeSnippet | undefined;
  onComplete?: (stats: {
    cpm: number;
    accuracy: number;
    totalTime: number;
    totalChars: number;
    correctChars: number;
    errorCount: number;
    errors: KeyError[];
    functionStats: FunctionStat[];
  }) => void;
}

export function useTypingGame({ snippet, onComplete }: UseTypingGameOptions) {
  const [status, setStatus] = useState<GameStatus>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [charStates, setCharStates] = useState<CharState[]>([]);
  const [errors, setErrors] = useState<KeyError[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const [functions, setFunctions] = useState<FunctionStat[]>([]);
  
  const timerRef = useRef<number | null>(null);
  const isCompletedRef = useRef(false);

  const totalChars = snippet?.code.length || 0;

  useEffect(() => {
    if (snippet) {
      const chars = snippet.code.split('').map((char) => ({
        char,
        status: 'pending' as const,
      }));
      setCharStates(chars);
      setCurrentIndex(0);
      setErrors([]);
      setStartTime(null);
      setElapsedTime(0);
      setCorrectChars(0);
      setStatus('idle');
      isCompletedRef.current = false;
      
      const funcs = extractFunctions(snippet.code, snippet.language);
      setFunctions(funcs);
    }
  }, [snippet]);

  useEffect(() => {
    if (status === 'playing' && startTime) {
      timerRef.current = window.setInterval(() => {
        setElapsedTime((Date.now() - startTime) / 1000);
      }, 100);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [status, startTime]);

  const finishGame = useCallback(() => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;
    
    setStatus('finished');
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    const totalTime = startTime ? (Date.now() - startTime) / 1000 : 0;
    const cpm = totalTime > 0 ? Math.round((correctChars / totalTime) * 60) : 0;
    const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 1000) / 10 : 0;
    
    const funcStats = calculateFunctionStats(functions, charStates);
    
    onComplete?.({
      cpm,
      accuracy,
      totalTime,
      totalChars,
      correctChars,
      errorCount: errors.reduce((sum, e) => sum + e.count, 0),
      errors,
      functionStats: funcStats,
    });
  }, [startTime, correctChars, totalChars, errors, functions, charStates, onComplete]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!snippet || status === 'finished') return;
    
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (currentIndex > 0) {
        const prevChar = charStates[currentIndex - 1];
        if (prevChar.status === 'correct') {
          setCorrectChars((c) => c - 1);
        }
        
        setCharStates((states) => {
          const newStates = [...states];
          newStates[currentIndex - 1] = { ...newStates[currentIndex - 1], status: 'pending' };
          newStates[currentIndex] = { ...newStates[currentIndex], status: 'pending' };
          return newStates;
        });
        
        setCurrentIndex((i) => i - 1);
      }
      return;
    }
    
    if (e.key.length !== 1 && e.key !== 'Enter' && e.key !== 'Tab') return;
    
    e.preventDefault();
    
    if (status === 'idle') {
      setStatus('playing');
      setStartTime(Date.now());
    }
    
    if (status === 'paused') {
      setStatus('playing');
    }
    
    const expectedChar = snippet.code[currentIndex];
    let typedChar = e.key;
    
    if (e.key === 'Enter') {
      typedChar = '\n';
    } else if (e.key === 'Tab') {
      typedChar = '\t';
    }
    
    const isCorrect = typedChar === expectedChar;
    
    setCharStates((states) => {
      const newStates = [...states];
      newStates[currentIndex] = {
        ...newStates[currentIndex],
        status: isCorrect ? 'correct' : 'incorrect',
      };
      if (currentIndex + 1 < newStates.length) {
        newStates[currentIndex + 1] = {
          ...newStates[currentIndex + 1],
          status: 'current',
        };
      }
      return newStates;
    });
    
    if (isCorrect) {
      setCorrectChars((c) => c + 1);
    } else {
      setErrors((prevErrors) => {
        const existingError = prevErrors.find(
          (e) => e.expected === expectedChar && e.typed === typedChar
        );
        
        if (existingError) {
          return prevErrors.map((e) =>
            e.expected === expectedChar && e.typed === typedChar
              ? { ...e, count: e.count + 1 }
              : e
          );
        }
        
        return [...prevErrors, { expected: expectedChar, typed: typedChar, count: 1 }];
      });
    }
    
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    
    if (nextIndex >= snippet.code.length) {
      setTimeout(finishGame, 100);
    }
  }, [snippet, status, currentIndex, charStates, finishGame]);

  const reset = useCallback(() => {
    if (snippet) {
      const chars: CharState[] = snippet.code.split('').map((char) => ({
        char,
        status: 'pending',
      }));
      if (chars.length > 0) {
        chars[0].status = 'current';
      }
      setCharStates(chars);
      setCurrentIndex(0);
      setErrors([]);
      setStartTime(null);
      setElapsedTime(0);
      setCorrectChars(0);
      setStatus('idle');
      isCompletedRef.current = false;
    }
  }, [snippet]);

  const pause = useCallback(() => {
    if (status === 'playing') {
      setStatus('paused');
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [status]);

  const resume = useCallback(() => {
    if (status === 'paused') {
      setStatus('playing');
    }
  }, [status]);

  const cpm = elapsedTime > 0 ? Math.round((correctChars / elapsedTime) * 60) : 0;
  const accuracy = currentIndex > 0 ? Math.round((correctChars / currentIndex) * 1000) / 10 : 100;
  
  const errorCount = errors.reduce((sum, e) => sum + e.count, 0);
  const progress = totalChars > 0 ? (currentIndex / totalChars) * 100 : 0;

  return {
    status,
    currentIndex,
    charStates,
    errors,
    elapsedTime,
    correctChars,
    totalChars,
    errorCount,
    cpm,
    accuracy,
    progress,
    functions,
    handleKeyDown,
    reset,
    pause,
    resume,
  };
}
