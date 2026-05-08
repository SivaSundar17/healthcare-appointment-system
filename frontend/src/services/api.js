import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.data);
      
      // Show error message from server, or default message
      const errorMessage = error.response.data?.detail || 'An error occurred';
      toast.error(errorMessage);
      
      if (error.response.status === 401) {
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('Network Error:', error.request);
      toast.error('Network error. Please check your connection.');
    } else {
      // Error in request configuration
      console.error('Request Error:', error.message);
      toast.error('Request failed. Please try again.');
    }
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  verifyToken: (idToken) => api.post('/verify-token', { id_token: idToken }),
  getUser: (uid) => api.get(`/auth/user/${uid}`),
};

// User Service
export const userService = {
  createPatient: (data) => api.post('/users/patients', data),
  getPatient: (id) => api.get(`/users/patients/${id}`),
  updatePatient: (id, data) => api.put(`/users/patients/${id}`, data),
  getMedicalRecords: (id) => api.get(`/users/patients/${id}/medical-records`),
  addMedicalRecord: (id, data) => api.post(`/users/patients/${id}/medical-records`, data),
};

// Doctor Service
export const doctorService = {
  createDoctor: (data) => api.post('/doctors', data),
  getDoctor: (id) => api.get(`/doctors/${id}`),
  updateDoctor: (id, data) => api.put(`/doctors/${id}`, data),
  listDoctors: (params) => api.get('/doctors', { params }),
  getSpecializations: () => api.get('/specializations'),
  getAvailability: (id, date) => api.get(`/doctors/${id}/availability`, { params: { date } }),
  getSlots: (id, date) => api.get(`/doctors/${id}/slots`, { params: { date } }),
  addAvailability: (id, data) => api.post(`/doctors/${id}/availability`, data),
};

// Appointment Service
export const appointmentService = {
  createAppointment: (data) => api.post('/appointments/appointments', data),
  getAppointment: (id) => api.get(`/appointments/appointments/${id}`),
  updateAppointment: (id, data) => api.put(`/appointments/appointments/${id}`, data),
  cancelAppointment: (id, reason) => api.post(`/appointments/appointments/${id}/cancel`, { reason }),
  getPatientAppointments: (id, status) => api.get(`/appointments/appointments/patient/${id}`, { params: { status } }),
  getDoctorAppointments: (id, params) => api.get(`/appointments/appointments/doctor/${id}`, { params }),
  getAppointmentHistory: (id) => api.get(`/appointments/appointments/${id}/history`),
};

// Notification Service
export const notificationService = {
  getNotifications: (userId, unreadOnly = false) => 
    api.get(`/notifications/notifications/${userId}`, { params: { unread_only: unreadOnly } }),
  markAsRead: (notificationId) => api.post(`/notifications/notifications/${notificationId}/read`),
  markAllAsRead: (userId) => api.post(`/notifications/notifications/${userId}/read-all`),
};

export default api;
