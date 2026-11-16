// src/lib/__tests__/web-links.test.ts
import { webLinks } from '../web-links';

describe('webLinks', () => {
  it('generates correct course link', () => {
    expect(webLinks.course('react-native-mastery')).toBe(
      'http://localhost:3000/courses/react-native-mastery'
    );
  });

  it('generates correct order link', () => {
    expect(webLinks.order('ORD-12345')).toBe(
      'http://localhost:3000/orders/ORD-12345'
    );
  });

  it('generates correct certificate verification link', () => {
    expect(webLinks.certificate('CERT-999')).toBe(
      'http://localhost:3000/certificates/CERT-999'
    );
  });

  it('generates correct cart link', () => {
    expect(webLinks.cart()).toBe('http://localhost:3000/cart');
  });
});
