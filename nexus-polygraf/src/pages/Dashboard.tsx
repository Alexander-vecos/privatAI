import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { useIsMobile } from '../hooks';
import { FaSignOutAlt } from 'react-icons/fa';

// Navigation imports
import { BottomNav, OrderReel, CalendarView, UploadView, TeamView, MoreView } from '../features/navigation';
import type { Order } from '../features/navigation';
import AdminPanelPage from './AdminPanel';

// Mock data
const MOCK_ORDERS: Order[] = [
  {
    id: 'o1',
    orderNumber: '2510-A1',
    client: 'ЭкоСтиль',
    product: 'Визитки 90x50мм',
    status: 'in_progress',
    deadline: new Date(Date.now() + 3 * 86400000).toISOString(),
    previewImage:
      'https://images.unsplash.com/photo-1509281373149-e957c6296406?q=80&w=1928&auto=format&fit=crop',
    details: { type: 'Цифра', colors: '4+4' },
    staff: { manager: 'Анна В.' },
    filesCount: 2,
  },
  {
    id: 'o2',
    orderNumber: '2510-B2',
    client: 'СтартАп Фест',
    product: 'Мерч: Футболки',
    status: 'new',
    deadline: new Date(Date.now() + 1 * 86400000).toISOString(),
    previewImage:
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1964&auto=format&fit=crop',
    details: { type: 'Шелкография', colors: '1+0' },
    staff: { manager: 'Анна В.' },
    filesCount: 0,
  },
  {
    id: 'o3',
    orderNumber: '2509-C3',
    client: 'СтройГрупп',
    product: 'Баннер 3x6м',
    status: 'quality_check',
    deadline: new Date(Date.now() + 5 * 86400000).toISOString(),
    previewImage:
      'https://images.unsplash.com/photo-1542435503-956c469947f6?q=80&w=1974&auto=format&fit=crop',
    details: { type: 'Широкоформат', colors: '4+0' },
    staff: { manager: 'Дмитрий Н.' },
    filesCount: 5,
  },
  {
    id: 'o4',
    orderNumber: '2509-D4',
    client: 'КофеТайм',
    product: 'Меню А3',
    status: 'new',
    deadline: new Date(Date.now() + 2 * 86400000).toISOString(),
    previewImage:
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1974&auto=format&fit=crop',
    details: { type: 'Цифра', colors: '4+4' },
    staff: { manager: 'Олег К.' },
    filesCount: 1,
  },
];

/**
 * Main Dashboard Page - Shows Order Reel with Bottom Navigation
 */
export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const isMobile = useIsMobile();
  const [currentView, setCurrentView] = useState('reel');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);

  // Load orders
  useEffect(() => {
    setTimeout(() => {
      setOrders(MOCK_ORDERS);
      setIsLoading(false);
    }, 800);
  }, []);

  const handleUpload = async (orderId: string, files: FileList) => {
    console.log(`Uploading ${files.length} files for order ${orderId}`);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Update files count
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, filesCount: o.filesCount + files.length } : o
      )
    );
  };

  if (!isMobile) {
    // Desktop view - keep original layout
    return (
      <div className="flex h-full overflow-hidden">
        <div className="flex-1 flex flex-col bg-gray-950">
          <div className="p-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-4">PrintStudio Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-8 text-white text-center"
              >
                <h3 className="text-xl font-bold mb-2">Orders</h3>
                <p className="text-blue-100">{orders.length} active orders</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-8 text-white text-center"
              >
                <h3 className="text-xl font-bold mb-2">Profile</h3>
                <p className="text-emerald-100 capitalize">{user?.role}</p>
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => logout()}
                className="bg-gradient-to-br from-red-600 to-red-700 rounded-xl p-8 text-white text-center hover:shadow-lg transition-shadow"
              >
                <FaSignOutAlt className="text-4xl mx-auto mb-2" />
                <h3 className="text-xl font-bold">Logout</h3>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile view - Order Reel with Bottom Navigation
  return (
    <div className="w-full h-screen bg-black/95 text-white flex flex-col overflow-hidden">
      {/* Admin overlay (modal) */}
      {showAdmin && (
        <div className="fixed inset-0 z-50 bg-black/60 p-6 overflow-auto">
          <div className="max-w-5xl mx-auto bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
              <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => setShowAdmin(false)}>Close</button>
            </div>
            <AdminPanelPage />
          </div>
        </div>
      )}

      {/* Floating admin button */}
      {user?.role === 'admin' && (
        <button
          title="Open admin"
          onClick={() => setShowAdmin(true)}
          className="fixed right-4 top-16 z-40 p-3 bg-emerald-600 text-white rounded-full shadow-lg"
        >
          Admin
        </button>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="text-emerald-500"
          >
            <svg
              width="48"
              height="48"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
            </svg>
          </motion.div>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && (
        <>
          {/* Order Reel */}
          {currentView === 'reel' && (
            <div className="flex-1 overflow-hidden">
              <OrderReel orders={orders} onUpload={handleUpload} />
            </div>
          )}

          {/* Calendar View */}
          {currentView === 'calendar' && (
            <div className="flex-1 overflow-auto pb-24">
              <CalendarView />
            </div>
          )}

          {/* Upload View */}
          {currentView === 'upload' && (
            <div className="flex-1 overflow-auto pb-24">
              <UploadView />
            </div>
          )}

          {/* Team View */}
          {currentView === 'team' && (
            <div className="flex-1 overflow-auto pb-24">
              <TeamView />
            </div>
          )}

          {/* More View */}
          {currentView === 'more' && (
            <div className="flex-1 overflow-auto pb-24">
              <MoreView />
            </div>
          )}

          {/* Bottom Navigation */}
          <BottomNav current={currentView} onChange={setCurrentView} />
        </>
      )}
    </div>
  );
}
