import { apiRequest } from './client';
import { IssueReportResponse } from '../types/api';

export interface CreateIssuePayload {
  title?: string;
  description?: string;
  category?: string;
}

export const issuesApi = {
  create: async (orderId: string, payload: CreateIssuePayload, token?: string) =>
    apiRequest<IssueReportResponse>(`/orders/${orderId}/issues`, {
      method: 'POST',
      body: payload,
      token,
    }),
};
