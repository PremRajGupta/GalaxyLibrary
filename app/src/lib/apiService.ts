import axios from 'axios';
import api from './api';
import { apiUrl } from './apiConfig';

const authClient = axios.create({
  baseURL: apiUrl(''),
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

// Cache storage and in-flight promises
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();
const inFlightRequests = new Map<string, Promise<any>>();

// Default TTL: 60 seconds
const DEFAULT_TTL = 60 * 1000;

export const clearApiCache = (pattern?: string) => {
  if (!pattern) {
    memoryCache.clear();
    return;
  }
  for (const key of Array.from(memoryCache.keys())) {
    if (key.includes(pattern)) {
      memoryCache.delete(key);
    }
  }
};

export const invalidateCacheTags = (tags: string[]) => {
  for (const tag of tags) {
    clearApiCache(tag);
  }
};

export const getCachedData = <T>(key: string, ttl: number = DEFAULT_TTL): T | null => {
  const cached = memoryCache.get(key);
  if (cached && (Date.now() - cached.timestamp < ttl)) {
    return cached.data;
  }
  return null;
};

async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  const cached = memoryCache.get(key);
  const now = Date.now();

  // Return cached result immediately if valid
  if (cached && (now - cached.timestamp < ttl)) {
    return cached.data;
  }

  // Deduplicate in-flight requests for the same key
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key) as Promise<T>;
  }

  const promise = (async () => {
    try {
      const data = await fetcher();
      memoryCache.set(key, { data, timestamp: Date.now() });
      return data;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, promise);
  return promise;
}

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await authClient.post('/login', { email, password });
    return response.data;
  }
};

export const studentApi = {
  getStudents: async () => {
    return cachedFetch('students:all', async () => {
      const response = await api.get('/students');
      return response.data;
    });
  },
  getCachedStudents: () => {
    return getCachedData<any[]>('students:all');
  },
  getStudentById: async (id: string) => {
    return cachedFetch(`student:${id}`, async () => {
      const response = await api.get(`/students/${id}`);
      return response.data;
    });
  },
  createStudent: async (data: any) => {
    const response = await api.post('/students', data);
    invalidateCacheTags(['students', 'student:', 'dashboard', 'seats', 'reports']);
    return response.data;
  },
  updateStudent: async (id: string, data: any) => {
    const response = await api.put(`/students/${id}`, data);
    invalidateCacheTags(['students', `student:${id}`, 'dashboard', 'seats', 'reports']);
    return response.data;
  },
  deleteStudent: async (id: string) => {
    const response = await api.delete(`/students/${id}`);
    invalidateCacheTags(['students', `student:${id}`, 'dashboard', 'seats', 'reports']);
    return response.data;
  }
};

export const feeApi = {
  getFees: async (params?: Record<string, string>) => {
    const key = `fees:${JSON.stringify(params || {})}`;
    return cachedFetch(key, async () => {
      const response = await api.get('/fees', { params });
      return response.data;
    });
  },
  getCachedFees: (params?: Record<string, string>) => {
    const key = `fees:${JSON.stringify(params || {})}`;
    return getCachedData<any[]>(key);
  },
  createFee: async (data: any) => {
    const response = await api.post('/fees', data);
    invalidateCacheTags(['fees', 'dashboard', 'reports', 'student:']);
    return response.data;
  },
  updateFee: async (id: string, data: any) => {
    const response = await api.put(`/fees/${id}`, data);
    invalidateCacheTags(['fees', 'dashboard', 'reports', 'student:']);
    return response.data;
  },
  markAdvancePayment: async (id: string, monthlyFee: number, advanceStartDate: string, isAdvance: boolean, advanceAmount?: number) => {
    const response = await api.post(`/fees/${id}/mark-advance`, {
      monthlyFee,
      advanceStartDate,
      isAdvance,
      advanceAmount
    });
    invalidateCacheTags(['fees', 'dashboard', 'reports', 'student:']);
    return response.data;
  },
  getStudentPaymentValidity: async (studentDisplayId: string) => {
    return cachedFetch(`validity:${studentDisplayId}`, async () => {
      const response = await api.get(`/fees/student/${studentDisplayId}/validity`);
      return response.data;
    }, 15000);
  }
};

export const seatApi = {
  getSeats: async () => {
    return cachedFetch('seats:all', async () => {
      const response = await api.get('/seats');
      return response.data;
    });
  },
  getCachedSeats: () => {
    return getCachedData<any[]>('seats:all');
  },
  getAvailableSeats: async () => {
    return cachedFetch('seats:available', async () => {
      const response = await api.get('/seats/available');
      return response.data;
    });
  },
  getCachedAvailableSeats: () => {
    return getCachedData<any[]>('seats:available');
  },
  updateSeatStatus: async (id: string, data: any) => {
    const response = await api.put(`/seats/${id}`, data);
    invalidateCacheTags(['seats', 'dashboard']);
    return response.data;
  }
};

export const dashboardApi = {
  getStats: async (params?: Record<string, string>) => {
    const key = `dashboard:${JSON.stringify(params || {})}`;
    return cachedFetch(key, async () => {
      const response = await api.get('/dashboard/stats', { params });
      return response.data;
    });
  },
  getCachedStats: (params?: Record<string, string>) => {
    const key = `dashboard:${JSON.stringify(params || {})}`;
    return getCachedData<any>(key);
  }
};

export const requestApi = {
  getRequests: async () => {
    return cachedFetch('requests:all', async () => {
      const response = await api.get('/requests');
      return response.data;
    }, 30000);
  },
  getCachedRequests: () => {
    return getCachedData<any[]>('requests:all', 30000);
  },
  createRequest: async (data: any) => {
    const response = await api.post('/requests', data);
    invalidateCacheTags(['requests', 'dashboard']);
    return response.data;
  },
  updateRequestStatus: async (id: string, status: string) => {
    const response = await api.put(`/requests/${id}`, { status });
    invalidateCacheTags(['requests', 'seats', 'students', 'dashboard', 'reports']);
    return response.data;
  },
  rejectRequest: async (id: string, reason: string) => {
    const response = await api.put(`/requests/${id}/status`, { status: 'rejected', reason });
    invalidateCacheTags(['requests', 'seats', 'students', 'dashboard']);
    return response.data;
  },
  createCashfreeOrder: async (phone: string, name: string, amount: number) => {
    const response = await api.post('/v1/cashfree/create-order', { customerPhone: phone, customerName: name, orderAmount: amount });
    return response.data;
  },
  generateAadhaarOtp: async (aadhaarNumber: string) => {
    const response = await api.post('/v1/cashfree/kyc/aadhaar/otp', { aadhaarNumber });
    return response.data;
  },
  verifyAadhaarOtp: async (refId: string, otp: string) => {
    const response = await api.post('/v1/cashfree/kyc/aadhaar/verify', { refId, otp });
    return response.data;
  },
  submitPublicAdmission: async (admissionData: any) => {
    const response = await api.post('/v1/cashfree/submit-admission', { details: 'Public Admission via Website', admissionData });
    invalidateCacheTags(['requests', 'seats', 'dashboard']);
    return response.data;
  },
  deleteRequest: async (id: string) => {
    const response = await api.delete(`/requests/${id}`);
    invalidateCacheTags(['requests', 'dashboard']);
    return response.data;
  },
  getPublicAvailableSeats: async () => {
    return cachedFetch('seats:publicAvailable', async () => {
      const response = await api.get('/v1/cashfree/seats/available');
      return response.data;
    }, 15000);
  }
};

export const reportApi = {
  getReportsData: async (timeRange: string) => {
    const key = `reports:${timeRange}`;
    return cachedFetch(key, async () => {
      const response = await api.get('/reports/data', { params: { timeRange } });
      return response.data;
    });
  },
  getCachedReportsData: (timeRange: string) => {
    const key = `reports:${timeRange}`;
    return getCachedData<any>(key);
  }
};

const siteContentUrl = () => '/site-content';

export const siteContentApi = {
  get: async () => {
    return cachedFetch('site-content', async () => {
      const response = await api.get(siteContentUrl());
      return response.data;
    });
  },
  update: async (data: Record<string, unknown>) => {
    const response = await api.put(siteContentUrl(), data);
    invalidateCacheTags(['site-content']);
    return response.data;
  },
};

export const studentPortalApi = {
  getMyDetails: async () => {
    const response = await api.get('/student/me');
    return response.data;
  }
};

export const adminApi = {
  getProfile: async () => {
    return cachedFetch('admin:profile', async () => {
      const response = await api.get('/admin/profile');
      const profile = response.data?.profile || response.data;
      if (profile) {
        try {
          localStorage.setItem('galaxylibrary_admin_profile', JSON.stringify(profile));
        } catch (e) {}
      }
      return profile;
    }, 15000);
  },
  getCachedProfile: () => {
    const memory = getCachedData<any>('admin:profile');
    if (memory) return memory;
    try {
      const stored = localStorage.getItem('galaxylibrary_admin_profile');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return null;
  },
  updateProfile: async (data: Record<string, unknown>) => {
    const response = await api.put('/admin/profile', data);
    const profile = response.data?.profile || response.data;
    if (profile) {
      try {
        localStorage.setItem('galaxylibrary_admin_profile', JSON.stringify(profile));
      } catch (e) {}
    }
    invalidateCacheTags(['admin:profile', 'site-content']);
    return profile;
  }
};

export const attendanceApi = {
  getAttendance: async (params?: {
    date?: string;
    shift?: string;
    status?: string;
    search?: string;
    registrationType?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.date) query.append('date', params.date);
    if (params?.shift) query.append('shift', params.shift);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.registrationType) query.append('registrationType', params.registrationType);

    const response = await api.get(`/attendance?${query.toString()}`);
    return response.data;
  },
  markCheckIn: async (data: {
    studentId: string;
    date?: string;
    inTime?: string;
    seatNumber?: string;
    remarks?: string;
  }) => {
    const response = await api.post('/attendance/check-in', data);
    return response.data;
  },
  markCheckOut: async (data: {
    id?: string;
    studentId?: string;
    date?: string;
    outTime?: string;
    remarks?: string;
  }) => {
    const response = await api.post('/attendance/check-out', data);
    return response.data;
  },
  saveManual: async (data: Record<string, any>) => {
    const response = await api.post('/attendance/manual', data);
    return response.data;
  },
  deleteRecord: async (id: string) => {
    const response = await api.delete(`/attendance/${id}`);
    return response.data;
  },
};


