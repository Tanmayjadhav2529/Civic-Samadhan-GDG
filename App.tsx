
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { CitizenDashboard } from './components/citizen/CitizenDashboard';
import { ReportForm } from './components/citizen/ReportForm';
import { RewardsView } from './components/citizen/RewardsView';
import { MyReports } from './components/citizen/MyReports';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ChatWidget } from './components/chatbot/ChatWidget';
import { LoginView } from './components/auth/LoginView';
import { subscribeToReports, addReportToFirebase, updateReportInFirebase } from './services/firebaseService';
import { CivicReport, ReportStatus, Department, User, Reward, Worker, Badge, PointTransaction, StatusHistoryItem, Notification } from './types';

const REWARDS_DATA: Reward[] = [
  { id: 'r1', title: '50% Off Bus Pass', description: 'One month unlimited travel across the city', cost: 500, icon: '🚌', category: 'coupon' },
  { id: 'r2', title: 'Library Premium', description: 'Borrow up to 10 books and access e-archives', cost: 200, icon: '📚', category: 'credit' },
  { id: 'r3', title: 'Brew & Co. Voucher', description: '$10 credit at participating cafes', cost: 300, icon: '☕', category: 'coupon' },
  { id: 'r4', title: 'Property Tax Rebate', description: '5% deduction on next tax assessment', cost: 2000, icon: '🏠', category: 'credit' },
];

const BADGES_DATA: Badge[] = [
  { id: 'b1', title: 'First Steps', description: 'Welcome to the force!', icon: '🥇', requirementDescription: 'Submit your first report' },
  { id: 'b2', title: 'Eagle Eye', description: 'Nothing escapes your gaze.', icon: '🦅', requirementDescription: 'Submit 5 reports' },
  { id: 'b3', title: 'City Hero', description: 'A pillar of the community.', icon: '🦸', requirementDescription: 'Get 3 reports verified' },
  { id: 'b4', title: 'Centurion', description: 'Dedicated and consistent.', icon: '💯', requirementDescription: 'Reach 1000 impact points' },
];

const INITIAL_WORKERS: Worker[] = [
  { id: 'W101', name: 'Officer Arjun', dept: Department.ROADS, status: 'available' },
  { id: 'W102', name: 'Sanitation Lead Priya', dept: Department.SANITATION, status: 'available' },
  { id: 'W103', name: 'Grid Tech Rohan', dept: Department.ELECTRICITY, status: 'available' },
  { id: 'W104', name: 'Water Marshal Zara', dept: Department.WATER, status: 'available' },
  { id: 'W105', name: 'Parks Warden Vikram', dept: Department.PARKS, status: 'available' },
];

const App: React.FC = () => {
  const [reports, setReports] = useState<CivicReport[]>([]);
  
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('civic_user_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('civic_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [activePage, setActivePage] = useState(() => {
    const savedUser = localStorage.getItem('civic_user_session');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      return parsed.role === 'ADMIN' ? 'admin-dashboard' : 'dashboard';
    }
    return 'dashboard';
  });

  const [workers, setWorkers] = useState<Worker[]>(INITIAL_WORKERS);
  const [recentImpact, setRecentImpact] = useState<{ points: number; newBadges: Badge[] } | null>(null);

  // Real-time Firebase Subscription
  useEffect(() => {
    const unsubscribe = subscribeToReports((fetchedReports) => {
      setReports(fetchedReports);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('civic_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('civic_user_session', JSON.stringify(user));
    } else {
      localStorage.removeItem('civic_user_session');
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const userReports = reports.filter(r => r.reporterId === user.id);
    const verifiedReports = userReports.filter(r => r.status === ReportStatus.VERIFIED);
    
    const newBadgeIds = [...user.earnedBadgeIds];
    const newlyUnlockedBadges: Badge[] = [];
    let changed = false;

    if (userReports.length >= 1 && !newBadgeIds.includes('b1')) {
      newBadgeIds.push('b1');
      newlyUnlockedBadges.push(BADGES_DATA.find(b => b.id === 'b1')!);
      changed = true;
    }
    if (userReports.length >= 5 && !newBadgeIds.includes('b2')) {
      newBadgeIds.push('b2');
      newlyUnlockedBadges.push(BADGES_DATA.find(b => b.id === 'b2')!);
      changed = true;
    }
    if (verifiedReports.length >= 3 && !newBadgeIds.includes('b3')) {
      newBadgeIds.push('b3');
      newlyUnlockedBadges.push(BADGES_DATA.find(b => b.id === 'b3')!);
      changed = true;
    }
    if (user.points >= 1000 && !newBadgeIds.includes('b4')) {
      newBadgeIds.push('b4');
      newlyUnlockedBadges.push(BADGES_DATA.find(b => b.id === 'b4')!);
      changed = true;
    }

    if (changed) {
      setUser(prev => prev ? ({ ...prev, earnedBadgeIds: newBadgeIds }) : null);
      setRecentImpact(prev => prev ? { ...prev, newBadges: [...prev.newBadges, ...newlyUnlockedBadges] } : { points: 0, newBadges: newlyUnlockedBadges });
      
      // Fix: newlyUnlockedBadges is an array; iterate over it to add notifications
      newlyUnlockedBadges.forEach(unlockedBadge => {
        addNotification({
          title: 'Achievement Unlocked!',
          message: `You've earned the ${unlockedBadge.title} badge.`,
          type: 'badge'
        });
      });
    }
  }, [reports, user?.points]);

  const addNotification = (notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: Notification = {
      ...notif,
      id: `ntf-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 20));
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    setActivePage(userData.role === 'ADMIN' ? 'admin-dashboard' : 'dashboard');
    addNotification({
      title: 'Session Established',
      message: `Welcome back, ${userData.name.split(' ')[0]}.`,
      type: 'system'
    });
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('civic_user_session');
    setActivePage('dashboard');
  };

  const updatePointsAndLevel = (amount: number, reason: string) => {
    if (!user) return;
    setUser(prev => {
      if (!prev) return null;
      const newPoints = prev.points + amount;
      const newLevel = Math.floor(newPoints / 250) + 1;
      const newTx: PointTransaction = {
        id: `tx${Date.now()}`,
        amount,
        reason,
        date: new Date().toISOString(),
      };
      
      return {
        ...prev,
        points: newPoints,
        level: newLevel,
        pointHistory: [newTx, ...prev.pointHistory]
      };
    });
  };

  const handleNewReport = async (data: any) => {
    if (!user) return;
    const pointsGained = 50;
    const now = new Date().toISOString();
    const newReport: CivicReport = {
      id: `INC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      title: data.title,
      description: data.description,
      category: data.category || Department.ROADS,
      issueType: data.issueType || 'Visual Detection',
      status: ReportStatus.NEW,
      priority: 'medium',
      location: { 
        lat: data.location?.lat || 0, 
        lng: data.location?.lng || 0, 
        address: data.address || 'Unidentified Grid Coordinate' 
      },
      image: data.image,
      createdAt: now,
      updatedAt: now,
      reporterId: user.id,
      impactScore: 25,
      statusHistory: [
        { status: ReportStatus.NEW, timestamp: now, note: 'Signal transmitted to Command Center.' }
      ]
    };
    
    try {
      await addReportToFirebase(newReport);
      updatePointsAndLevel(pointsGained, 'Verified Report Dispatch');
      setRecentImpact({ points: pointsGained, newBadges: [] });
      setActivePage('dashboard');

      addNotification({
        title: 'Signal Dispatched',
        message: `Your report "${data.title}" is now under review in the cloud.`,
        type: 'status'
      });
    } catch (error: any) {
      console.error("Firebase submission failed:", error);
      const errorMsg = error.code === 'permission-denied' 
        ? "Missing or insufficient permissions. Please update your Firebase Rules to 'allow read, write: if true;'."
        : "Failed to transmit signal to cloud database.";
      alert(errorMsg);
    }
  };

  const handleUpdateStatus = async (id: string, status: ReportStatus) => {
    const report = reports.find(r => r.id === id);
    if (!report || !report.firebaseId) return;

    const now = new Date().toISOString();
    const historyItem: StatusHistoryItem = {
      status,
      timestamp: now,
      note: `Protocol updated to ${status} by Municipal Intelligence.`
    };

    const updates = { 
      status, 
      updatedAt: now,
      statusHistory: [...report.statusHistory, historyItem]
    };

    try {
      await updateReportInFirebase(report.firebaseId, updates);
      
      if (status === ReportStatus.VERIFIED) {
        updatePointsAndLevel(100, `Municipal Resolution Verified: ${report.title}`);
      }
      
      if (user && report.reporterId === user.id) {
        addNotification({
          title: 'Status Update',
          message: `"${report.title}" has been updated to ${status}.`,
          type: 'status'
        });
      }
    } catch (error) {
      console.error("Firebase update failed:", error);
    }
  };

  const handleAssignWorker = async (reportId: string, workerId: string) => {
    if (!workerId) return;
    const report = reports.find(r => r.id === reportId);
    if (!report || !report.firebaseId) return;

    const now = new Date().toISOString();
    const worker = workers.find(w => w.id === workerId);
    
    const historyItem: StatusHistoryItem = {
      status: ReportStatus.IN_PROGRESS,
      timestamp: now,
      note: `Deployment initiated: ${worker?.name} dispatched.`
    };

    const updates = { 
      workerId, 
      status: ReportStatus.IN_PROGRESS, 
      updatedAt: now,
      statusHistory: [...report.statusHistory, historyItem]
    };

    try {
      await updateReportInFirebase(report.firebaseId, updates);
      setWorkers(prev => prev.map(w => w.id === workerId ? { ...w, status: 'busy' } : w));

      if (user && report.reporterId === user.id) {
        addNotification({
          title: 'Field Deployment',
          message: `A specialist has been dispatched to resolve "${report.title}".`,
          type: 'status'
        });
      }
    } catch (error) {
      console.error("Firebase assignment failed:", error);
    }
  };

  const handleRedeemReward = (reward: Reward) => {
    if (user && user.points >= reward.cost) {
      updatePointsAndLevel(-reward.cost, `Resource Redemption: ${reward.title}`);
      setUser(prev => prev ? ({
        ...prev,
        redeemedRewardIds: [...prev.redeemedRewardIds, reward.id]
      }) : null);
      
      addNotification({
        title: 'Reward Redeemed',
        message: `You've successfully redeemed "${reward.title}". Check your email.`,
        type: 'reward'
      });
    }
  };

  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar activePage={activePage} onPageChange={setActivePage} role={user.role as any} />
      
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <Header 
          user={user} 
          activePage={activePage} 
          onLogout={handleLogout} 
          notifications={notifications}
          onMarkAllRead={handleMarkAllNotificationsRead}
        />
        
        <main className="flex-1">
          {user.role === 'ADMIN' ? (
            <AdminDashboard 
              reports={reports} 
              workers={workers}
              onUpdateStatus={handleUpdateStatus} 
              onAssignWorker={handleAssignWorker}
              initialTab={activePage === 'analytics' ? 'analytics' : 'board'}
            />
          ) : (
            activePage === 'dashboard' ? (
              <CitizenDashboard 
                user={user} 
                reports={reports} 
                onNavigate={setActivePage} 
                recentImpact={recentImpact}
                onClearImpact={() => setRecentImpact(null)}
              />
            ) : activePage === 'new-report' ? (
              <ReportForm onSubmit={handleNewReport} onCancel={() => setActivePage('dashboard')} />
            ) : activePage === 'rewards' ? (
              <RewardsView 
                user={user} 
                availableRewards={REWARDS_DATA} 
                allBadges={BADGES_DATA}
                onRedeem={handleRedeemReward} 
              />
            ) : activePage === 'my-reports' ? (
              <MyReports reports={reports.filter(r => r.reporterId === user.id)} />
            ) : (
              <div className="p-8 text-slate-500 font-medium">Establishing Satellite Link...</div>
            )
          )}
        </main>
      </div>
      <ChatWidget user={user} reports={reports} />
    </div>
  );
};

export default App;
