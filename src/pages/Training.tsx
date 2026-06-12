import { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Target, Zap, AlertTriangle, Code, Play, ArrowLeft, Dumbbell } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { extractFunctions } from '../utils/codeAnalyzer';
import { KeyError, FunctionStat, CodeSnippet } from '../types';

interface ErrorPair {
  expected: string;
  typed: string;
  count: number;
}

interface WeakFunction {
  name: string;
  accuracy: number;
  snippetTitle: string;
  code: string;
}

interface TrainingSnippet {
  title: string;
  code: string;
  type: 'keys' | 'functions';
}

function aggregateErrors(records: KeyError[]): ErrorPair[] {
  const map = new Map<string, ErrorPair>();
  for (const err of records) {
    const key = `${err.expected}→${err.typed}`;
    const existing = map.get(key);
    if (existing) {
      existing.count += err.count;
    } else {
      map.set(key, { expected: err.expected, typed: err.typed, count: err.count });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 5);
}

function aggregateWeakFunctions(
  records: { functionStats: FunctionStat[]; snippetId: string; snippetTitle: string }[],
  getSnippetById: (id: string) => CodeSnippet | undefined
): WeakFunction[] {
  const funcMap = new Map<string, { name: string; accuracies: number[]; snippetId: string; snippetTitle: string }>();

  for (const rec of records) {
    for (const fs of rec.functionStats) {
      const mapKey = `${rec.snippetId}::${fs.name}`;
      const existing = funcMap.get(mapKey);
      if (existing) {
        existing.accuracies.push(fs.accuracy);
      } else {
        funcMap.set(mapKey, {
          name: fs.name,
          accuracies: [fs.accuracy],
          snippetId: rec.snippetId,
          snippetTitle: rec.snippetTitle,
        });
      }
    }
  }

  const weak: WeakFunction[] = [];
  for (const [, info] of funcMap) {
    const avg = info.accuracies.reduce((a, b) => a + b, 0) / info.accuracies.length;
    if (avg < 95) {
      const snippet = getSnippetById(info.snippetId);
      if (snippet) {
        const funcs = extractFunctions(snippet.code, snippet.language);
        const matched = funcs.find((f) => f.name === info.name);
        const code =
          matched && matched.endIndex > matched.startIndex
            ? snippet.code.slice(matched.startIndex, matched.endIndex)
            : '';
        if (code) {
          weak.push({ name: info.name, accuracy: avg, snippetTitle: info.snippetTitle, code });
        }
      }
    }
  }

  return weak.sort((a, b) => a.accuracy - b.accuracy).slice(0, 3);
}

function generateKeyDrill(errors: ErrorPair[]): string {
  const lines: string[] = [];
  const contextPairs: Record<string, string[]> = {
    ')': ['func(arg)', '(a + b)', 'result = fn(x)'],
    ']': ['data[index]', 'arr[0]', 'items[key]'],
    '}': ['{ return x }', 'obj = {}', 'if (c) { }'],
    ';': ['let x = 1;', 'return val;', 'break;'],
    ':': ['key: value', 'case 1:', 'type: string'],
    "'": ["'hello'", "str = 'abc'", "name = 'test'"],
    '"': ['"hello"', 'str = "abc"', 'name = "test"'],
    '-': ['x - y', 'a - b', 'result - 1'],
    '_': ['my_var', 'get_name', 'MAX_SIZE'],
    '.': ['obj.prop', 'arr.length', 'self.name'],
    '>': ['a > b', 'x => x', '=> result'],
    '<': ['a < b', '<div>', '< 10'],
  };

  for (const err of errors) {
    const target = err.expected;
    const templates = contextPairs[target];
    if (templates) {
      lines.push(...templates.slice(0, 2));
    } else {
      lines.push(`key_${target}_1`, `key_${target}_2`);
    }
  }

  let drill = lines.join('\n');
  if (drill.length > 80) {
    drill = drill.slice(0, 80);
    const lastNewline = drill.lastIndexOf('\n');
    if (lastNewline > 20) drill = drill.slice(0, lastNewline);
  }
  return drill;
}

function generateFunctionSnippet(weakFuncs: WeakFunction[]): string | null {
  if (weakFuncs.length === 0) return null;
  const target = weakFuncs[0];
  let code = target.code;
  if (code.length > 80) {
    const lines = code.split('\n');
    let total = 0;
    const selected: string[] = [];
    for (const line of lines) {
      if (total + line.length + 1 > 80) break;
      selected.push(line);
      total += line.length + 1;
    }
    code = selected.join('\n');
  }
  return code.length >= 10 ? code : null;
}

function generateTrainingSnippets(
  errors: ErrorPair[],
  weakFuncs: WeakFunction[]
): TrainingSnippet[] {
  const snippets: TrainingSnippet[] = [];

  if (errors.length > 0) {
    snippets.push({
      title: '专项训练 - 薄弱键位',
      code: generateKeyDrill(errors),
      type: 'keys',
    });
  }

  const funcCode = generateFunctionSnippet(weakFuncs);
  if (funcCode) {
    snippets.push({
      title: `专项训练 - ${weakFuncs[0].name}()`,
      code: funcCode,
      type: 'functions',
    });
  }

  if (errors.length > 0 && weakFuncs.length > 1) {
    const second = weakFuncs[1];
    const secondCode = generateFunctionSnippet([second]);
    if (secondCode && secondCode !== funcCode) {
      snippets.push({
        title: `专项训练 - ${second.name}()`,
        code: secondCode,
        type: 'functions',
      });
    }
  }

  return snippets;
}

function displayChar(c: string): string {
  if (c === ' ') return '␣';
  if (c === '\n') return '↵';
  if (c === '\t') return '⇥';
  return c;
}

export function Training() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { records, getSnippetById, addCustomSnippet } = useAppStore();

  const playerName = name ?? 'Player';

  const analysis = useMemo(() => {
    const playerRecords = records.filter(
      (r) => r.playerName === playerName && r.recordType === 'challenge'
    );

    if (playerRecords.length === 0) {
      return { errors: [] as ErrorPair[], weakFuncs: [] as WeakFunction[], hasData: false };
    }

    const allErrors: KeyError[] = [];
    for (const rec of playerRecords) {
      allErrors.push(...rec.errors);
    }
    const errors = aggregateErrors(allErrors);
    const weakFuncs = aggregateWeakFunctions(playerRecords, getSnippetById);

    return { errors, weakFuncs, hasData: true };
  }, [records, playerName, getSnippetById]);

  const trainingSnippets = useMemo(
    () => generateTrainingSnippets(analysis.errors, analysis.weakFuncs),
    [analysis.errors, analysis.weakFuncs]
  );

  const handleStartTraining = (ts: TrainingSnippet) => {
    addCustomSnippet({
      title: ts.title,
      language: 'custom',
      difficulty: 'easy',
      code: ts.code,
    });
    const snippets = useAppStore.getState().snippets;
    const added = snippets[snippets.length - 1];
    if (added) {
      const backTo = `/training-archive/${encodeURIComponent(playerName)}`;

      const playerRecords = useAppStore
        .getState()
        .records.filter(
          (r) => r.playerName === playerName && r.recordType === 'challenge'
        )
        .sort((a, b) => b.timestamp - a.timestamp);
      const beforeChallengeId = playerRecords[0]?.id;

      const params = new URLSearchParams();
      params.set('player', playerName);
      params.set('type', 'training');
      params.set('backTo', backTo);
      params.set('targetType', ts.type);
      if (beforeChallengeId) {
        params.set('beforeChallengeId', beforeChallengeId);
      }
      if (ts.type === 'keys' && analysis.errors.length > 0) {
        params.set('targetKey', analysis.errors[0].expected);
        params.set('targetKeyTyped', analysis.errors[0].typed);
      }
      if (ts.type === 'functions' && analysis.weakFuncs.length > 0) {
        // 从 title 解析："专项训练 - xxx()"
        const match = ts.title.match(/^专项训练\s*-\s*(.+?)\(\)$/);
        const fname = match ? match[1] : analysis.weakFuncs[0].name;
        params.set('targetFunction', fname);
      }

      navigate(`/practice/${added.id}?${params.toString()}`);
    }
  };

  return (
    <div className="page-enter pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-cyber-textMuted hover:text-cyber-primary transition-colors mb-6"
          >
            <ArrowLeft size={18} />
            返回首页
          </Link>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyber-warning/20 to-cyber-error/20 border border-cyber-warning/30 mb-4">
              <Dumbbell className="w-8 h-8 text-cyber-warning" />
            </div>
            <h1 className="text-3xl font-bold text-cyber-text mb-2">
              专项训练 - {playerName}
            </h1>
            <p className="text-cyber-textMuted">
              基于历史数据自动分析薄弱环节，生成针对性练习
            </p>
          </div>
        </div>

        {!analysis.hasData ? (
          <div className="card-neon p-12 text-center">
            <Target className="w-16 h-16 text-cyber-border mx-auto mb-4" />
            <p className="text-cyber-textMuted text-lg mb-2">暂无训练数据</p>
            <p className="text-cyber-textMuted/70 text-sm">
              该玩家还没有练习记录，完成一些代码练习后再来训练吧
            </p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-5 mb-8">
              <div className="card-neon p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-cyber-error/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-cyber-error" />
                  </div>
                  <h2 className="text-lg font-semibold text-cyber-text">常错键位</h2>
                </div>
                {analysis.errors.length > 0 ? (
                  <div className="space-y-3">
                    {analysis.errors.map((err, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-3 py-2 bg-cyber-bg rounded-lg"
                      >
                        <span className="font-mono text-sm">
                          <span className="text-cyber-error">{displayChar(err.expected)}</span>
                          <span className="text-cyber-textMuted mx-2">→</span>
                          <span className="text-cyber-warning">{displayChar(err.typed)}</span>
                        </span>
                        <span className="text-xs text-cyber-textMuted bg-cyber-card px-2 py-1 rounded">
                          {err.count} 次
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-cyber-textMuted text-sm">未检测到频繁错误键位</p>
                )}
              </div>

              <div className="card-neon p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-cyber-warning/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-cyber-warning" />
                  </div>
                  <h2 className="text-lg font-semibold text-cyber-text">薄弱函数</h2>
                </div>
                {analysis.weakFuncs.length > 0 ? (
                  <div className="space-y-3">
                    {analysis.weakFuncs.map((wf, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-3 py-2 bg-cyber-bg rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Code className="w-4 h-4 text-cyber-secondary" />
                          <span className="text-sm text-cyber-text font-mono">{wf.name}()</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-cyber-textMuted">{wf.snippetTitle}</span>
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded ${
                              wf.accuracy < 80
                                ? 'bg-cyber-error/10 text-cyber-error'
                                : 'bg-cyber-warning/10 text-cyber-warning'
                            }`}
                          >
                            {wf.accuracy.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-cyber-textMuted text-sm">所有函数准确率均在 95% 以上</p>
                )}
              </div>
            </div>

            {trainingSnippets.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-cyber-text mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-cyber-primary" />
                  生成训练片段
                </h2>
                <div className="space-y-4">
                  {trainingSnippets.map((ts, i) => (
                    <div key={i} className="card-neon p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-base font-medium text-cyber-text">{ts.title}</h3>
                          <p className="text-xs text-cyber-textMuted mt-1">
                            {ts.code.length} 字符 · {ts.type === 'keys' ? '键位纠正' : '函数强化'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleStartTraining(ts)}
                          className="btn-cyber btn-cyber-primary px-5 py-2 flex items-center gap-2 text-sm"
                        >
                          <Play size={16} />
                          开始训练
                        </button>
                      </div>
                      <div className="bg-cyber-bg rounded-lg p-4 font-mono text-sm text-cyber-primary/80 leading-relaxed overflow-x-auto whitespace-pre">
                        {ts.code}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.errors.length === 0 && analysis.weakFuncs.length === 0 && (
              <div className="card-neon p-12 text-center">
                <Zap className="w-16 h-16 text-cyber-success mx-auto mb-4" />
                <p className="text-cyber-text text-lg mb-2">表现出色！</p>
                <p className="text-cyber-textMuted text-sm">
                  当前没有检测到明显的薄弱环节，继续保持
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
