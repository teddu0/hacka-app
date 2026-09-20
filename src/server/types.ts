import { z } from 'zod';

export const categories = ['Продукты', 'Кафе', 'Транспорт', 'Подписки', 'Здоровье', 'Развлечения', 'Покупки', 'Переводы', 'Другое'] as const;

export const transactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Дата должна быть в формате YYYY-MM-DD'),
  merchant: z.string().min(1),
  amount: z.number().positive(),
  type: z.enum(['expense', 'income', 'transfer']),
  category: z.enum(categories)
});

export const categoryAssignmentSchema = z.object({
  id: z.number().int().nonnegative(),
  category: z.enum(categories)
});

export const categorizationResultSchema = z.object({
  categories: z.array(categoryAssignmentSchema)
});

export const insightsResultSchema = z.object({
  insights: z.array(z.string().min(1)).min(1).max(3)
});

export type Transaction = z.infer<typeof transactionSchema>;
export type AnalysisResult = {
  period: { from: string; to: string };
  transactions: Transaction[];
  summary: { totalExpenses: number; transactionCount: number; topCategory: string; categories: Array<{ name: string; value: number }> };
  insights: string[];
};
