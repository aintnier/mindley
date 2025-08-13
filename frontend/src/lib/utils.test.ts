import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
  it('merges class names', () => {
    expect(cn('flex', 'items-center')).toBe('flex items-center');
  });

  it('deduplicates tailwind conflicting classes keeping the last', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('handles conditional falsey values', () => {
    expect(cn('flex', false && 'hidden', 'gap-2')).toBe('flex gap-2');
  });

  it('keeps latest color utility', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });
});
