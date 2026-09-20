import { describe, expect, it } from 'vitest';
import { bankStatementTemplate, TemplateError } from '../src/server/bank-template.js';

describe('bank statement template', () => {
  it('rejects content that is not a statement', () => {
    expect(() => bankStatementTemplate.validate('too short')).toThrow(TemplateError);
  });
  it('accepts statement-like text', () => {
    const text = 'Банковская выписка за период 01.09.2026 - 30.09.2026. Операция магазин 01.09.2026 1 200,00 KZT. '.repeat(2);
    expect(bankStatementTemplate.validate(text)).toContain('Банковская выписка');
  });
});
