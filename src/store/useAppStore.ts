import { create } from 'zustand';
import { CodeSnippet, TypingRecord, Player, RecordType } from '../types';
import { defaultSnippets } from '../data/snippets';
import {
  getCustomSnippets,
  saveCustomSnippet as saveSnippetToStorage,
  deleteCustomSnippet as deleteSnippetFromStorage,
  getTypingRecords,
  saveTypingRecord as saveRecordToStorage,
  getCurrentPlayer,
  setCurrentPlayer as setPlayerToStorage,
  getPlayers,
  generateId,
  savePlayers as savePlayersToStorage,
} from '../utils/storage';

interface AppState {
  snippets: CodeSnippet[];
  records: TypingRecord[];
  currentPlayer: string;
  players: Player[];
  currentRecord: TypingRecord | null;

  loadData: () => void;
  addCustomSnippet: (snippet: Omit<CodeSnippet, 'id' | 'isCustom' | 'createdAt'>) => void;
  deleteSnippet: (id: string) => void;
  getSnippetById: (id: string) => CodeSnippet | undefined;
  setCurrentPlayer: (name: string) => void;
  saveRecord: (
    record: Omit<TypingRecord, 'id' | 'timestamp' | 'recordType'> & { recordType?: RecordType }
  ) => TypingRecord;
  getRecordsForSnippet: (snippetId: string, recordType?: RecordType) => TypingRecord[];
  getChallengeRecords: () => TypingRecord[];
  getTrainingRecords: () => TypingRecord[];
  getRecordsForPlayer: (playerName: string, recordType?: RecordType) => TypingRecord[];
  setCurrentRecord: (record: TypingRecord | null) => void;
  recomputePlayers: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  snippets: [],
  records: [],
  currentPlayer: 'Player1',
  players: [],
  currentRecord: null,

  loadData: () => {
    const customSnippets = getCustomSnippets();
    const allSnippets = [...defaultSnippets, ...customSnippets];
    const rawRecords = getTypingRecords();
    const records = rawRecords.map(r => ({
      ...r,
      recordType: (r as any).recordType || 'challenge',
    })) as TypingRecord[];
    const currentPlayer = getCurrentPlayer();

    const playersMap = new Map<string, Player>();
    records.forEach(record => {
      if (record.recordType !== 'challenge') return;
      const existing = playersMap.get(record.playerName);
      if (!existing) {
        playersMap.set(record.playerName, {
          name: record.playerName,
          totalGames: 1,
          bestCpm: record.cpm,
          bestAccuracy: record.accuracy,
        });
      } else {
        existing.totalGames += 1;
        existing.bestCpm = Math.max(existing.bestCpm, record.cpm);
        existing.bestAccuracy = Math.max(existing.bestAccuracy, record.accuracy);
      }
    });

    const storedPlayers = getPlayers();
    storedPlayers.forEach(p => {
      if (!playersMap.has(p.name)) {
        playersMap.set(p.name, p);
      }
    });

    const players = Array.from(playersMap.values());
    savePlayersToStorage(players);

    set({
      snippets: allSnippets,
      records,
      currentPlayer,
      players,
    });
  },

  recomputePlayers: () => {
    const records = get().records;
    const playersMap = new Map<string, Player>();
    records.forEach(record => {
      if (record.recordType !== 'challenge') return;
      const existing = playersMap.get(record.playerName);
      if (!existing) {
        playersMap.set(record.playerName, {
          name: record.playerName,
          totalGames: 1,
          bestCpm: record.cpm,
          bestAccuracy: record.accuracy,
        });
      } else {
        existing.totalGames += 1;
        existing.bestCpm = Math.max(existing.bestCpm, record.cpm);
        existing.bestAccuracy = Math.max(existing.bestAccuracy, record.accuracy);
      }
    });
    const storedPlayers = getPlayers();
    storedPlayers.forEach(p => {
      if (!playersMap.has(p.name)) {
        playersMap.set(p.name, p);
      }
    });
    const players = Array.from(playersMap.values());
    savePlayersToStorage(players);
    set({ players });
  },

  addCustomSnippet: (snippetData) => {
    const newSnippet: CodeSnippet = {
      ...snippetData,
      id: generateId(),
      isCustom: true,
      createdAt: Date.now(),
    };

    saveSnippetToStorage(newSnippet);

    set((state) => ({
      snippets: [...state.snippets, newSnippet],
    }));
  },

  deleteSnippet: (id) => {
    deleteSnippetFromStorage(id);

    set((state) => ({
      snippets: state.snippets.filter((s) => s.id !== id),
    }));
  },

  getSnippetById: (id) => {
    return get().snippets.find((s) => s.id === id);
  },

  setCurrentPlayer: (name) => {
    setPlayerToStorage(name);
    set({ currentPlayer: name });
  },

  saveRecord: (recordData) => {
    const recordType: RecordType = recordData.recordType || 'challenge';
    const newRecord: TypingRecord = {
      ...recordData,
      recordType,
      id: generateId(),
      timestamp: Date.now(),
    } as TypingRecord;

    saveRecordToStorage(newRecord);

    if (recordType === 'challenge') {
      get().recomputePlayers();
    } else {
      set((state) => ({
        records: [...state.records, newRecord],
      }));
    }

    return newRecord;
  },

  getRecordsForSnippet: (snippetId, recordType) => {
    return get()
      .records.filter((r) => {
        if (r.snippetId !== snippetId) return false;
        if (recordType && r.recordType !== recordType) return false;
        return true;
      })
      .sort((a, b) => {
        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
        if (b.cpm !== a.cpm) return b.cpm - a.cpm;
        return a.totalTime - b.totalTime;
      });
  },

  getChallengeRecords: () => {
    return get().records.filter((r) => r.recordType === 'challenge');
  },

  getTrainingRecords: () => {
    return get().records.filter((r) => r.recordType === 'training');
  },

  getRecordsForPlayer: (playerName, recordType) => {
    return get().records.filter((r) => {
      if (r.playerName !== playerName) return false;
      if (recordType && r.recordType !== recordType) return false;
      return true;
    }).sort((a, b) => a.timestamp - b.timestamp);
  },

  setCurrentRecord: (record) => {
    set({ currentRecord: record });
  },
}));
