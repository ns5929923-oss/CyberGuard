/**
 * Admin API service.
 * All requests require a valid JWT with admin role.
 * The backend enforces authorization — this layer just calls the API.
 */
import api from '../api/client'

// ── Dashboard ──────────────────────────────────────────────────────────────

export async function fetchAdminDashboard() {
  const res = await api.get('/admin/dashboard')
  return res.data
}

export async function fetchAdminCharts() {
  const res = await api.get('/admin/dashboard/charts')
  return res.data
}

// ── Users ──────────────────────────────────────────────────────────────────

export async function fetchAdminUsers(params = {}) {
  const res = await api.get('/admin/users', { params })
  return res.data
}

export async function fetchAdminUser(userId) {
  const res = await api.get(`/admin/users/${userId}`)
  return res.data.user
}

export async function fetchUserActivity(userId) {
  const res = await api.get(`/admin/users/${userId}/activity`)
  return res.data
}

export async function updateAdminUser(userId, data) {
  const res = await api.put(`/admin/users/${userId}`, data)
  return res.data.user
}

export async function setUserStatus(userId, isActive) {
  const res = await api.patch(`/admin/users/${userId}/status`, { is_active: isActive })
  return res.data.user
}

export async function deleteAdminUser(userId) {
  const res = await api.delete(`/admin/users/${userId}`)
  return res.data
}

// ── Scans ──────────────────────────────────────────────────────────────────

export async function fetchAdminScans(params = {}) {
  const res = await api.get('/admin/scans', { params })
  return res.data
}

// ── Findings ───────────────────────────────────────────────────────────────

export async function fetchAdminFindings(params = {}) {
  const res = await api.get('/admin/findings', { params })
  return res.data
}
