export class TemplateError extends Error {}

const kaspiBankSignature = /АО\s*[«"]?Kaspi\s+Bank[»"]?/iu;
const kaspiGoldPeriod = /ВЫПИСКА\s+по\s+Kaspi\s+Gold\s+за\s+период\s+с\s+\d{2}[./-]\d{2}[./-]\d{2,4}\s+по\s+\d{2}[./-]\d{2}[./-]\d{2,4}/iu;
const operationTableHeader = /Дата\s*Сумма\s*Операция\s*Детали/iu;
const operationRow = /\b\d{2}[./-]\d{2}[./-]\d{2,4}\s*[+-]\s*\d[\d\s]*[,.]\d{2}\s*₸\s*(?:Покупка|Перевод|Пополнение|Снятие)(?=\s|$)/giu;

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
  }
};
