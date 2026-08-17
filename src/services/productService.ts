import { medicinesApi } from '../api/productsApi';

export const medicineService = {
  list: (token?: string) => medicinesApi.list(token),
  getById: (medicineId: string, token?: string) => medicinesApi.getById(medicineId, token),
};

export type MedicineService = typeof medicineService;
export default medicineService;
