// Admin Dashboard Types and Interfaces

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
  lastLogin: string;
  isActive: boolean;
  decisionsCount: number;
}

export interface AdminDecision {
  id: string;
  userId: string;
  userName: string;
  title: string;
  status: 'completed' | 'pending' | 'archived';
  createdAt: string;
  updatedAt: string;
  alternativeCount: number;
  criteriaCount: number;
  score: number;
}

export interface AdminAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalDecisions: number;
  completedDecisions: number;
  avgDecisionScore: number;
  totalAlternatives: number;
  userGrowth: Array<{ date: string; count: number }>;
  decisionTrend: Array<{ date: string; count: number }>;
  decisionsByStatus: Array<{ name: string; value: number }>;
  topCriteria: Array<{ name: string; usage: number }>;
  deviceStats: Array<{ device: string; users: number }>;
  dayOfWeekStats: Array<{ day: string; decisions: number }>;
}

export interface AdminSettings {
  siteName: string;
  maxDecisionAlternatives: number;
  maxDecisionCriteria: number;
  enableAIFeatures: boolean;
  enableUserRegistration: boolean;
  maintenanceMode: boolean;
  emailNotifications: boolean;
  dataRetentionDays: number;
}

export interface DashboardStatCard {
  title: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: string;
  color: string;
}

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, row: T) => string | React.ReactNode;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}
