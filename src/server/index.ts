import express, { type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import pdf from 'pdf-parse';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { analyzeStatement } from './analyzer.js';
import { TemplateError } from './bank-template.js';
import { AnalysisCache } from './analysis-cache.js';

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
const analysisCache = new AnalysisCache();

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.post('/api/analyze-statement', upload.single('statement'), async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Прикрепите PDF-выписку.' });
    if (file.mimetype !== 'application/pdf' && !file.originalname.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ error: 'Поддерживаются только PDF-файлы.' });
    }
    const fileBuffer = file.buffer;
    const statementHash = createHash('sha256').update(fileBuffer).digest('hex');
    const { value: cachedAnalysis, cached } = await analysisCache.getOrCreate(statementHash, async () => {
      const parsedFile = await pdf(fileBuffer);
      if (!parsedFile.text.trim()) throw new TemplateError('В PDF не найден текст. Загрузите экспортированную выписку, не скан.');
      return analyzeStatement(parsedFile.text);
    });
    return res.set('X-Analysis-Cache', cached ? 'HIT' : 'MISS').json(cachedAnalysis);
  } catch (error) { return next(error); }
});

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'Размер файла не должен превышать 8 МБ.' });
  if (error instanceof TemplateError) return res.status(422).json({ error: error.message });
  if (error.message === 'OPENAI_API_KEY is not configured') return res.status(503).json({ error: 'Сервис анализа не настроен: отсутствует API-ключ.' });
  console.error('Statement analysis failed:', error.message);
  return res.status(502).json({ error: 'Не удалось проанализировать выписку. Попробуйте ещё раз.' });
});

const dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.resolve(dirname, '../client')));
app.get(/.*/, (_req, res) => res.sendFile(path.resolve(dirname, '../client/index.html')));

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`Pocket Accountant is running on http://localhost:${port}`));
