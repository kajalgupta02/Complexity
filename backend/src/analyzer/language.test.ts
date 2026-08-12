import { describe, expect, it } from 'vitest';
import { detectLanguage } from './language';

describe('detectLanguage', () => {
  it('detects C syntax separately from C++', () => {
    expect(detectLanguage('#include <stdio.h>\nint main() { return 0; }')).toBe('c');
    expect(detectLanguage('#include <iostream>\nstd::vector<int> values;')).toBe('cpp');
  });
});
