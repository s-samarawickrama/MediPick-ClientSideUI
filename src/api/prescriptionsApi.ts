import { apiRequest } from './client';
import {
  PrescriptionDetail,
  PrescriptionStatus,
  PrescriptionUploadResponse,
} from '../types/api';

export interface UploadPrescriptionPayload {
  fileName?: string;
  contentType?: string;
  base64Data?: string;
}

export const prescriptionsApi = {
  upload: async (payload: UploadPrescriptionPayload, token?: string) =>
    apiRequest<PrescriptionUploadResponse>('/prescriptions', {
      method: 'POST',
      body: payload,
      token,
    }),

  getById: async (prescriptionId: string, token?: string) =>
    apiRequest<PrescriptionDetail>(`/prescriptions/${prescriptionId}`, {
      method: 'GET',
      token,
    }),

  getStatus: async (prescriptionId: string, token?: string) =>
    apiRequest<PrescriptionStatus>(`/prescriptions/${prescriptionId}/status`, {
      method: 'GET',
      token,
    }),
};
