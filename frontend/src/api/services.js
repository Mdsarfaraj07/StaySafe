import { api } from './client';

// auth
export const login = (email, password) => api('/auth/login', { method: 'POST', body: { email, password } });
export const register = (data) => api('/auth/register', { method: 'POST', body: data });
export const getMe = () => api('/auth/me');
export const updateProfile = (data) => api('/auth/me', { method: 'PUT', body: data });

// properties (public)
export const getProperties = (params = {}) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')).toString();
  return api(`/properties${qs ? `?${qs}` : ''}`);
};
export const getProperty = (id) => api(`/properties/${id}`);
export const getReviews = (id) => api(`/properties/${id}/reviews`);
export const addReview = (id, rating, comment) => api(`/properties/${id}/reviews`, { method: 'POST', body: { rating, comment } });

// bookings / favorites / tickets / notifications
export const createBooking = (data) => api('/bookings', { method: 'POST', body: data });
export const getMyBookings = () => api('/bookings/me');
export const cancelBooking = (dbId) => api(`/bookings/${dbId}/cancel`, { method: 'PUT' });
export const getFavorites = () => api('/favorites');
export const toggleFavorite = (propertyId) => api(`/favorites/${propertyId}`, { method: 'POST' });
export const getMyTickets = () => api('/tickets/me');
export const createTicket = (subject, message) => api('/tickets', { method: 'POST', body: { subject, message } });
export const getNotifications = () => api('/notifications');
export const markNotificationRead = (id) => api(`/notifications/${id}/read`, { method: 'PUT' });
export const markAllNotificationsRead = () => api('/notifications/read-all', { method: 'PUT' });

// owner
export const getOwnerProperties = () => api('/owner/properties');
export const createOwnerProperty = (data) => api('/owner/properties', { method: 'POST', body: data });
export const getOwnerBookings = () => api('/owner/bookings');
export const getOwnerStats = () => api('/owner/stats');

// admin
export const getAdminStats = () => api('/admin/stats');
export const getPendingProperties = () => api('/admin/properties/pending');
export const approveProperty = (id) => api(`/admin/properties/${id}/approve`, { method: 'PUT' });
export const rejectProperty = (id) => api(`/admin/properties/${id}/reject`, { method: 'PUT' });
export const getAdminTickets = () => api('/admin/tickets');
export const updateAdminTicket = (id, data) => api(`/admin/tickets/${id}`, { method: 'PUT', body: data });
export const getAdminUsers = () => api('/admin/users');
export const toggleAdminUser = (id) => api(`/admin/users/${id}/toggle`, { method: 'PUT' });
