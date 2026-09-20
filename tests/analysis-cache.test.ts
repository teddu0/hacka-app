import { describe, expect, it } from 'vitest';
import { AnalysisCache } from '../src/server/analysis-cache.js';

describe('AnalysisCache', () => {
  it('returns the stored analysis on a repeated statement', async () => {
    const cache = new AnalysisCache<string>();
    await expect(cache.getOrCreate('statement-hash', async () => 'analysis')).resolves.toEqual({ value: 'analysis', cached: false });
    await expect(cache.getOrCreate('statement-hash', async () => 'new analysis')).resolves.toEqual({ value: 'analysis', cached: true });
  });

  it('shares an in-progress analysis for identical uploads', async () => {
    const cache = new AnalysisCache<string>();
    let calls = 0;
    const create = async () => {
      calls += 1;
      return 'analysis';
    };
    const results = await Promise.all([cache.getOrCreate('statement-hash', create), cache.getOrCreate('statement-hash', create)]);
    expect(calls).toBe(1);
    expect(results.map((result) => result.value)).toEqual(['analysis', 'analysis']);
  });
});
