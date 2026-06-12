import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, Search, Filter } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { SnippetCard } from '../components/SnippetCard';
import { Language, Difficulty } from '../types';
import { getDifficultyLabel } from '../utils/codeAnalyzer';

export function Home() {
  const navigate = useNavigate();
  const { snippets, deleteSnippet } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const languages: (Language | 'all')[] = ['all', 'python', 'javascript', 'go', 'rust', 'java', 'custom'];
  const difficulties: (Difficulty | 'all')[] = ['all', 'easy', 'medium', 'hard'];

  const filteredSnippets = useMemo(() => {
    return snippets.filter((snippet) => {
      const matchesSearch = snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        snippet.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLanguage = selectedLanguage === 'all' || snippet.language === selectedLanguage;
      const matchesDifficulty = selectedDifficulty === 'all' || snippet.difficulty === selectedDifficulty;
      return matchesSearch && matchesLanguage && matchesDifficulty;
    });
  }, [snippets, searchQuery, selectedLanguage, selectedDifficulty]);

  const handleSnippetClick = (id: string) => {
    navigate(`/practice/${id}`);
  };

  const handleDeleteSnippet = (id: string) => {
    if (confirm('确定要删除这个代码片段吗？')) {
      deleteSnippet(id);
    }
  };

  return (
    <div className="page-enter pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyber-primary via-cyber-secondary to-cyber-primary bg-clip-text text-transparent bg-size-200 animate-pulse-slow">
              CodeType
            </span>
          </h1>
          <p className="text-lg text-cyber-textMuted max-w-xl mx-auto">
            用真实的代码练习打字，提升你的编程速度和准确率
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cyber-textMuted" size={20} />
            <input
              type="text"
              placeholder="搜索代码片段..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-cyber-card border border-cyber-border rounded-xl text-cyber-text placeholder-cyber-textMuted/50 focus:outline-none focus:border-cyber-primary/50 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-6 py-3 bg-cyber-card border border-cyber-border rounded-xl text-cyber-text hover:border-cyber-primary/30 transition-colors"
          >
            <Filter size={20} />
            筛选
          </button>
        </div>

        {showFilters && (
          <div className="card-neon p-5 mb-8 animate-fadeInUp">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-cyber-textMuted mb-3">编程语言</p>
                <div className="flex flex-wrap gap-2">
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                        selectedLanguage === lang
                          ? 'bg-cyber-primary/20 text-cyber-primary border border-cyber-primary/50'
                          : 'bg-cyber-bg text-cyber-textMuted border border-cyber-border hover:border-cyber-primary/30'
                      }`}
                    >
                      {lang === 'all' ? '全部' : lang}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-cyber-textMuted mb-3">难度</p>
                <div className="flex flex-wrap gap-2">
                  {difficulties.map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedDifficulty === diff
                          ? 'bg-cyber-primary/20 text-cyber-primary border border-cyber-primary/50'
                          : 'bg-cyber-bg text-cyber-textMuted border border-cyber-border hover:border-cyber-primary/30'
                      }`}
                    >
                      {diff === 'all' ? '全部' : getDifficultyLabel(diff)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <p className="text-cyber-textMuted">
            共 <span className="text-cyber-primary font-medium">{filteredSnippets.length}</span> 个代码片段
          </p>
        </div>

        {filteredSnippets.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSnippets.map((snippet) => (
              <SnippetCard
                key={snippet.id}
                snippet={snippet}
                onClick={() => handleSnippetClick(snippet.id)}
                onDelete={snippet.isCustom ? () => handleDeleteSnippet(snippet.id) : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Code2 className="w-16 h-16 text-cyber-border mx-auto mb-4" />
            <p className="text-cyber-textMuted text-lg">没有找到匹配的代码片段</p>
            <p className="text-cyber-textMuted/70 text-sm mt-1">尝试调整筛选条件或添加自定义代码</p>
          </div>
        )}
      </div>
    </div>
  );
}
