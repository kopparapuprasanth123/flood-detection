import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getHealth = async () => {
  const response = await apiClient.get('/api/health');
  return response.data;
};

export const getLocations = async () => {
  const response = await apiClient.get('/api/locations');
  return response.data;
};

export const getDashboardData = async () => {
  const response = await apiClient.get('/api/dashboard');
  return response.data;
};

export const getWeather = async (lat, lon) => {
  const response = await apiClient.get('/api/weather', {
    params: { lat, lon },
  });
  return response.data;
};

export const getRiskAssessments = async () => {
  const response = await apiClient.get('/api/risk');
  return response.data;
};

export const predictRisk = async (payload) => {
  const response = await apiClient.post('/api/predict', payload);
  return response.data;
};

export const getAlerts = async (params = {}) => {
  const response = await apiClient.get('/api/alerts', { params });
  return response.data;
};

export const createAlert = async (payload) => {
  const response = await apiClient.post('/api/alerts', payload);
  return response.data;
};

export const acknowledgeAlert = async (alertId) => {
  const response = await apiClient.patch(`/api/alerts/${alertId}`);
  return response.data;
};

// ==========================================
// GLOF & Non-Rainfall Outburst Flood APIs
// ==========================================

export const getGlofBasins = async () => {
  const response = await apiClient.get('/api/glof/basins');
  return response.data;
};

export const assessGlofRisk = async (payload) => {
  const response = await apiClient.post('/api/glof/assess', payload);
  return response.data;
};

export const simulateGlofBreach = async (payload) => {
  const response = await apiClient.post('/api/glof/simulate-breach', payload);
  return response.data;
};

export const getGlofProtocols = async () => {
  const response = await apiClient.get('/api/glof/protocols');
  return response.data;
};

export const broadcastGlofAlert = async (basinId) => {
  const response = await apiClient.post(`/api/glof/broadcast-alert?basin_id=${basinId}`);
  return response.data;
};

export default apiClient;

