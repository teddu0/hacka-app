import { describe, expect, it } from 'vitest';
import { bankStatementTemplate } from '../src/server/bank-template.js';

describe('deterministic statement parsing', () => {
  it('extracts normalized operations without an AI call', () => {
    const statement = `АО «Kaspi Bank» ВЫПИСКА по Kaspi Gold за период с 01.01.26 по 17.08.26 Дата Сумма Операция Детали 17.08.26- 6 592,31 ₸ Покупка WOLT.COM 16.08.26+ 10 000,00 ₸ Пополнение В Kaspi Банкомате 15.08.26- 500,00 ₸ Перевод Иван Иванов`;
    expect(bankStatementTemplate.parse(statement)).toEqual([
      { date: '2026-08-17', merchant: 'WOLT.COM', amount: 6592.31, type: 'expense' },
      { date: '2026-08-16', merchant: 'В Kaspi Банкомате', amount: 10000, type: 'income' },
      { date: '2026-08-15', merchant: 'Иван Иванов', amount: 500, type: 'transfer' }
    ]);
  });
});
