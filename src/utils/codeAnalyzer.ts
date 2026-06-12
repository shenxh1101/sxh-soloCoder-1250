import { FunctionStat, CharState, Language } from '../types';

export function extractFunctions(code: string, language: Language): FunctionStat[] {
  const functions: FunctionStat[] = [];
  
  switch (language) {
    case 'python':
      extractPythonFunctions(code, functions);
      break;
    case 'javascript':
      extractJavaScriptFunctions(code, functions);
      break;
    case 'go':
      extractGoFunctions(code, functions);
      break;
    case 'rust':
      extractRustFunctions(code, functions);
      break;
    case 'java':
      extractJavaFunctions(code, functions);
      break;
    default:
      break;
  }
  
  return functions;
}

function extractPythonFunctions(code: string, functions: FunctionStat[]) {
  const regex = /^def\s+(\w+)\s*\(/gm;
  let match;
  
  while ((match = regex.exec(code)) !== null) {
    const funcName = match[1];
    const startIndex = match.index;
    
    const startLine = code.substring(0, startIndex).split('\n').length - 1;
    const lines = code.split('\n');
    
    let endLine = startLine;
    const baseIndent = lines[startLine].search(/\S/);
    
    for (let i = startLine + 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === '') continue;
      const indent = line.search(/\S/);
      if (indent <= baseIndent && !line.trim().startsWith('#')) {
        break;
      }
      endLine = i;
    }
    
    const endIndex = lines.slice(0, endLine + 1).join('\n').length;
    
    functions.push({
      name: funcName,
      startIndex,
      endIndex,
      totalChars: endIndex - startIndex,
      errorChars: 0,
      accuracy: 100,
    });
  }
}

function extractJavaScriptFunctions(code: string, functions: FunctionStat[]) {
  const jsKeywords = new Set([
    'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'try', 'catch',
    'finally', 'with', 'typeof', 'instanceof', 'new', 'in', 'of', 'return',
    'throw', 'break', 'continue', 'yield', 'await', 'async', 'function',
    'class', 'extends', 'super', 'this', 'const', 'let', 'var', 'import',
    'export', 'default', 'from', 'as', 'void', 'delete', 'debugger'
  ]);

  const patterns: Array<{ regex: RegExp; nameGroup: number }> = [
    {
      regex: /^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+(\w+)\s*\(/gm,
      nameGroup: 1,
    },
    {
      regex: /^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function\s*\(|\([^)]*\)\s*=>|\w+\s*=>)/gm,
      nameGroup: 1,
    },
    {
      regex: /^\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/gm,
      nameGroup: 1,
    },
  ];
  
  const found = new Set<string>();
  
  for (const { regex, nameGroup } of patterns) {
    let match;
    const regexCopy = new RegExp(regex.source, regex.flags);
    
    while ((match = regexCopy.exec(code)) !== null) {
      const funcName = match[nameGroup];
      if (!funcName || found.has(funcName)) continue;
      if (jsKeywords.has(funcName)) continue;
      
      const lineStart = code.substring(0, match.index).lastIndexOf('\n') + 1;
      const line = code.substring(lineStart, match.index + match[0].length).trim();
      
      const controlFlowPatterns = [
        /^if\s*\(/, /^else\s*if\s*\(/, /^for\s*\(/, /^while\s*\(/,
        /^do\s*$/, /^switch\s*\(/, /^case\s+/, /^catch\s*\(/,
        /^try\s*$/, /^finally\s*$/, /^with\s*\(/
      ];
      if (controlFlowPatterns.some(p => line.match(p))) continue;
      
      found.add(funcName);
      
      const startIndex = match.index;
      const braceStart = findMatchingBrace(code, code.indexOf('{', startIndex));
      const endIndex = braceStart !== -1 ? braceStart + 1 : startIndex + match[0].length;
      
      functions.push({
        name: funcName,
        startIndex,
        endIndex,
        totalChars: endIndex - startIndex,
        errorChars: 0,
        accuracy: 100,
      });
    }
  }
}

function extractGoFunctions(code: string, functions: FunctionStat[]) {
  const regex = /^func\s+(?:\(\w+\s+\*?\w+\)\s+)?(\w+)\s*\(/gm;
  let match;
  
  while ((match = regex.exec(code)) !== null) {
    const funcName = match[1];
    const startIndex = match.index;
    const braceStart = findMatchingBrace(code, code.indexOf('{', startIndex));
    const endIndex = braceStart !== -1 ? braceStart + 1 : startIndex + match[0].length;
    
    functions.push({
      name: funcName,
      startIndex,
      endIndex,
      totalChars: endIndex - startIndex,
      errorChars: 0,
      accuracy: 100,
    });
  }
}

function extractRustFunctions(code: string, functions: FunctionStat[]) {
  const regex = /^fn\s+(\w+)\s*\(/gm;
  let match;
  
  while ((match = regex.exec(code)) !== null) {
    const funcName = match[1];
    const startIndex = match.index;
    const braceStart = findMatchingBrace(code, code.indexOf('{', startIndex));
    const endIndex = braceStart !== -1 ? braceStart + 1 : startIndex + match[0].length;
    
    functions.push({
      name: funcName,
      startIndex,
      endIndex,
      totalChars: endIndex - startIndex,
      errorChars: 0,
      accuracy: 100,
    });
  }
}

function extractJavaFunctions(code: string, functions: FunctionStat[]) {
  const regex = /(?:public|private|protected|static|final|\s)+\s+\w+\s+(\w+)\s*\([^)]*\)\s*(?:throws\s+\w+(?:\s*,\s*\w+)*)?\s*\{/g;
  let match;
  
  while ((match = regex.exec(code)) !== null) {
    const funcName = match[1];
    if (funcName === 'class' || funcName === 'interface') continue;
    
    const startIndex = match.index;
    const braceStart = findMatchingBrace(code, code.indexOf('{', startIndex));
    const endIndex = braceStart !== -1 ? braceStart + 1 : startIndex + match[0].length;
    
    functions.push({
      name: funcName,
      startIndex,
      endIndex,
      totalChars: endIndex - startIndex,
      errorChars: 0,
      accuracy: 100,
    });
  }
}

function findMatchingBrace(code: string, startIndex: number): number {
  if (startIndex === -1 || code[startIndex] !== '{') return -1;
  
  let depth = 0;
  for (let i = startIndex; i < code.length; i++) {
    if (code[i] === '{') depth++;
    if (code[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

export function calculateFunctionStats(
  functions: FunctionStat[],
  charStates: CharState[]
): FunctionStat[] {
  return functions.map(func => {
    let errorChars = 0;
    let totalChars = 0;
    
    for (let i = func.startIndex; i < Math.min(func.endIndex, charStates.length); i++) {
      if (charStates[i]?.status === 'correct' || charStates[i]?.status === 'incorrect') {
        totalChars++;
        if (charStates[i].status === 'incorrect') {
          errorChars++;
        }
      }
    }
    
    const accuracy = totalChars > 0 ? ((totalChars - errorChars) / totalChars) * 100 : 100;
    
    return {
      ...func,
      errorChars,
      totalChars,
      accuracy,
    };
  });
}

export function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    python: '#3776ab',
    javascript: '#f7df1e',
    go: '#00add8',
    rust: '#dea584',
    java: '#b07219',
    custom: '#a855f7',
  };
  return colors[language] || '#888899';
}

export function getDifficultyColor(difficulty: string): string {
  const colors: Record<string, string> = {
    easy: '#2ed573',
    medium: '#ffa502',
    hard: '#ff4757',
  };
  return colors[difficulty] || '#888899';
}

export function getDifficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  };
  return labels[difficulty] || difficulty;
}
