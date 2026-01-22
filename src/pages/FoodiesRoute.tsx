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

  const currentLocationFoods = getCurrentLocationFoods();
  const currentLocationSuggestions = getDeliveryAddressSuggestions(currentLocationQuery);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-screen bg-gray-50 overflow-hidden"
    >
      {/* HEADER */}
      <div className="bg-white p-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <motion.button
            onClick={() => navigate('/order-foodies/' + cartItems[0]?.storeId)}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={24} />
          </motion.button>
          <h1 className="text-2xl font-bold">Foodies Route</h1>
        </div>

        {/* CURRENT LOCATION + ADD BUTTON */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full" />
          <div className="flex-1 flex items-center bg-gray-100 rounded-xl px-3 py-2.5">
            <input
              ref={currentLocationInputRef}
              value={currentLocationQuery}
              onChange={(e) => setCurrentLocationQuery(e.target.value)}
              placeholder={locationLoading ? 'Getting your location...' : 'Search delivery location'}
              className="flex-1 bg-transparent outline-none text-sm"
            />
            <button
              onClick={() => setShowCurrentLocationModal(true)}
              className="ml-2 px-2 py-1 bg-gray-200 rounded-full text-xs"
            >
              View
            </button>
          </div>

          <motion.button
            onClick={handleAddStop}
            disabled={!canAddStop()}
            className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <Plus size={20} />
          </motion.button>
        </div>
      </div>

      {/* SCROLLABLE CONTENT (STOPS + RECENT) */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32">
        {/* STOPS */}
        <AnimatePresence>
          {stops.map((stop) => (
            <motion.div
              key={stop.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3"
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <input
                  ref={(el) => {
                    if (el) stopInputRefs.current[stop.id] = el;
                  }}
                  placeholder="Add stop"
                  className="flex-1 px-3 py-2 rounded-xl border"
                />
                <button onClick={() => removeStop(stop.id)}>
                  <X size={16} className="text-red-500" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* RECENT ADDRESSES */}
        {showRecentAddresses && (
          <div className="space-y-2 mt-4">
            <p className="text-xs text-gray-500">Recent addresses</p>
            {mockDeliveryAddresses.slice(0, 6).map((addr) => (
              <button
                key={addr.id}
                className="w-full p-3 bg-white rounded-xl text-left"
              >
                <p className="text-sm font-medium">{addr.name}</p>
                <p className="text-xs text-gray-500">{addr.description}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* FIXED BOTTOM */}
      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t">
        <button className="w-full py-3 bg-green-600 text-white rounded-xl">
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
    </motion.div>
  );
}
