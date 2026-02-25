import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiLoader,
  FiClock,
  FiPaperclip,
  FiPhone,
  FiMessageCircle,
} from 'react-icons/fi';

export interface Order {
  id: string;
  orderNumber: string;
  client: string;
  product: string;
  status: 'new' | 'in_progress' | 'quality_check';
  deadline: string;
  previewImage?: string;
  details: {
    type: string;
    colors: string;
  };
  staff: {
    manager: string;
  };
  filesCount: number;
}

const STATUS_CONFIG = {
  new: { color: '#10B981', label: 'Новый' },
  in_progress: { color: '#F59E0B', label: 'В работе' },
  quality_check: { color: '#8B5CF6', label: 'Проверка' },
};

interface OrderCardProps {
  order: Order;
  isActive: boolean;
  onUpload?: (files: FileList) => Promise<void>;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, isActive, onUpload }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bgImage = order.previewImage || 'https://images.unsplash.com/photo-1626544827763-d516dce335ca?q=80&w=2000&auto=format&fit=crop';
  const dateStr = new Date(order.deadline).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      if (onUpload) {
        await onUpload(files);
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
      e.currentTarget.value = '';
    }
  };

  const handlePaperclipClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl"
      style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-black/95" />

      {/* Content */}
      <div className="relative h-full w-full flex flex-col p-6 justify-between">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="text-xs text-white/90 flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
            <FiClock size={14} />
            {dateStr}
          </div>

          {/* Order Number Badge - Green */}
          <div className="text-xs font-bold text-white tracking-wider bg-emerald-600/90 px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg shadow-emerald-900/50 border border-emerald-500/30">
            #{order.orderNumber}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1 drop-shadow-md leading-tight">
              {order.product}
            </h2>
            <p className="text-white/70 text-sm">{order.client}</p>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-300">
            <span className="bg-white/10 px-2 py-1 rounded">{order.details.type}</span>
            <span className="bg-white/10 px-2 py-1 rounded">{order.details.colors}</span>
          </div>
        </div>
      </div>

      {/* Right Action Panel */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-20"
        >
          {/* Upload Button */}
          <div className="relative group">
            <input
              type="file"
              multiple
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,application/pdf,.doc,.docx"
            />

            <button
              className="w-10 h-10 rounded-full bg-black/40 border border-white/10 text-white flex items-center justify-center cursor-pointer transition-all hover:bg-white/20 active:scale-95 backdrop-blur-md shadow-lg shadow-black/30"
              onClick={handlePaperclipClick}
              disabled={isUploading}
            >
              {isUploading ? (
                <FiLoader size={20} className="animate-spin text-emerald-400" />
              ) : (
                <FiPaperclip size={20} />
              )}

              {order.filesCount > 0 && !isUploading && (
                <span className="absolute -top-1 -right-1 bg-emerald-500 text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-black shadow-md">
                  +{order.filesCount}
                </span>
              )}
            </button>

            <span className="absolute bottom-full -right-2 mb-2 text-xs font-medium text-white bg-black/60 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur pointer-events-none">
              Files
            </span>
          </div>

          {/* Phone Button */}
          <div className="relative group">
            <button className="w-10 h-10 rounded-full bg-black/40 border border-white/10 text-white flex items-center justify-center cursor-pointer transition-all hover:bg-white/20 active:scale-95 backdrop-blur-md shadow-lg shadow-black/30">
              <FiPhone size={20} />
            </button>
            <span className="absolute bottom-full -right-2 mb-2 text-xs font-medium text-white bg-black/60 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur pointer-events-none">
              Call
            </span>
          </div>

          {/* Message Button */}
          <div className="relative group">
            <button className="w-10 h-10 rounded-full bg-black/40 border border-white/10 text-white flex items-center justify-center cursor-pointer transition-all hover:bg-white/20 active:scale-95 backdrop-blur-md shadow-lg shadow-black/30">
              <FiMessageCircle size={20} />
            </button>
            <span className="absolute bottom-full -right-2 mb-2 text-xs font-medium text-white bg-black/60 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur pointer-events-none">
              Chat
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

interface OrderReelProps {
  orders: Order[];
  onUpload?: (orderId: string, files: FileList) => Promise<void>;
}

export const OrderReel: React.FC<OrderReelProps> = ({ orders, onUpload }) => {
  const [idx, setIdx] = useState(1);
  const [animating, setAnimating] = useState(false);
  const touchStart = useRef(0);
  const lastDeltaY = useRef(0);

  // Extended orders for infinite scroll
  const extendedOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    if (orders.length === 1) return orders;
    return [orders[orders.length - 1], ...orders, orders[0]];
  }, [orders]);

  const move = (dir: number) => {
    if (animating || orders.length <= 1) return;
    setAnimating(true);
    setIdx((p) => p + dir);
  };

  const onTransEnd = () => {
    setAnimating(false);
    if (idx === 0) {
      setIdx(extendedOrders.length - 2);
    } else if (idx === extendedOrders.length - 1) {
      setIdx(1);
    }
  };

  const handleWheel = (e: WheelEvent) => {
    const now = Date.now();
    if (now - lastDeltaY.current < 50) return;
    lastDeltaY.current = now;

    if (Math.abs(e.deltaY) > 10) {
      move(e.deltaY > 0 ? 1 : -1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 50) move(diff > 0 ? 1 : -1);
  };

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center overflow-hidden"
      onWheel={handleWheel as any}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="w-full h-full flex flex-col transition-transform"
        onTransitionEnd={onTransEnd}
        style={{
          transform: `translateY(-${idx * 100}%)`,
          transitionProperty: animating ? 'transform' : 'none',
          transitionDuration: '0.5s',
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {extendedOrders.map((order, i) => (
          <div key={`${order.id}-${i}`} className="w-full h-full flex-shrink-0 flex items-center justify-center p-4 md:p-0">
            <div className="w-full max-w-md h-full md:max-h-96 md:rounded-3xl md:overflow-hidden">
              <OrderCard
                order={order}
                isActive={i === idx && !animating}
                onUpload={(files) => onUpload?.(order.id, files) || Promise.resolve()}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
