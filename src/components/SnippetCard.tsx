import { Code2, Clock, Trash2 } from 'lucide-react';
import { CodeSnippet } from '../types';
import { getLanguageColor, getDifficultyColor, getDifficultyLabel } from '../utils/codeAnalyzer';

interface SnippetCardProps {
  snippet: CodeSnippet;
  onClick: () => void;
  onDelete?: () => void;
}

export function SnippetCard({ snippet, onClick, onDelete }: SnippetCardProps) {
  const langColor = getLanguageColor(snippet.language);
  const diffColor = getDifficultyColor(snippet.difficulty);

  const previewLines = snippet.code.split('\n').slice(0, 3);

  return (
    <div
      onClick={onClick}
      className="card-neon p-5 cursor-pointer group relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyber-primary to-cyber-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {snippet.isCustom && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-3 right-3 p-1.5 rounded-lg bg-cyber-bgAlt text-cyber-textMuted hover:text-cyber-error hover:bg-cyber-error/10 transition-colors opacity-0 group-hover:opacity-100 z-10"
        >
          <Trash2 size={14} />
        </button>
      )}

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${langColor}20` }}
          >
            <Code2 size={16} style={{ color: langColor }} />
          </div>
          <div>
            <h3 className="font-semibold text-cyber-text group-hover:text-cyber-primary transition-colors">
              {snippet.title}
            </h3>
            <p className="text-xs text-cyber-textMuted capitalize">
              {snippet.language}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span
          className="px-2 py-0.5 rounded text-xs font-medium"
          style={{ backgroundColor: `${diffColor}20`, color: diffColor }}
        >
          {getDifficultyLabel(snippet.difficulty)}
        </span>
        <span className="flex items-center gap-1 text-xs text-cyber-textMuted">
          <Clock size={12} />
          约 {Math.ceil(snippet.code.length / 300)} 分钟
        </span>
      </div>

      <div className="bg-cyber-bg rounded-lg p-3 overflow-hidden font-mono text-xs leading-relaxed">
        {previewLines.map((line, i) => (
          <div key={i} className="text-cyber-textMuted truncate">
            {line || ' '}
          </div>
        ))}
        {snippet.code.split('\n').length > 3 && (
          <div className="text-cyber-textMuted/50">...</div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-cyber-textMuted">
        <span>{snippet.code.length} 字符</span>
        <span className="text-cyber-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          开始挑战
          <span>→</span>
        </span>
      </div>
    </div>
  );
}
