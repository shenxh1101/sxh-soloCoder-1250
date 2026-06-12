import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Code2, Play, Plus, X, Trophy, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useTournamentStore } from '../store/useTournamentStore';
import { CodeSnippet } from '../types';
import { SnippetCard } from '../components/SnippetCard';

export function TournamentSetup() {
  const navigate = useNavigate();
  const { snippets } = useAppStore();
  const { createTournament } = useTournamentStore();
  
  const [step, setStep] = useState<'snippet' | 'players'>('snippet');
  const [selectedSnippet, setSelectedSnippet] = useState<CodeSnippet | null>(null);
  const [playerNames, setPlayerNames] = useState<string[]>(['Player1']);
  const [newPlayerName, setNewPlayerName] = useState('');

  const handleAddPlayer = () => {
    const name = newPlayerName.trim();
    if (name && !playerNames.includes(name)) {
      setPlayerNames([...playerNames, name]);
      setNewPlayerName('');
    }
  };

  const handleRemovePlayer = (index: number) => {
    if (playerNames.length > 1) {
      setPlayerNames(playerNames.filter((_, i) => i !== index));
    }
  };

  const handleStart = () => {
    if (selectedSnippet && playerNames.length > 0) {
      createTournament(selectedSnippet.id, selectedSnippet.title, playerNames);
      navigate('/tournament/play');
    }
  };

  return (
    <div className="page-enter pt-24 pb-12 min-h-screen">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyber-secondary/20 to-cyber-primary/20 border border-cyber-secondary/30 mb-4">
            <Trophy className="w-8 h-8 text-cyber-secondary" />
          </div>
          <h1 className="text-3xl font-bold text-cyber-text mb-2">多人比赛模式</h1>
          <p className="text-cyber-textMuted">选择代码片段，添加玩家，开始挑战！</p>
        </div>

        <div className="flex items-center justify-center mb-10">
          <div className={`flex items-center gap-2 px-5 py-2 rounded-full transition-all ${
            step === 'snippet'
              ? 'bg-cyber-primary/20 text-cyber-primary border border-cyber-primary/50'
              : step === 'players'
              ? 'bg-cyber-success/20 text-cyber-success border border-cyber-success/50'
              : 'bg-cyber-card text-cyber-textMuted border border-cyber-border'
          }`}>
            <Code2 size={18} />
            <span className="font-medium">选择代码</span>
          </div>
          <ChevronRight className="mx-2 text-cyber-textMuted" />
          <div className={`flex items-center gap-2 px-5 py-2 rounded-full transition-all ${
            step === 'players'
              ? 'bg-cyber-primary/20 text-cyber-primary border border-cyber-primary/50'
              : 'bg-cyber-card text-cyber-textMuted border border-cyber-border'
          }`}>
            <Users size={18} />
            <span className="font-medium">添加玩家</span>
          </div>
        </div>

        {step === 'snippet' && (
          <div>
            <h2 className="text-xl font-semibold text-cyber-text mb-6">选择比赛用的代码片段</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {snippets.map((snippet) => (
                <div
                  key={snippet.id}
                  onClick={() => setSelectedSnippet(snippet)}
                  className={`cursor-pointer transition-all ${
                    selectedSnippet?.id === snippet.id
                      ? 'ring-2 ring-cyber-primary rounded-xl scale-[1.02]'
                      : ''
                  }`}
                >
                  <SnippetCard
                    snippet={snippet}
                    onClick={() => {}}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <div className="text-cyber-textMuted">
                {selectedSnippet ? (
                  <span>
                    已选择：<span className="text-cyber-primary">{selectedSnippet.title}</span>
                  </span>
                ) : (
                  <span>请选择一段代码</span>
                )}
              </div>
              <button
                onClick={() => setStep('players')}
                disabled={!selectedSnippet}
                className="btn-cyber btn-cyber-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一步
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 'players' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-cyber-text">添加参赛玩家</h2>
              <button
                onClick={() => setStep('snippet')}
                className="text-cyber-textMuted hover:text-cyber-primary text-sm"
              >
                ← 返回选择代码
              </button>
            </div>

            <div className="card-neon p-6 mb-8">
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  placeholder="输入玩家名称..."
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                  className="flex-1 px-4 py-3 bg-cyber-bg border border-cyber-border rounded-xl text-cyber-text placeholder-cyber-textMuted/50 focus:outline-none focus:border-cyber-primary/50 transition-colors"
                />
                <button
                  onClick={handleAddPlayer}
                  disabled={!newPlayerName.trim()}
                  className="btn-cyber btn-cyber-primary flex items-center gap-2 disabled:opacity-50"
                >
                  <Plus size={20} />
                  添加
                </button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {playerNames.map((name, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-4 py-3 bg-cyber-bg rounded-lg border border-cyber-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyber-primary/30 to-cyber-secondary/30 flex items-center justify-center text-sm font-bold text-cyber-primary">
                        {index + 1}
                      </div>
                      <span className="text-cyber-text font-medium">{name}</span>
                    </div>
                    {playerNames.length > 1 && (
                      <button
                        onClick={() => handleRemovePlayer(index)}
                        className="p-1 rounded hover:bg-cyber-error/10 text-cyber-textMuted hover:text-cyber-error transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {playerNames.length === 0 && (
                <div className="text-center py-8 text-cyber-textMuted">
                  请至少添加一位玩家
                </div>
              )}
            </div>

            <div className="card-neon p-6 mb-8">
              <h3 className="font-semibold text-cyber-text mb-3">比赛信息</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-cyber-textMuted">比赛题目</span>
                  <p className="text-cyber-primary font-medium mt-1">{selectedSnippet?.title}</p>
                </div>
                <div>
                  <span className="text-cyber-textMuted">参赛人数</span>
                  <p className="text-cyber-primary font-medium mt-1">{playerNames.length} 人</p>
                </div>
                <div>
                  <span className="text-cyber-textMuted">代码长度</span>
                  <p className="text-cyber-primary font-medium mt-1">{selectedSnippet?.code.length} 字符</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleStart}
                disabled={playerNames.length === 0}
                className="btn-cyber btn-cyber-primary px-12 py-4 text-lg flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed animate-glow"
              >
                <Play size={24} />
                开始比赛
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
