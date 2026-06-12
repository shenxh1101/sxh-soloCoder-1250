import { create } from 'zustand';
import { Tournament, TournamentPlayer, TypingRecord } from '../types';
import {
  generateId,
  saveTournament as saveTournamentToStorage,
  getTournamentById,
  setActiveTournamentId,
  getActiveTournamentId,
  getAllTournaments,
} from '../utils/storage';

interface TournamentState {
  tournament: Tournament | null;

  createTournament: (snippetId: string, snippetTitle: string, playerNames: string[]) => void;
  setPlayerRecord: (playerIndex: number, record: TypingRecord) => void;
  nextPlayer: () => void;
  finishTournament: () => void;
  resetTournament: () => void;
  getRankedPlayers: () => TournamentPlayer[];
  loadTournament: (id: string) => Tournament | null;
  loadActiveTournament: () => void;
  listTournaments: () => Tournament[];
}

function persist(t: Tournament | null): void {
  if (t) {
    saveTournamentToStorage(t);
    setActiveTournamentId(t.id);
  }
}

export const useTournamentStore = create<TournamentState>((set, get) => ({
  tournament: null,

  createTournament: (snippetId, snippetTitle, playerNames) => {
    const players: TournamentPlayer[] = playerNames.map(name => ({
      name,
      finished: false,
    }));

    const newTournament: Tournament = {
      id: generateId(),
      snippetId,
      snippetTitle,
      players,
      currentPlayerIndex: 0,
      status: 'in_progress',
      createdAt: Date.now(),
    };

    persist(newTournament);
    set({ tournament: newTournament });
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

      const updated = {
        ...state.tournament,
        players,
      };
      persist(updated);
      return { tournament: updated };
    });
  },

  nextPlayer: () => {
    set((state) => {
      if (!state.tournament) return state;

      const nextIndex = state.tournament.currentPlayerIndex + 1;
      const allFinished = nextIndex >= state.tournament.players.length;

      const updated: Tournament = {
        ...state.tournament,
        currentPlayerIndex: nextIndex,
        status: allFinished ? 'finished' : 'in_progress',
        finishedAt: allFinished ? Date.now() : undefined,
      };
      persist(updated);
      return { tournament: updated };
    });
  },

  finishTournament: () => {
    set((state) => {
      if (!state.tournament) return state;
      const updated: Tournament = {
        ...state.tournament,
        status: 'finished',
        finishedAt: Date.now(),
      };
      persist(updated);
      return { tournament: updated };
    });
  },

  resetTournament: () => {
    setActiveTournamentId(null);
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

  loadTournament: (id) => {
    const t = getTournamentById(id);
    if (t) {
      set({ tournament: t });
      setActiveTournamentId(t.id);
    }
    return t;
  },

  loadActiveTournament: () => {
    const id = getActiveTournamentId();
    if (id) {
      const t = getTournamentById(id);
      if (t) {
        set({ tournament: t });
      }
    }
  },

  listTournaments: () => {
    return getAllTournaments().sort((a, b) => b.createdAt - a.createdAt);
  },
}));
