
export enum ReportStatus {
  NEW = 'NEW',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  VERIFIED = 'VERIFIED',
  CLOSED = 'CLOSED',
  ESCALATED = 'ESCALATED'
}

export enum Department {
  ELECTRICITY = 'Electricity',
  SANITATION = 'Sanitation',
  ROADS = 'Roads & Infrastructure',
  WATER = 'Water Supply',
  PARKS = 'Parks & Recreation'
}

export interface StatusHistoryItem {
  status: ReportStatus;
  timestamp: string;
  note: string;
}

export interface CivicReport {
  id: string;
  firebaseId?: string; // Added for Firestore document reference
  title: string;
  description: string;
  category: Department;
  issueType: string;
  status: ReportStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  image?: string;
  createdAt: string;
  updatedAt: string;
  reporterId: string;
  impactScore: number;
  slaStatus?: string;
  workerId?: string; 
  statusHistory: StatusHistoryItem[];
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number;
  icon: string;
  category: 'coupon' | 'credit';
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirementDescription: string;
}

export interface PointTransaction {
  id: string;
  amount: number;
  reason: string;
  date: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'status' | 'reward' | 'badge' | 'system';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'CITIZEN' | 'ADMIN' | 'WORKER';
  points: number;
  level: number;
  cityRank: number;
  earnedBadgeIds: string[];
  redeemedRewardIds: string[];
  pointHistory: PointTransaction[];
}

export interface Worker {
  id: string;
  name: string;
  dept: Department;
  status: 'available' | 'busy';
}
