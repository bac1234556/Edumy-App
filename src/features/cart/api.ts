// src/features/cart/api.ts
// Typed API fetchers for Cart.

import { client } from '../../api/client';
import { components } from '../../api/schema';

export type Cart = components['schemas']['Cart'];
export type CartItem = components['schemas']['CartItem'];

export async function getCartApi(): Promise<Cart> {
  const response = await client.get<Cart>('/cart');
  const data = (response.data as { data?: Cart }).data || response.data;
  return data;
}

export async function addToCartApi(courseId: number): Promise<Cart> {
  const response = await client.post<Cart>('/cart/items', { courseId });
  const data = (response.data as { data?: Cart }).data || response.data;
  return data;
}

export async function removeFromCartApi(courseId: number): Promise<void> {
  await client.delete(`/cart/items/${courseId}`);
}
