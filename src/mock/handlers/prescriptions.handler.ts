/**
 * MediPick Mock Engine — Prescriptions Handler (Priority 1)
 */

import { mockResponse, mockError, requireAuth, parseBody } from '../engine';

// Mock DB for prescriptions
const mockPrescriptions = new Map<string, any>();
const uuid = () => Math.random().toString(36).substring(2, 10);

export async function handleGetUploadUrl(authHeader: string | null | undefined) {
  const auth = await requireAuth(authHeader);
  if ('error' in auth) return auth.error;

  const fileKey = `prescriptions/mock/${uuid()}.jpg`;
  return mockResponse(200, {
    uploadUrl: `https://mock-storage.medipick.lk/upload/${fileKey}`,
    fileKey,
    expiresIn: 300,
  });
}

export async function handleRegisterPrescription(authHeader: string | null | undefined, body: unknown) {
  const auth = await requireAuth(authHeader);
  if ('error' in auth) return auth.error;

  const { fileKey } = parseBody(body) as any;
  if (!fileKey) return mockError(400, 'VALIDATION_ERROR', 'fileKey is required.');

  const id = uuid();
  const p = {
    id,
    fileUrl: `https://mock-storage.medipick.lk/${fileKey}`,
    aiClarityScore: null,
    aiChecks: null,
    status: 'PRESCRIPTION_VALIDATION',
    pharmacistNote: null,
    createdAt: new Date().toISOString(),
  };
  mockPrescriptions.set(id, p);

  // Simulate AI processing in background
  setTimeout(() => {
    const updated = mockPrescriptions.get(id);
    if (updated) {
      updated.status = 'WAITING_PHARMACY_CONFIRMATION';
      updated.aiClarityScore = 95;
      updated.aiChecks = {
        clarity: { score: 95, max: 100, passed: true },
        doctorSignature: { detected: true },
        patientName: { detected: true },
        date: { detected: true, value: new Date().toISOString() },
      };
    }
  }, 4000); // 4 seconds delay for "AI check"

  return mockResponse(201, p);
}

export async function handleGetPrescription(id: string, authHeader: string | null | undefined) {
  const auth = await requireAuth(authHeader);
  if ('error' in auth) return auth.error;

  const p = mockPrescriptions.get(id);
  if (!p) return mockError(404, 'NOT_FOUND', 'Prescription not found.');
  return mockResponse(200, p);
}

export async function handleGetPrescriptionStatus(id: string, authHeader: string | null | undefined) {
  const auth = await requireAuth(authHeader);
  if ('error' in auth) return auth.error;

  const p = mockPrescriptions.get(id);
  if (!p) return mockError(404, 'NOT_FOUND', 'Prescription not found.');
  
  return mockResponse(200, {
    id: p.id,
    status: p.status,
    aiClarityScore: p.aiClarityScore,
  });
}

export async function handleListPrescriptions(authHeader: string | null | undefined) {
  const auth = await requireAuth(authHeader);
  if ('error' in auth) return auth.error;

  return mockResponse(200, Array.from(mockPrescriptions.values()));
}
