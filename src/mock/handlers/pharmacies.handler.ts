/**
 * MediPick Mock Engine — Pharmacies Handler (Priority 0)
 *
 * Implements mock logic for all A3 Pharmacies endpoints:
 *   A3.1  GET    /pharmacies
 *   A3.2  GET    /pharmacies/:id
 *   A3.3  GET    /pharmacies/favorites
 *   A3.4  POST   /pharmacies/:id/favorites
 *   A3.5  DELETE /pharmacies/:id/favorites/:favoriteId
 *
 * A3.1 and A3.2 are public (no auth required).
 * A3.3, A3.4, A3.5 require a valid Bearer access token.
 *
 * Distance sorting: uses Haversine formula to compute real GPS distances
 * when latitude + longitude query params are provided.
 */

import { FavoriteStore } from '../store';
import { SEED_PHARMACIES } from '../seed';
import { mockResponse, mockError, requireAuth } from '../engine';

// ─── Haversine distance (km) ─────────────────────────────────────────────────
function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R     = 6371;
  const dLat  = ((lat2 - lat1) * Math.PI) / 180;
  const dLon  = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

// ─── Helper: enrich pharmacy with isFavorite + favoriteId ────────────────────
async function enrichWithFavorite(pharmacy: typeof SEED_PHARMACIES[0], customerId: string | null) {
  if (!customerId) {
    return { ...pharmacy, isFavorite: false, favoriteId: null };
  }
  const fav = await FavoriteStore.findByCustomerAndPharmacy(customerId, pharmacy.id);
  return {
    ...pharmacy,
    isFavorite: !!fav,
    favoriteId: fav?.id ?? null,
  };
}

// ─── A3.1 — GET /pharmacies  🔓 ──────────────────────────────────────────────
export async function handleListPharmacies(
  query: Record<string, string>,
  authHeader: string | null | undefined,
) {
  const { search, latitude, longitude, sort, isOpen, page = '1', limit = '10' } = query;

  const customerIdForFavs = await getCustomerIdOptional(authHeader);

  let results = [...SEED_PHARMACIES];

  // Filter: isOpen
  if (isOpen === 'true')  results = results.filter((p) => p.isOpen);
  if (isOpen === 'false') results = results.filter((p) => !p.isOpen);

  // Filter: text search on name and address
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q),
    );
  }

  // Compute real distances if GPS provided
  const lat = latitude  ? parseFloat(latitude)  : null;
  const lon = longitude ? parseFloat(longitude) : null;
  const withDistance = results.map((p) => {
    if (lat !== null && lon !== null) {
      const km = haversineKm(lat, lon, p.latitude, p.longitude);
      return { ...p, distance: formatDistance(km), _distKm: km };
    }
    return { ...p, _distKm: 999 };
  });

  // Sort
  if (sort === 'distance' || (lat !== null && !sort)) {
    withDistance.sort((a, b) => a._distKm - b._distKm);
  } else if (sort === 'rating') {
    withDistance.sort((a, b) => b.rating - a.rating);
  } else if (sort === 'popularity') {
    withDistance.sort((a, b) => b.popularityScore - a.popularityScore);
  }

  // Paginate
  const pageNum  = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const total    = withDistance.length;
  const sliced   = withDistance.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  // Enrich with favorite status
  const enriched = await Promise.all(
    sliced.map((p) => enrichWithFavorite(p, customerIdForFavs)),
  );
  // Strip internal _distKm field
  const data = enriched.map(({ _distKm, ...rest }: any) => rest);

  return mockResponse(200, data, {
    page:       pageNum,
    limit:      limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
  });
}

// ─── A3.2 — GET /pharmacies/:id  🔓 ──────────────────────────────────────────
export async function handleGetPharmacy(
  pharmacyId: string,
  authHeader: string | null | undefined,
) {
  const pharmacy = SEED_PHARMACIES.find((p) => p.id === pharmacyId);
  if (!pharmacy) {
    return mockError(404, 'PHARMACY_NOT_FOUND', `Pharmacy ${pharmacyId} not found.`);
  }

  const customerId = await getCustomerIdOptional(authHeader);
  const enriched   = await enrichWithFavorite(pharmacy, customerId);

  return mockResponse(200, enriched);
}

// ─── A3.3 — GET /pharmacies/favorites  🔒 ────────────────────────────────────
export async function handleListFavorites(authHeader: string | null | undefined) {
  const auth = await requireAuth(authHeader);
  if ('error' in auth) return auth.error;

  const favs    = await FavoriteStore.findByCustomer(auth.payload.sub);
  const favIds  = new Set(favs.map((f) => f.pharmacyId));

  const pharmacies = SEED_PHARMACIES
    .filter((p) => favIds.has(p.id))
    .map((p) => {
      const fav = favs.find((f) => f.pharmacyId === p.id)!;
      return { ...p, isFavorite: true, favoriteId: fav.id };
    });

  return mockResponse(200, pharmacies);
}

// ─── A3.4 — POST /pharmacies/:id/favorites  🔒 ───────────────────────────────
export async function handleAddFavorite(
  pharmacyId: string,
  authHeader: string | null | undefined,
) {
  const auth = await requireAuth(authHeader);
  if ('error' in auth) return auth.error;

  const pharmacy = SEED_PHARMACIES.find((p) => p.id === pharmacyId);
  if (!pharmacy) {
    return mockError(404, 'PHARMACY_NOT_FOUND', `Pharmacy ${pharmacyId} not found.`);
  }

  const fav = await FavoriteStore.add(auth.payload.sub, pharmacyId);

  return mockResponse(201, {
    favoriteId: fav.id,
    pharmacyId: fav.pharmacyId,
  });
}

// ─── A3.5 — DELETE /pharmacies/:id/favorites/:favoriteId  🔒 ─────────────────
export async function handleRemoveFavorite(
  pharmacyId: string,
  favoriteId: string,
  authHeader: string | null | undefined,
) {
  const auth = await requireAuth(authHeader);
  if ('error' in auth) return auth.error;

  const removed = await FavoriteStore.remove(favoriteId, auth.payload.sub);
  if (!removed) {
    return mockError(404, 'FAVORITE_NOT_FOUND', 'Favorite not found or already removed.');
  }

  return mockResponse(200, { message: 'Removed from favorites.' });
}


// ─── Internal helper ──────────────────────────────────────────────────────────
// Try to get customerId from token, but don't fail if no token (public routes)
import { validateAccessToken, extractBearerToken } from '../jwt';

async function getCustomerIdOptional(authHeader: string | null | undefined): Promise<string | null> {
  const token  = extractBearerToken(authHeader);
  const result = validateAccessToken(token);
  return result.valid ? result.payload.sub : null;
}
