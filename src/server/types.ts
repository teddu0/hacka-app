import { z } from 'zod';

export const categories = ['Продукты', 'Кафе', 'Транспорт', 'Подписки', 'Здоровье', 'Развлечения', 'Покупки', 'Переводы', 'Другое'] as const;

export const transactionSchema = z.object({
  date: z.string(),
  merchant: z.string().min(1),
  amount: z.number().positive(),
  type: z.enum(['expense', 'income', 'transfer']),
  category: z.enum(categories)
});

export const aiResultSchema = z.object({
  transactions: z.array(transactionSchema).min(1),
  insights: z.array(z.string().min(1)).min(1).max(3)
});

export type Transaction = z.infer<typeof transactionSchema>;
export type AnalysisResult = {
  period: { from: string; to: string };
  transactions: Transaction[];
  summary: { totalExpenses: number; transactionCount: number; topCategory: string; categories: Array<{ name: string; value: number }> };
  insights: string[];
};
