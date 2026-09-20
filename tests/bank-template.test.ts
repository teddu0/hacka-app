import { describe, expect, it } from 'vitest';
import { bankStatementTemplate, TemplateError } from '../src/server/bank-template.js';

const kaspiStatement = `
  АО «Kaspi Bank», БИК CASPKZKA, www.kaspi.kz
  ВЫПИСКА по Kaspi Gold за период с 01.01.26 по 17.08.26
  Номер карты: *5069 Номер счета: KZ60722C000084206814
  Дата Сумма Операция Детали
  17.08.26- 6 592,31 ₸ Покупка WOLT.COM
  16.08.26+ 10 000,00 ₸ Пополнение В Kaspi Банкомате
`;

describe('bank statement template', () => {
  it('rejects content that is not a statement', () => {
    expect(() => bankStatementTemplate.validate('too short')).toThrow(TemplateError);
  });
  it('accepts a Kaspi Gold statement for any period', () => {
    expect(bankStatementTemplate.validate(kaspiStatement)).toContain('Kaspi Gold');
  });
  it('rejects a statement from another bank even when it has transaction-like rows', () => {
    const anotherBank = kaspiStatement.replace('АО «Kaspi Bank», БИК CASPKZKA, www.kaspi.kz', 'АО «Другой Банк», БИК OTHERKZK');
    expect(() => bankStatementTemplate.validate(anotherBank)).toThrow('Поддерживаются только выписки Kaspi Bank');
  });
  it('rejects a Kaspi document without the Gold statement operation table', () => {
    const balanceCertificate = 'АО «Kaspi Bank», БИК CASPKZKA. СПРАВКА об остатке на счете. Сумма на счете в тенге 256 566,78 ₸. '.repeat(2);
    expect(() => bankStatementTemplate.validate(balanceCertificate)).toThrow('Не найден заголовок выписки Kaspi Gold');
  });
});
