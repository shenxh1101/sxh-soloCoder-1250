import { create } from 'zustand';
import { Tournament, TournamentPlayer, TypingRecord } from '../types';
import { generateId } from '../utils/storage';

interface TournamentState {
  tournament: Tournament | null;
  createTournament: (snippetId: string, snippetTitle: string, playerNames: string[]) => void;
  setPlayerRecord: (playerIndex: number, record: TypingRecord) => void;
  nextPlayer: () => void;
  finishTournament: () => void;
  resetTournament: () => void;
  getRankedPlayers: () => TournamentPlayer[];
}

export const useTournamentStore = create<TournamentState>((set, get) => ({
  tournament: null,

  createTournament: (snippetId, snippetTitle, playerNames) => {
    const players: TournamentPlayer[] = playerNames.map(name => ({
      name,
      finished: false,
    }));

    set({
      tournament: {
        id: generateId(),
        snippetId,
        snippetTitle,
        players,
        currentPlayerIndex: 0,
        status: 'in_progress',
        createdAt: Date.now(),
      },
    });
  },

  setPlayerRecord: (playerIndex, record) => {
    set((state) => {
      if (!state.tournament) return state;
      
      const players = [...state.tournament.players];
      players[playerIndex] = {
        ...players[playerIndex],
        record,
        finished: true,
      };

      return {
        tournament: {
          ...state.tournament,
          players,
        },
      };
    });
  },

  nextPlayer: () => {
    set((state) => {
      if (!state.tournament) return state;
      
      const nextIndex = state.tournament.currentPlayerIndex + 1;
      const allFinished = nextIndex >= state.tournament.players.length;

      return {
        tournament: {
          ...state.tournament,
          currentPlayerIndex: nextIndex,
          status: allFinished ? 'finished' : 'in_progress',
        },
      };
    });
  },

  finishTournament: () => {
    set((state) => {
      if (!state.tournament) return state;
      return {
        tournament: {
          ...state.tournament,
          status: 'finished',
        },
      };
    });
  },

  resetTournament: () => {
    set({ tournament: null });
  },

  getRankedPlayers: () => {
    const { tournament } = get();
    if (!tournament) return [];
    
    return [...tournament.players]
      .filter(p => p.record)
      .sort((a, b) => {
        if (!a.record || !b.record) return 0;
        if (b.record.accuracy !== a.record.accuracy) return b.record.accuracy - a.record.accuracy;
        if (b.record.cpm !== a.record.cpm) return b.record.cpm - a.record.cpm;
        return a.record.totalTime - b.record.totalTime;
      });
  },
}));
