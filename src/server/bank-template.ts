export class TemplateError extends Error {}

/**
 * The first version intentionally supports one bank. Once its sample PDF is available,
 * adjust these signatures and date/currency patterns instead of touching the API flow.
 */
export const bankStatementTemplate = {
  name: process.env.BANK_TEMPLATE_NAME ?? 'Настраиваемый шаблон банка',
  validate(text: string) {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (normalized.length < 80) throw new TemplateError('В PDF недостаточно текста. Загрузите текстовую банковскую выписку, а не скан.');
    if (process.env.BANK_TEMPLATE_VALIDATION === 'false') return normalized;
    const dateMatches = normalized.match(/\b\d{2}[./-]\d{2}[./-]\d{2,4}\b/g) ?? [];
    const moneyMatches = normalized.match(/\b\d[\d\s]*[,.]\d{2}\b/g) ?? [];
    if (dateMatches.length < 2 || moneyMatches.length < 1) {
      throw new TemplateError('Файл не похож на выписку ожидаемого банка. Проверьте период и формат PDF.');
    }
    return normalized;
  }
};
