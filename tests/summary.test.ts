import { describe, expect, it } from 'vitest';
import { buildAnalysis } from '../src/server/summary.js';

describe('buildAnalysis', () => {
  it('counts only expenses and sorts categories by total', () => {
    const result = buildAnalysis([
      { date: '2026-09-01', merchant: 'Market', amount: 1200, type: 'expense', category: 'Продукты' },
      { date: '2026-09-02', merchant: 'Bus', amount: 100, type: 'expense', category: 'Транспорт' },
      { date: '2026-09-03', merchant: 'Salary', amount: 10000, type: 'income', category: 'Другое' }
    ], ['Продукты — крупнейшая статья расходов.']);
    expect(result.summary.totalExpenses).toBe(1300);
    expect(result.summary.transactionCount).toBe(2);
    expect(result.summary.topCategory).toBe('Продукты');
    expect(result.period).toEqual({ from: '2026-09-01', to: '2026-09-03' });
  });
});
