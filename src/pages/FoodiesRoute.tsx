import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Clock, ChevronDown } from 'lucide-react';
import { useFoodOrderSession } from '../contexts/FoodOrderSession';
import { FoodSelectionModal } from '../components/FoodSelectionModal';
import { useGeolocation } from '../hooks/useGeolocation';
import { mockDeliveryAddresses, getDeliveryAddressSuggestions } from '../data/mockDeliveryAddresses';

export function FoodiesRoute() {
  const navigate = useNavigate();
  const { address: geoLocation } = useGeolocation();

  const {
    cartItems,
    stops,
    addStop,
    removeStop,
    updateStop,
    canAddStop,
    getCurrentLocationFoods,
    removeStopsWithoutFoodOrAddress,
    deliveryLocation,
    setDeliveryLocation
  } = useFoodOrderSession();

  const currentLocationInputRef = useRef<HTMLInputElement>(null);
  const stopInputRefs = useRef<{ [key: string]: HTMLInputElement }>({});

  const [currentLocationQuery, setCurrentLocationQuery] = useState('');
  const [stopAddressQuery, setStopAddressQuery] = useState<{ [key: string]: string }>({});
  const [activeLocationInput, setActiveLocationInput] = useState('current-location');
  const [showCurrentLocationSuggestions, setShowCurrentLocationSuggestions] = useState(false);
  const [showStopSuggestions, setShowStopSuggestions] = useState<{ [key: string]: boolean }>({});
  const [showRecentAddresses, setShowRecentAddresses] = useState(true);
  const [showCurrentLocationModal, setShowCurrentLocationModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState<string | null>(null);

  const [hasInitializedLocation, setHasInitializedLocation] = useState(false);
  const [isEditingCurrentLocation, setIsEditingCurrentLocation] = useState(false);

  /* ---------------- INITIAL LOCATION SET (ONCE ONLY) ---------------- */
  useEffect(() => {
    if (!hasInitializedLocation && geoLocation && !deliveryLocation) {
      setDeliveryLocation(geoLocation);
      setCurrentLocationQuery(geoLocation);
      setHasInitializedLocation(true);
    }
  }, [geoLocation, deliveryLocation, hasInitializedLocation, setDeliveryLocation]);

  /* ---------------- REDIRECT IF CART EMPTY ---------------- */
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/shop');
    }
  }, [cartItems.length, navigate]);

  /* ---------------- CURRENT LOCATION HANDLERS ---------------- */
  const handleCurrentLocationChange = (value: string) => {
    setIsEditingCurrentLocation(true);
    setCurrentLocationQuery(value);
    setShowCurrentLocationSuggestions(true);
    setShowRecentAddresses(false);
  };

  const handleCurrentLocationSelect = (address: string) => {
    setIsEditingCurrentLocation(false);
    setDeliveryLocation(address);
    setCurrentLocationQuery(address);
    setShowCurrentLocationSuggestions(false);
    setShowRecentAddresses(true);
    setActiveLocationInput('current-location');
  };

  /* ---------------- STOP HANDLERS ---------------- */
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
  };

  const handleAddStop = () => {
    if (!canAddStop()) return;
    const newStop = { id: `stop-${Date.now()}`, address: '', foodIds: [] };
    addStop(newStop);
    setActiveLocationInput(newStop.id);
    setShowRecentAddresses(true);
  };

  const handleRemoveStop = (stopId: string) => {
    removeStop(stopId);
    setActiveLocationInput('current-location');
    setShowRecentAddresses(true);
  };

  /* ---------------- NAVIGATION BUTTON ---------------- */
  const handleGoToDelivery = () => {
    removeStopsWithoutFoodOrAddress();
    navigate('/food-delivery');
  };

  const currentLocationFoods = getCurrentLocationFoods();
  const suggestions = getDeliveryAddressSuggestions(currentLocationQuery);

  return (
    <motion.div className="flex flex-col h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 bg-white border-b z-30 p-3">
        <div className="flex items-center gap-2 mb-3">
          <motion.button
            onClick={() => navigate('/order-foodies/' + cartItems[0]?.storeId)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </motion.button>

          <span className="text-sm font-semibold truncate flex-1">
            {cartItems[0]?.storeName}
          </span>

          <motion.button
            onClick={handleAddStop}
            disabled={!canAddStop()}
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              canAddStop() ? 'bg-green-500 text-white' : 'bg-gray-300'
            }`}
          >
            <Plus size={16} />
          </motion.button>
        </div>

        {/* CURRENT LOCATION */}
        <div className="relative">
          <input
            ref={currentLocationInputRef}
            value={currentLocationQuery}
            onChange={(e) => handleCurrentLocationChange(e.target.value)}
            onFocus={() => setActiveLocationInput('current-location')}
            placeholder="Delivery location"
            className="w-full bg-gray-100 rounded-lg px-3 py-2 text-xs outline-none"
          />

          <motion.button
            onClick={() => setShowCurrentLocationModal(true)}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1"
          >
            <span className="text-sm">🍔</span>
            <span className="text-xs">View your foodies</span>
            <span className="text-xs bg-red-500 text-white rounded-full px-2">
              {currentLocationFoods.length}
            </span>
          </motion.button>
        </div>

        <AnimatePresence>
          {showCurrentLocationSuggestions && currentLocationQuery && (
            <motion.div className="bg-white mt-2 rounded-lg shadow">
              {suggestions.slice(0, 4).map(addr => (
                <button
                  key={addr.id}
                  onClick={() => handleCurrentLocationSelect(addr.address)}
                  className="w-full text-left p-2 hover:bg-gray-50"
                >
                  <p className="text-xs font-medium">{addr.name}</p>
                  <p className="text-[10px] text-gray-500">{addr.description}</p>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* STOPS */}
        {stops.map(stop => (
          <div key={stop.id} className="mt-2 flex items-center gap-2">
            <input
              ref={(el) => el && (stopInputRefs.current[stop.id] = el)}
              value={stop.address || stopAddressQuery[stop.id] || ''}
              onChange={(e) => handleStopAddressChange(stop.id, e.target.value)}
              placeholder="Stop location"
              className="flex-1 bg-gray-100 rounded-lg px-3 py-2 text-xs outline-none"
            />
            <button onClick={() => handleRemoveStop(stop.id)}>
              <X size={14} className="text-red-500" />
            </button>
          </div>
        ))}
      </div>

      {/* RECENTS */}
      <div className="flex-1 overflow-y-auto pt-40 px-3">
        {showRecentAddresses && mockDeliveryAddresses.map(addr => (
          <button
            key={addr.id}
            onClick={() => handleCurrentLocationSelect(addr.address)}
            className="w-full p-3 bg-white rounded-lg mb-2"
          >
            <p className="text-xs font-medium">{addr.name}</p>
            <p className="text-[10px] text-gray-500">{addr.description}</p>
          </button>
        ))}
      </div>

      {/* BOTTOM BUTTON */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t">
        <motion.button
          onClick={handleGoToDelivery}
          disabled={currentLocationFoods.length === 0}
          className="w-full py-3 rounded-lg bg-green-600 text-white font-semibold"
        >
          Go to delivery
        </motion.button>
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
          isOpen
          onClose={() => setShowStopModal(null)}
          title="Select Food"
          stopId={showStopModal}
          mode="stop"
        />
      )}
    </motion.div>
  );
}
