import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// automatically attach token to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export const registerUser = (data) => API.post('/api/auth/register', data);
export const loginUser = (data) => API.post('/api/auth/login', data);
export const getDoctors = (params) => API.get('/api/doctors', { params });
export const getSlots = (doctorId, date) => API.get(`/api/doctors/${doctorId}/slots?date=${date}`);
export const bookAppointment = (data) => API.post('/api/appointments', data);
export const getMyAppointments = () => API.get('/api/appointments/my');
export const getMyPrescriptions = () => API.get('/api/prescriptions/my');
export const getNotifications = () => API.get('/api/notifications');
export const getTodayAppointments = () => API.get('/api/appointments/today');
export const updateAppointmentStatus = (id, status) => API.patch(`/api/appointments/${id}/status`, { status });
export const savePrescription = (data) => API.post('/api/prescriptions', data);
export const getFollowups = () => API.get('/api/prescriptions/followups');

export default API;