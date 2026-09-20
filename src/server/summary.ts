import type { AnalysisResult, Transaction } from './types.js';

export function buildAnalysis(transactions: Transaction[], insights: string[]): AnalysisResult {
  const expenses = transactions.filter((item) => item.type === 'expense');
  const totals = new Map<string, number>();
  for (const item of expenses) totals.set(item.category, (totals.get(item.category) ?? 0) + item.amount);
  const categories = [...totals.entries()]
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);
  const dates = transactions.map((item) => item.date).sort();
  return {
    period: { from: dates[0] ?? '', to: dates.at(-1) ?? '' },
    transactions,
    summary: {
      totalExpenses: Math.round(expenses.reduce((sum, item) => sum + item.amount, 0) * 100) / 100,
      transactionCount: expenses.length,
      topCategory: categories[0]?.name ?? 'Нет расходов',
      categories
    },
    insights
  };
}
