import OpenAI from 'openai';
import { bankStatementTemplate } from './bank-template.js';
import { aiResultSchema, categories, type AnalysisResult } from './types.js';
import { buildAnalysis } from './summary.js';

const schema = {
  type: 'object', additionalProperties: false, required: ['transactions', 'insights'],
  properties: {
    transactions: {
      type: 'array', minItems: 1,
      items: {
        type: 'object', additionalProperties: false,
        required: ['date', 'merchant', 'amount', 'type', 'category'],
        properties: {
          date: { type: 'string', description: 'Date as YYYY-MM-DD when possible' },
          merchant: { type: 'string' }, amount: { type: 'number', minimum: 0.01 },
          type: { type: 'string', enum: ['expense', 'income', 'transfer'] },
          category: { type: 'string', enum: [...categories] }
        }
      }
    },
    insights: { type: 'array', minItems: 1, maxItems: 3, items: { type: 'string' } }
  }
} as const;

export async function analyzeStatement(pdfText: string): Promise<AnalysisResult> {
  const statement = bankStatementTemplate.validate(pdfText);
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL ?? 'gpt-5.5',
    store: false,
    input: `You analyze a bank statement from ${bankStatementTemplate.name}. Extract every transaction. Amounts must be positive. Categorize expenses only using the allowed Russian categories. Transfers are not expenses. Produce up to 3 concise Russian observations grounded only in the extracted transactions. Statement:\n\n${statement}`,
    text: { format: { type: 'json_schema', name: 'bank_statement_analysis', strict: true, schema } }
  });
  let parsed: unknown;
  try { parsed = JSON.parse(response.output_text); } catch { throw new Error('AI returned an unreadable result'); }
  const result = aiResultSchema.safeParse(parsed);
  if (!result.success) throw new Error('AI returned a result that does not match the expected schema');
  return buildAnalysis(result.data.transactions, result.data.insights);
}
