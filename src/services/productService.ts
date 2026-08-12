import { productsApi } from '../api/productsApi';

export const productService = {
  list: (token?: string) => productsApi.list(token),
  getById: (productId: string, token?: string) => productsApi.getById(productId, token),
};

export type ProductService = typeof productService;
export default productService;
