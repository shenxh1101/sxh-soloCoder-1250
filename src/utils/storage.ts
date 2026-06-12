import { CodeSnippet, TypingRecord, Player } from '../types';

const SNIPPETS_KEY = 'codetype_snippets';
const RECORDS_KEY = 'codetype_records';
const CURRENT_PLAYER_KEY = 'codetype_current_player';
const PLAYERS_KEY = 'codetype_players';

export function getCustomSnippets(): CodeSnippet[] {
  try {
    const data = localStorage.getItem(SNIPPETS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveCustomSnippet(snippet: CodeSnippet): void {
  const snippets = getCustomSnippets();
  const existingIndex = snippets.findIndex(s => s.id === snippet.id);
  
  if (existingIndex >= 0) {
    snippets[existingIndex] = snippet;
  } else {
    snippets.push(snippet);
  }
  
  localStorage.setItem(SNIPPETS_KEY, JSON.stringify(snippets));
}

export function deleteCustomSnippet(id: string): void {
  const snippets = getCustomSnippets().filter(s => s.id !== id);
  localStorage.setItem(SNIPPETS_KEY, JSON.stringify(snippets));
}

export function getTypingRecords(): TypingRecord[] {
  try {
    const data = localStorage.getItem(RECORDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveTypingRecord(record: TypingRecord): void {
  const records = getTypingRecords();
  records.push(record);
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  updatePlayerStats(record);
}

export function getRecordsBySnippet(snippetId: string): TypingRecord[] {
  return getTypingRecords()
    .filter(r => r.snippetId === snippetId)
    .sort((a, b) => {
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      if (b.cpm !== a.cpm) return b.cpm - a.cpm;
      return a.totalTime - b.totalTime;
    });
}

export function getCurrentPlayer(): string {
  return localStorage.getItem(CURRENT_PLAYER_KEY) || 'Player1';
}

export function setCurrentPlayer(name: string): void {
  localStorage.setItem(CURRENT_PLAYER_KEY, name);
}

export function getPlayers(): Player[] {
  try {
    const data = localStorage.getItem(PLAYERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function updatePlayerStats(record: TypingRecord): void {
  const players = getPlayers();
  const existingIndex = players.findIndex(p => p.name === record.playerName);
  
  if (existingIndex >= 0) {
    const player = players[existingIndex];
    player.totalGames++;
    player.bestCpm = Math.max(player.bestCpm, record.cpm);
    player.bestAccuracy = Math.max(player.bestAccuracy, record.accuracy);
  } else {
    players.push({
      name: record.playerName,
      totalGames: 1,
      bestCpm: record.cpm,
      bestAccuracy: record.accuracy,
    });
  }
  
  localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
