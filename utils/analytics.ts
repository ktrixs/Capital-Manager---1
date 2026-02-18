import { Bet, BetResult, JournalStats } from "../types";

export const calculateStats = (bets: Bet[], initialBankroll: number = 10000): JournalStats => {
  let currentBankroll = initialBankroll;
  let maxBankroll = initialBankroll;
  let maxDrawdown = 0;
  let totalStake = 0;
  let totalReturn = 0;
  let wins = 0;
  let settledBets = 0;
  let weightedOddsSum = 0;

  bets.forEach(bet => {
    if (bet.result === BetResult.PENDING) return;

    settledBets++;
    totalStake += bet.stake;
    weightedOddsSum += bet.odds * bet.stake;

    let profit = 0;
    if (bet.result === BetResult.WIN) {
      profit = (bet.stake * bet.odds) - bet.stake;
      wins++;
    } else if (bet.result === BetResult.LOSS) {
      profit = -bet.stake;
    } else if (bet.result === BetResult.HALF_WIN) {
        profit = (bet.stake * bet.odds - bet.stake) / 2;
        wins += 0.5;
    } else if (bet.result === BetResult.HALF_LOSS) {
        profit = -bet.stake / 2;
    }
    // Push result is 0 profit

    currentBankroll += profit;
    totalReturn += (bet.stake + profit);

    // Drawdown Calculation
    if (currentBankroll > maxBankroll) {
      maxBankroll = currentBankroll;
    }
    const drawdown = (maxBankroll - currentBankroll) / maxBankroll;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });

  const profit = currentBankroll - initialBankroll;

  return {
    totalBets: bets.length,
    totalStake,
    totalReturn,
    profit,
    roi: totalStake > 0 ? (profit / totalStake) * 100 : 0,
    yield: totalStake > 0 ? (profit / totalStake) * 100 : 0, // In this context similar to ROI but often distinct in turnover terms
    winRate: settledBets > 0 ? (wins / settledBets) * 100 : 0,
    maxDrawdown: maxDrawdown * 100,
    currentBankroll,
    averageOdds: totalStake > 0 ? weightedOddsSum / totalStake : 0
  };
};

export const generateBankrollChartData = (bets: Bet[], initialBankroll: number) => {
    let balance = initialBankroll;
    const data = bets
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((bet, index) => {
            if (bet.result === BetResult.PENDING) return null;
            
            let change = 0;
            if (bet.result === BetResult.WIN) change = (bet.stake * bet.odds) - bet.stake;
            else if (bet.result === BetResult.LOSS) change = -bet.stake;
            else if (bet.result === BetResult.HALF_WIN) change = ((bet.stake * bet.odds) - bet.stake) / 2;
            else if (bet.result === BetResult.HALF_LOSS) change = -bet.stake / 2;
            
            balance += change;
            return {
                name: `Bet ${index + 1}`,
                date: bet.date,
                balance: Number(balance.toFixed(2)),
                change: change
            };
        })
        .filter(Boolean);
    
    // Add start point
    return [{ name: 'Start', date: 'Start', balance: initialBankroll, change: 0 }, ...data];
};

export const calculateKelly = (
  decimalOdds: number,
  winProbability: number, // 0 to 1
  bankroll: number,
  kellyFraction: number
) => {
  const b = decimalOdds - 1;
  const p = winProbability;
  const q = 1 - p;

  if (b <= 0) return { stake: 0, percentage: 0 };

  const fullKelly = (b * p - q) / b;
  const adjustedKelly = fullKelly * kellyFraction;
  const stake = Math.max(0, adjustedKelly * bankroll);

  return {
    stake,
    percentage: adjustedKelly
  };
};