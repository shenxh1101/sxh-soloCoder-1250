import { useState } from 'react';
import { Code2, Trophy, Plus, User, ChevronDown } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

export function Navbar() {
  const location = useLocation();
  const { currentPlayer, setCurrentPlayer, players } = useAppStore();
  const [showPlayerMenu, setShowPlayerMenu] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);

  const navItems = [
    { path: '/', label: '题库', icon: Code2 },
    { path: '/leaderboard', label: '排行榜', icon: Trophy },
    { path: '/custom', label: '添加代码', icon: Plus },
  ];

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      setCurrentPlayer(newPlayerName.trim());
      setNewPlayerName('');
      setIsAddingPlayer(false);
      setShowPlayerMenu(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-cyber-bg/80 backdrop-blur-lg border-b border-cyber-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-primary to-cyber-secondary flex items-center justify-center">
            <Code2 className="w-5 h-5 text-black" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-cyber-primary to-cyber-secondary bg-clip-text text-transparent">
            CodeType
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-cyber-primary/10 text-cyber-primary'
                      : 'text-cyber-textMuted hover:text-cyber-text hover:bg-cyber-card'
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowPlayerMenu(!showPlayerMenu)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-card border border-cyber-border hover:border-cyber-primary/30 transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyber-primary/20 to-cyber-secondary/20 flex items-center justify-center">
                <User size={14} className="text-cyber-primary" />
              </div>
              <span className="text-sm font-medium text-cyber-text max-w-[100px] truncate">
                {currentPlayer}
              </span>
              <ChevronDown size={16} className="text-cyber-textMuted" />
            </button>

            {showPlayerMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-cyber-card border border-cyber-border rounded-xl shadow-xl overflow-hidden z-50">
                <div className="p-3 border-b border-cyber-border">
                  <p className="text-xs text-cyber-textMuted mb-2">切换玩家</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {players.map((player) => (
                      <button
                        key={player.name}
                        onClick={() => {
                          setCurrentPlayer(player.name);
                          setShowPlayerMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          player.name === currentPlayer
                            ? 'bg-cyber-primary/10 text-cyber-primary'
                            : 'text-cyber-text hover:bg-cyber-bgAlt'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{player.name}</span>
                          <span className="text-xs text-cyber-textMuted">
                            {player.totalGames} 局
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {isAddingPlayer ? (
                  <div className="p-3 space-y-2">
                    <input
                      type="text"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      placeholder="输入玩家名称"
                      className="w-full px-3 py-2 text-sm bg-cyber-bg border border-cyber-border rounded-lg text-cyber-text focus:outline-none focus:border-cyber-primary"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setIsAddingPlayer(false);
                          setNewPlayerName('');
                        }}
                        className="flex-1 px-3 py-1.5 text-sm text-cyber-textMuted hover:text-cyber-text"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleAddPlayer}
                        className="flex-1 px-3 py-1.5 text-sm bg-cyber-primary/10 text-cyber-primary rounded-lg"
                      >
                        添加
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingPlayer(true)}
                    className="w-full p-3 text-sm text-cyber-primary hover:bg-cyber-bgAlt transition-colors text-left"
                  >
                    + 添加新玩家
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
