'use client';

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

export interface LoginPayload {
    email: string;
    password: string;
}

export interface RegisterPayload {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
    filiereId?: string;
    specialtyId?: string;
    niveau?: string;
    role?: 'ADMIN' | 'STUDENT';
    status?: 'active' | 'inactive';
}

export const authApi = {
    login: (payload: LoginPayload) => api.post('/auth/login', payload),
    register: (payload: RegisterPayload) => api.post('/auth/register', payload),
    logout: () => api.post('/auth/logout'),
    getCurrentUser: () => api.get('/auth/me'),
};

export const competenceApi = {
    getAll: (params?: any) => api.get('/competences', { params }),
    getById: (id: string) => api.get(`/competences/${id}`),
    create: (data: any) => api.post('/competences', data),
    update: (id: string, data: any) => api.put(`/competences/${id}`, data),
    delete: (id: string) => api.delete(`/competences/${id}`),
};

export const studentApi = {
    getDashboard: () => api.get('/student/dashboard'),
    getProfile: () => api.get('/student/profile'),
    updateProfile: (data: any) => api.put('/student/profile', data),
    getAcademicRecords: () => api.get('/student/academic-records'),
    addAcademicCourse: (data: any) => api.post('/student/academic-records/courses', data),
    getSkills: (params?: any) => api.get('/student/skills', { params }),
    updateSkill: (data: any) => api.post('/student/skills', data),
    deleteSkill: (id: string) => api.delete(`/student/skills/${id}`),
    getGoals: (params?: any) => api.get('/student/goals', { params }),
    createGoal: (data: any) => api.post('/student/goals', data),
    updateGoal: (id: string, data: any) => api.put(`/student/goals/${id}`, data),
    deleteGoal: (id: string) => api.delete(`/student/goals/${id}`),
    getRoadmap: () => api.get('/student/roadmap'),
    getAchievements: (params?: any) => api.get('/student/achievements', { params }),
    getRecommendations: (params?: any) => api.get('/student/recommendations', { params }),
    trainRecommendationModel: () => api.post('/student/recommendations/train'),
    generateRecommendations: () => api.post('/student/recommendations/generate'),
    startRecommendation: (id: string) => api.post(`/student/recommendations/${id}/start`),
    completeRecommendation: (id: string) => api.post(`/student/recommendations/${id}/complete`),
    ignoreRecommendation: (id: string) => api.post(`/student/recommendations/${id}/ignore`),
};

export const usersApi = {
    getAll: (params?: any) => api.get('/users', { params }),
    getById: (id: string) => api.get(`/users/${id}`),
    update: (id: string, data: any) => api.put(`/users/${id}`, data),
    delete: (id: string) => api.delete(`/users/${id}`),
    getStats: () => api.get('/users/stats/students'),
};

export const adminApi = {
    getStats: () => api.get('/admin/stats'),
};

export const filieresApi = {
    getAll: (params?: any) => api.get('/filieres', { params }),
};

export default api;
