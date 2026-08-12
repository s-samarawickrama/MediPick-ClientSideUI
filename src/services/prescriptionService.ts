import { prescriptionsApi, UploadPrescriptionPayload } from '../api/prescriptionsApi';

export const prescriptionService = {
  upload: (payload: UploadPrescriptionPayload, token?: string) =>
    prescriptionsApi.upload(payload, token),
  getById: (prescriptionId: string, token?: string) =>
    prescriptionsApi.getById(prescriptionId, token),
  getStatus: (prescriptionId: string, token?: string) =>
    prescriptionsApi.getStatus(prescriptionId, token),
};

export type PrescriptionService = typeof prescriptionService;
export default prescriptionService;
