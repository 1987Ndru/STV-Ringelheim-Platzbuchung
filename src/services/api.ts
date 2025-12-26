const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper to get auth token from localStorage
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

// Helper to set auth token
function setAuthToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

// Helper to remove auth token
function removeAuthToken(): void {
  localStorage.removeItem('auth_token');
}

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const apiService = {
  // Authentication
  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    passwordConfirm: string;
  }) {
    const result = await apiRequest<{ message: string; userId: string }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return result;
  },

  async login(email: string, password: string) {
    const result = await apiRequest<{ token: string; user: any }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    if (result.token) {
      setAuthToken(result.token);
    }
    return result;
  },

  async getCurrentUser() {
    return apiRequest<any>('/auth/me');
  },

  logout() {
    removeAuthToken();
  },

  // Users (Admin only)
  async getUsers() {
    return apiRequest<any[]>('/users');
  },

  async updateUserStatus(userId: string, status: string) {
    return apiRequest<{ message: string }>(`/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async updateUserRole(userId: string, role: string) {
    return apiRequest<{ message: string }>(`/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  async deleteUser(userId: string) {
    return apiRequest<{ message: string }>(`/users/${userId}`, {
      method: 'DELETE',
    });
  },

  // Bookings
  async getBookings(date?: string) {
    const endpoint = date ? `/bookings/date/${date}` : '/bookings';
    return apiRequest<any[]>(endpoint);
  },

  async createBooking(booking: any) {
    return apiRequest<any>('/bookings', {
      method: 'POST',
      body: JSON.stringify(booking),
    });
  },

  async updateBooking(bookingId: string, booking: any) {
    return apiRequest<any>(`/bookings/${bookingId}`, {
      method: 'PUT',
      body: JSON.stringify(booking),
    });
  },

  async deleteBooking(bookingId: string) {
    return apiRequest<{ message: string }>(`/bookings/${bookingId}`, {
      method: 'DELETE',
    });
  },
};

