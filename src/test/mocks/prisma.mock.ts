import { vi } from 'vitest';

export const cretaePrismaMock = () => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  article: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
});
