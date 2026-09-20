import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

type Result = {
  period: { from: string; to: string };
  transactions: Array<{ date: string; merchant: string; amount: number; type: string; category: string }>;
  summary: { totalExpenses: number; transactionCount: number; topCategory: string; categories: Array<{ name: string; value: number }> };
  insights: string[];
};
const colors = ['#5B5BD6', '#0EA5A8', '#F59E0B', '#EF5B5B', '#8B5CF6', '#22C55E', '#EC4899', '#64748B', '#94A3B8'];
const money = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 });

export function App() {
  const [result, setResult] = useState<Result | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) return setError('Выберите PDF-выписку.');
    setError(''); setLoading(true);
    try {
      const body = new FormData(); body.append('statement', file);
      const response = await fetch('/api/analyze-statement', { method: 'POST', body });
      const data = await response.json() as Result & { error?: string };
      if (!response.ok) throw new Error(data.error ?? 'Ошибка анализа.');
      setResult(data);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Ошибка анализа.'); }
    finally { setLoading(false); }
  }

  if (result) return <Dashboard result={result} reset={() => { setResult(null); setFile(null); }} />;
  return <main className="landing"><section className="hero"><p className="eyebrow">AI-финансы без ручных таблиц</p><h1>Карманный<br /><span>бухгалтер</span></h1><p className="lead">Загрузите банковскую выписку — мы покажем структуру расходов и персональные наблюдения.</p>
    <form className="upload-card" onSubmit={submit}>
      <label className="file-zone"><input type="file" accept="application/pdf,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /><strong>{file ? file.name : 'Выберите PDF-выписку'}</strong><small>Только текстовые PDF, до 8 МБ</small></label>
      {error && <p className="error">{error}</p>}<button disabled={loading}>{loading ? 'Анализируем выписку…' : 'Проанализировать'}</button>
    </form><p className="privacy">Выписка обрабатывается только для анализа и не сохраняется.</p>
  </section></main>;
}

function Dashboard({ result, reset }: { result: Result; reset: () => void }) {
  return <main className="dashboard"><header><div><p className="eyebrow">Результат анализа</p><h1>Ваши расходы</h1><p>{result.period.from} — {result.period.to}</p></div><button className="secondary" onClick={reset}>Новая выписка</button></header>
    <section className="kpis"><Metric label="Расходы" value={money.format(result.summary.totalExpenses)} /><Metric label="Операций" value={String(result.summary.transactionCount)} /><Metric label="Главная категория" value={result.summary.topCategory} /></section>
    <section className="grid"><article className="card chart"><h2>Структура расходов</h2><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={result.summary.categories} dataKey="value" nameKey="name" innerRadius={64} outerRadius={100} paddingAngle={3}>{result.summary.categories.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip formatter={(value) => money.format(Number(value))} /></PieChart></ResponsiveContainer><div className="legend">{result.summary.categories.map((item, index) => <span key={item.name}><i style={{ background: colors[index % colors.length] }} />{item.name}: {money.format(item.value)}</span>)}</div></article>
      <article className="card insights"><h2>AI-наблюдения</h2>{result.insights.map((insight) => <p key={insight}>✦ {insight}</p>)}</article></section>
    <section className="card"><h2>Операции</h2><div className="table-wrap"><table><thead><tr><th>Дата</th><th>Описание</th><th>Категория</th><th>Сумма</th></tr></thead><tbody>{result.transactions.map((item, index) => <tr key={`${item.date}-${item.merchant}-${index}`}><td>{item.date}</td><td>{item.merchant}</td><td><span className="tag">{item.category}</span></td><td className={item.type === 'expense' ? 'expense' : ''}>{item.type === 'expense' ? '−' : '+'}{money.format(item.amount)}</td></tr>)}</tbody></table></div></section>
  </main>;
}
function Metric({ label, value }: { label: string; value: string }) { return <article className="metric"><p>{label}</p><strong>{value}</strong></article>; }
