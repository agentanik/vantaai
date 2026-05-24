import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

vi.mock('../src/middleware/authMiddleware', () => ({
  authMiddleware: (req: any, res: any, next: any) => next(),
  requireScope: () => (req: any, res: any, next: any) => next()
}));

import router from '../src/routes';
import { errorMiddleware } from '../src/middleware/errorMiddleware';

const app = express();
app.use(express.json());
app.use(router);
app.use(errorMiddleware);

describe('Output Endpoint Directory Traversal Security', () => {
  it('should violently reject relative path traversal payloads with HTTP 400', async () => {
    const maliciousPayloads = [
      '../../../etc/passwd',
      '..%2F..%2FWindows%2FSystem32',
      '..\\..\\..\\config.json',
      '%2E%2E%2Fsecret.env'
    ];

    for (const payload of maliciousPayloads) {
      const res = await request(app).get(`/api/v1/outputs/${payload}`);
      expect([400, 404]).toContain(res.status);
      if (res.status === 400) {
        expect(res.body.ok).toBe(false);
        expect(res.body.error).toContain('traversal detected');
      }
    }
  });

  it('should pass safe filenames through the traversal guard (returning 404 since file is absent)', async () => {
    const res = await request(app).get('/api/v1/outputs/clean_video_output_123.mp4');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('not found');
  });
});
