import { useEffect, useState } from 'react';

interface VirtualKeyboardProps {
  highlightKey?: string;
  isShiftPressed?: boolean;
}

interface KeyDef {
  key: string;
  label: string;
  shift?: string;
  wide?: boolean;
  extraWide?: boolean;
  extraExtraWide?: boolean;
}

const KEYBOARD_ROWS: KeyDef[][] = [
  [
    { key: '`', shift: '~', label: '`' },
    { key: '1', shift: '!', label: '1' },
    { key: '2', shift: '@', label: '2' },
    { key: '3', shift: '#', label: '3' },
    { key: '4', shift: '$', label: '4' },
    { key: '5', shift: '%', label: '5' },
    { key: '6', shift: '^', label: '6' },
    { key: '7', shift: '&', label: '7' },
    { key: '8', shift: '*', label: '8' },
    { key: '9', shift: '(', label: '9' },
    { key: '0', shift: ')', label: '0' },
    { key: '-', shift: '_', label: '-' },
    { key: '=', shift: '+', label: '=' },
    { key: 'Backspace', label: '⌫', wide: true },
  ],
  [
    { key: 'Tab', label: 'Tab', wide: true },
    { key: 'q', shift: 'Q', label: 'Q' },
    { key: 'w', shift: 'W', label: 'W' },
    { key: 'e', shift: 'E', label: 'E' },
    { key: 'r', shift: 'R', label: 'R' },
    { key: 't', shift: 'T', label: 'T' },
    { key: 'y', shift: 'Y', label: 'Y' },
    { key: 'u', shift: 'U', label: 'U' },
    { key: 'i', shift: 'I', label: 'I' },
    { key: 'o', shift: 'O', label: 'O' },
    { key: 'p', shift: 'P', label: 'P' },
    { key: '[', shift: '{', label: '[' },
    { key: ']', shift: '}', label: ']' },
    { key: '\\', shift: '|', label: '\\' },
  ],
  [
    { key: 'CapsLock', label: 'Caps', wide: true },
    { key: 'a', shift: 'A', label: 'A' },
    { key: 's', shift: 'S', label: 'S' },
    { key: 'd', shift: 'D', label: 'D' },
    { key: 'f', shift: 'F', label: 'F' },
    { key: 'g', shift: 'G', label: 'G' },
    { key: 'h', shift: 'H', label: 'H' },
    { key: 'j', shift: 'J', label: 'J' },
    { key: 'k', shift: 'K', label: 'K' },
    { key: 'l', shift: 'L', label: 'L' },
    { key: ';', shift: ':', label: ';' },
    { key: "'", shift: '"', label: "'" },
    { key: 'Enter', label: 'Enter', wide: true },
  ],
  [
    { key: 'Shift', label: 'Shift', wide: true, extraWide: true },
    { key: 'z', shift: 'Z', label: 'Z' },
    { key: 'x', shift: 'X', label: 'X' },
    { key: 'c', shift: 'C', label: 'C' },
    { key: 'v', shift: 'V', label: 'V' },
    { key: 'b', shift: 'B', label: 'B' },
    { key: 'n', shift: 'N', label: 'N' },
    { key: 'm', shift: 'M', label: 'M' },
    { key: ',', shift: '<', label: ',' },
    { key: '.', shift: '>', label: '.' },
    { key: '/', shift: '?', label: '/' },
    { key: 'Shift', label: 'Shift', wide: true, extraWide: true },
  ],
  [
    { key: 'Control', label: 'Ctrl', wide: true },
    { key: 'Meta', label: 'Win', wide: false },
    { key: 'Alt', label: 'Alt', wide: false },
    { key: ' ', label: 'Space', extraExtraWide: true },
    { key: 'Alt', label: 'Alt', wide: false },
    { key: 'Control', label: 'Ctrl', wide: true },
  ],
];

export function VirtualKeyboard({ highlightKey, isShiftPressed }: VirtualKeyboardProps) {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setPressedKeys((prev) => new Set(prev).add(e.key.toLowerCase()));
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setPressedKeys((prev) => {
        const next = new Set(prev);
        next.delete(e.key.toLowerCase());
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const isKeyPressed = (key: string): boolean => {
    const lowerKey = key.toLowerCase();
    if (pressedKeys.has(lowerKey)) return true;
    
    if (highlightKey) {
      const highlightLower = highlightKey.toLowerCase();
      if (lowerKey === highlightLower) return true;
      if (isShiftPressed) {
        const rows = KEYBOARD_ROWS.flat();
        const keyDef = rows.find(k => k.key === key);
        if (keyDef?.shift?.toLowerCase() === highlightLower) return true;
      }
    }
    
    return false;
  };

  const getKeyWidth = (keyDef: typeof KEYBOARD_ROWS[0][0]): string => {
    if (keyDef.extraExtraWide) return 'flex-[6]';
    if (keyDef.extraWide) return 'flex-[2]';
    if (keyDef.wide) return 'flex-[1.5]';
    return 'flex-1';
  };

  return (
    <div className="w-full bg-cyber-card/50 backdrop-blur-sm rounded-2xl p-4 border border-cyber-border">
      <div className="flex flex-col gap-1.5">
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1.5 justify-center">
            {row.map((keyDef, keyIndex) => {
              const pressed = isKeyPressed(keyDef.key);
              const displayLabel = isShiftPressed && keyDef.shift ? keyDef.shift : keyDef.label;
              
              return (
                <div
                  key={`${rowIndex}-${keyIndex}`}
                  className={`
                    ${getKeyWidth(keyDef)}
                    h-10 flex items-center justify-center
                    rounded-lg font-medium text-sm
                    transition-all duration-75
                    ${pressed
                      ? 'bg-cyber-primary/30 text-cyber-primary scale-95 shadow-neon-cyan border border-cyber-primary/50'
                      : 'bg-cyber-bgAlt text-cyber-text border border-cyber-border hover:border-cyber-primary/30'
                    }
                  `}
                >
                  <span className="select-none">{displayLabel}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
