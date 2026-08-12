import { issuesApi } from '../api/issuesApi';

export const issueService = {
  create: (orderId: string, payload: { title?: string; description?: string; category?: string }, token?: string) =>
    issuesApi.create(orderId, payload, token),
};

export type IssueService = typeof issueService;
export default issueService;
