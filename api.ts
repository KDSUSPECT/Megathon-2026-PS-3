const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1').replace(/\/$/, '');

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const text = await response.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) {
    const message = body?.message || body?.error || body || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return body as T;
}

export const api = {
  login: (usernameOrLicense: string, pinOrPassword: string) =>
    request<any>('/auth/login', { method: 'POST', body: JSON.stringify({ usernameOrLicense, pinOrPassword }) }),
  switchPersona: (targetRole: string) =>
    request<any>('/dev/switch-persona', { method: 'POST', body: JSON.stringify({ targetRole }) }),
  batches: () => request<any[]>('/batches'),
  returns: () => request<any[]>('/returns'),
  disputes: () => request<any[]>('/disputes'),
  certificates: () => request<any[]>('/disposal/certificates'),
  alerts: () => request<any[]>('/reentry-alerts'),
  ledger: (batchNumber: string) => request<any[]>(`/ledger/${encodeURIComponent(batchNumber)}`),
  verifyIntegrity: () => request<any>('/ledger/verify-integrity'),
  createReturn: (body: any) => request<any>('/returns', { method: 'POST', body: JSON.stringify(body) }),
  confirmPickup: (returnId: number, body: any) => request<any>(`/returns/${returnId}/confirm-pickup`, { method: 'POST', body: JSON.stringify(body) }),
  issueCertificate: (body: any) => request<any>('/disposal/certificates', { method: 'POST', body: JSON.stringify(body) }),
  verifyBatch: (batchNumber: string, scannerLicense: string) =>
    request<any>(`/batches/${encodeURIComponent(batchNumber)}/verify?scannerLicense=${encodeURIComponent(scannerLicense)}`),
  resolveDispute: (id: number, resolutionNotes: string) =>
    request<any>(`/disputes/${id}/resolve`, { method: 'PATCH', body: JSON.stringify({ resolutionNotes }) }),
  updateAlert: (id: number, alertStatus: string) =>
    request<any>(`/reentry-alerts/${id}/status`, { method: 'PATCH', body: JSON.stringify({ alertStatus }) }),
};

export { API_BASE };
