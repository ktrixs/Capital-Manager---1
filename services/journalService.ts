import { Bet, CycleState, AllocationState } from "../types";

const STORAGE_KEY = 'alphabet_bets_v1';
const BANKROLL_KEY = 'alphabet_bankroll_v1';
const CYCLE_KEY = 'alphabet_cycle_v1';
const ALLOCATION_KEY = 'alphabet_allocation_v1';

export const getBets = (): Bet[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveBet = (bet: Bet): Bet[] => {
  const bets = getBets();
  // Check if update or new
  const index = bets.findIndex(b => b.id === bet.id);
  if (index >= 0) {
    bets[index] = bet;
  } else {
    bets.push(bet);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bets));
  return bets;
};

export const deleteBet = (id: string): Bet[] => {
  const bets = getBets().filter(b => b.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bets));
  return bets;
};

export const clearJournal = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const getStartingBankroll = (): number => {
  const data = localStorage.getItem(BANKROLL_KEY);
  return data ? parseFloat(data) : 10000;
};

export const saveStartingBankroll = (amount: number): number => {
  localStorage.setItem(BANKROLL_KEY, amount.toString());
  return amount;
};

export const getCycleState = (): CycleState | null => {
  const data = localStorage.getItem(CYCLE_KEY);
  return data ? JSON.parse(data) : null;
};

export const saveCycleState = (state: CycleState) => {
  localStorage.setItem(CYCLE_KEY, JSON.stringify(state));
};

export const getAllocationState = (): AllocationState | null => {
  const data = localStorage.getItem(ALLOCATION_KEY);
  return data ? JSON.parse(data) : null;
};

export const saveAllocationState = (state: AllocationState) => {
  localStorage.setItem(ALLOCATION_KEY, JSON.stringify(state));
};