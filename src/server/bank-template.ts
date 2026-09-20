export class TemplateError extends Error {}

export type ParsedStatementTransaction = {
  date: string;
  merchant: string;
  amount: number;
  type: 'expense' | 'income' | 'transfer';
};

const kaspiBankSignature = /АО\s*[«"]?Kaspi\s+Bank[»"]?/iu;
const kaspiGoldPeriod = /ВЫПИСКА\s+по\s+Kaspi\s+Gold\s+за\s+период\s+с\s+\d{2}[./-]\d{2}[./-]\d{2,4}\s+по\s+\d{2}[./-]\d{2}[./-]\d{2,4}/iu;
const operationTableHeader = /Дата\s*Сумма\s*Операция\s*Детали/iu;
const operationRow = /\b\d{2}[./-]\d{2}[./-]\d{2,4}\s*[+-]\s*\d[\d\s]*[,.]\d{2}\s*₸\s*(?:Покупка|Перевод|Пополнение|Снятие)(?=\s|$)/giu;
const transactionStart = /(?<date>\d{2}[./-]\d{2}[./-]\d{2,4})\s*(?<sign>[+-])\s*(?<amount>\d[\d\s]*[,.]\d{2})\s*₸\s*(?<operation>Покупка|Перевод|Пополнение|Снятие)\s*/giu;

function normalizeDate(value: string): string {
  const [day, month, rawYear] = value.split(/[./-]/);
  const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
  return `${year}-${month}-${day}`;
}

function parseAmount(value: string): number {
  return Number(value.replace(/\s/g, '').replace(',', '.'));
}

function transactionType(operation: string): ParsedStatementTransaction['type'] {
  if (operation === 'Перевод') return 'transfer';
  if (operation === 'Пополнение') return 'income';
  return 'expense';
}

export const bankStatementTemplate = {
  name: 'Kaspi Bank (Kaspi Gold)',
  validate(text: string) {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (normalized.length < 80) {
      throw new TemplateError('В PDF недостаточно текста. Загрузите экспортированную выписку Kaspi Gold, а не скан.');
    }
    if (!kaspiBankSignature.test(normalized)) {
      throw new TemplateError('Поддерживаются только выписки Kaspi Bank по Kaspi Gold.');
    }
    if (!kaspiGoldPeriod.test(normalized)) {
      throw new TemplateError('Не найден заголовок выписки Kaspi Gold с периодом. Выберите экспортированную выписку из Kaspi.');
    }
    if (!operationTableHeader.test(normalized)) {
      throw new TemplateError('Не найдена таблица операций Kaspi Gold. Выберите полную выписку, а не справку об остатке.');
    }
    const operations = normalized.match(operationRow) ?? [];
    if (operations.length === 0) {
      throw new TemplateError('В выписке Kaspi Gold не найдены строки операций в ожидаемом формате.');
    }
    return normalized;
  },
  parse(text: string): ParsedStatementTransaction[] {
    const statement = this.validate(text);
    const matches = [...statement.matchAll(transactionStart)];
    const transactions = matches.map((match, index) => {
      const groups = match.groups!;
      const nextStart = matches[index + 1]?.index ?? statement.length;
      const merchant = statement.slice((match.index ?? 0) + match[0].length, nextStart).trim();
      const amount = parseAmount(groups.amount);
      if (!merchant || !Number.isFinite(amount) || amount <= 0) {
        throw new TemplateError('Не удалось строго разобрать строку операции Kaspi Gold.');
      }
      return { date: normalizeDate(groups.date), merchant, amount, type: transactionType(groups.operation) };
    });
    if (transactions.length === 0) {
      throw new TemplateError('В выписке Kaspi Gold не найдены строки операций в ожидаемом формате.');
    }
    return transactions;
  }
};
