import { APIRequestContext } from '@playwright/test';

/**
 * Generates a unique test identifier with a prefix to prevent conflicts and ensure idempotency.
 */
export function generateTestId(prefix: string = 'E2E'): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Coordinates helper for FT Maos (within allowed radius vs outside radius).
 */
export const FT_MAOS_COORDINATES = {
  // Valid FT Maos central point
  VALID: {
    latitude: -7.604500,
    longitude: 109.153400,
  },
  // Outside valid tolerance (approx. 20km away)
  OUTSIDE_RADIUS: {
    latitude: -7.420000,
    longitude: 109.230000,
  },
};

/**
 * Helper to delete a created APAR via API to ensure test cleanup.
 */
export async function deleteAparById(
  request: APIRequestContext,
  token: string,
  aparId: number | string,
  baseURL: string = 'http://127.0.0.1:8000'
): Promise<boolean> {
  try {
    const res = await request.delete(`${baseURL}/api/apar/${aparId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.ok();
  } catch (err) {
    console.warn(`Failed to cleanup APAR ${aparId}:`, err);
    return false;
  }
}
