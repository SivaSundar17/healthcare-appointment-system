import axios from 'axios';

// Service URLs - can be overridden by environment variables
const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:8001';
const DOCTOR_URL = import.meta.env.VITE_DOCTOR_URL || 'http://localhost:8003';
const APPOINTMENT_URL = import.meta.env.VITE_APPOINTMENT_URL || 'http://localhost:8004';
const USER_URL = import.meta.env.VITE_USER_URL || 'http://localhost:8002';
const NOTIFICATION_URL = import.meta.env.VITE_NOTIFICATION_URL || 'http://localhost:8005';

// Create axios instances for each service
const authApi = axios.create({
  baseURL: `${AUTH_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

const doctorApi = axios.create({
  baseURL: `${DOCTOR_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

const appointmentApi = axios.create({
  baseURL: `${APPOINTMENT_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

const userApi = axios.create({
  baseURL: `${USER_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

const notificationApi = axios.create({
  baseURL: `${NOTIFICATION_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Add auth token to all requests
const addAuthInterceptor = (apiInstance) => {
  apiInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  apiInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        console.error('API Error:', error.response.data);
        const errorMessage = error.response.data?.detail || 'An error occurred';
        toast.error(errorMessage);
        
        if (error.response.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
      } else if (error.request) {
        console.error('Network Error:', error.request);
        toast.error('Network error. Please check your connection.');
      }
      return Promise.reject(error);
    }
  );
};

// eslint-disable-next-line no-unused-vars
import { toast } from 'react-hot-toast';

addAuthInterceptor(authApi);
addAuthInterceptor(doctorApi);
addAuthInterceptor(appointmentApi);
addAuthInterceptor(userApi);
addAuthInterceptor(notificationApi);

// Export service-specific API instances
export const authService = {
  login: (data) => authApi.post('/auth/login', data),
  signup: (data) => authApi.post('/auth/signup', data),
  getProfile: () => authApi.get('/auth/profile'),
};

export const doctorService = {
  getDoctors: (params) => doctorApi.get('/doctors/', { params }),
  getDoctor: (id) => doctorApi.get(`/doctors/${id}`),
  getSlots: (id, date) => doctorApi.get(`/doctors/${id}/slots`, { params: { date } }),
  addReview: (id, data) => doctorApi.post(`/doctors/${id}/reviews`, data),
};

export const appointmentService = {
  getAppointments: (params) => appointmentApi.get('/appointments/', { params }),
  createAppointment: (data) => appointmentApi.post('/appointments/', data),
  updateStatus: (id, data) => appointmentApi.patch(`/appointments/${id}/status`, data),
  updatePayment: (id) => appointmentApi.post(`/appointments/${id}/payment`),
};

export const userService = {
  getProfile: () => userApi.get('/users/profile'),
  updateProfile: (data) => userApi.put('/users/profile', data),
};

export const notificationService = {
  getNotifications: () => notificationApi.get('/notifications/'),
};

export default authApi;
