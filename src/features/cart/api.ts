// src/features/cart/api.ts
// Typed API fetchers for Cart (removed in Phase 3).

import { client } from '../../api/client';
import { unwrap } from '../../api/envelope';

export interface CartInstructor {
  id: number;
  fullName: string;
}

export interface CartItem {
  courseId: number;
  title: string;
  slug: string;
  thumbnailUrl?: string;
  price: number;
  isFree: boolean;
  instructor?: CartInstructor;
  addedAt: string;
  purchasable: boolean;
  unavailableReason?: string;
}

export interface Cart {
  items: CartItem[];
  itemCount: number;
  purchasableCount: number;
  totalAmount: number;
}

export async function getCartApi(): Promise<Cart> {
  const response = await client.get('/cart');
  return unwrap<Cart>(response.data);
}

export async function addToCartApi(courseId: number): Promise<Cart> {
  const response = await client.post('/cart/items', { courseId });
  return unwrap<Cart>(response.data);
}

export async function removeFromCartApi(courseId: number): Promise<void> {
  await client.delete(`/cart/items/${courseId}`);
}
