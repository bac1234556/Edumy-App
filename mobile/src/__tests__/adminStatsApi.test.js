import { api } from '../api/client';
import { fetchAdminStats } from '../api/adminStats';

jest.mock('../api/client', () => ({ api: { get: jest.fn() } }));

test('fetches the admin stats API through the shared authenticated client', async () => {
  const payload = { usersByRole: { STUDENT: 2 }, enrollmentsLast6Months: [] };
  api.get.mockResolvedValue({ data: { data: payload } });

  await expect(fetchAdminStats()).resolves.toBe(payload);
  expect(api.get).toHaveBeenCalledWith('/admin/stats');
});
