import { describe, expect, it } from 'vitest';
import { getCategories, getTransactionPage, getVisibleTransactions, transactionsPerPage, type Transaction } from '../src/client/transaction-list.js';

const transactions: Transaction[] = [
  { date: '2026-09-03', merchant: 'Coffee', amount: 1200, type: 'expense', category: 'Кафе' },
  { date: '2026-09-01', merchant: 'Market', amount: 3400, type: 'expense', category: 'Продукты' },
  { date: '2026-09-02', merchant: 'Bus', amount: 600, type: 'expense', category: 'Транспорт' }
];

describe('transaction list', () => {
  it('returns unique category options in alphabetical order', () => {
    expect(getCategories(transactions)).toEqual(['Кафе', 'Продукты', 'Транспорт']);
  });

  it('filters by category before sorting the result', () => {
    expect(getVisibleTransactions(transactions, 'Продукты', 'amount', 'ascending'))
      .toEqual([transactions[1]]);
  });

  it('sorts by date, category, and amount in both directions', () => {
    expect(getVisibleTransactions(transactions, '', 'date', 'ascending').map((item) => item.merchant))
      .toEqual(['Market', 'Bus', 'Coffee']);
    expect(getVisibleTransactions(transactions, '', 'category', 'descending').map((item) => item.category))
      .toEqual(['Транспорт', 'Продукты', 'Кафе']);
    expect(getVisibleTransactions(transactions, '', 'amount', 'descending').map((item) => item.amount))
      .toEqual([3400, 1200, 600]);
  });

  it('returns 25 transactions per page and keeps page numbers in range', () => {
    const items = Array.from({ length: 51 }, (_, index) => index + 1);

    expect(getTransactionPage(items, 2)).toEqual({
      currentPage: 2,
      totalPages: 3,
      transactions: items.slice(transactionsPerPage, transactionsPerPage * 2)
    });
    expect(getTransactionPage(items, 99).currentPage).toBe(3);
    expect(getTransactionPage([], 1)).toEqual({ currentPage: 1, totalPages: 1, transactions: [] });
  });
});
