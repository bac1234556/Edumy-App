// src/lib/__tests__/web-links.test.ts
import { webLinks } from '../web-links';

describe('webLinks', () => {
  it('generates correct course link by course ID', () => {
    expect(webLinks.course(42)).toBe('http://localhost:3000/courses/42');
  });

  it('generates correct certificate verification link', () => {
    expect(webLinks.certificateVerify('EDUMY-999')).toBe(
      'http://localhost:3000/certificates/verify/EDUMY-999'
    );
  });
});
