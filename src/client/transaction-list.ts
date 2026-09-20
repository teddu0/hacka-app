export type Transaction = {
  date: string;
  merchant: string;
  amount: number;
  type: string;
  category: string;
};

export type SortField = 'date' | 'category' | 'amount';
export type SortDirection = 'ascending' | 'descending';
export const transactionsPerPage = 25;

export function getCategories(transactions: Transaction[]) {
  return [...new Set(transactions.map((transaction) => transaction.category))]
    .sort((left, right) => left.localeCompare(right, 'ru'));
}

export function getVisibleTransactions(
  transactions: Transaction[],
  category: string,
  sortField: SortField,
  sortDirection: SortDirection
) {
  const direction = sortDirection === 'ascending' ? 1 : -1;

  return transactions
    .filter((transaction) => !category || transaction.category === category)
    .map((transaction, index) => ({ transaction, index }))
    .sort((left, right) => {
      let comparison: number;
      if (sortField === 'amount') comparison = left.transaction.amount - right.transaction.amount;
      else if (sortField === 'date') comparison = left.transaction.date.localeCompare(right.transaction.date);
      else comparison = left.transaction.category.localeCompare(right.transaction.category, 'ru');
      return comparison === 0 ? left.index - right.index : comparison * direction;
    })
    .map(({ transaction }) => transaction);
}

export function getTransactionPage<T>(transactions: T[], page: number, perPage = transactionsPerPage) {
  const totalPages = Math.max(1, Math.ceil(transactions.length / perPage));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * perPage;

  return {
    currentPage,
    totalPages,
    transactions: transactions.slice(start, start + perPage)
  };
}
