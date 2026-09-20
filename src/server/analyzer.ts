import OpenAI from 'openai';
import { bankStatementTemplate } from './bank-template.js';
import { categories, categorizationResultSchema, insightsResultSchema, type AnalysisResult, type Transaction } from './types.js';
import { buildAnalysis } from './summary.js';

const maxCategorizationBatchSize = 100;

const categorizationSchema = {
  type: 'object', additionalProperties: false, required: ['categories'],
  properties: {
    categories: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['id', 'category'],
        properties: {
          id: { type: 'integer', minimum: 0 },
          category: { type: 'string', enum: [...categories] }
        }
      }
    }
  }
} as const;

const insightsSchema = {
  type: 'object', additionalProperties: false, required: ['insights'],
  properties: { insights: { type: 'array', minItems: 1, maxItems: 3, items: { type: 'string' } } }
} as const;

function parseOutput(response: OpenAI.Responses.Response): unknown {
  try { return JSON.parse(response.output_text); } catch { throw new Error('AI returned an unreadable result'); }
}

export async function analyzeStatement(pdfText: string): Promise<AnalysisResult> {
  const parsedTransactions = bankStatementTemplate.parse(pdfText);
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const transactions: Transaction[] = parsedTransactions.map((transaction) => ({
    ...transaction,
    category: transaction.type === 'transfer' ? 'Переводы' : 'Другое'
  }));
  const expenses = transactions
    .map((transaction, id) => ({ id, transaction }))
    .filter(({ transaction }) => transaction.type === 'expense');

  for (let start = 0; start < expenses.length; start += maxCategorizationBatchSize) {
    const batch = expenses.slice(start, start + maxCategorizationBatchSize);
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-5.5',
      store: false,
      input: `Categorize every expense below using only the allowed Russian categories. The server parsed these records from a ${bankStatementTemplate.name} statement; do not add, remove, alter, or infer transactions. Return exactly one category for every id.\n\n${JSON.stringify(batch.map(({ id, transaction }) => ({ id, merchant: transaction.merchant, amount: transaction.amount })))}`,
      text: { format: { type: 'json_schema', name: 'expense_categories', strict: true, schema: categorizationSchema } }
    });
    const result = categorizationResultSchema.safeParse(parseOutput(response));
    const expectedIds = new Set(batch.map(({ id }) => id));
    if (!result.success || result.data.categories.length !== expectedIds.size || result.data.categories.some(({ id }) => !expectedIds.delete(id))) {
      throw new Error('AI returned incomplete expense categories');
    }
    for (const { id, category } of result.data.categories) transactions[id].category = category;
  }

  const insightsResponse = await client.responses.create({
    model: process.env.OPENAI_MODEL ?? 'gpt-5.5',
    store: false,
    input: `Produce up to 3 concise Russian observations grounded only in these parsed and categorized bank-statement transactions:\n\n${JSON.stringify(transactions)}`,
    text: { format: { type: 'json_schema', name: 'statement_insights', strict: true, schema: insightsSchema } }
  });
  const insights = insightsResultSchema.safeParse(parseOutput(insightsResponse));
  if (!insights.success) throw new Error('AI returned insights that do not match the expected schema');
  return buildAnalysis(transactions, insights.data.insights);
}
