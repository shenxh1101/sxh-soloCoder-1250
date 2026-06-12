import { create } from 'zustand';
import { CodeSnippet, TypingRecord, Player } from '../types';
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
  saveRecord: (record: Omit<TypingRecord, 'id' | 'timestamp'>) => TypingRecord;
  getRecordsForSnippet: (snippetId: string) => TypingRecord[];
  setCurrentRecord: (record: TypingRecord | null) => void;
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
    const records = getTypingRecords();
    const currentPlayer = getCurrentPlayer();
    const players = getPlayers();

    set({
      snippets: allSnippets,
      records,
      currentPlayer,
      players,
    });
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
    const newRecord: TypingRecord = {
      ...recordData,
      id: generateId(),
      timestamp: Date.now(),
    };
    
    saveRecordToStorage(newRecord);
    
    const players = getPlayers();
    
    set((state) => ({
      records: [...state.records, newRecord],
      players,
    }));
    
    return newRecord;
  },

  getRecordsForSnippet: (snippetId) => {
    return get()
      .records.filter((r) => r.snippetId === snippetId)
      .sort((a, b) => {
        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
        if (b.cpm !== a.cpm) return b.cpm - a.cpm;
        return a.totalTime - b.totalTime;
      });
  },

  setCurrentRecord: (record) => {
    set({ currentRecord: record });
  },
}));
