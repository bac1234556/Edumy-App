// src/lib/money.ts
// Format VND currency according to Edumy UI/UX standards (BR-40, 50-ui-ux).

export function formatVnd(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    return '0 đ';
  }
  if (amount === 0) {
    return 'Miễn phí';
  }
  const integerAmount = Math.round(amount);
  const formatted = integerAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted} đ`;
}
