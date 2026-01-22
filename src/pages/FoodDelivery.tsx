import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ArrowLeft, Bike, Car, Banknote } from 'lucide-react';
import { useFoodOrderSession } from '../contexts/FoodOrderSession';
import { useFoodPayment } from '../contexts/FoodPaymentContext';

interface DeliveryMode {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: React.ReactNode;
  duration: string;
}

export function FoodDelivery() {
  const navigate = useNavigate();
  const { cartItems, getCurrentLocationFoods, setDeliveryMode, selectedDeliveryMode, deliveryLocation } = useFoodOrderSession();
  const { paymentStatus } = useFoodPayment();
  const [selectedMode, setSelectedMode] = useState<string>(selectedDeliveryMode || 'motorbike');
  const [panelHeight, setPanelHeight] = useState(450);
  const minHeight = 300;
  const maxHeight = 680;

  const deliveryModes: DeliveryMode[] = [
    {
      id: 'motorbike',
      name: 'Motorbike',
      description: 'Fast delivery',
      price: 80,
      icon: <Bike size={32} className="text-gray-700" />,
      duration: '15-25 min'
    },
    {
      id: 'car',
      name: 'Car',
      description: 'Standard delivery',
      price: 140,
      icon: <Car size={32} className="text-gray-700" />,
      duration: '20-35 min'
    },
    {
      id: 'bicycle',
      name: 'Bicycle',
      description: 'Eco-friendly',
      price: 105,
      icon: <span className="text-3xl">🚴</span>,
      duration: '25-40 min'
    }
  ];

  const currentLocationFoods = getCurrentLocationFoods();
  const foodSubtotal = currentLocationFoods.reduce((sum, item) => sum + item.price, 0);
  const selectedModeData = deliveryModes.find(m => m.id === selectedMode);
  const deliveryFee = selectedModeData?.price || 0;
  const total = foodSubtotal + deliveryFee;

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/shop');
    }
  }, [cartItems.length, navigate]);

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const newHeight = panelHeight - info.delta.y;
    const clampedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
    setPanelHeight(clampedHeight);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const velocity = info.velocity.y;
    let targetHeight = panelHeight;

    if (Math.abs(velocity) > 500) {
      targetHeight = velocity > 0 ? minHeight : maxHeight;
    } else {
      const midPoint = (minHeight + maxHeight) / 2;
      targetHeight = panelHeight > midPoint ? maxHeight : minHeight;
    }

    setPanelHeight(targetHeight);
  };

  const handleSelectDelivery = () => {
    if (!selectedModeData || paymentStatus !== 'authorized') return;
    setDeliveryMode(selectedMode, selectedModeData.price);
    navigate('/food-confirm-order');
  };

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden touch-none select-none" style={{ touchAction: 'none' }}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-blue-50 to-green-50">
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      <motion.div
        className="fixed top-4 left-4 z-10"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
      >
        <button
          onClick={() => navigate('/foodies-route')}
          className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50"
        >
          <ArrowLeft size={20} className="text-gray-800" />
        </button>
      </motion.div>

      <motion.div
        className="fixed top-20 left-1/2 transform -translate-x-1/2 z-10 bg-green-600 text-white px-4 py-2 rounded-full shadow-lg"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <span className="font-medium text-sm">{currentLocationFoods.length} items for delivery</span>
      </motion.div>

      <motion.div
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-20"
        style={{ height: panelHeight }}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
      >
        <motion.div
          className="w-full h-6 flex justify-center items-center cursor-grab active:cursor-grabbing"
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.1}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          whileTap={{ scale: 1.1 }}
        >
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </motion.div>

        <div className="px-4 pb-24" style={{ height: panelHeight - 24, overflowY: 'auto' }}>
          <div className="mb-4">
            <div className="bg-blue-100 rounded-xl p-3">
              <p className="text-blue-700 text-sm font-medium">30% promo applied</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {deliveryModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  selectedMode === mode.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center">
                    {mode.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-gray-900">{mode.name}</h3>
                    <p className="text-sm text-gray-600">{mode.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{mode.duration}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">R {mode.price}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-bold text-gray-900 mb-3">Order Summary</h3>
            <p className="text-sm text-gray-600 mb-4">{currentLocationFoods.length} items for delivery</p>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Food subtotal</span>
                <span className="font-medium text-gray-900">R {foodSubtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery fee</span>
                <span className="font-medium text-gray-900">R {deliveryFee}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-gray-900">R {total}</span>
              </div>
            </div>

            {selectedModeData && (
              <div className="bg-gray-50 rounded-xl p-3 mb-4">
                <p className="text-sm text-gray-600 text-center">
                  Deliver via <span className="font-bold text-gray-900">{selectedModeData.name}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4 flex-shrink-0 space-y-3">
          <button
            onClick={() => navigate('/food-payment')}
            className="w-full p-3 bg-green-50 border-2 border-green-500 rounded-xl font-semibold text-green-700 hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
          >
            <Banknote size={20} />
            Cash
          </button>
          <button
            onClick={handleSelectDelivery}
            disabled={paymentStatus !== 'authorized'}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-colors shadow-lg ${
              paymentStatus === 'authorized'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Select {selectedModeData?.name || 'Delivery'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
