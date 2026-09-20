import { useEffect, useState } from 'react';
import { CircleAlert, FileText, Moon, ShieldCheck, Sparkles, Sun, UploadCloud } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Toggle } from '@/components/ui/toggle';

type Result = {
  period: { from: string; to: string };
  transactions: Array<{ date: string; merchant: string; amount: number; type: string; category: string }>;
  summary: { totalExpenses: number; transactionCount: number; topCategory: string; categories: Array<{ name: string; value: number }> };
  insights: string[];
};

const savedResultKey = 'pocket-accountant:last-analysis';

function loadSavedResult(): Result | null {
  try {
    const saved = window.localStorage.getItem(savedResultKey);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as Result;
    if (!parsed.period || !Array.isArray(parsed.transactions) || !parsed.summary || !Array.isArray(parsed.insights)) return null;
    return parsed;
  } catch {
    return null;
  }
}

const colors = ['#B96E35', '#4D8278', '#D69A42', '#B95B4C', '#8A6548', '#6A9566', '#C77A62', '#77837B', '#A89B8A'];
const money = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 });
const savedThemeKey = 'pocket-accountant:theme';

type Theme = 'light' | 'dark';

function loadTheme(): Theme {
  const savedTheme = window.localStorage.getItem(savedThemeKey);
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(loadTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(savedThemeKey, theme);
  }, [theme]);
  const isDark = theme === 'dark';
  return <Toggle aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'} pressed={isDark} variant="outline" size="sm" onPressedChange={(pressed) => setTheme(pressed ? 'dark' : 'light')}>
    {isDark ? <Sun /> : <Moon />}<span className="hidden sm:inline">{isDark ? 'Светлая' : 'Тёмная'}</span>
  </Toggle>;
}

function AnalysisProgress() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const progress = Math.min(94, Math.round(12 + 82 * (1 - Math.exp(-seconds / 32))));
  const status = seconds < 5
    ? 'Загружаем и читаем выписку'
    : seconds < 15
      ? 'Извлекаем операции'
      : seconds < 35
        ? 'Анализируем категории расходов'
        : 'Готовим персональные наблюдения';

  return <div className="rounded-lg border bg-muted/40 p-4" role="status" aria-live="polite">
    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
      <span className="font-medium">{status}…</span>
      <span className="shrink-0 tabular-nums text-muted-foreground">{seconds} сек.</span>
    </div>
    <Progress value={progress} aria-label="Ход анализа выписки" />
    <p className="mt-2 text-xs text-muted-foreground">Обычно это занимает меньше минуты. Не закрывайте страницу.</p>
  </div>;
}

export function App() {
  const [result, setResult] = useState<Result | null>(loadSavedResult);
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
      window.localStorage.setItem(savedResultKey, JSON.stringify(data));
      setResult(data);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Ошибка анализа.'); }
    finally { setLoading(false); }
  }

  if (result) return <Dashboard result={result} reset={() => { window.localStorage.removeItem(savedResultKey); setResult(null); setFile(null); }} />;
  return <main className="app-shell grid min-h-svh place-items-center px-6 py-8"><section className="w-full max-w-2xl">
    <div className="mb-4 flex items-center justify-between gap-4"><Badge variant="secondary" className="gap-1.5"><Sparkles className="size-3.5" />AI-финансы без ручных таблиц</Badge><ThemeToggle /></div>
    <h1 className="text-5xl font-bold tracking-tight text-balance sm:text-7xl">Карманный<br /><span className="text-primary">бухгалтер</span></h1>
    <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">Загрузите банковскую выписку — мы покажем структуру расходов и персональные наблюдения.</p>
    <Card className="mt-8"><CardHeader><CardTitle>Загрузите выписку</CardTitle><CardDescription>Поддерживаются текстовые PDF-файлы до 8 МБ.</CardDescription></CardHeader><CardContent><form onSubmit={submit} className="space-y-4">
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:border-primary hover:bg-muted/50"><input className="sr-only" type="file" accept="application/pdf,.pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><UploadCloud className="size-8 text-primary" /><span className="font-medium">{file ? file.name : 'Выберите PDF-выписку'}</span><span className="text-sm text-muted-foreground">Нажмите, чтобы выбрать файл</span></label>
      {error && <Alert variant="destructive"><CircleAlert /><AlertDescription>{error}</AlertDescription></Alert>}
      {loading && <AnalysisProgress />}
      <Button className="w-full" size="lg" disabled={loading}>{loading ? 'Анализируем выписку…' : 'Проанализировать'}</Button>
    </form></CardContent></Card>
    <p className="mt-4 flex items-center justify-center gap-2 text-center text-sm text-muted-foreground"><ShieldCheck className="size-4" />Выписка обрабатывается только для анализа и не сохраняется.</p>
  </section></main>;
}

function Dashboard({ result, reset }: { result: Result; reset: () => void }) {
  return <main className="app-shell min-h-svh"><div className="mx-auto max-w-6xl px-6 py-9 md:py-12"><header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div><Badge variant="secondary" className="mb-3">Результат анализа</Badge><h1 className="text-4xl font-bold tracking-tight">Ваши расходы</h1><p className="mt-2 text-muted-foreground">{result.period.from} — {result.period.to}</p></div><div className="flex items-center gap-2"><ThemeToggle /><Button variant="outline" onClick={reset}><FileText />Новая выписка</Button></div></header>
    <section className="mb-4 grid gap-4 md:grid-cols-3"><Metric label="Расходы" value={money.format(result.summary.totalExpenses)} /><Metric label="Операций" value={String(result.summary.transactionCount)} /><Metric label="Главная категория" value={result.summary.topCategory} /></section>
    <section className="mb-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]"><Card><CardHeader><CardTitle>Структура расходов</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={result.summary.categories} dataKey="value" nameKey="name" innerRadius={64} outerRadius={100} paddingAngle={3}>{result.summary.categories.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip formatter={(value) => money.format(Number(value))} /></PieChart></ResponsiveContainer><div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">{result.summary.categories.map((item, index) => <span className="flex items-center gap-1.5" key={item.name}><i className="size-2 rounded-full" style={{ background: colors[index % colors.length] }} />{item.name}: {money.format(item.value)}</span>)}</div></CardContent></Card><Card><CardHeader><CardTitle>AI-наблюдения</CardTitle></CardHeader><CardContent className="space-y-3">{result.insights.map((insight) => <Alert key={insight}><Sparkles /><AlertDescription>{insight}</AlertDescription></Alert>)}</CardContent></Card></section>
    <Card><CardHeader><CardTitle>Операции</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Дата</TableHead><TableHead>Описание</TableHead><TableHead>Категория</TableHead><TableHead className="text-right">Сумма</TableHead></TableRow></TableHeader><TableBody>{result.transactions.map((item, index) => <TableRow key={`${item.date}-${item.merchant}-${index}`}><TableCell>{item.date}</TableCell><TableCell>{item.merchant}</TableCell><TableCell><Badge variant="secondary">{item.category}</Badge></TableCell><TableCell className={`text-right font-medium ${item.type === 'expense' ? 'text-destructive' : 'text-emerald-600'}`}>{item.type === 'expense' ? '−' : '+'}{money.format(item.amount)}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
  </div></main>;
}

function Metric({ label, value }: { label: string; value: string }) { return <Card><CardHeader className="gap-1"><CardDescription>{label}</CardDescription><CardTitle className="text-2xl">{value}</CardTitle></CardHeader></Card>; }
