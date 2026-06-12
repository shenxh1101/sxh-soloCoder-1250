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
  const [pausedDuration, setPausedDuration] = useState(0);

  const timerRef = useRef<number | null>(null);
  const isCompletedRef = useRef(false);
  const correctCharsRef = useRef(0);
  const charStatesRef = useRef<CharState[]>([]);
  const errorsRef = useRef<KeyError[]>([]);
  const pauseStartTimeRef = useRef<number | null>(null);
  const pausedDurationRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const resumingRef = useRef(false);

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
      setPausedDuration(0);
      isCompletedRef.current = false;
      correctCharsRef.current = 0;
      errorsRef.current = [];
      charStatesRef.current = chars;
      pausedDurationRef.current = 0;
      startTimeRef.current = null;
      pauseStartTimeRef.current = null;
      resumingRef.current = false;

      const funcs = extractFunctions(snippet.code, snippet.language);
      setFunctions(funcs);
    }
  }, [snippet]);

  useEffect(() => {
    if (status === 'playing' && startTimeRef.current) {
      timerRef.current = window.setInterval(() => {
        const wallElapsed = (Date.now() - startTimeRef.current!) / 1000;
        const activeElapsed = wallElapsed - pausedDurationRef.current;
        setElapsedTime(Math.max(0, activeElapsed));
      }, 100);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [status, startTime]);

  useEffect(() => {
    correctCharsRef.current = correctChars;
  }, [correctChars]);

  useEffect(() => {
    charStatesRef.current = charStates;
  }, [charStates]);

  useEffect(() => {
    errorsRef.current = errors;
  }, [errors]);

  const finishGame = useCallback(() => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;

    setStatus('finished');

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const wallElapsed = startTimeRef.current
      ? (Date.now() - startTimeRef.current) / 1000
      : 0;
    const totalTime = Math.max(0, wallElapsed - pausedDurationRef.current);
    const finalCorrectChars = correctCharsRef.current;
    const finalCharStates = charStatesRef.current;
    const finalErrors = errorsRef.current;

    const cpm = totalTime > 0 ? Math.round((finalCorrectChars / totalTime) * 60) : 0;
    const accuracy = totalChars > 0 ? Math.round((finalCorrectChars / totalChars) * 1000) / 10 : 0;

    const funcStats = calculateFunctionStats(functions, finalCharStates);

    onComplete?.({
      cpm,
      accuracy,
      totalTime,
      totalChars,
      correctChars: finalCorrectChars,
      errorCount: finalErrors.reduce((sum, e) => sum + e.count, 0),
      errors: finalErrors,
      functionStats: funcStats,
    });
  }, [totalChars, functions, onComplete]);

  const startGame = useCallback(() => {
    if (status === 'idle') {
      const now = Date.now();
      setStatus('playing');
      setStartTime(now);
      startTimeRef.current = now;
      pausedDurationRef.current = 0;
      setPausedDuration(0);

      setCharStates((states) => {
        const newStates = [...states];
        if (newStates.length > 0) {
          newStates[0] = { ...newStates[0], status: 'current' };
        }
        return newStates;
      });
    }
  }, [status]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!snippet || status === 'finished') return;

    if (status === 'idle') {
      return;
    }

    if (status === 'paused') {
      const now = Date.now();
      if (pauseStartTimeRef.current) {
        const pauseLen = (now - pauseStartTimeRef.current) / 1000;
        pausedDurationRef.current += pauseLen;
        setPausedDuration(pausedDurationRef.current);
      }
      pauseStartTimeRef.current = null;
      setStatus('playing');
      resumingRef.current = true;
      setTimeout(() => {
        resumingRef.current = false;
      }, 100);
      return;
    }

    if (resumingRef.current) {
      return;
    }

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
          if (currentIndex - 1 >= 0) {
            newStates[currentIndex - 1] = { ...newStates[currentIndex - 1], status: 'current' };
          }
          return newStates;
        });

        setCurrentIndex((i) => i - 1);
      }
      return;
    }

    if (e.key.length !== 1 && e.key !== 'Enter' && e.key !== 'Tab') return;

    e.preventDefault();

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
      setTimeout(finishGame, 50);
    }
  }, [snippet, status, currentIndex, charStates, finishGame]);

  const reset = useCallback(() => {
    if (snippet) {
      const chars: CharState[] = snippet.code.split('').map((char) => ({
        char,
        status: 'pending',
      }));
      setCharStates(chars);
      setCurrentIndex(0);
      setErrors([]);
      setStartTime(null);
      setElapsedTime(0);
      setCorrectChars(0);
      setStatus('idle');
      setPausedDuration(0);
      isCompletedRef.current = false;
      correctCharsRef.current = 0;
      errorsRef.current = [];
      charStatesRef.current = chars;
      pausedDurationRef.current = 0;
      startTimeRef.current = null;
      pauseStartTimeRef.current = null;
      resumingRef.current = false;
    }
  }, [snippet]);

  const pause = useCallback(() => {
    if (status === 'playing') {
      pauseStartTimeRef.current = Date.now();
      setStatus('paused');
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [status]);

  const resume = useCallback(() => {
    if (status === 'paused') {
      const now = Date.now();
      if (pauseStartTimeRef.current) {
        const pauseLen = (now - pauseStartTimeRef.current) / 1000;
        pausedDurationRef.current += pauseLen;
        setPausedDuration(pausedDurationRef.current);
      }
      pauseStartTimeRef.current = null;
      setStatus('playing');
      resumingRef.current = true;
      setTimeout(() => {
        resumingRef.current = false;
      }, 100);
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
    pausedDuration,
    handleKeyDown,
    startGame,
    reset,
    pause,
    resume,
  };
}
