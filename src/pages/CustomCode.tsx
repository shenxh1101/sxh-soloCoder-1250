import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Code2, Check } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Language, Difficulty } from '../types';
import { getLanguageColor } from '../utils/codeAnalyzer';

export function CustomCode() {
  const navigate = useNavigate();
  const { addCustomSnippet } = useAppStore();
  
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<Language>('javascript');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const languages: Language[] = ['python', 'javascript', 'go', 'rust', 'java', 'custom'];
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

  const difficultyLabels: Record<Difficulty, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !code.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    
    addCustomSnippet({
      title: title.trim(),
      code: code,
      language,
      difficulty,
    });
    
    setTimeout(() => {
      navigate('/');
    }, 500);
  };

  return (
    <div className="page-enter pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyber-secondary/20 to-cyber-primary/20 border border-cyber-secondary/30 mb-4">
            <Plus className="w-8 h-8 text-cyber-secondary" />
          </div>
          <h1 className="text-3xl font-bold text-cyber-text mb-2">添加自定义代码</h1>
          <p className="text-cyber-textMuted">粘贴一段代码，保存为新的练习挑战</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card-neon p-6">
            <label className="block text-sm font-medium text-cyber-text mb-2">
              标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="给这段代码起个名字..."
              className="w-full px-4 py-3 bg-cyber-bg border border-cyber-border rounded-xl text-cyber-text placeholder-cyber-textMuted/50 focus:outline-none focus:border-cyber-primary/50 transition-colors"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card-neon p-6">
              <label className="block text-sm font-medium text-cyber-text mb-3">
                编程语言
              </label>
              <div className="flex flex-wrap gap-2">
                {languages.map((lang) => {
                  const color = getLanguageColor(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setLanguage(lang)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                        language === lang
                          ? 'text-white'
                          : 'bg-cyber-bg text-cyber-textMuted border border-cyber-border hover:border-cyber-primary/30'
                      }`}
                      style={language === lang ? { backgroundColor: color } : {}}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="card-neon p-6">
              <label className="block text-sm font-medium text-cyber-text mb-3">
                难度
              </label>
              <div className="flex gap-2">
                {difficulties.map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      difficulty === diff
                        ? diff === 'easy'
                          ? 'bg-cyber-success/20 text-cyber-success border border-cyber-success/50'
                          : diff === 'medium'
                          ? 'bg-cyber-warning/20 text-cyber-warning border border-cyber-warning/50'
                          : 'bg-cyber-error/20 text-cyber-error border border-cyber-error/50'
                        : 'bg-cyber-bg text-cyber-textMuted border border-cyber-border hover:border-cyber-primary/30'
                    }`}
                  >
                    {difficultyLabels[diff]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card-neon p-6">
            <label className="block text-sm font-medium text-cyber-text mb-2">
              代码内容
            </label>
            <div className="relative">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="在此粘贴你的代码..."
                rows={15}
                className="w-full px-4 py-3 bg-cyber-bg border border-cyber-border rounded-xl text-cyber-text placeholder-cyber-textMuted/50 focus:outline-none focus:border-cyber-primary/50 transition-colors font-mono text-sm leading-relaxed resize-none"
                spellCheck={false}
              />
              <div className="absolute bottom-3 right-3 text-xs text-cyber-textMuted">
                {code.length} 字符
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn-cyber px-8"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !code.trim() || isSubmitting}
              className="btn-cyber btn-cyber-primary px-8 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Check size={18} />
                  已保存
                </>
              ) : (
                <>
                  <Code2 size={18} />
                  保存代码
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
