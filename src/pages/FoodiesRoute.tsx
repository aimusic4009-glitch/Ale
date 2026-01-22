import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, UtensilsCrossed, X, Clock } from 'lucide-react';
import { useFoodOrderSession, FoodItem } from '../contexts/FoodOrderSession';
import { FoodSelectionModal } from '../components/FoodSelectionModal';
import { useGeolocation } from '../hooks/useGeolocation';
import { mockDeliveryAddresses, getDeliveryAddressSuggestions } from '../data/mockDeliveryAddresses';

export function FoodiesRoute() {
  const navigate = useNavigate();
  const { address: currentLocation, loading: locationLoading } = useGeolocation();
  const {
    cartItems,
    currentLocationFoodIds,
    stops,
    addStop,
    removeStop,
    updateStop,
    canAddStop,
    getCurrentLocationFoods,
    getStopFoods,
    removeStopsWithoutFoodOrAddress,
    deliveryLocation,
    setDeliveryLocation
  } = useFoodOrderSession();

  const currentLocationInputRef = useRef<HTMLInputElement>(null);
  const stopInputRefs = useRef<{ [key: string]: HTMLInputElement }>({});

  const [showCurrentLocationModal, setShowCurrentLocationModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState<string | null>(null);
  const [currentLocationQuery, setCurrentLocationQuery] = useState('');
  const [stopAddressQuery, setStopAddressQuery] = useState<{ [key: string]: string }>({});
  const [activeLocationInput, setActiveLocationInput] = useState('current-location');
  const [showCurrentLocationSuggestions, setShowCurrentLocationSuggestions] = useState(false);
  const [showStopSuggestions, setShowStopSuggestions] = useState<{ [key: string]: boolean }>({});
  const [showRecentAddresses, setShowRecentAddresses] = useState(true);

  useEffect(() => {
    if (currentLocation && !deliveryLocation) {
      setDeliveryLocation(currentLocation);
      setCurrentLocationQuery(currentLocation);
    } else if (deliveryLocation) {
      setCurrentLocationQuery(deliveryLocation);
    }
  }, [currentLocation, deliveryLocation, setDeliveryLocation]);

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/shop');
    }
  }, [cartItems.length, navigate]);

  useEffect(() => {
    if (activeLocationInput === 'current-location' && currentLocationInputRef.current) {
      currentLocationInputRef.current.focus();
    } else if (activeLocationInput && stopInputRefs.current[activeLocationInput]) {
      stopInputRefs.current[activeLocationInput].focus();
    }
  }, [activeLocationInput]);

  const handleCurrentLocationChange = (value: string) => {
    setCurrentLocationQuery(value);
    setShowCurrentLocationSuggestions(true);
    setShowRecentAddresses(false);
  };

  const handleCurrentLocationSelect = (address: string) => {
    setDeliveryLocation(address);
    setCurrentLocationQuery(address);
    setShowCurrentLocationSuggestions(false);
    setShowRecentAddresses(true);

    if (stops.length > 0 && !stops[0].address) {
      setActiveLocationInput(stops[0].id);
    }
  };

  const handleStopAddressChange = (stopId: string, value: string) => {
    setStopAddressQuery(prev => ({ ...prev, [stopId]: value }));
    setShowStopSuggestions(prev => ({ ...prev, [stopId]: true }));
    setShowRecentAddresses(false);
  };

  const handleStopAddressSelect = (stopId: string, address: string, description: string) => {
    updateStop(stopId, { address, description });
    setStopAddressQuery(prev => ({ ...prev, [stopId]: '' }));
    setShowStopSuggestions(prev => ({ ...prev, [stopId]: false }));
    setShowRecentAddresses(true);

    const currentIndex = stops.findIndex(s => s.id === stopId);
    if (currentIndex < stops.length - 1) {
      const nextStop = stops[currentIndex + 1];
      if (!nextStop.address) {
        setActiveLocationInput(nextStop.id);
      }
    }
  };

  const handleAddStop = () => {
    if (!canAddStop()) return;

    const newStop = {
      id: `stop-${Date.now()}`,
      address: '',
      foodIds: []
    };

    addStop(newStop);
    setActiveLocationInput(newStop.id);
    setShowRecentAddresses(true);
  };

  const handleRemoveStop = (stopId: string) => {
    removeStop(stopId);
    setActiveLocationInput('current-location');
    setShowRecentAddresses(true);
  };

  const handleGoToDelivery = () => {
    removeStopsWithoutFoodOrAddress();
    navigate('/food-delivery');
  };

  const handleRecentAddressClick = (address: string) => {
    if (activeLocationInput === 'current-location') {
      handleCurrentLocationSelect(address);
    } else {
      handleStopAddressSelect(activeLocationInput, address, '');
    }
  };

  const currentLocationFoods = getCurrentLocationFoods();
  const currentLocationSuggestions = getDeliveryAddressSuggestions(currentLocationQuery);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-screen bg-gray-50 overflow-hidden touch-none select-none"
      style={{ touchAction: 'none', userSelect: 'none' }}
    >
      <div className="bg-white p-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <motion.button
            onClick={() => navigate('/order-foodies/' + cartItems[0]?.storeId)}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-800" />
          </motion.button>
          <h1 className="text-2xl font-bold text-gray-900">Foodies Route</h1>
        </div>

        {/* CURRENT LOCATION INPUT + PLUS BUTTON (UNCHANGED FUNCTIONALITY) */}
        <div className="relative mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0" />

            <div className={`flex-1 relative flex items-center rounded-xl px-3 py-2.5 transition-all ${
              activeLocationInput === 'current-location'
                ? 'bg-white border-2 border-green-500 shadow-md'
                : 'bg-gray-100 border-2 border-transparent'
            }`}>
              <input
                ref={currentLocationInputRef}
                type="text"
                value={currentLocationQuery}
                onChange={(e) => handleCurrentLocationChange(e.target.value)}
                onFocus={() => {
                  setActiveLocationInput('current-location');
                  setShowCurrentLocationSuggestions(false);
                  setShowRecentAddresses(true);
                }}
                onBlur={() => setTimeout(() => setShowCurrentLocationSuggestions(false), 200)}
                placeholder={locationLoading ? 'Getting your location...' : 'Search delivery location'}
                className="flex-1 bg-transparent text-gray-900 text-sm outline-none"
              />

              <motion.button
                onClick={() => setShowCurrentLocationModal(true)}
                disabled={currentLocationFoods.length === 0}
                className="ml-2 flex items-center gap-1 bg-gray-100 px-2.5 py-1.5 rounded-full border border-gray-200 hover:bg-gray-200 transition-colors relative"
                whileTap={{ scale: 0.95 }}
              >
                <UtensilsCrossed size={12} className="text-gray-700" />
                <span className="text-xs font-medium text-gray-700">View</span>
                {currentLocationFoods.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {currentLocationFoods.length}
                  </span>
                )}
              </motion.button>
            </div>

            <motion.button
              onClick={handleAddStop}
              disabled={!canAddStop()}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors flex-shrink-0 ${
                canAddStop()
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              whileTap={{ scale: canAddStop() ? 0.95 : 1 }}
            >
              <Plus size={20} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* SCROLL AREA — padded so fixed bottom does NOT cover content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32">
        {showRecentAddresses && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 px-2 py-1">Recent addresses</p>
            {mockDeliveryAddresses.slice(0, 6).map((addr) => (
              <motion.button
                key={addr.id}
                onClick={() => handleRecentAddressClick(addr.address)}
                className="w-full flex items-center gap-3 p-3 bg-white rounded-xl hover:bg-gray-50 transition-colors"
                whileTap={{ scale: 0.98 }}
              >
                <Clock size={20} className="text-gray-400 flex-shrink-0" />
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900 text-sm">{addr.name}</p>
                  <p className="text-xs text-gray-500">{addr.description}</p>
                </div>
                {addr.distance && (
                  <span className="text-xs text-gray-400">{addr.distance}</span>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* FIXED BOTTOM PANEL (FUNCTIONALITY UNCHANGED) */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-30"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <button
          onClick={handleGoToDelivery}
          disabled={currentLocationFoods.length === 0}
          className={`w-full py-3.5 rounded-xl font-semibold text-lg transition-colors ${
            currentLocationFoods.length > 0
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Go to delivery
        </button>
      </div>

      <FoodSelectionModal
        isOpen={showCurrentLocationModal}
        onClose={() => setShowCurrentLocationModal(false)}
        title="Your Food"
        stopId="current-location"
        mode="current-location"
      />

      {showStopModal && (
        <FoodSelectionModal
          isOpen={true}
          onClose={() => setShowStopModal(null)}
          title="Select Food for Stop"
          stopId={showStopModal}
          mode="stop"
        />
      )}
    </motion.div>
  );
}
