import api from './api'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const libraryService = {
  // Get all library items
  async getAllItems(category?: string, search?: string) {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);

    const queryString = params.toString();
    const url = queryString ? `/library?${queryString}` : '/library';

    return api.get(url);
  },

  // Get single library item
  async getItem(id: number) {
    return api.get(`/library/${id}`);
  },

  // Get library categories
  async getCategories() {
    return api.get('/library/categories');
  },

  // Get library stats (admin only)
  async getStats() {
    return api.get('/library/stats');
  },

  // Download file
  async downloadFile(id: number) {
    const response = await fetch(`${API_BASE_URL}/library/${id}/download`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download file');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `file-${id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Get cover image URL
  getCoverImageUrl(id: number): string {
    return `${API_BASE_URL}/library/${id}/cover`;
  },

  // Upload library item (admin only)
  async uploadItem(formData: FormData) {
    const response = await fetch(`${API_BASE_URL}/library/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload file');
    }

    return response.json();
  },

  // Update library item (admin only)
  async updateItem(id: number, data: any) {
    return api.patch(`/library/${id}`, data);
  },

  // Delete library item (admin only)
  async deleteItem(id: number) {
    return api.delete(`/library/${id}`);
  },

  // Create request
  async createRequest(data: any) {
    return api.post('/library-requests', data);
  },

  // Get all requests
  async getAllRequests(status?: string, myRequests?: boolean) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (myRequests) params.append('myRequests', 'true');

    const queryString = params.toString();
    const url = queryString ? `/library-requests?${queryString}` : '/library-requests';

    return api.get(url);
  },

  // Get single request
  async getRequest(id: number) {
    return api.get(`/library-requests/${id}`);
  },

  // Get requests stats (admin only)
  async getRequestStats() {
    return api.get('/library-requests/stats');
  },

  // Get pending requests count (admin only)
  async getPendingCount() {
    return api.get('/library-requests/pending-count');
  },

  // Update request status (admin only)
  async updateRequestStatus(id: number, data: any) {
    return api.patch(`/library-requests/${id}/status`, data);
  },

  // Delete request
  async deleteRequest(id: number) {
    return api.delete(`/library-requests/${id}`);
  },
};
