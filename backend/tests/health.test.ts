import { describe, expect, it } from 'vitest';

describe('backend foundation', () => {
  it('exposes the expected API contract prefix', () => {
    expect('/api/v1/health').toMatch(/^\/api\/v1\//);
  });
});
