/**
 * MediPick Mock Engine — Medicines Handler (Priority 1)
 *
 * Implements mock logic for all A4 Medicines endpoints:
 *   A4.1  GET /medicines
 *   A4.2  GET /medicines/:id
 */

import { SEED_MEDICINES } from '../seed';
import { mockResponse, mockError } from '../engine';

// ─── A4.1 — GET /medicines  🔓 ───────────────────────────────────────────────
export async function handleListMedicines(query: Record<string, string>) {
  const { search, category, pharmacyId, isRxRequired, inStock, sort, page = '1', limit = '20' } = query;

  let results = [...SEED_MEDICINES];

  if (category) {
    results = results.filter((m) => m.category === category);
  }
  if (pharmacyId) {
    results = results.filter((m) => m.availableAtPharmacyIds.includes(pharmacyId));
  }
  if (isRxRequired === 'true')  results = results.filter((m) => m.isRxRequired);
  if (isRxRequired === 'false') results = results.filter((m) => !m.isRxRequired);
  if (inStock === 'true')       results = results.filter((m) => m.inStock);
  if (inStock === 'false')      results = results.filter((m) => !m.inStock);

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.genericName.toLowerCase().includes(q) ||
        (m.brandName && m.brandName.toLowerCase().includes(q))
    );
  }

  // Sorting
  if (sort === 'price_asc') {
    results.sort((a, b) => a.pharmacyPrice - b.pharmacyPrice);
  } else if (sort === 'price_desc') {
    results.sort((a, b) => b.pharmacyPrice - a.pharmacyPrice);
  } else if (sort === 'name') {
    results.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    // Default: popularity
    results.sort((a, b) => b.popularity - a.popularity);
  }

  // Pagination
  const pageNum  = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const total    = results.length;
  const sliced   = results.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  return mockResponse(200, sliced, {
    page:       pageNum,
    limit:      limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
  });
}

// ─── A4.2 — GET /medicines/:id  🔒 ───────────────────────────────────────────
export async function handleGetMedicine(medicineId: string) {
  const med = SEED_MEDICINES.find((m) => m.id === medicineId);
  if (!med) {
    return mockError(404, 'MEDICINE_NOT_FOUND', `Medicine ${medicineId} not found.`);
  }
  return mockResponse(200, med);
}
