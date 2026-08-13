import React, { useState, useEffect } from 'react';
import { FarmProvider, useFarm } from './context/FarmContext.tsx';
import { Copilot } from './components/Copilot.tsx';
import { 
  LayoutDashboard, 
  Map, 
  ThermometerSun, 
  Droplet, 
  AlertTriangle, 
  Calendar, 
  Sparkles, 
  History, 
  ShieldAlert, 
  Sprout, 
  LogOut, 
  Settings, 
  Bell, 
  Search, 
  Check, 
  ChevronRight, 
  Database, 
  ArrowUpRight, 
  Bot, 
  RefreshCw,
  ShoppingCart,
  ShoppingBag,
  User,
  Plus,
  Camera,
  Trash,
  Eye,
  MapPin,
  List,
  Store,
  FileText,
  Bookmark,
  CheckCircle,
  Truck,
  RotateCcw,
  Sliders,
  TrendingUp,
  Palette,
  Loader
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';

declare global {
  interface Window {
    google: any;
  }
}

const GoogleMapComponent = ({ 
  pickup, 
  delivery, 
  customer 
}: { 
  pickup: { lat: number; lng: number; name?: string };
  delivery: { lat: number; lng: number; name?: string } | null;
  customer: { lat: number; lng: number; name?: string };
}) => {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const [mapType, setMapType] = React.useState<'none' | 'google' | 'leaflet'>('none');
  const googleMapInstanceRef = React.useRef<any>(null);
  const googleMarkersRef = React.useRef<any[]>([]);
  const leafletMapInstanceRef = React.useRef<any>(null);
  const leafletMarkersRef = React.useRef<any[]>([]);

  // Dynamically load Google Maps or Leaflet on mount
  React.useEffect(() => {
    const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      if (!window.google) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
        script.async = true;
        script.defer = true;
        script.onload = () => setMapType('google');
        script.onerror = () => loadLeaflet();
        document.head.appendChild(script);
      } else {
        setMapType('google');
      }
    } else {
      loadLeaflet();
    }

    function loadLeaflet() {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      const L = (window as any).L;
      if (!L) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = () => setMapType('leaflet');
        document.head.appendChild(script);
      } else {
        setMapType('leaflet');
      }
    }
  }, []);

  // Update map markers when props change
  React.useEffect(() => {
    if (mapType === 'google' && window.google) {
      if (!mapRef.current) return;
      if (!googleMapInstanceRef.current) {
        googleMapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: 11.1271, lng: 78.6569 },
          zoom: 7
        });
      }
      const map = googleMapInstanceRef.current;

      // Clear old google markers
      googleMarkersRef.current.forEach(m => m.setMap(null));
      googleMarkersRef.current = [];

      const farmMarker = new window.google.maps.Marker({
        position: pickup,
        map,
        title: pickup.name || 'Farmer Pickup',
        icon: { url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png' }
      });
      googleMarkersRef.current.push(farmMarker);

      const custMarker = new window.google.maps.Marker({
        position: customer,
        map,
        title: customer.name || 'Customer Destination',
        icon: { url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png' }
      });
      googleMarkersRef.current.push(custMarker);

      if (delivery) {
        const delMarker = new window.google.maps.Marker({
          position: delivery,
          map,
          title: delivery.name || 'Delivery Partner',
          icon: { url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png' }
        });
        googleMarkersRef.current.push(delMarker);
      }

      // Fit bounds
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(pickup);
      bounds.extend(customer);
      if (delivery) bounds.extend(delivery);
      map.fitBounds(bounds);

    } else if (mapType === 'leaflet') {
      const L = (window as any).L;
      if (!L || !mapRef.current) return;

      if (!leafletMapInstanceRef.current) {
        leafletMapInstanceRef.current = L.map(mapRef.current).setView([11.1271, 78.6569], 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(leafletMapInstanceRef.current);
      }
      const map = leafletMapInstanceRef.current;

      // Clear old leaflet markers
      leafletMarkersRef.current.forEach(m => m.remove());
      leafletMarkersRef.current = [];

      const createSVGIcon = (color: string, emoji: string) => {
        return L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 2px 5px rgba(0,0,0,0.3); border: 2px solid white;">${emoji}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
      };

      const pickupMarker = L.marker([pickup.lat, pickup.lng], { icon: createSVGIcon('#10b981', '🌾') })
        .bindPopup(pickup.name || 'Farmer Pickup')
        .addTo(map);
      leafletMarkersRef.current.push(pickupMarker);

      const custMarker = L.marker([customer.lat, customer.lng], { icon: createSVGIcon('#3b82f6', '🏠') })
        .bindPopup(customer.name || 'Customer Destination')
        .addTo(map);
      leafletMarkersRef.current.push(custMarker);

      if (delivery) {
        const delMarker = L.marker([delivery.lat, delivery.lng], { icon: createSVGIcon('#ef4444', '🚚') })
          .bindPopup(delivery.name || 'Delivery Partner')
          .addTo(map);
        leafletMarkersRef.current.push(delMarker);
      }

      // Fit bounds
      const points = [
        [pickup.lat, pickup.lng] as [number, number],
        [customer.lat, customer.lng] as [number, number]
      ];
      if (delivery) points.push([delivery.lat, delivery.lng] as [number, number]);
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
    }
  }, [mapType, pickup, delivery, customer]);

  return (
    <div className="w-full h-full min-h-[300px] relative rounded-3xl overflow-hidden border border-[#DFF2E1]">
      {mapType === 'none' && (
        <div className="absolute inset-0 bg-[#FAFCF8] flex flex-col items-center justify-center space-y-3 z-10">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-slate-500">Loading Map View...</span>
        </div>
      )}
      <div ref={mapRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }} />
    </div>
  );
};

interface LocationPickerProps {
  lat: number;
  lng: number;
  accuracy: number | null;
  timestamp: number | null;
  locationSource: 'gps' | 'manual';
  permissionState: 'prompt' | 'loading' | 'allowed' | 'denied' | 'timeout' | 'unsupported';
  onLocationChange: (lat: number, lng: number, accuracy: number | null, source: 'gps' | 'manual', timestamp: number | null, permissionState?: any) => void;
  shippingAddress: string;
  setShippingAddress: (val: string) => void;
  shippingCity: string;
  setShippingCity: (val: string) => void;
  shippingState: string;
  setShippingState: (val: string) => void;
  shippingPincode: string;
  setShippingPincode: (val: string) => void;
}

const GoogleMapLocationPicker: React.FC<LocationPickerProps> = ({
  lat,
  lng,
  accuracy,
  timestamp,
  locationSource,
  permissionState,
  onLocationChange,
  shippingAddress,
  setShippingAddress,
  shippingCity,
  setShippingCity,
  shippingState,
  setShippingState,
  shippingPincode,
  setShippingPincode
}) => {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<any>(null);
  const markerRef = React.useRef<any>(null);
  const [manualMode, setManualMode] = React.useState<boolean>(false);
  
  // SDK Loader and Map type decision
  const [mapType, setMapType] = React.useState<'none' | 'google' | 'leaflet'>('none');
  const leafletMapInstanceRef = React.useRef<any>(null);
  const leafletMarkerRef = React.useRef<any>(null);

  // Reverse Geocoding helper
  const triggerReverseGeocoding = (newLat: number, newLng: number) => {
    const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
    if (apiKey && window.google && window.google.maps && window.google.maps.Geocoder) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results: any, status: any) => {
        if (status === 'OK' && results && results[0]) {
          setShippingAddress(results[0].formatted_address);
          let city = '';
          let state = '';
          let pincode = '';
          for (const comp of results[0].address_components) {
            if (comp.types.includes('locality')) city = comp.long_name;
            if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
            if (comp.types.includes('postal_code')) pincode = comp.long_name;
          }
          if (city) setShippingCity(city);
          if (state) setShippingState(state);
          if (pincode) setShippingPincode(pincode);
        }
      });
    } else {
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${newLat}&lon=${newLng}&format=json`)
        .then(res => res.json())
        .then(data => {
          setShippingAddress(data.display_name || `GPS Location: Lat ${newLat.toFixed(6)}, Lng ${newLng.toFixed(6)}`);
          const addr = data.address || {};
          const city = addr.city || addr.town || addr.village || addr.suburb || '';
          const state = addr.state || '';
          const pincode = addr.postcode || '';
          if (city) setShippingCity(city);
          if (state) setShippingState(state);
          if (pincode) setShippingPincode(pincode);
        })
        .catch(() => {
          setShippingAddress(`GPS Location: Lat ${newLat.toFixed(6)}, Lng ${newLng.toFixed(6)}`);
        });
    }
  };

  // Initialize browser GPS detection
  const requestGPSLocation = () => {
    if (!navigator.geolocation) {
      onLocationChange(lat, lng, null, 'manual', Date.now(), 'unsupported');
      return;
    }

    onLocationChange(lat, lng, null, 'manual', Date.now(), 'loading');

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocationChange(
          pos.coords.latitude,
          pos.coords.longitude,
          pos.coords.accuracy,
          'gps',
          pos.timestamp,
          'allowed'
        );
        triggerReverseGeocoding(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        if (err.code === err.TIMEOUT) {
          onLocationChange(lat, lng, null, 'manual', Date.now(), 'timeout');
        } else {
          onLocationChange(lat, lng, null, 'manual', Date.now(), 'denied');
        }
      },
      options
    );
  };

  // SDK Scripts loading on Mount
  React.useEffect(() => {
    const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      if (!window.google) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          setMapType('google');
        };
        script.onerror = () => {
          loadLeaflet();
        };
        document.head.appendChild(script);
      } else {
        setMapType('google');
      }
    } else {
      loadLeaflet();
    }

    function loadLeaflet() {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      const L = (window as any).L;
      if (!L) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = () => {
          setMapType('leaflet');
        };
        script.onerror = () => {
          console.error("Leaflet SDK failed to load.");
        };
        document.head.appendChild(script);
      } else {
        setMapType('leaflet');
      }
    }
  }, []);

  // Map cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (leafletMapInstanceRef.current) {
        leafletMapInstanceRef.current.remove();
        leafletMapInstanceRef.current = null;
      }
    };
  }, []);

  // Map Initialization and Position Updates
  React.useEffect(() => {
    if (mapType === 'none' || !mapContainerRef.current) return;

    const isTamilNaduDefault = lat === 11.1271 && lng === 78.6569;
    const zoom = isTamilNaduDefault ? 7 : 16;

    if (mapType === 'google' && window.google) {
      // Clear leaflet map if switching
      if (leafletMapInstanceRef.current) {
        leafletMapInstanceRef.current.remove();
        leafletMapInstanceRef.current = null;
      }

      const mapOptions = {
        center: { lat, lng },
        zoom,
        styles: [
          {
            "featureType": "administrative",
            "elementType": "geometry",
            "stylers": [{ "visibility": "off" }]
          }
        ]
      };

      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new window.google.maps.Map(mapContainerRef.current, mapOptions);
        mapInstanceRef.current.addListener('click', (e: any) => {
          const clickedLat = e.latLng.lat();
          const clickedLng = e.latLng.lng();
          onLocationChange(clickedLat, clickedLng, null, 'manual', Date.now(), permissionState);
          triggerReverseGeocoding(clickedLat, clickedLng);
        });
      } else {
        mapInstanceRef.current.setCenter({ lat, lng });
        mapInstanceRef.current.setZoom(zoom);
      }

      if (markerRef.current) {
        markerRef.current.setMap(null);
      }

      markerRef.current = new window.google.maps.Marker({
        position: { lat, lng },
        map: mapInstanceRef.current,
        title: locationSource === 'gps' ? 'Your Current Location' : 'Selected Location',
        draggable: true,
        icon: {
          url: locationSource === 'gps' ? 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png' : 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
        }
      });

      markerRef.current.addListener('dragend', () => {
        const position = markerRef.current.getPosition();
        const newLat = position.lat();
        const newLng = position.lng();
        onLocationChange(newLat, newLng, null, 'manual', Date.now(), permissionState);
        triggerReverseGeocoding(newLat, newLng);
      });

    } else if (mapType === 'leaflet' && (window as any).L) {
      const L = (window as any).L;
      // Clear google map references
      mapInstanceRef.current = null;

      if (!leafletMapInstanceRef.current) {
        // Clear children to avoid double-initializing
        mapContainerRef.current.innerHTML = '';
        leafletMapInstanceRef.current = L.map(mapContainerRef.current).setView([lat, lng], zoom);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(leafletMapInstanceRef.current);

        leafletMapInstanceRef.current.on('click', (e: any) => {
          const clickedLat = e.latlng.lat;
          const clickedLng = e.latlng.lng;
          onLocationChange(clickedLat, clickedLng, null, 'manual', Date.now(), permissionState);
          triggerReverseGeocoding(clickedLat, clickedLng);
        });
      } else {
        leafletMapInstanceRef.current.setView([lat, lng], zoom);
      }

      if (leafletMarkerRef.current) {
        leafletMapInstanceRef.current.removeLayer(leafletMarkerRef.current);
      }

      const pinIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: `<div style="display: flex; flex-direction: column; align-items: center;">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${locationSource === 'gps' ? '#3B82F6' : '#EF4444'}" style="width: 32px; height: 32px; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.4));">
                   <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/>
                 </svg>
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      leafletMarkerRef.current = L.marker([lat, lng], {
        icon: pinIcon,
        draggable: true
      }).addTo(leafletMapInstanceRef.current);

      leafletMarkerRef.current.on('dragend', (e: any) => {
        const position = e.target.getLatLng();
        const newLat = position.lat;
        const newLng = position.lng;
        onLocationChange(newLat, newLng, null, 'manual', Date.now(), permissionState);
        triggerReverseGeocoding(newLat, newLng);
      });
    }
  }, [mapType, lat, lng, locationSource]);

  return (
    <div className="space-y-4">
      {/* 1. Header and Status Accuracy Banners */}
      <div className="flex justify-between items-center">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Delivery Location</label>
        {permissionState === 'allowed' && accuracy !== null && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
            accuracy <= 100 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            Accuracy: {accuracy.toFixed(0)} meters
          </span>
        )}
      </div>

      {/* 2. Geolocation Status and Banner Alerts */}
      {permissionState === 'prompt' && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex justify-between items-center gap-3">
          <span className="text-slate-500 font-medium">Waiting for location permission</span>
          <button
            type="button"
            onClick={requestGPSLocation}
            className="px-3 py-1.5 bg-lime-600 hover:bg-lime-500 text-white font-bold rounded-lg text-[10px] transition-colors whitespace-nowrap"
          >
            Use My Current Location
          </button>
        </div>
      )}

      {permissionState === 'loading' && (
        <div className="p-3 bg-[#DFF2E1]/20 border border-[#A8D5BA]/30 rounded-xl text-xs text-[#34413A] font-semibold animate-pulse">
          Getting your current location...
        </div>
      )}

      {permissionState === 'allowed' && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex justify-between items-center">
          <div>
            <span className="font-bold block text-emerald-600">Current location detected</span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Drag map pin or click map to refine.</span>
          </div>
          <button
            type="button"
            onClick={requestGPSLocation}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] transition-colors shrink-0"
          >
            Refresh Location
          </button>
        </div>
      )}

      {permissionState === 'denied' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
          Location permission denied. Please allow location access or enter address manually.
        </div>
      )}

      {permissionState === 'timeout' && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-[#d97706]">
          Unable to get accurate GPS location. Try again or enter location manually.
        </div>
      )}

      {permissionState === 'unsupported' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
          Your browser does not support live location.
        </div>
      )}

      {/* 3. The Map Frame Containers */}
      <div className="w-full relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm md:h-[220px] h-[180px]">
        {mapType === 'none' ? (
          <div className="absolute inset-0 bg-[#FAFCF8] rounded-2xl flex flex-col items-center justify-center p-6 text-center animate-pulse">
            <span className="text-slate-400 font-bold text-sm block">
              Loading Map SDK...
            </span>
          </div>
        ) : (
          <div ref={mapContainerRef} className="w-full h-full absolute inset-0" />
        )}
      </div>

      {/* 4. Map Loader Status indicator */}
      <div className="text-[10px] text-slate-400 font-semibold flex justify-between items-center bg-slate-100/50 px-3 py-1.5 rounded-lg border border-slate-200">
        <span>Map: {mapType === 'google' ? 'Google Maps' : mapType === 'leaflet' ? 'OpenStreetMap Fallback' : 'Loading...'}</span>
        {mapType === 'leaflet' && (
          <span className="text-amber-600 font-bold text-[9px] uppercase tracking-wider">
            Google Maps API key missing, using OpenStreetMap fallback
          </span>
        )}
        {mapType === 'google' && (
          <span className="text-emerald-600 font-bold text-[9px] uppercase tracking-wider">
            Map loaded
          </span>
        )}
      </div>

      {/* 5. Manual Fallback Fields Toggle Button */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setManualMode(!manualMode)}
          className="text-xs text-lime-700 hover:text-lime-600 font-bold flex items-center gap-1"
        >
          {manualMode ? 'Hide Manual Inputs' : 'Enter Location Manually'}
        </button>
        {manualMode && (
          <span className="text-[10px] text-slate-400 font-medium self-center">
            (Manual location may be less accurate than GPS)
          </span>
        )}
      </div>

      {/* 5. Fallback Manual Input Form Fields */}
      {manualMode && (
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Address / Village / City *</label>
            <input
              type="text"
              required
              value={shippingAddress}
              onChange={(e) => {
                setShippingAddress(e.target.value);
                onLocationChange(lat, lng, null, 'manual', Date.now(), permissionState);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-900"
              placeholder="e.g. 123 Main Road, Village Name"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">City / District *</label>
            <input
              type="text"
              required
              value={shippingCity}
              onChange={(e) => {
                setShippingCity(e.target.value);
                onLocationChange(lat, lng, null, 'manual', Date.now(), permissionState);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-900"
              placeholder="e.g. Coimbatore"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">State *</label>
            <input
              type="text"
              required
              value={shippingState}
              onChange={(e) => {
                setShippingState(e.target.value);
                onLocationChange(lat, lng, null, 'manual', Date.now(), permissionState);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-900"
              placeholder="e.g. Tamil Nadu"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Pincode *</label>
            <input
              type="text"
              required
              value={shippingPincode}
              onChange={(e) => {
                setShippingPincode(e.target.value);
                onLocationChange(lat, lng, null, 'manual', Date.now(), permissionState);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-900"
              placeholder="e.g. 641018"
            />
          </div>
        </div>
      )}
    </div>
  );
};

const MarketplaceProductCard = ({
  product,
  viewDetails,
  onAddToCart,
  cardClass,
  textTitle,
  textBody,
  borderClass,
  getProductImage,
}: {
  product: any;
  viewDetails: (p: any) => void;
  onAddToCart: (p: any, qty: number) => void;
  cardClass: string;
  textTitle: string;
  textBody: string;
  borderClass: string;
  getProductImage: any;
}) => {
  const [qty, setQty] = React.useState<string>('1');
  const numericQty = Number(qty) || 0;

  const dateHarvested = new Date(product.harvest_date);
  const diffTime = Math.abs(new Date().getTime() - dateHarvested.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1;

  let freshnessBadge = "Fresh Listing";
  let badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (diffDays === 0) {
    freshnessBadge = "Harvested Today";
  } else if (diffDays === 1) {
    freshnessBadge = "1 Day Since Harvest";
  } else if (diffDays <= 3) {
    freshnessBadge = `${diffDays} Days Since Harvest`;
    badgeColor = "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
  } else {
    freshnessBadge = `${diffDays} Days Since Harvest`;
    badgeColor = "bg-orange-500/10 text-orange-400 border-orange-500/20";
  }

  // Validations
  const isOutOfStock = product.status === 'OUT OF STOCK' || product.quantity <= 0;
  const isQtyExceeded = numericQty > product.quantity;
  const isQtyInvalid = numericQty <= 0;
  const validationError = isOutOfStock
    ? 'Out of Stock'
    : isQtyExceeded
    ? `Only ${product.quantity} ${product.unit} available.`
    : isQtyInvalid
    ? 'Please enter a valid quantity.'
    : null;

  return (
    <div className={`${cardClass} rounded-2xl overflow-hidden hover:border-lime-500/50 hover:shadow-lg transition-all flex flex-col justify-between`}>
      <div>
        <img
          src={getProductImage(product.name, product.crop, product.image_url)}
          alt={product.name}
          className="w-full h-40 object-cover"
        />
        <div className="p-4">
          <div className="flex justify-between items-start gap-1">
            <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${badgeColor}`}>
              {freshnessBadge}
            </span>
            <span className="text-[10px] bg-slate-950/20 border border-slate-700/50 px-2 py-0.5 rounded-full font-semibold">
              {product.quality}
            </span>
          </div>

          <h3 className={`font-bold text-lg mt-3 ${textTitle}`}>{product.name}</h3>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-lime-500" fill="none" />
            <span>{product.farm_name || 'Green Valley Farm'} ({product.farm_region || 'Coimbatore'})</span>
          </div>

          <div className={`flex justify-between items-baseline mt-4 border-t ${borderClass} pt-3`}>
            <div>
              <span className="text-xl font-black text-lime-600 font-outfit">₹{product.price}</span>
              <span className="text-xs text-slate-400">/{product.unit}</span>
            </div>
            {isOutOfStock ? (
              <span className="text-xs font-bold text-red-500 uppercase">Out of Stock</span>
            ) : (
              <span className="text-xs text-slate-405">Available: {product.quantity} {product.unit}</span>
            )}
          </div>

          {!isOutOfStock && (
            <div className="mt-4 space-y-2">
              <label className="block text-[10px] font-bold text-slate-500">How many {product.unit} do you want?</label>
              <input
                type="number"
                step="any"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950/10 border border-slate-700/50 focus:border-lime-500 focus:outline-none rounded-xl text-xs font-semibold text-slate-900"
                placeholder={`Enter quantity in ${product.unit}`}
              />
              
              {/* Estimated calculations / validation warnings */}
              {validationError ? (
                <div className="text-[10px] text-red-500 font-bold">{validationError}</div>
              ) : (
                <div className="text-[10px] text-emerald-600 font-bold">
                  Estimated Amount: ₹{(numericQty * product.price).toFixed(2)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={`p-4 bg-slate-950/10 border-t ${borderClass} flex gap-2`}>
        <button
          type="button"
          onClick={() => viewDetails(product)}
          className="flex-1 py-2 bg-transparent border border-slate-700/50 hover:border-lime-500 rounded-lg text-xs font-semibold"
        >
          Details
        </button>
        {isOutOfStock ? (
          <button
            disabled
            className="flex-1 py-2 bg-slate-800 text-slate-550 rounded-lg text-xs font-bold cursor-not-allowed border border-slate-700/30 text-slate-400"
          >
            Out of Stock
          </button>
        ) : (
          <button
            type="button"
            disabled={!!validationError}
            onClick={() => {
              onAddToCart(product, numericQty);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              validationError
                ? 'bg-slate-850 text-slate-500 cursor-not-allowed'
                : 'bg-lime-500 text-slate-950 hover:bg-lime-400'
            }`}
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
};

const demoRoute = [
  { lat: 10.9970, lng: 76.9616, dist: 8.5, eta: 15, status: 'ASSIGNED', msg: 'Delivery Partner Assigned' },
  { lat: 11.0012, lng: 76.9602, dist: 7.2, eta: 12, status: 'PICKED_UP', msg: 'Order Picked Up by Agent' },
  { lat: 11.0065, lng: 76.9585, dist: 5.4, eta: 9, status: 'OUT_FOR_DELIVERY', msg: 'Out for Delivery' },
  { lat: 11.0118, lng: 76.9571, dist: 3.2, eta: 6, status: 'OUT_FOR_DELIVERY', msg: 'En Route to Destination' },
  { lat: 11.0145, lng: 76.9562, dist: 1.4, eta: 3, status: 'OUT_FOR_DELIVERY', msg: 'Approaching Delivery Area' },
  { lat: 11.0162, lng: 76.9560, dist: 0.2, eta: 1, status: 'NEAR_YOU', msg: 'Your Order is Nearby (Within 500m)' },
  { lat: 11.0168, lng: 76.9558, dist: 0.0, eta: 0, status: 'DELIVERED', msg: 'Order Delivered successfully!' }
];

const getProductImage = (name: string, crop: string, imageUrl?: string) => {
  const normName = (name || '').toLowerCase();
  const normCrop = (crop || '').toLowerCase();

  // 1. Check keywords first
  if (normName.includes('tomato') || normCrop.includes('tomato')) {
    return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600';
  }
  if (normName.includes('potato') || normCrop.includes('potato')) {
    return 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=600';
  }
  if (normName.includes('spinach') || normCrop.includes('spinach') || normName.includes('greens') || normName.includes('leafy')) {
    return 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=600';
  }
  if (normName.includes('rice') || normCrop.includes('rice') || normName.includes('basmati') || normName.includes('grain')) {
    return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600';
  }
  if (normName.includes('banana') || normCrop.includes('banana')) {
    return 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&q=80&w=600';
  }
  if (normName.includes('chilli') || normName.includes('chili') || normName.includes('pepper') || normCrop.includes('chilli') || normCrop.includes('pepper')) {
    return 'https://images.unsplash.com/photo-1588252303782-cb80119cb665?auto=format&fit=crop&q=80&w=600';
  }
  if (normName.includes('carrot') || normCrop.includes('carrot')) {
    return 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=600';
  }
  if (normName.includes('onion') || normCrop.includes('onion')) {
    return 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&q=80&w=600';
  }
  if (normName.includes('corn') || normCrop.includes('corn') || normCrop.includes('maize')) {
    return 'https://images.unsplash.com/photo-1551754655-cd27e38d20f6?auto=format&fit=crop&q=80&w=600';
  }
  if (normName.includes('fruit')) {
    return 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&q=80&w=600';
  }

  // 2. Custom image link check
  if (imageUrl && 
      !imageUrl.includes('photo-1595855759920-86582396756a') && 
      !imageUrl.includes('photo-1592924357228-91a4daadcfea') &&
      imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  return imageUrl || 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=600';
};

function AppContent() {
  const {
    isAuthenticated,
    loading,
    user,
    farm,
    fields,
    healthScore,
    sustainabilityScore,
    recommendations,
    tasks,
    alerts,
    waterIntelligence,
    systemStatus,
    activeFieldId,
    setActiveFieldId,
    currentLanguage,
    setCurrentLanguage,
    recordIrrigation,
    submitFeedback,
    updateTaskStatus,
    addCustomTask,
    createNewFarm,
    createNewField,
    plantNewCrop,
    triggerDemo,
    login,
    logout,
    fetchDashboard,
    
    // Marketplace & Cart
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    checkoutCart,
    fetchMarketplace,
    fetchFarmerInventory,
    addMarketplaceProduct,
    updateMarketplaceProduct,
    deleteMarketplaceProduct,
    fetchCustomerOrders,
    fetchFarmerOrders,
    updateOrderStatus,
    cancelOrder,

    // Advisor
    runSoilTest,
    fetchAdvisorHistory,
    sendAdvisorChat,
    fetchDemandInsights,

    fetchDeliveryPartners,
    assignDeliveryPartner,
    fetchDeliveryProfile,
    updateDeliveryAvailability,
    fetchOrderTracking,
    fetchDeliveryRoute,
    simulateDelivery,

    // Payment and Disputes Protection
    payOrder,
    acceptOrder,
    dispatchOrder,
    deliverOrder,
    disputeOrder,
    fetchAdminStats,
    fetchAdminOrders,
    restrictFarmer,
    resolveDispute
  } = useFarm();

  const t = (key: string): string => {
    const dict: Record<string, Record<string, string>> = {
      en: {
        dashboard: "Dashboard",
        seasonalCrops: "Seasonal Crops",
        soilAnalysis: "Soil Analysis",
        plantHealth: "Plant Health",
        products: "Products",
        myProducts: "My Products",
        orders: "Orders",
        delivery: "Delivery",
        notifications: "Notifications",
        profile: "Profile",
        signOut: "Sign Out",
        reliability: "Reliability",
        standing: "Standing",
        active: "Active",
        restricted: "Restricted",
        welcome: "Welcome",
        farmerWorkspace: "Farmer Workspace",
        signedIn: "Signed in",
        seasonalSubtitle: "Here is what you can grow this season based on weather and soil.",
        locationFarm: "Location & Farm",
        bestCrops: "Best Crops for This Season",
        currentSeason: "🌦️ Current Season: Monsoon",
        seasonReason: "These crops are suitable because they grow well in warm weather, need moderate to high water, and match common Indian farming conditions during this season.",
        goodRain: "🌧️ Good Rainfall",
        warmTemp: "☀️ Warm Temperature",
        moistureAvail: "💧 Soil Moisture Available",
        suggestedSeason: "* Suggested dynamically using the season-based crop guide.",
        seasonalCropGuide: "Seasonal Crop Guide",
        highlySuitable: "Highly Suitable",
        suitable: "Suitable",
        moderate: "Moderate",
        duration: "Duration",
        waterNeed: "Water Need",
        viewGrowingTips: "View Growing Tips",
        checkPlantHealth: "Check Plant Health",
        rice: "Rice",
        maize: "Maize",
        groundnut: "Groundnut",
        soybean: "Soybean",
        cotton: "Cotton",
        tomato: "Tomato",
        riceDesc: "Grows well in rainy season and needs standing water.",
        maizeDesc: "Performs well in warm weather with regular rainfall.",
        groundnutDesc: "Good for warm climate and well-drained soil.",
        soybeanDesc: "Suitable for monsoon season and improves soil fertility.",
        cottonDesc: "Needs warm climate but should be protected from excess water.",
        tomatoDesc: "Can grow in this season with proper drainage and disease care.",
        high: "High",
        medium: "Medium",
        
        // Quick Actions
        quickActions: "Quick Actions",
        analyzeSoil: "Analyze Soil",
        analyzeSoilDesc: "Check soil condition before choosing crops.",
        detectDisease: "Detect Disease",
        detectDiseaseDesc: "Upload a leaf photo to check plant health.",
        myProductsDesc: "Seeds, fertilizers, and active listings.",
        trackOrders: "Track Orders",
        trackOrdersDesc: "View product orders and delivery status.",
        
        // Farm Health Overview
        farmHealthOverview: "Farm Health Overview",
        soilStatus: "SOIL STATUS",
        notCheckedYet: "Not checked yet",
        startSoilAnalysis: "Start Soil Analysis",
        plantDiseaseScan: "PLANT DISEASE SCAN",
        noRecentScan: "No recent scan",
        scanPlant: "Scan Plant",
        waterReminder: "WATER REMINDER",
        waterNeedsDepend: "Water needs depend on selected crop.",
        viewCropGuide: "View Crop Guide",
        
        // Farming Store
        farmingStore: "Farming Store",
        manageMarketplace: "Manage active marketplace listings.",
        openProducts: "Open Products",
        recentCustomerEscrow: "Recent customer checkouts & escrow.",
        viewOrders: "View Orders",
        todaysReminders: "Today's Reminders",
        checkSoilMoistureRemind: "Check soil moisture before planting a new crop.",
        useDiseaseDetection: "Use disease detection if leaves show spots or yellowing.",
        chooseCropsWater: "Choose crops based on water availability.",
        viewNotifications: "View Notifications",
        
        // Growing Guide Modal
        growingGuide: "Growing Guide",
        close: "Close",
        bestSeason: "Best Season",
        soilType: "Soil Type",
        essentialCareTips: "Essential Care Tips",
        gotItThanks: "Got it, Thanks!",
        
        // Seasons
        monsoon: "Monsoon",
        
        // Soils
        clayeyLoamy: "Clayey or loamy soil",
        wellDrainedLoamy: "Well-drained loamy soil",
        sandyLoam: "Sandy loam or well-drained soil",
        fertileWellDrained: "Fertile, well-drained loam",
        deepClayeyBlack: "Deep clayey black soil",

        // Tips lists
        riceTip1: "Maintain enough water in the field",
        riceTip2: "Use healthy seeds",
        riceTip3: "Check regularly for pests and leaf disease",
        
        maizeTip1: "Ensure proper spacing between seeds",
        maizeTip2: "Apply organic compost",
        maizeTip3: "Protect from early weeds",
        
        groundnutTip1: "Sow seeds at 5cm depth",
        groundnutTip2: "Control soil moisture during flowering",
        groundnutTip3: "Protect from root rot",
        
        soybeanTip1: "Keep soil moisture consistent",
        soybeanTip2: "Check for leaf miners",
        soybeanTip3: "Inoculate seeds before sowing",
        
        cottonTip1: "Ensure excellent drainage",
        cottonTip2: "Prune excess leaves",
        cottonTip3: "Monitor for bollworms regularly",
        
        // Add Product Form & Inventory
        addProduct: "Add Product",
        addNewProduct: "Add New Product for Direct Sale",
        productTitle: "Product Title *",
        category: "Category *",
        cropType: "Crop Type *",
        variety: "Variety *",
        totalProducts: "Total Products",
        available: "Available",
        outOfStock: "Out of Stock",
        paused: "Paused",
        noProductsAdded: "No products added yet.",
        startSellingDirect: "Start selling your farm products directly to customers.",
        addFirstProduct: "+ ADD YOUR FIRST PRODUCT",
        
        // Customer Portal
        marketplace: "Marketplace",
        myOrders: "My Orders",
        
        // Delivery Portal
        deliveryPortal: "Delivery Portal",
        fulfillmentPartner: "Fulfillment Partner",
        assignedRuns: "Assigned Runs",
        availability: "Availability",
        deliveryDashboard: "Delivery Dashboard",
        deliveryDesc: "Manage active logistics dispatch, accept route orders, and complete shipments.",
        
        // Admin Portal
        adminControl: "Admin Control",
        overview: "Overview",
        users: "Users",
        farmers: "Farmers",
        orderExplorer: "Order Explorer",
        disputes: "Disputes",
        totalFarmers: "Total Farmers",
        totalCustomers: "Total Customers",
        totalOrders: "Total Orders",
        deliveries: "Deliveries",
        failures: "Failures",
        refunds: "Refunds",
        activeDisputes: "Active Disputes",
        
        // Product Categories & Submission
        vegetables: "Vegetables",
        fruits: "Fruits",
        grains: "Grains",
        pulses: "Pulses",
        leafyVegetables: "Leafy vegetables",
        spices: "Spices",
        organicProduce: "Organic produce",
        listProductToMarketplace: "List Product to Marketplace"
      },
      ta: {
        dashboard: "டாஷ்போர்டு",
        seasonalCrops: "பருவகால பயிர்கள்",
        soilAnalysis: "மண் பகுப்பாய்வு",
        plantHealth: "பயிர் ஆரோக்கியம்",
        products: "தயாரிப்புகள்",
        myProducts: "எனது தயாரிப்புகள்",
        orders: "ஆர்டர்கள்",
        delivery: "விநியோகம்",
        notifications: "அறிவிப்புகள்",
        profile: "சுயவிவரம்",
        signOut: "வெளியேறு",
        reliability: "நம்பகத்தன்மை",
        standing: "நிலை",
        active: "செயலில்",
        restricted: "தடைசெய்யப்பட்டது",
        welcome: "வரவேற்கிறோம்",
        farmerWorkspace: "விவசாயி பணியிடம்",
        signedIn: "உள்நுழைந்துள்ளீர்கள்",
        seasonalSubtitle: "வானிலை மற்றும் மண்ணின் அடிப்படையில் இந்த பருவத்தில் நீங்கள் என்ன பயிரிடலாம் என்பது இதோ.",
        locationFarm: "இருப்பிடம் & பண்ணை",
        bestCrops: "இந்த பருவத்திற்கான சிறந்த பயிர்கள்",
        currentSeason: "🌦️ தற்போதைய பருவம்: பருவமழை",
        seasonReason: "இப்பயிர்கள் வெப்பமான வானிலையில் நன்றாக வளர்வதாலும், மிதமான முதல் அதிக தண்ணீர் தேவைப்படுவதாலும், இந்த பருவத்தில் இந்திய விவசாய நிலைகளுக்கு உகந்ததாக உள்ளன.",
        goodRain: "🌧️ நல்ல மழைப்பொழிவு",
        warmTemp: "☀️ வெப்பமான வெப்பநிலை",
        moistureAvail: "💧 மண்ணின் ஈரப்பதம் உள்ளது",
        suggestedSeason: "* பருவக்கால பயிர் வழிகாட்டியின் அடிப்படையில் பரிந்துரைக்கப்படுகிறது.",
        seasonalCropGuide: "பருவகால பயிர் வழிகாட்டி",
        highlySuitable: "மிகவும் பொருத்தமானது",
        suitable: "பொருத்தமானது",
        moderate: "மிதமானது",
        duration: "காலம்",
        waterNeed: "நீர் தேவை",
        viewGrowingTips: "வளர்ப்பு குறிப்புகள்",
        checkPlantHealth: "ஆரோக்கியத்தை சரிபார்",
        rice: "நெல்",
        maize: "சோளம்",
        groundnut: "நிலக்கடலை",
        soybean: "சோயாபீன்ஸ்",
        cotton: "பருத்தி",
        tomato: "தக்காளி",
        riceDesc: "மழைக்காலத்தில் நன்றாக வளரும் மற்றும் தேங்கி நிற்கும் நீர் தேவைப்படுகிறது.",
        maizeDesc: "வெப்பமான வானிலை மற்றும் வழக்கமான மழையில் நன்றாக வளரும்.",
        groundnutDesc: "வெப்பமான காலநிலை மற்றும் வடிகால் வசதியுள்ள மண்ணுக்கு நல்லது.",
        soybeanDesc: "பருவமழை காலத்திற்கு ஏற்றது மற்றும் மண் வளத்தை மேம்படுத்துகிறது.",
        cottonDesc: "வெப்பமான காலநிலை தேவை, ஆனால் அதிகப்படியான நீரிலிருந்து பாதுகாக்கப்பட வேண்டும்.",
        tomatoDesc: "முறையான வடிகால் மற்றும் நோய் பராமரிப்புடன் இந்த பருவத்தில் வளரக்கூடியது.",
        high: "அதிகம்",
        medium: "மிதமானது",
        
        // Quick Actions
        quickActions: "விரைவுச் செயல்பாடுகள்",
        analyzeSoil: "மண்ணை ஆய்வு செய்",
        analyzeSoilDesc: "பயிர்களைத் தேர்ந்தெடுப்பதற்கு முன் மண்ணின் நிலையைச் சரிபார்க்கவும்.",
        detectDisease: "நோயைக் கண்டறி",
        detectDiseaseDesc: "பயிரின் ஆரோக்கியத்தை சரிபார்க்க இலையின் புகைப்படத்தைப் பதிவேற்றவும்.",
        myProductsDesc: "விதைகள், உரங்கள் மற்றும் செயலில் உள்ள பட்டியல்கள்.",
        trackOrders: "ஆர்டர்களைக் கண்காணி",
        trackOrdersDesc: "தயாரிப்பு ஆர்டர்கள் மற்றும் விநியோக நிலையைப் பார்க்கவும்.",
        
        // Farm Health Overview
        farmHealthOverview: "பண்ணை ஆரோக்கிய கண்ணோட்டம்",
        soilStatus: "மண் நிலை",
        notCheckedYet: "இன்னும் சரிபார்க்கப்படவில்லை",
        startSoilAnalysis: "மண் ஆய்வைத் தொடங்கு",
        plantDiseaseScan: "பயிர் நோய் ஸ்கேன்",
        noRecentScan: "அண்மைக்கால ஸ்கேன்கள் எதுவும் இல்லை",
        scanPlant: "பயிரை ஸ்கேன் செய்",
        waterReminder: "நீர் நினைவூட்டல்",
        waterNeedsDepend: "நீர் தேவைகள் தேர்ந்தெடுக்கப்பட்ட பயிரைச் சார்ந்தது.",
        viewCropGuide: "பயிர் வழிகாட்டியைப் பார்",
        
        // Farming Store
        farmingStore: "விவசாயக் கடை",
        manageMarketplace: "செயலில் உள்ள சந்தைப் பட்டியல்களை நிர்வகிக்கவும்.",
        openProducts: "தயாரிப்புகளைத் திற",
        recentCustomerEscrow: "சமீபத்திய வாடிக்கையாளர் செக்அவுட்கள்.",
        viewOrders: "ஆர்டர்களைப் பார்",
        todaysReminders: "இன்றைய நினைவூட்டல்கள்",
        checkSoilMoistureRemind: "புதிய பயிரை நடுவதற்கு முன் மண்ணின் ஈரப்பதத்தை சரிபார்க்கவும்.",
        useDiseaseDetection: "இலைகளில் புள்ளிகள் அல்லது மஞ்சள் நிறம் காணப்பட்டால் நோய் கண்டறிதலைப் பயன்படுத்தவும்.",
        chooseCropsWater: "நீர் கிடைக்கும் தன்மையைப் பொறுத்து பயிர்களைத் தேர்ந்தெடுக்கவும்.",
        viewNotifications: "அறிவிப்புகளைப் பார்",
        
        // Growing Guide Modal
        growingGuide: "வளர்ப்பு வழிகாட்டி",
        close: "மூடு",
        bestSeason: "சிறந்த பருவம்",
        soilType: "மண் வகை",
        essentialCareTips: "அத்தியாவசிய பராமரிப்பு குறிப்புகள்",
        gotItThanks: "புரிந்தது, நன்றி!",
        
        // Seasons
        monsoon: "பருவமழை",
        
        // Soils
        clayeyLoamy: "களிமண் அல்லது வண்டல் மண்",
        wellDrainedLoamy: "வடிகால் வசதியுள்ள வண்டல் மண்",
        sandyLoam: "மணல் கலந்த வண்டல் அல்லது வடிகால் மண்",
        fertileWellDrained: "வளமான, நல்ல வடிகால் வண்டல்",
        deepClayeyBlack: "ஆழமான களிமண் கரிசல் மண்",

        // Tips lists
        riceTip1: "வயலில் போதுமான தண்ணீரை பராமரிக்கவும்",
        riceTip2: "ஆரோக்கியமான விதைகளைப் பயன்படுத்தவும்",
        riceTip3: "பூச்சிகள் மற்றும் இலை நோய்களை தவறாமல் சரிபார்க்கவும்",
        
        maizeTip1: "விதைகளுக்கு இடையே சரியான இடைவெளியை உறுதிப்படுத்தவும்",
        maizeTip2: "இயற்கை உரம் பயன்படுத்தவும்",
        maizeTip3: "ஆரம்பகால களைகளிலிருந்து பாதுகாக்கவும்",
        
        groundnutTip1: "விதைகளை 5 செமீ ஆழத்தில் விதைக்கவும்",
        groundnutTip2: "பூக்கும் காலத்தில் மண்ணின் ஈரப்பதத்தை கட்டுப்படுத்தவும்",
        groundnutTip3: "வேர் அழுகல் நோயிலிருந்து பாதுகாக்கவும்",
        
        soybeanTip1: "மண்ணின் ஈரப்பதத்தை சீராக வைத்திருக்கவும்",
        soybeanTip2: "இலை துளைப்பான்களை சரிபார்க்கவும்",
        soybeanTip3: "விதைப்பதற்கு முன் விதைகளை நேர்த்தி செய்யவும்",
        
        cottonTip1: "சிறந்த வடிகால் வசதியை உறுதி செய்யவும்",
        cottonTip2: "அதிகப்படியான இலைகளை கவாத்து செய்யவும்",
        cottonTip3: "காய்ப்புழுக்களை தவறாமல் கண்காணிக்கவும்",
        
        // Add Product Form & Inventory
        addProduct: "தயாரிப்பைச் சேர்",
        addNewProduct: "நேரடி விற்பனைக்கு புதிய தயாரிப்பைச் சேர்க்கவும்",
        productTitle: "தயாரிப்பு பெயர் *",
        category: "வகை *",
        cropType: "பயிர் வகை *",
        variety: "இனம் / ரகம் *",
        totalProducts: "மொத்த தயாரிப்புகள்",
        available: "இருப்பில் உள்ளவை",
        outOfStock: "இருப்பு இல்லை",
        paused: "நிறுத்தப்பட்டது",
        noProductsAdded: "இன்னும் தயாரிப்புகள் எதுவும் சேர்க்கப்படவில்லை.",
        startSellingDirect: "உங்கள் பண்ணை தயாரிப்புகளை நேரடியாக வாடிக்கையாளர்களுக்கு விற்கத் தொடங்குங்கள்.",
        addFirstProduct: "+ உங்களது முதல் தயாரிப்பைச் சேர்க்கவும்",
        
        // Customer Portal
        marketplace: "சந்தை",
        myOrders: "எனது ஆர்டர்கள்",
        
        // Delivery Portal
        deliveryPortal: "விநியோக போர்டல்",
        fulfillmentPartner: "விநியோக கூட்டாளர்",
        assignedRuns: "ஒதுக்கப்பட்ட விநியோகங்கள்",
        availability: "இருப்பு நிலை",
        deliveryDashboard: "விநியோக டாஷ்போர்டு",
        deliveryDesc: "செயலில் உள்ள தளவாடங்கள் அனுப்புதலை நிர்வகிக்கவும், ஆர்டர்களை ஏற்று அனுப்பவும்.",
        
        // Admin Portal
        adminControl: "நிர்வாகக் கட்டுப்பாடு",
        overview: "கண்ணோட்டம்",
        users: "பயனர்கள்",
        farmers: "விவசாயிகள்",
        orderExplorer: "ஆர்டர் எக்ஸ்ப்ளோரர்",
        disputes: "தகராறுகள்",
        totalFarmers: "மொத்த விவசாயிகள்",
        totalCustomers: "மொத்த வாடிக்கையாளர்கள்",
        totalOrders: "மொத்த ஆர்டர்கள்",
        deliveries: "விநியோகங்கள்",
        failures: "தோல்விகள்",
        refunds: "பணம் திரும்பப் பெறுதல்",
        activeDisputes: "செயலில் உள்ள தகராறுகள்",
        
        // Product Categories & Submission
        vegetables: "காய்கறிகள்",
        fruits: "பழங்கள்",
        grains: "தானியங்கள்",
        pulses: "பருப்பு வகைகள்",
        leafyVegetables: "கீரை வகைகள்",
        spices: "மசாலாப் பொருட்கள்",
        organicProduce: "இயற்கை தயாரிப்புகள்",
        listProductToMarketplace: "தயாரிப்பை சந்தையில் பட்டியலிடு"
      },
      hi: {
        dashboard: "डैशबोर्ड",
        seasonalCrops: "मौसमी फसलें",
        soilAnalysis: "मिट्टी विश्लेषण",
        plantHealth: "फसल स्वास्थ्य",
        products: "उत्पाद",
        myProducts: "मेरे उत्पाद",
        orders: "ऑर्डर",
        delivery: "डिलीवरी",
        notifications: "सूचनाएं",
        profile: "प्रोफ़ाइल",
        signOut: "साइन आउट",
        reliability: "विश्वसनीयता",
        standing: "स्थिति",
        active: "सक्रिय",
        restricted: "प्रतिबंधित",
        welcome: "स्वागत है",
        farmerWorkspace: "किसान कार्यक्षेत्र",
        signedIn: "साइन इन किया",
        seasonalSubtitle: "यहाँ मौसम और मिट्टी के आधार पर आप इस मौसम में क्या उगा सकते हैं, बताया गया है।",
        locationFarm: "स्थान और फार्म",
        bestCrops: "इस मौसम के लिए सर्वोत्तम फसलें",
        currentSeason: "🌦️ वर्तमान मौसम: मानसून",
        seasonReason: "ये फसलें उपयुक्त हैं क्योंकि वे गर्म मौसम में अच्छी तरह बढ़ती हैं, मध्यम से उच्च पानी की आवश्यकता होती है, और इस मौसम के दौरान आम भारतीय कृषि स्थितियों से मेल खाती हैं।",
        goodRain: "🌧️ अच्छी बारिश",
        warmTemp: "☀️ गर्म तापमान",
        moistureAvail: "💧 मिट्टी की नमी उपलब्ध",
        suggestedSeason: "* मौसम आधारित फसल गाइड का उपयोग करके गतिशील रूप से सुझाया गया है।",
        seasonalCropGuide: "मौसमी फसल गाइड",
        highlySuitable: "अत्यधिक उपयुक्त",
        suitable: "उपयुक्त",
        moderate: "मध्यम",
        duration: "अवधि",
        waterNeed: "पानी की आवश्यकता",
        viewGrowingTips: "उगाने के सुझाव",
        checkPlantHealth: "पौधों का स्वास्थ्य जांचें",
        rice: "धान (चावल)",
        maize: "मक्का",
        groundnut: "मूंगफली",
        soybean: "सोयाबीन",
        cotton: "कपास",
        tomato: "टमाटर",
        riceDesc: "बरसात के मौसम में अच्छी तरह बढ़ता है और खड़े पानी की आवश्यकता होती है।",
        maizeDesc: "नियमित बारिश के साथ गर्म मौसम में अच्छा प्रदर्शन करता है।",
        groundnutDesc: "गर्म जलवायु और अच्छी जल निकासी वाली मिट्टी के लिए अच्छा है।",
        soybeanDesc: "मानसून के मौसम के लिए उपयुक्त और मिट्टी की उर्वरता में सुधार करता है।",
        cottonDesc: "गर्म जलवायु की आवश्यकता होती है लेकिन अतिरिक्त पानी से सुरक्षित रखा जाना चाहिए।",
        tomatoDesc: "उचित जल निकासी और रोग देखभाल के साथ इस मौसम में बढ़ सकता है।",
        high: "उच्च",
        medium: "मध्यम",
        
        // Quick Actions
        quickActions: "त्वरित कार्रवाई",
        analyzeSoil: "मिट्टी का विश्लेषण",
        analyzeSoilDesc: "फसल चुनने से पहले मिट्टी की स्थिति की जाँच करें।",
        detectDisease: "रोग का पता लगाएं",
        detectDiseaseDesc: "पौधे के स्वास्थ्य की जांच के लिए पत्ती का फोटो अपलोड करें।",
        myProductsDesc: "बीज, उर्वरक और सक्रिय लिस्टिंग।",
        trackOrders: "ऑर्डर ट्रैक करें",
        trackOrdersDesc: "उत्पाद ऑर्डर और डिलीवरी स्थिति देखें।",
        
        // Farm Health Overview
        farmHealthOverview: "खेत स्वास्थ्य अवलोकन",
        soilStatus: "मिट्टी की स्थिति",
        notCheckedYet: "अभी तक जाँच नहीं की गई",
        startSoilAnalysis: "मिट्टी विश्लेषण शुरू करें",
        plantDiseaseScan: "पौध रोग स्कैन",
        noRecentScan: "कोई हालिया स्कैन नहीं",
        scanPlant: "पौधे को स्कैन करें",
        waterReminder: "पानी अनुस्मारक",
        waterNeedsDepend: "पानी की जरूरतें चुनी गई फसल पर निर्भर करती हैं।",
        viewCropGuide: "फसल गाइड देखें",
        
        // Farming Store
        farmingStore: "कृषि स्टोर",
        manageMarketplace: "सक्रिय बाज़ार लिस्टिंग प्रबंधित करें।",
        openProducts: "उत्पाद खोलें",
        recentCustomerEscrow: "हालिया ग्राहक चेकआउट और एस्क्रो।",
        viewOrders: "ऑर्डर देखें",
        todaysReminders: "आज के अनुस्मारक",
        checkSoilMoistureRemind: "नई फसल लगाने से पहले मिट्टी की नमी की जांच करें।",
        useDiseaseDetection: "यदि पत्तियों पर धब्बे या पीलापन दिखे तो रोग पहचान का उपयोग करें।",
        chooseCropsWater: "पानी की उपलब्धता के आधार पर फसलें चुनें।",
        viewNotifications: "सूचनाएं देखें",
        
        // Growing Guide Modal
        growingGuide: "उगाने की गाइड",
        close: "बंद करें",
        bestSeason: "सर्वोत्तम मौसम",
        soilType: "मिट्टी का प्रकार",
        essentialCareTips: "आवश्यक देखभाल युक्तियाँ",
        gotItThanks: "समझ गया, धन्यवाद!",
        
        // Seasons
        monsoon: "मानसून",
        
        // Soils
        clayeyLoamy: "चिकनी या दोमट मिट्टी",
        wellDrainedLoamy: "अच्छी जल निकासी वाली दोमट मिट्टी",
        sandyLoam: "रेतीली दोमट या अच्छी जल निकासी वाली मिट्टी",
        fertileWellDrained: "उर्वर, अच्छी जल निकासी वाली दोमट",
        deepClayeyBlack: "गहरी चिकनी काली मिट्टी",

        // Tips lists
        riceTip1: "खेत में पर्याप्त पानी बनाए रखें",
        riceTip2: "स्वस्थ बीजों का उपयोग करें",
        riceTip3: "कीटों और पत्ती रोग की नियमित रूप से जाँच करें",
        
        maizeTip1: "बीजों के बीच उचित दूरी सुनिश्चित करें",
        maizeTip2: "जैविक खाद का प्रयोग करें",
        maizeTip3: "शुरुआती खरपतवार से बचाएं",
        
        groundnutTip1: "बीज 5 सेमी गहराई पर बोएं",
        groundnutTip2: "फूल आने के समय मिट्टी की नमी को नियंत्रित करें",
        groundnutTip3: "जड़ सड़न से बचाव करें",
        
        soybeanTip1: "मिट्टी की नमी लगातार बनाए रखें",
        soybeanTip2: "लीफ माइनर कीटों की जाँच करें",
        soybeanTip3: "बुआई से पहले बीजों का उपचार करें",
        
        cottonTip1: "उत्कृष्ट जल निकासी सुनिश्चित करें",
        cottonTip2: "अतिरिक्त पत्तियों की छंटाई करें",
        cottonTip3: "नियमित रूप से बोलवर्म की निगरानी करें",
        
        // Add Product Form & Inventory
        addProduct: "उत्पाद जोड़ें",
        addNewProduct: "प्रत्यक्ष बिक्री के लिए नया उत्पाद जोड़ें",
        productTitle: "उत्पाद का शीर्षक *",
        category: "श्रेणी *",
        cropType: "फसल का प्रकार *",
        variety: "विविधता *",
        totalProducts: "कुल उत्पाद",
        available: "उपलब्ध",
        outOfStock: "स्टॉक में नहीं है",
        paused: "रुका हुआ",
        noProductsAdded: "अभी तक कोई उत्पाद नहीं जोड़ा गया है।",
        startSellingDirect: "अपने कृषि उत्पादों को सीधे ग्राहकों को बेचना शुरू करें।",
        addFirstProduct: "+ अपना पहला उत्पाद जोड़ें",
        
        // Customer Portal
        marketplace: "बाज़ार",
        myOrders: "मेरे ऑर्डर",
        
        // Delivery Portal
        deliveryPortal: "डिलीवरी पोर्टल",
        fulfillmentPartner: "पूर्ति भागीदार",
        assignedRuns: "सौंपी गई डिलीवरी",
        availability: "उपलब्धता",
        deliveryDashboard: "डिलीवरी डैशबोर्ड",
        deliveryDesc: "सक्रिय लॉजिस्टिक्स डिस्पैच प्रबंधित करें, रूट ऑर्डर स्वीकार करें और शिपमेंट पूरा करें।",
        
        // Admin Portal
        adminControl: "एडमिन नियंत्रण",
        overview: "अवलोकन",
        users: "उपयोगकर्ता",
        farmers: "किसान",
        orderExplorer: "ऑर्डर खोजक",
        disputes: "विवाद",
        totalFarmers: "कुल किसान",
        totalCustomers: "कुल ग्राहक",
        totalOrders: "कुल ऑर्डर",
        deliveries: "डिलीवरी",
        failures: "विफलताएं",
        refunds: "धनवापसी",
        activeDisputes: "सक्रिय विवाद",
        
        // Product Categories & Submission
        vegetables: "सब्जियां",
        fruits: "फल",
        grains: "अनाज",
        pulses: "दालें",
        leafyVegetables: "हरी पत्तेदार सब्जियां",
        spices: "मसाले",
        organicProduce: "जैविक उत्पाद",
        listProductToMarketplace: "उत्पाद को बाज़ार में सूचीबद्ध करें"
      }
    };
    return dict[currentLanguage]?.[key] || dict.en[key] || key;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-[#34413A] font-bold text-lg">
        <div className="text-center space-y-4">
          <Loader className="w-10 h-10 animate-spin text-emerald-500 mx-auto" />
          <p>Loading your account...</p>
        </div>
      </div>
    );
  }

  // Theme Management
  const [theme, setTheme] = useState<'forest' | 'rose' | 'lavender' | 'sky' | 'peach' | 'sunflower'>(
    () => (localStorage.getItem('agriconnect-theme') as any) || 'forest'
  );

  const themesConfig = {
    forest: {
      primary: '#A8D5BA',
      primaryLight: '#DFF2E1',
      secondary: '#BFD8C2',
      accent: '#CDEFE3',
      background: '#F7FBF7',
      card: '#FFFFFF',
      text: '#34413A',
      mutedText: '#6B756E',
      border: '#DFF2E1',
      innerBox: '#FFF8E7'
    },
    rose: {
      primary: '#E8AEB7',
      primaryLight: '#F8DDE1',
      secondary: '#F3C6CE',
      accent: '#F6C6D8',
      background: '#FFF8FA',
      card: '#FFFFFF',
      text: '#49383D',
      mutedText: '#7A6970',
      border: '#F8DDE1',
      innerBox: '#FFF0F3'
    },
    lavender: {
      primary: '#B8A9D9',
      primaryLight: '#E7DFF5',
      secondary: '#D8C7F1',
      accent: '#CFC1E8',
      background: '#FAF8FF',
      card: '#FFFFFF',
      text: '#3F394A',
      mutedText: '#716A7D',
      border: '#E7DFF5',
      innerBox: '#F3EFFF'
    },
    sky: {
      primary: '#9CC9E4',
      primaryLight: '#DDEFFA',
      secondary: '#B8DDF0',
      accent: '#C6DDF5',
      background: '#F5FBFF',
      card: '#FFFFFF',
      text: '#34434D',
      mutedText: '#687781',
      border: '#DDEFFA',
      innerBox: '#EDF6FF'
    },
    peach: {
      primary: '#F2B8A2',
      primaryLight: '#FCE3D9',
      secondary: '#FFD6BA',
      accent: '#F7C7A9',
      background: '#FFF9F5',
      card: '#FFFFFF',
      text: '#4A3B35',
      mutedText: '#796B64',
      border: '#FCE3D9',
      innerBox: '#FFF1EB'
    },
    sunflower: {
      primary: '#E6C978',
      primaryLight: '#F9F0C8',
      secondary: '#F3E3A1',
      accent: '#F7E8B0',
      background: '#FFFDF4',
      card: '#FFFFFF',
      text: '#48412F',
      mutedText: '#776F58',
      border: '#F9F0C8',
      innerBox: '#FFFBE6'
    }
  };

  useEffect(() => {
    const config = themesConfig[theme] || themesConfig.forest;
    const root = document.documentElement;
    root.style.setProperty('--primary-color', config.primary);
    root.style.setProperty('--primary-light', config.primaryLight);
    root.style.setProperty('--secondary-color', config.secondary);
    root.style.setProperty('--accent-color', config.accent);
    root.style.setProperty('--background-color', config.background);
    root.style.setProperty('--card-color', config.card);
    root.style.setProperty('--text-color', config.text);
    root.style.setProperty('--muted-text-color', config.mutedText);
    root.style.setProperty('--border-color', config.border);
    root.style.setProperty('--inner-box-color', config.innerBox);
    localStorage.setItem('agriconnect-theme', theme);
  }, [theme]);

  // CSS mappings based on theme (Redesigned for Pastel Theme)
  const bgClass = 'theme-bg';
  const cardClass = 'theme-card shadow-[0_4px_20px_rgba(0,0,0,0.02)] border rounded-[20px]';
  const headerClass = 'theme-card border-b';
  const sidebarClass = 'theme-card border-r';
  const innerBoxClass = 'theme-inner-box border rounded-[16px]';
  const textTitle = 'theme-text font-bold font-outfit';
  const textBody = 'theme-text-muted text-sm leading-relaxed';
  const borderClass = 'theme-border';

  // Accent mapping
  const accentText = 'theme-text font-semibold';
  const accentBg = 'theme-primary-bg hover:opacity-90 font-bold transition-all';
  const accentBgMuted = 'theme-primary-light-bg border theme-border font-semibold';

  // Role Selection States
  const [selectedRole, setSelectedRole] = useState<'farmer' | 'customer' | 'delivery' | 'admin' | null>(null);
  const [showAuth, setShowAuth] = useState<'login' | 'register' | 'forgot' | null>(null);

  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const renderLanguageSelector = (alignRight: boolean = true) => {
    const langNames: Record<string, string> = {
      en: 'English',
      ta: 'தமிழ்',
      hi: 'हिन्दी'
    };

    return (
      <div className="relative inline-block text-left z-40">
        <button
          type="button"
          onClick={() => setLangMenuOpen(!langMenuOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border theme-border theme-card hover:opacity-90 font-semibold text-xs transition-all shadow-sm focus:outline-none"
        >
          <span>🌐 Language: {langNames[currentLanguage] || 'English'}</span>
        </button>

        {langMenuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setLangMenuOpen(false)} />
            <div
              className={`absolute ${alignRight ? 'right-0' : 'left-0'} mt-2 w-40 rounded-2xl shadow-xl border theme-border theme-card p-2 z-40 animate-in fade-in slide-in-from-top-1 duration-100 bg-white`}
            >
              <div className="px-3 py-1.5 border-b theme-border text-[9px] font-black uppercase tracking-wider theme-text-muted">
                Select Language
              </div>
              <div className="mt-1 space-y-0.5">
                {(['en', 'ta', 'hi'] as const).map((lang) => {
                  const isSelected = currentLanguage === lang;
                  return (
                    <button
                      key={lang}
                      onClick={() => {
                        setCurrentLanguage(lang);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${isSelected ? 'theme-primary-light-bg' : 'hover:bg-slate-100/10'}`}
                    >
                      <span className="theme-text">{langNames[lang]}</span>
                      {isSelected && <span className="text-emerald-500 text-xs">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const themeOptions: { id: typeof theme; name: string; icon: string; colors: string[] }[] = [
    { id: 'forest', name: 'Forest Pastel', icon: '🌿', colors: ['#A8D5BA', '#DFF2E1', '#BFD8C2'] },
    { id: 'rose', name: 'Rose Pastel', icon: '🌸', colors: ['#E8AEB7', '#F8DDE1', '#F3C6CE'] },
    { id: 'lavender', name: 'Lavender Pastel', icon: '🪻', colors: ['#B8A9D9', '#E7DFF5', '#D8C7F1'] },
    { id: 'sky', name: 'Sky Pastel', icon: '🩵', colors: ['#9CC9E4', '#DDEFFA', '#B8DDF0'] },
    { id: 'peach', name: 'Peach Pastel', icon: '🍑', colors: ['#F2B8A2', '#FCE3D9', '#FFD6BA'] },
    { id: 'sunflower', name: 'Sunflower Pastel', icon: '🌼', colors: ['#E6C978', '#F9F0C8', '#F3E3A1'] }
  ];

  const renderThemeSelector = (alignRight: boolean = true) => {
    return (
      <div className="relative inline-block text-left z-40">
        <button
          type="button"
          onClick={() => setThemeMenuOpen(!themeMenuOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border theme-border theme-card hover:opacity-90 font-semibold text-xs transition-all shadow-sm focus:outline-none"
        >
          <span>🎨 Theme</span>
          <span className="capitalize text-[10px] theme-text-muted">
            {themeOptions.find(t => t.id === theme)?.icon} {themeOptions.find(t => t.id === theme)?.name.split(' ')[0]}
          </span>
        </button>

        {themeMenuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setThemeMenuOpen(false)} />
            <div
              className={`absolute ${alignRight ? 'right-0' : 'left-0'} mt-2 w-56 rounded-2xl shadow-xl border theme-border theme-card p-2 z-40 animate-in fade-in slide-in-from-top-1 duration-100`}
            >
              <div className="px-3 py-1.5 border-b theme-border text-[9px] font-black uppercase tracking-wider theme-text-muted">
                Appearance Settings
              </div>
              <div className="mt-1 space-y-0.5">
                {themeOptions.map((opt) => {
                  const isSelected = theme === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setTheme(opt.id);
                        setThemeMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${isSelected ? 'theme-primary-light-bg' : 'hover:bg-slate-100/10'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{opt.icon}</span>
                        <div className="flex flex-col">
                          <span className="theme-text">{opt.name}</span>
                          {/* Color dots previews */}
                          <div className="flex gap-1 mt-0.5">
                            {opt.colors.map((c, i) => (
                              <span
                                key={i}
                                className="w-1.5 h-1.5 rounded-full border border-black/5"
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      {isSelected && <span className="text-[10px] text-lime-600 font-bold">✓ Selected</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const getTreatmentTips = (diseaseName: string) => {
    const name = (diseaseName || '').toLowerCase();
    if (name.includes('black spot')) {
      return [
        "Remove infected leaves immediately to stop spores from spreading.",
        "Do not compost diseased leaves; dispose of or burn them.",
        "Avoid watering leaves directly; water at soil level to keep foliage dry.",
        "Improve air circulation by pruning surrounding weeds or branches.",
        "Use suitable copper or sulfur-based organic fungicide if infection spreads.",
        "Keep the plant bed clean of fallen leaf debris."
      ];
    } else if (name.includes('late blight') || name.includes('blight')) {
      return [
        "Remove heavily infected leaves, stems, or entire plants immediately.",
        "Avoid overhead irrigation entirely; keep foliage dry.",
        "Improve field drainage to reduce humidity around root systems.",
        "Use recommended crop-safe fungicides under local agriculture advisor guidance.",
        "Do not store or use infected tubers/fruit for future seeds."
      ];
    } else if (name.includes('tomato') || name.includes('leaf mold') || name.includes('yellow leaf curl')) {
      return [
        "Remove lower infected leaves to prevent ground splash transmission.",
        "Use drip irrigation systems if possible to avoid soil splashing.",
        "Avoid overhead watering; irrigate early in the day.",
        "Use staking or cages to support plants and improve airflow.",
        "Apply crop-safe fungicide or neem oil spray only when needed."
      ];
    } else {
      return [
        "Remove and destroy infected plant parts immediately.",
        "Keep foliage as dry as possible (water near roots, avoid overhead sprinkling).",
        "Improve sunlight penetration and airflow (prune surrounding vegetation).",
        "Avoid overcrowding; space plants properly.",
        "Check soil moisture and ensure adequate field drainage.",
        "Contact your local agriculture officer if the disease continues to spread."
      ];
    }
  };

  const checkCropSupport = (cropName: string) => {
    const name = cropName.toLowerCase();
    const supportedList = ['maize', 'corn', 'soybean', 'tomato', 'potato', 'apple', 'blueberry', 'cherry', 'grape', 'peach', 'pepper', 'raspberry', 'squash', 'strawberry'];
    return supportedList.some(item => name.includes(item));
  };

  const renderPlantHealthDetection = () => {
    const activeResult = selectedHistoryItem || plantAnalysisResult;

    if (plantAnalysisLoading) {
      return (
        <div className="text-center py-20 flex flex-col items-center justify-center max-w-lg mx-auto">
          <div className="w-16 h-16 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mb-6"></div>
          <h3 className="text-xl font-bold text-[#34413A] animate-pulse">{plantAnalysisStep}</h3>
          <p className="text-xs text-slate-500 mt-2">Please do not navigate away or refresh the page while the image is being processed.</p>
        </div>
      );
    }

    if (activeResult) {
      const isLowConfidence = activeResult.confidence < 50.0;
      const displayUrl = activeResult.imageUrl 
        ? (activeResult.imageUrl.startsWith('http') ? activeResult.imageUrl : `http://localhost:3000${activeResult.imageUrl}`)
        : (plantPreview || '');

      return (
        <div className="max-w-3xl mx-auto text-left space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-2xl font-bold ${textTitle}`}>Plant Analysis Result</h2>
            <button
              onClick={() => {
                setPlantAnalysisResult(null);
                setSelectedHistoryItem(null);
                setPlantImage(null);
                setPlantPreview(null);
              }}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-all"
            >
              ← Back to Upload
            </button>
          </div>

          {isLowConfidence ? (
            <div className={`${cardClass} p-8 border border-amber-500/25 bg-amber-500/5 rounded-3xl text-center space-y-6`}>
              <span className="text-5xl block">⚠️</span>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-amber-600 font-outfit uppercase tracking-wide">Unable to confidently identify condition</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  The model confidence is low. Please upload or capture a clearer image showing the affected part of the leaf.
                </p>
              </div>

              <div className="bg-white/40 border border-[#BFD8C2] p-4 rounded-2xl max-w-xs mx-auto text-sm font-semibold text-[#34413A]">
                Detection Confidence: {activeResult.confidence}%
              </div>

              {displayUrl && (
                <div className="max-w-xs mx-auto rounded-2xl overflow-hidden shadow-md border border-[#BFD8C2]/45">
                  <img src={displayUrl} alt="Analyzed Leaf" className="w-full h-48 object-cover" />
                </div>
              )}

              <button
                onClick={() => {
                  setPlantAnalysisResult(null);
                  setSelectedHistoryItem(null);
                  setPlantImage(null);
                  setPlantPreview(null);
                }}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-all shadow-md inline-block"
              >
                Upload Another Image
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Leaf Image & Basic Stats */}
              <div className="space-y-6">
                <div className={`${cardClass} p-4 rounded-3xl overflow-hidden shadow-md`}>
                  <img src={displayUrl} alt="Analyzed Leaf" className="w-full h-56 object-cover rounded-2xl border border-[#BFD8C2]/30 mb-4" />
                  <div className="space-y-2 text-sm text-left">
                    <div>
                      <span className="text-slate-400 text-xs uppercase tracking-wider block">Plant Target</span>
                      <strong className="text-[#34413A] font-bold text-base capitalize">{activeResult.plant}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs uppercase tracking-wider block">Model Confidence</span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-lime-500 h-full rounded-full" style={{ width: `${activeResult.confidence}%` }}></div>
                        </div>
                        <strong className="text-lime-600 font-extrabold font-mono text-xs">{activeResult.confidence}%</strong>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs uppercase tracking-wider block">Detection Mode</span>
                      <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
                        {activeResult.modelVersion || '1.0.0-ONNX'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Disease, Symptoms & Recommendations */}
              <div className="md:col-span-2 space-y-6">
                
                {/* 1. Disease Summary Card */}
                <div className={`${cardClass} p-6 rounded-3xl border border-slate-100 shadow-sm text-left`}>
                  <div className="flex items-start gap-4">
                    {activeResult.status === 'healthy' ? (
                      <>
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0 text-2xl">✓</div>
                        <div className="text-left">
                          <span className="text-emerald-600 font-bold text-xs uppercase tracking-wider">{t('diseaseSummary')}</span>
                          <h3 className="text-2xl font-black text-emerald-800 font-outfit mt-0.5">{t('healthy') || 'Plant Appears Healthy'}</h3>
                          <p className="text-xs text-slate-500 mt-1">No significant disease was detected in the uploaded image sample.</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0 text-2xl">⚠️</div>
                        <div className="text-left">
                          <span className="text-amber-600 font-bold text-xs uppercase tracking-wider">{t('diseaseSummary')}</span>
                          <h3 className="text-2xl font-black text-amber-800 font-outfit mt-0.5">{activeResult.disease}</h3>
                          <p className="text-xs text-slate-500 mt-1">Diagnosis is indicative based on leaf visual symptoms. Consult a local advisor if needed.</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 2. Observed Symptoms Card */}
                {activeResult.symptoms && (
                  <div className={`${cardClass} p-5 rounded-3xl border border-slate-100 shadow-sm text-left`}>
                    <h4 className="font-bold text-[#34413A] mb-2 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <span>🍃</span> {t('observedSymptoms')}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{activeResult.symptoms}</p>
                  </div>
                )}

                {activeResult.status !== 'healthy' && (
                  <>
                    {/* 3. Recommended Fertilizer & Nutrients Card */}
                    <div className={`${cardClass} p-5 rounded-3xl border border-slate-100 shadow-sm text-left`}>
                      <h4 className="font-bold text-emerald-800 mb-2 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <span>🧪</span> {t('recommendedFertilizers')}
                      </h4>
                      <p className="text-xs text-slate-500 mb-3 leading-relaxed italic font-medium">
                        "Fertilizers support plant recovery, but disease control may also need pruning, hygiene, drainage, or fungicide."
                      </p>
                      <ul className="space-y-2 text-xs text-[#6B756E] font-medium">
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-500 shrink-0 mt-0.5">▪</span>
                          <span>Well-rotted compost/FYM: improves soil health & general crop vigor.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-500 shrink-0 mt-0.5">▪</span>
                          <span>Neem cake: supports root health and increases pest resistance.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-500 shrink-0 mt-0.5">▪</span>
                          <span>Balanced NPK: supplies baseline nutrients for recovery growth.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-500 shrink-0 mt-0.5">▪</span>
                          <span>Potassium: improves stem strength and cellular defense mechanisms.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-500 shrink-0 mt-0.5">▪</span>
                          <span>Micronutrient spray: resolves secondary deficiencies in leaves.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-500 shrink-0 mt-0.5">⚠️</span>
                          <span>Avoid excess nitrogen: soft growth increases vulnerability to disease spread.</span>
                        </li>
                      </ul>
                    </div>

                    {/* 4. Treatment Steps Card */}
                    <div className={`${cardClass} p-5 rounded-3xl border border-slate-100 shadow-sm text-left`}>
                      <h4 className="font-bold text-amber-800 mb-2 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <span>🩹</span> {t('treatmentSteps')}
                      </h4>
                      <ul className="space-y-2 text-xs text-slate-600 font-medium">
                        {getTreatmentTips(activeResult.disease).map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-amber-500 shrink-0 mt-0.5">▪</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 5. Prevention Tips Card */}
                    <div className={`${cardClass} p-5 rounded-3xl border border-slate-100 shadow-sm text-left`}>
                      <h4 className="font-bold text-slate-700 mb-2 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <span>🛡️</span> {t('preventionTips')}
                      </h4>
                      <ul className="space-y-2 text-xs text-slate-600 font-medium">
                        <li className="flex items-start gap-2">
                          <span className="text-slate-400 shrink-0 mt-0.5">▪</span>
                          <span>Use healthy, certified disease-free seeds or seedlings.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-slate-400 shrink-0 mt-0.5">▪</span>
                          <span>Maintain proper crop spacing to permit wind flow.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-slate-400 shrink-0 mt-0.5">▪</span>
                          <span>Water near the root zone, keeping leaves dry.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-slate-400 shrink-0 mt-0.5">▪</span>
                          <span>Clear competitive weeds regularly.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-slate-400 shrink-0 mt-0.5">▪</span>
                          <span>Sanitize tools with rubbing alcohol after cutting diseased wood.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-slate-400 shrink-0 mt-0.5">▪</span>
                          <span>Rotate crops each season to break pest life cycles.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-slate-400 shrink-0 mt-0.5">▪</span>
                          <span>Inspect leaves weekly for early signs of disease.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-slate-400 shrink-0 mt-0.5">▪</span>
                          <span>Avoid over-fertilizing with mineral nitrogen.</span>
                        </li>
                      </ul>
                    </div>

                    {/* 6. Expert Help Card */}
                    <div className={`${cardClass} p-5 rounded-3xl border border-red-200/40 bg-red-500/5 text-left`}>
                      <h4 className="font-bold text-red-800 mb-2 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <span>📞</span> {t('whenToContactExpert')}
                      </h4>
                      <p className="text-xs text-red-800 leading-relaxed font-semibold">
                        Contact a local agriculture officer or expert if the infection spreads quickly, affects many plants, or the crop starts wilting.
                      </p>
                    </div>
                  </>
                )}

                {activeResult.status === 'healthy' && (
                  <>
                    {/* Recommended Fertilizers & Maintenance Card */}
                    <div className={`${cardClass} p-5 rounded-3xl border border-slate-100 shadow-sm text-left`}>
                      <h4 className="font-bold text-emerald-800 mb-2 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <span>🧪</span> Recommended Fertilizers & Maintenance
                      </h4>
                      <p className="text-xs text-slate-500 mb-3 leading-relaxed italic font-medium">
                        "Keep your healthy crop strong, support robust root development, and maintain high disease resistance:"
                      </p>
                      <ul className="space-y-2 text-xs text-[#6B756E] font-medium">
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-500 shrink-0 mt-0.5">▪</span>
                          <span>Well-rotted organic compost or FYM (Farm Yard Manure): Top-dress once every month to feed soil microbiomes.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-500 shrink-0 mt-0.5">▪</span>
                          <span>Balanced NPK Feed (e.g. 19-19-19): Apply in low concentrations during growth phases to supply essential nitrogen, potash, and phosphates.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-500 shrink-0 mt-0.5">▪</span>
                          <span>Organic Mulch (Straw, Dry Leaves): Spread a 2-inch layer around the roots to retain soil moisture and regulate soil temperature.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-500 shrink-0 mt-0.5">▪</span>
                          <span>Liquid Seaweed Extract / Foliar Spray: Spray early morning every 2-3 weeks to introduce trace micronutrients and mineral boost.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-500 shrink-0 mt-0.5">▪</span>
                          <span>Weeding & Soil Aeration: Gently till the topsoil around the plant to permit root breathing and clear competitive weed hosts.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-500 shrink-0 mt-0.5">▪</span>
                          <span>Proper Crop Spacing: Ensure adjacent leaves do not touch, facilitating free passage of air and drying of dew.</span>
                        </li>
                      </ul>
                    </div>

                    <div className={`${cardClass} p-5 rounded-3xl border border-slate-100 shadow-sm text-left`}>
                      <h4 className="font-bold text-[#34413A] mb-2 text-xs uppercase tracking-wider">Recommendations</h4>
                      <ul className="space-y-2 text-xs text-[#6B756E]">
                        {activeResult.recommendations?.map((rec: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-emerald-500 shrink-0 mt-0.5">▪</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={() => {
                      setPlantAnalysisResult(null);
                      setSelectedHistoryItem(null);
                      setPlantImage(null);
                      setPlantPreview(null);
                    }}
                    className="flex-1 py-3 bg-lime-500 hover:bg-lime-400 text-slate-955 font-bold rounded-2xl text-xs tracking-wider uppercase transition-all shadow-md text-center"
                  >
                    Check Another Plant
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto space-y-8 text-left animate-in fade-in duration-200">
        <div className="mb-6">
          <h2 className={`text-2xl font-bold ${textTitle}`}>Plant Health Detection</h2>
          <p className="text-slate-500 text-sm mt-1">
            Upload or capture a photo of your plant to check for possible diseases.
          </p>
          {selectedPlantForHealth && (
            <div className="mt-3 space-y-2 max-w-sm">
              <div className="flex items-center justify-between bg-slate-900/10 p-3 rounded-xl border border-slate-200/50">
                <span className="text-xs font-semibold text-slate-600">
                  Selected Plant: <strong className="text-[#34413A]">{selectedPlantForHealth}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedPlantForHealth('')}
                  className="text-[10px] text-red-500 hover:text-red-700 font-bold"
                >
                  Clear
                </button>
              </div>
              {!checkCropSupport(selectedPlantForHealth) && (
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-[10px] text-amber-600 font-semibold">
                  ⚠️ Detection support may be limited for this crop.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Action Column: Camera & Upload */}
          <div className="md:col-span-2 space-y-6">
            {plantCameraActive ? (
              <div className={`${cardClass} p-6 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center h-[350px] bg-black`}>
                <video ref={videoRef} className="w-full h-full object-cover rounded-2xl" playsInline muted />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-6 z-10">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-colors shadow-lg"
                  >
                    📷 Capture Photo
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors shadow-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : plantPreview ? (
              <div className={`${cardClass} p-6 rounded-3xl flex flex-col items-center`}>
                <div className="w-full h-[280px] rounded-2xl overflow-hidden border border-[#BFD8C2] mb-4">
                  <img src={plantPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex gap-4 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setPlantImage(null);
                      setPlantPreview(null);
                    }}
                    className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 transition-colors"
                  >
                    Change Image
                  </button>
                  <button
                    type="button"
                    onClick={analyzePlant}
                    className="flex-1 py-2.5 bg-lime-500 hover:bg-lime-400 text-[#34413A] font-bold rounded-xl text-xs transition-colors shadow-md"
                  >
                    Analyze Plant
                  </button>
                </div>
              </div>
            ) : (
              <div className={`${cardClass} p-8 rounded-3xl border-2 border-dashed border-[#BFD8C2]/60 hover:border-lime-500/40 transition-colors flex flex-col items-center justify-center py-16 text-center space-y-4`}>
                <span className="text-5xl block">🌱</span>
                <div>
                  <h4 className="font-bold text-[#34413A] text-sm">Select Leaf Sample</h4>
                  <p className="text-xs text-slate-500 mt-1">Select a photo from your gallery or use your device camera.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <input
                    type="file"
                    id="leaf-upload-input"
                    className="hidden"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        if (file.size > 10 * 1024 * 1024) {
                          alert("File exceeds maximum size limits (10MB).");
                          return;
                        }
                        setPlantImage(file);
                        setPlantPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('leaf-upload-input')?.click()}
                    className="px-6 py-3 bg-[#DFF2E1] hover:opacity-95 text-[#34413A] font-bold rounded-xl text-xs border border-[#BFD8C2]/40 transition-all flex items-center justify-center gap-2"
                  >
                    📁 Upload Plant Image
                  </button>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-6 py-3 bg-lime-500 hover:bg-lime-400 text-slate-955 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    📷 Take Photo
                  </button>
                </div>

                {cameraPermissionError && (
                  <p className="text-xs text-red-500 font-semibold bg-red-100/50 border border-red-200/50 px-4 py-2 rounded-xl mt-4">
                    {cameraPermissionError}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Guidance Info */}
          <div className="space-y-6">
            <div className={`${cardClass} p-6 rounded-3xl text-xs space-y-4`}>
              <h4 className="font-bold text-[#34413A] text-sm flex items-center gap-1.5">
                <span>💡</span> Guidance for Better Detection
              </h4>
              <ul className="space-y-2.5 text-slate-600 font-medium">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 text-sm">✓</span>
                  <span>Use good lighting.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 text-sm">✓</span>
                  <span>Keep the affected leaf visible.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 text-sm">✓</span>
                  <span>Avoid blurry photos.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 text-sm">✓</span>
                  <span>Keep the plant centered.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 text-sm">✓</span>
                  <span>Capture the affected area clearly.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 text-sm">✓</span>
                  <span>Avoid excessive background.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section: History */}
        <div className="border-t theme-border pt-8 mt-4">
          <h3 className="text-lg font-bold font-outfit text-[#34413A] mb-4">Plant Analysis History</h3>
          
          {plantHistory.length === 0 ? (
            <div className="text-center py-12 bg-slate-550/5 border border-[#DFF2E1]/20 rounded-2xl">
              <span className="text-3xl block mb-2">📋</span>
              <p className="text-slate-500 text-xs">No previous analysis records available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {plantHistory.map((item) => {
                const isHealthy = item.status === 'healthy';
                const formattedDate = new Date(item.created_at).toLocaleDateString(undefined, { 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric' 
                });
                const displayThumbnail = item.image_url 
                  ? (item.image_url.startsWith('http') ? item.image_url : `http://localhost:3000${item.image_url}`)
                  : '';

                return (
                  <div key={item.id} className={`${cardClass} p-4 rounded-2xl flex flex-col justify-between border theme-border shadow-sm`}>
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] text-slate-400 font-bold">{formattedDate}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isHealthy ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {isHealthy ? 'Healthy' : 'Possible Infection'}
                        </span>
                      </div>
                      <div className="flex gap-3">
                        {displayThumbnail && (
                          <img src={displayThumbnail} alt="Leaf" className="w-12 h-12 object-cover rounded-xl border border-slate-200" />
                        )}
                        <div className="text-left">
                          <h4 className="font-bold text-[#34413A] text-xs capitalize block">{item.plant_name}</h4>
                          <span className="text-xs text-slate-500 block truncate max-w-[150px]">{item.disease_name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t theme-border pt-3 mt-4">
                      <span className="text-[10px] text-slate-400 font-bold">Conf: {item.confidence}%</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => deleteHistoryItem(item.id)}
                          className="px-2.5 py-1 bg-red-500/10 text-red-600 font-bold rounded-lg text-[10px] hover:bg-red-500 hover:text-white transition-colors"
                          title="Delete Record"
                        >
                          🗑️
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedHistoryItem(item)}
                          className="px-3 py-1 bg-lime-600 text-white font-bold rounded-lg text-[10px] hover:bg-lime-500 transition-colors"
                        >
                          View Result
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Geolocation states
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState<'prompt' | 'enabled' | 'disabled'>('prompt');
  const [courierLat, setCourierLat] = useState<number | null>(null);
  const [courierLng, setCourierLng] = useState<number | null>(null);

  // Remember Me credentials retentive states
  const [rememberMe, setRememberMe] = useState(true);

  // Plant Health Detection states
  const [plantImage, setPlantImage] = useState<File | null>(null);
  const [plantPreview, setPlantPreview] = useState<string | null>(null);
  const [plantCameraActive, setPlantCameraActive] = useState(false);
  const [plantAnalysisLoading, setPlantAnalysisLoading] = useState(false);
  const [plantAnalysisStep, setPlantAnalysisStep] = useState('');
  const [plantAnalysisResult, setPlantAnalysisResult] = useState<any | null>(null);
  const [plantHistory, setPlantHistory] = useState<any[]>([]);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraPermissionError, setCameraPermissionError] = useState<string | null>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any | null>(null);
  const [selectedPlantForHealth, setSelectedPlantForHealth] = useState<string>('');
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Authentication forms
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Dashboard navigation tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Voice Update recording state
  const [voiceRecordingStates, setVoiceRecordingStates] = useState<{ [orderId: string]: string }>({});

  // Sliders for dynamic What-If simulations
  const [demoMoisture, setDemoMoisture] = useState(28);
  const [demoRainProb, setDemoRainProb] = useState(10);
  const [simulatedRec, setSimulatedRec] = useState<any>(null);

  // Products and Marketplace
  const [marketplaceProducts, setMarketplaceProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [viewProductDetails, setViewProductDetails] = useState<any | null>(null);
  const [detailProductQty, setDetailProductQty] = useState<string>('1');

  useEffect(() => {
    if (viewProductDetails) {
      setDetailProductQty('1');
    }
  }, [viewProductDetails]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<number>(1);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);

  // Checkout inputs
  const [shippingName, setShippingName] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingStateInput, setShippingStateInput] = useState('');
  const [shippingPincode, setShippingPincode] = useState('');
  const [shippingLat, setShippingLat] = useState<number>(11.1271);
  const [shippingLng, setShippingLng] = useState<number>(78.6569);
  const [shippingAccuracy, setShippingAccuracy] = useState<number | null>(null);
  const [shippingTimestamp, setShippingTimestamp] = useState<number | null>(null);
  const [shippingLocationSource, setShippingLocationSource] = useState<'gps' | 'manual'>('manual');
  const [locationPermissionState, setLocationPermissionState] = useState<'prompt' | 'loading' | 'allowed' | 'denied' | 'timeout' | 'unsupported'>('prompt');
  const [deliveryPreference, setDeliveryPreference] = useState('Delivery');
  const [orderNotes, setOrderNotes] = useState('');

  // Farmer Inventory and Orders
  const [farmerInventory, setFarmerInventory] = useState<any[]>([]);
  const [farmerOrders, setFarmerOrders] = useState<any[]>([]);
  const [demandInsights, setDemandInsights] = useState<any[]>([]);

  // Add Product Form inputs
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('Vegetables');
  const [newProductCrop, setNewProductCrop] = useState('');
  const [newProductVariety, setNewProductVariety] = useState('');
  const [newProductQty, setNewProductQty] = useState('');
  const [newProductUnit, setNewProductUnit] = useState('kg');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductHarvest, setNewProductHarvest] = useState(new Date().toISOString().split('T')[0]);
  const [newProductQuality, setNewProductQuality] = useState('Grade A');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductImage, setNewProductImage] = useState('');

  // Edit Product Form inputs
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editProductName, setEditProductName] = useState('');
  const [editProductCategory, setEditProductCategory] = useState('Vegetables');
  const [editProductCrop, setEditProductCrop] = useState('');
  const [editProductVariety, setEditProductVariety] = useState('');
  const [editProductQty, setEditProductQty] = useState('');
  const [editProductUnit, setEditProductUnit] = useState('kg');
  const [editProductPrice, setEditProductPrice] = useState('');
  const [editProductHarvest, setEditProductHarvest] = useState('');
  const [editProductQuality, setEditProductQuality] = useState('Grade A');
  const [editProductDesc, setEditProductDesc] = useState('');
  const [editProductImage, setEditProductImage] = useState('');

  const [uploadingImage, setUploadingImage] = useState(false);
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('agrimind_token')}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        if (isEdit) {
          setEditProductImage(data.imageUrl);
        } else {
          setNewProductImage(data.imageUrl);
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to upload image');
      }
    } catch (err) {
      alert('Error uploading image.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Product Camera States & Handlers
  const [productCameraActive, setProductCameraActive] = useState(false);
  const [productCameraStream, setProductCameraStream] = useState<MediaStream | null>(null);
  const [productCameraIsEdit, setProductCameraIsEdit] = useState(false);
  const productVideoRef = React.useRef<HTMLVideoElement | null>(null);

  const startProductCamera = async (isEdit: boolean) => {
    setProductCameraIsEdit(isEdit);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setProductCameraStream(stream);
      setProductCameraActive(true);
    } catch (err) {
      alert("Unable to access camera: " + err);
    }
  };

  const stopProductCamera = () => {
    if (productCameraStream) {
      productCameraStream.getTracks().forEach(t => t.stop());
      setProductCameraStream(null);
    }
    setProductCameraActive(false);
  };

  const captureProductPhoto = () => {
    if (productVideoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = productVideoRef.current.videoWidth || 640;
      canvas.height = productVideoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(productVideoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], "captured_product.jpg", { type: "image/jpeg" });
            
            setUploadingImage(true);
            const formData = new FormData();
            formData.append('image', file);
            try {
              const res = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('agrimind_token')}`
                },
                body: formData
              });
              if (res.ok) {
                const data = await res.json();
                if (productCameraIsEdit) {
                  setEditProductImage(data.imageUrl);
                } else {
                  setNewProductImage(data.imageUrl);
                }
                stopProductCamera();
              } else {
                alert("Failed to upload captured photo.");
              }
            } catch (e) {
              alert("Error uploading captured photo.");
            } finally {
              setUploadingImage(false);
            }
          }
        }, 'image/jpeg');
      }
    }
  };

  useEffect(() => {
    if (productCameraActive && productCameraStream && productVideoRef.current) {
      productVideoRef.current.srcObject = productCameraStream;
      productVideoRef.current.play().catch((err: any) => console.error("Error playing video:", err));
    }
  }, [productCameraActive, productCameraStream]);

  // Farmer My Products Search & Filters
  const [farmerSearch, setFarmerSearch] = useState('');
  const [farmerCategoryFilter, setFarmerCategoryFilter] = useState('');
  const [farmerStatusFilter, setFarmerStatusFilter] = useState('');
  const [farmerSortFilter, setFarmerSortFilter] = useState('recent');

  // Customer Order Cancellation State
  const [cancellationOrder, setCancellationOrder] = useState<any | null>(null);
  const [cancellationReason, setCancellationReason] = useState('Ordered by mistake');
  const [cancellationReasonOther, setCancellationReasonOther] = useState('');

  // Advisor forms
  const [soilPh, setSoilPh] = useState('6.5');
  const [soilN, setSoilN] = useState('Medium');
  const [soilP, setSoilP] = useState('High');
  const [soilK, setSoilK] = useState('Medium');
  const [soilMoisture, setSoilMoisture] = useState('Good');
  const [soilCarbon, setSoilCarbon] = useState('1.2');
  const [soilTypeInput, setSoilTypeInput] = useState('Clay Loam');
  const [soilTempInput, setSoilTempInput] = useState('30');
  const [soilLocationInput, setSoilLocationInput] = useState('Coimbatore Field A');
  const [advisorResults, setAdvisorResults] = useState<any[]>([]);
  const [advisorHistory, setAdvisorHistory] = useState<any[]>([]);
  const [advisorChatHistory, setAdvisorChatHistory] = useState<any[]>([]);
  const [advisorChatMessage, setAdvisorChatMessage] = useState('');
  const [advisorChatLoading, setAdvisorChatLoading] = useState(false);
  // Delivery tracking states
  const [deliveryPartners, setDeliveryPartners] = useState<any[]>([]);
  const [selectedPartners, setSelectedPartners] = useState<{ [orderId: string]: string }>({});
  const [trackingOrder, setTrackingOrder] = useState<any | null>(null);
  const [liveTrackingInfo, setLiveTrackingInfo] = useState<any | null>(null);
  const [liveRoutePoints, setLiveRoutePoints] = useState<any[]>([]);
  const [activeSimulationInterval, setActiveSimulationInterval] = useState<any | null>(null);
  const [deliveryPersonOrders, setDeliveryPersonOrders] = useState<any[]>([]);
  const [selectedDeliveryOrder, setSelectedDeliveryOrder] = useState<any | null>(null);
  const [isDemoTracking, setIsDemoTracking] = useState(false);
  const [demoTrackingIndex, setDemoTrackingIndex] = useState(0);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [courierAccuracy, setCourierAccuracy] = useState<number | null>(null);
  const [courierTimestamp, setCourierTimestamp] = useState<number | null>(null);

  // Secure vegetable order and payment protection states
  const [adminStats, setAdminStats] = useState<any>(null);
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
  const [disputeModalOrder, setDisputeModalOrder] = useState<any | null>(null);
  const [disputeReason, setDisputeReason] = useState('Order not received');
  const [disputeReasonOther, setDisputeReasonOther] = useState('');
  const [otpInputOrder, setOtpInputOrder] = useState<any | null>(null);
  const [otpInputValue, setOtpInputValue] = useState('');
  const [otpError, setOtpError] = useState('');
  const [selectedCropTips, setSelectedCropTips] = useState<any | null>(null);
  const [deliveryPartnerProfile, setDeliveryPartnerProfile] = useState<any | null>(null);
  const [assigningOrder, setAssigningOrder] = useState<any | null>(null);
  const [manualDriverName, setManualDriverName] = useState('');
  const [manualDriverPhone, setManualDriverPhone] = useState('');
  const [manualDriverVehicle, setManualDriverVehicle] = useState('Bike');
  const [manualPickupLocation, setManualPickupLocation] = useState('');
  const [manualDeliveryLocation, setManualDeliveryLocation] = useState('');
  const [manualNotes, setManualNotes] = useState('');

  // Load contextual data based on active roles
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'customer') {
        loadMarketplace();
        loadCustomerOrders();
      } else if (user.role === 'farmer') {
        loadFarmerInventory();
        loadFarmerOrders();
        loadDemandInsights();
        loadDeliveryPartners();
        loadAdvisorHistory();
      } else if (user.role === 'delivery') {
        loadDeliveryPersonOrders();
      } else if (user.role === 'admin') {
        loadAdminStats();
        loadAdminOrders();
        loadMarketplace();
      }
    }
  }, [isAuthenticated, user]);

  const loadDeliveryPersonOrders = async () => {
    try {
      const res = await fetch('/api/delivery/orders', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('agrimind_token')}` }
      });
      if (res.ok) {
        const list = await res.json();
        setDeliveryPersonOrders(list);
        
        // Sync selected order state
        if (selectedDeliveryOrder) {
          const updated = list.find((o: any) => o.order_id === selectedDeliveryOrder.order_id);
          if (updated) {
            setSelectedDeliveryOrder(updated);
          }
        }
      }
      const prof = await fetchDeliveryProfile();
      if (prof) {
        setDeliveryPartnerProfile(prof);
      }
    } catch (e) {
      console.error('Error loading delivery orders:', e);
    }
  };

  const startVoiceUpdateRecording = async (orderId: number, deliveryId: number | null) => {
    let recordingStartTime = Date.now();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());

        const duration = Date.now() - recordingStartTime;
        if (duration < 5000) {
          alert('Please record a longer voice message.');
          setVoiceRecordingStates(prev => ({ ...prev, [orderId]: 'IDLE' }));
          return;
        }

        setVoiceRecordingStates(prev => ({ ...prev, [orderId]: 'UPLOADING' }));
        
        // Transition from Uploading to Processing after 1 second to show feedback
        setTimeout(() => {
          setVoiceRecordingStates(prev => {
            if (prev[orderId] === 'UPLOADING') {
              return { ...prev, [orderId]: 'PROCESSING' };
            }
            return prev;
          });
        }, 1000);

        try {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          
          // Convert audio blob to base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            try {
              const base64Audio = (reader.result as string).split(',')[1];
              const payload = {
                audio_base64: base64Audio,
                order_id: String(orderId),
                delivery_person_id: deliveryId ? String(deliveryId) : ''
              };

              const response = await fetch('https://poornima25.app.n8n.cloud/webhook/delivery-voice-update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });

              if (response.ok) {
                const result = await response.json();
                if (result.status === 'success' || result.success) {
                  setVoiceRecordingStates(prev => ({ ...prev, [orderId]: 'COMPLETED' }));
                  await loadDeliveryPersonOrders();
                  setTimeout(() => {
                    setVoiceRecordingStates(prev => ({ ...prev, [orderId]: 'IDLE' }));
                  }, 4000);
                } else {
                  throw new Error(result.error || 'n8n process failed');
                }
              } else {
                throw new Error('Upload failed');
              }
            } catch (innerError: any) {
              console.error('Failed to complete base64 upload:', innerError);
              setVoiceRecordingStates(prev => ({ ...prev, [orderId]: 'FAILED' }));
              setTimeout(() => {
                setVoiceRecordingStates(prev => ({ ...prev, [orderId]: 'IDLE' }));
              }, 4000);
            }
          };
        } catch (uploadError) {
          console.error('Failed to prepare voice upload:', uploadError);
          setVoiceRecordingStates(prev => ({ ...prev, [orderId]: 'FAILED' }));
          setTimeout(() => {
            setVoiceRecordingStates(prev => ({ ...prev, [orderId]: 'IDLE' }));
          }, 4000);
        }
      };

      mediaRecorder.start();
      setVoiceRecordingStates(prev => ({ ...prev, [orderId]: 'RECORDING' }));
      recordingStartTime = Date.now();

      // Store media recorder reference so we can stop it manually
      (window as any)[`mediaRecorder_${orderId}`] = mediaRecorder;

      // Automatically stop after 8 seconds
      setTimeout(() => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      }, 8000);

    } catch (err: any) {
      console.error('Error starting audio recording:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert('Microphone permission was denied. Please allow microphone access to use voice updates.');
      } else {
        alert('Failed to start audio recording: ' + err.message);
      }
      setVoiceRecordingStates(prev => ({ ...prev, [orderId]: 'FAILED' }));
      setTimeout(() => {
        setVoiceRecordingStates(prev => ({ ...prev, [orderId]: 'IDLE' }));
      }, 3000);
    }
  };

  const stopVoiceUpdateRecording = (orderId: number) => {
    const mediaRecorder = (window as any)[`mediaRecorder_${orderId}`];
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  };

  const loadDeliveryPartners = async () => {
    const list = await fetchDeliveryPartners();
    setDeliveryPartners(list);
  };

  const loadMarketplace = async () => {
    const list = await fetchMarketplace(selectedCategory, searchQuery);
    setMarketplaceProducts(list);
  };

  const loadCustomerOrders = async () => {
    const list = await fetchCustomerOrders();
    setCustomerOrders(list);
  };

  const loadFarmerInventory = async () => {
    const list = await fetchFarmerInventory();
    setFarmerInventory(list);
  };

  const loadFarmerOrders = async () => {
    const list = await fetchFarmerOrders();
    setFarmerOrders(list);
  };

  const loadDemandInsights = async () => {
    const list = await fetchDemandInsights();
    setDemandInsights(list);
  };

  const loadAdvisorHistory = async () => {
    const list = await fetchAdvisorHistory();
    setAdvisorHistory(list);
  };

  const loadAdminStats = async () => {
    const stats = await fetchAdminStats();
    setAdminStats(stats);
  };

  const loadAdminOrders = async () => {
    const list = await fetchAdminOrders();
    setAdminOrders(list);
  };

  // Re-fetch marketplace when search query or category filters shift
  useEffect(() => {
    if (isAuthenticated && user?.role === 'customer') {
      loadMarketplace();
    }
  }, [selectedCategory, searchQuery]);

  // Trigger browser location request on first launch
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
          setLocationStatus('enabled');
        },
        (err) => {
          setLocationStatus('disabled');
        }
      );
    } else {
      setLocationStatus('disabled');
    }
  }, []);

  // Auto-fill credentials on selecting active portal login
  useEffect(() => {
    if (showAuth === 'login' && selectedRole) {
      const lastEmail = localStorage.getItem(`agrimind_remember_${selectedRole}_email`);
      if (lastEmail) {
        fetch(`/api/auth/remembered?email=${encodeURIComponent(lastEmail)}&role=${selectedRole}`)
          .then((res) => {
            if (res.ok) return res.json();
            throw new Error();
          })
          .then((data) => {
            setAuthEmail(data.email);
            setAuthPassword(data.password);
            setRememberMe(true);
          })
          .catch(() => {
            setAuthEmail('');
            setAuthPassword('');
            setRememberMe(true);
          });
      } else {
        setAuthEmail('');
        setAuthPassword('');
        setRememberMe(true);
      }
    }
  }, [showAuth, selectedRole]);

  // Real-time location watching and telemetry streaming for active courier deliveries
  useEffect(() => {
    let watchId: number | null = null;

    if (isAuthenticated && user?.role === 'delivery' && selectedDeliveryOrder && isSharingLocation) {
      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
          async (pos) => {
            const latitude = pos.coords.latitude;
            const longitude = pos.coords.longitude;
            const accuracy = pos.coords.accuracy;
            const timestamp = pos.timestamp;
            
            try {
              await fetch(`/api/delivery/location`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('agrimind_token')}`
                },
                body: JSON.stringify({
                  deliveryPersonId: user.id,
                  orderId: selectedDeliveryOrder.order_id,
                  latitude,
                  longitude,
                  accuracy,
                  timestamp
                })
              });
              
              // Local update for map indicators
              setCourierLat(latitude);
              setCourierLng(longitude);
              setCourierAccuracy(accuracy);
              setCourierTimestamp(timestamp);
            } catch (err) {
              console.error('Telemetry streaming error:', err);
            }
          },
          (err) => {
            console.error('Telemetry location watch error:', err);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      }
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isAuthenticated, user, selectedDeliveryOrder]);

  // Load plant analysis history for farmer
  const loadPlantHistory = async () => {
    try {
      const res = await fetch('/api/plant-disease/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('agrimind_token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPlantHistory(data.history || []);
      }
    } catch (e) {
      console.error('Error loading plant health history:', e);
    }
  };

  const deleteHistoryItem = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this analysis record?")) return;
    try {
      const res = await fetch(`/api/plant-disease/history/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('agrimind_token')}`
        }
      });
      if (res.ok) {
        loadPlantHistory();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to delete record');
      }
    } catch (e) {
      console.error('Error deleting plant history item:', e);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'farmer' && activeTab === 'plant-health') {
      loadPlantHistory();
    }
  }, [isAuthenticated, user, activeTab]);

  // Camera start/stop/capture controller functions
  const startCamera = async () => {
    setCameraPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);
      setPlantCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraPermissionError("Camera access was denied. You can upload an image from your device instead.");
      setPlantCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setPlantCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "captured_leaf.jpg", { type: "image/jpeg" });
            setPlantImage(file);
            setPlantPreview(URL.createObjectURL(blob));
            stopCamera();
          }
        }, 'image/jpeg');
      }
    }
  };

  useEffect(() => {
    if (plantCameraActive && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(e => console.error("Error playing video:", e));
    }
  }, [plantCameraActive, cameraStream]);

  // Analyze plant leaf method
  const analyzePlant = async () => {
    if (!plantImage) return;
    setPlantAnalysisLoading(true);
    setPlantAnalysisResult(null);
    setSelectedHistoryItem(null);
    
    // Step-by-step loading animation
    setPlantAnalysisStep("Analyzing your plant...");
    await new Promise(r => setTimeout(r, 800));
    setPlantAnalysisStep("Processing image...");
    await new Promise(r => setTimeout(r, 800));
    setPlantAnalysisStep("Checking for possible diseases...");
    await new Promise(r => setTimeout(r, 800));

    try {
      const formData = new FormData();
      formData.append('image', plantImage);
      
      const res = await fetch('/api/plant-disease/predict', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('agrimind_token')}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setPlantAnalysisResult(data.prediction);
        loadPlantHistory();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to analyze plant.');
      }
    } catch (e) {
      console.error(e);
      alert('Error connecting to server.');
    } finally {
      setPlantAnalysisLoading(false);
    }
  };

  // Start/Stop location and status polling loop
  const startTrackingPolling = async (order: any) => {
    setTrackingOrder(order);
    const track = await fetchOrderTracking(order.id);
    if (track?.delivery) {
      setLiveTrackingInfo(track);
      const routeInfo = await fetchDeliveryRoute(track.delivery.id);
      if (routeInfo?.routePoints) {
        setLiveRoutePoints(routeInfo.routePoints);
      }
    } else {
      setLiveTrackingInfo(null);
    }

    if (activeSimulationInterval) {
      clearInterval(activeSimulationInterval);
    }

    const interval = setInterval(async () => {
  const updated = await fetchOrderTracking(order.id);

  if (updated?.delivery) {
    setLiveTrackingInfo(updated);

    // Refresh route/location points
    const routeInfo = await fetchDeliveryRoute(updated.delivery.id);

    if (routeInfo?.routePoints) {
      setLiveRoutePoints(routeInfo.routePoints);
    }

    if (user?.role === 'customer') {
      loadCustomerOrders();
    }

    if (user?.role === 'farmer') {
      loadFarmerOrders();
    }
  }
}, 3500);

    setActiveSimulationInterval(interval);
  };

  const stopTrackingPolling = () => {
    if (activeSimulationInterval) {
      clearInterval(activeSimulationInterval);
      setActiveSimulationInterval(null);
    }
    setTrackingOrder(null);
    setLiveTrackingInfo(null);
    setLiveRoutePoints([]);
  };

  useEffect(() => {
    return () => {
      if (activeSimulationInterval) clearInterval(activeSimulationInterval);
    };
  }, [activeSimulationInterval]);

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail) {
      alert('Please enter username.');
      return;
    }
    if (!authPassword) {
      alert('Please enter password.');
      return;
    }
    if (authPassword !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, newPassword: authPassword })
      });
      if (res.ok) {
        alert('Password reset successfully! You can now log in.');
        setShowAuth('login');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to reset password.');
      }
    } catch (e) {
      alert('Error contacting server.');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail) {
      alert('Please enter username.');
      return;
    }
    if (!authPassword) {
      alert('Please enter password.');
      return;
    }
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword, rememberMe })
      });
      const data = await res.json();
      if (res.ok) {
        if (rememberMe) {
          localStorage.setItem(`agrimind_remember_${selectedRole}_email`, authEmail);
        } else {
          localStorage.removeItem(`agrimind_remember_${selectedRole}_email`);
        }
        alert('Login successful.');
        login(data.token, data.user);
        setShowAuth(null);
      } else {
        alert(data.error || 'Authentication failed.');
      }
    } catch (e) {
      alert('Error contacting server.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authName || !authEmail || !authPassword || !selectedRole) {
      return alert('Please fill in name, email, password, and select a role.');
    }
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: authName,
          email: authEmail,
          password: authPassword,
          role: selectedRole
        })
      });
      if (res.ok) {
        const data = await res.json();
        login(data.token, data.user);
        setShowAuth(null);
      } else {
        const err = await res.json();
        alert(err.error || 'Registration failed.');
      }
    } catch (e) {
      alert('Error contacting server.');
    }
  };

  const startDemoSession = async (role: 'farmer' | 'customer' | 'delivery' | 'admin') => {
    try {
      let email = 'demo@agrimind.ai';
      let password = 'farmer123';
      if (role === 'customer') {
        email = 'customer@agrimind.ai';
        password = 'customer123';
      } else if (role === 'delivery') {
        email = 'delivery@agrimind.ai';
        password = 'delivery123';
      } else if (role === 'admin') {
        email = 'admin@agrimind.ai';
        password = 'admin123';
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        login(data.token, data.user);
        setShowAuth(null);
      } else {
        alert(`${role} account data is not seeded.`);
      }
    } catch (e) {
      alert('Demo login failed.');
    }
  };

  const runLocalWhatIf = () => {
    const MOISTURE_THRESHOLD = 35;
    const RAIN_PROB_THRESHOLD = 50;
    
    let recommendation = '';
    let reason = '';
    let benefit = '';
    let confidence = 0.90;

    if (demoMoisture < MOISTURE_THRESHOLD) {
      if (demoRainProb < RAIN_PROB_THRESHOLD) {
        recommendation = 'Irrigate immediately';
        reason = `Soil moisture is low (${demoMoisture}%) and rain probability is low (${demoRainProb}%).`;
        benefit = 'Prevents crop drying and supports growth stage.';
      } else {
        recommendation = 'Delay irrigation';
        reason = `Soil moisture is low (${demoMoisture}%), but rain probability is high (${demoRainProb}%).`;
        benefit = 'Conserves irrigation water by leveraging rainfall.';
        confidence = 0.88;
      }
    } else {
      recommendation = 'No active irrigation required';
      reason = `Soil moisture is healthy (${demoMoisture}%).`;
      benefit = 'Prevents root oxygen lock and water logging.';
    }

    setSimulatedRec({ recommendation, reason, benefit, confidence });
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || !newProductCrop || !newProductVariety || !newProductQty || !newProductPrice) {
      return alert('Please fill in required fields.');
    }

    const payload = {
      name: newProductName,
      category: newProductCategory,
      crop: newProductCrop,
      variety: newProductVariety,
      quantity: Number(newProductQty),
      unit: newProductUnit,
      price: Number(newProductPrice),
      harvestDate: newProductHarvest,
      quality: newProductQuality,
      description: newProductDesc,
      imageUrl: newProductImage || 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=600'
    };

    const res = await addMarketplaceProduct(payload);
    if (res?.success) {
      alert('Product listed successfully!');
      setNewProductName('');
      setNewProductCrop('');
      setNewProductVariety('');
      setNewProductQty('');
      setNewProductPrice('');
      setNewProductDesc('');
      setNewProductImage('');
      loadFarmerInventory();
      setActiveTab('inventory');
    } else {
      alert('Failed to add product.');
    }
  };

  const handleEditClick = (p: any) => {
    setEditingProduct(p);
    setEditProductName(p.name);
    setEditProductCategory(p.category);
    setEditProductCrop(p.crop);
    setEditProductVariety(p.variety);
    setEditProductQty(String(p.quantity));
    setEditProductUnit(p.unit);
    setEditProductPrice(String(p.price));
    setEditProductHarvest(p.harvest_date);
    setEditProductQuality(p.quality);
    setEditProductDesc(p.description || '');
    setEditProductImage(p.image_url || '');
  };

  const handleUpdateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editProductName || !editProductCrop || !editProductVariety || !editProductQty || !editProductPrice) {
      return alert('Please fill in required fields.');
    }

    const payload = {
      name: editProductName,
      category: editProductCategory,
      crop: editProductCrop,
      variety: editProductVariety,
      quantity: Number(editProductQty),
      unit: editProductUnit,
      price: Number(editProductPrice),
      harvestDate: editProductHarvest,
      quality: editProductQuality,
      description: editProductDesc,
      imageUrl: editProductImage
    };

    const res = await updateMarketplaceProduct(editingProduct.id, payload);
    if (res?.success) {
      alert('Product updated successfully!');
      setEditingProduct(null);
      loadFarmerInventory();
    } else {
      alert('Failed to update product.');
    }
  };

  const handleUpdateProductQty = async (id: string, currentQty: number) => {
    const promptQty = prompt('Enter new available quantity:', currentQty.toString());
    if (promptQty === null) return;
    const qty = Number(promptQty);
    if (isNaN(qty)) return alert('Please enter a valid number.');

    const res = await updateMarketplaceProduct(id, { quantity: qty });
    if (res?.success) {
      loadFarmerInventory();
    }
  };

  const handleToggleProductStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    const res = await updateMarketplaceProduct(id, { status: newStatus });
    if (res?.success) {
      loadFarmerInventory();
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    const res = await deleteMarketplaceProduct(id);
    if (res?.success) {
      alert('Product deleted successfully.');
      loadFarmerInventory();
    } else {
      alert('Failed to delete product.');
    }
  };

  const handleStep1Next = () => {
    setCheckoutError(null);
    if (!shippingName.trim()) {
      setCheckoutError("Recipient Name is required");
      return;
    }
    const cleanPhone = shippingPhone.replace(/\D/g, '');
    if (!shippingPhone.trim() || cleanPhone.length !== 10) {
      setCheckoutError("Phone Number is required and must be exactly 10 digits");
      return;
    }
    setCheckoutStep(2);
  };

  const handleStep2Next = () => {
    setCheckoutError(null);
    if (!shippingAddress.trim()) {
      setCheckoutError("Delivery Address is required");
      return;
    }
    if (!shippingCity.trim()) {
      setCheckoutError("City is required");
      return;
    }
    if (!shippingStateInput.trim()) {
      setCheckoutError("State is required");
      return;
    }
    const cleanPin = shippingPincode.replace(/\D/g, '');
    if (!shippingPincode.trim() || cleanPin.length !== 6) {
      setCheckoutError("Pincode is required and must be exactly 6 digits");
      return;
    }
    setCheckoutStep(3);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingName || !shippingPhone || !shippingAddress || !shippingCity || !shippingStateInput || !shippingPincode) {
      return alert('Please enter shipping name, phone, address, city, state and pincode.');
    }

    const details = {
      shippingName,
      shippingPhone,
      shippingAddress,
      city: shippingCity,
      state: shippingStateInput,
      pincode: shippingPincode,
      latitude: shippingLat,
      longitude: shippingLng,
      accuracy: shippingAccuracy,
      locationSource: shippingLocationSource,
      deliveryPreference,
      orderNotes
    };

    const res = await checkoutCart(details);
    if (res?.success) {
      alert('Order placed successfully! Cash on Delivery confirmed.');
      setCheckoutOpen(false);
      setCartOpen(false);
      setShippingName('');
      setShippingPhone('');
      setShippingAddress('');
      setShippingCity('');
      setShippingStateInput('');
      setShippingPincode('');
      setOrderNotes('');
      loadCustomerOrders();
      setActiveTab('orders');
    } else {
      alert(res.error || 'Failed to place order.');
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, status: string) => {
    const res = await updateOrderStatus(orderId, status);
    if (res?.success) {
      loadFarmerOrders();
    }
  };

  const handleCancelOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellationOrder) return;

    const finalReason = cancellationReason === 'Other' ? cancellationReasonOther : cancellationReason;
    const res = await cancelOrder(cancellationOrder.id, finalReason);
    if (res?.success) {
      alert(res.message || 'Your order has been cancelled successfully.');
      setCancellationOrder(null);
      setCancellationReason('Ordered by mistake');
      setCancellationReasonOther('');
      loadCustomerOrders();
      loadMarketplace();
    } else {
      alert(res?.error || 'Failed to cancel order.');
    }
  };

  const handleDisputeOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeModalOrder) return;

    const finalReason = disputeReason === 'Other' ? disputeReasonOther : disputeReason;
    const res = await disputeOrder(disputeModalOrder.id, finalReason);
    if (res?.success) {
      alert('Dispute filed successfully. Payment held securely in vault.');
      setDisputeModalOrder(null);
      setDisputeReason('Order not received');
      setDisputeReasonOther('');
      loadCustomerOrders();
    } else {
      alert(res?.error || 'Failed to file dispute.');
    }
  };

  const handleAdvisorSoilSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ph: Number(soilPh),
      nitrogen: soilN,
      phosphorus: soilP,
      potassium: soilK,
      moisture: soilMoisture,
      organicCarbon: Number(soilCarbon),
      soilType: soilTypeInput,
      temperature: Number(soilTempInput),
      location: soilLocationInput
    };

    const res = await runSoilTest(payload);
    if (res?.suitabilityResults) {
      setAdvisorResults(res.suitabilityResults);
      loadAdvisorHistory();
    } else {
      alert('Failed to analyze soil suitability.');
    }
  };

  const handleAdvisorChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advisorChatMessage.trim()) return;

    const userMsg = advisorChatMessage;
    setAdvisorChatMessage('');
    setAdvisorChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    setAdvisorChatLoading(true);

    const soilData = {
      ph: Number(soilPh),
      nitrogen: soilN,
      phosphorus: soilP,
      potassium: soilK,
      moisture: soilMoisture,
      organicCarbon: Number(soilCarbon),
      soilType: soilTypeInput
    };

    const answer = await sendAdvisorChat(userMsg, soilData);
    setAdvisorChatHistory(prev => [...prev, { sender: 'ai', text: answer }]);
    setAdvisorChatLoading(false);
  };

  const triggerHarvestListing = (crop: any) => {
    setNewProductCrop(crop.name);
    setNewProductVariety(crop.variety || '');
    setNewProductName(`Fresh ${crop.name}`);
    setNewProductQty(Math.floor(crop.area * 50).toString());
    setNewProductPrice('35');
    setNewProductDesc(`Freshly harvested ${crop.variety} ${crop.name} grown organically at our farm.`);
    setActiveTab('products');
    alert(`Harvest Listing Auto-filled for crop: ${crop.name}!`);
  };

  const resetAllDemoData = async () => {
    if (!confirm('Are you sure you want to reset all databases?')) return;
    const res = await triggerDemo('reset');
    if (res?.success) {
      alert('Database restored to clean seeded starter states.');
      logout();
      setSelectedRole(null);
    }
  };



  if (!isAuthenticated && !showAuth) {
    return (
      <div className={`min-h-screen ${bgClass} flex flex-col items-center justify-center p-6 relative overflow-hidden`}>
        {/* Subtle Admin Panel Link in the Top-Left corner */}
        <button
          onClick={() => { setSelectedRole('admin'); setShowAuth('login'); }}
          className="absolute top-6 left-6 z-40 flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 bg-white/60 hover:bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm transition-all"
          title="Admin Access"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Admin</span>
        </button>
        {/* Floating Top-Right Header controls */}
        <div className="absolute top-6 right-6 z-40 flex items-center gap-4">
          {locationStatus === 'enabled' ? (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1.5 rounded-xl select-none">
              📍 Location Access Enabled
            </span>
          ) : (
            <span className="text-xs text-red-500 font-semibold flex items-center gap-1 bg-red-500/10 border border-red-500/25 px-2.5 py-1.5 rounded-xl cursor-help select-none" title="Location access is required for live delivery tracking. You can enable it from your browser/device settings.">
              ⚠️ Location Access Disabled
            </span>
          )}
          {renderLanguageSelector(true)}
          {renderThemeSelector(true)}
        </div>
        {/* Dynamic Background Accents */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#A8D5BA]/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#C6DDF5]/15 rounded-full blur-[120px]" />
 
        <div className="max-w-4xl text-center z-10 flex flex-col items-center">
          {/* Location Request Warning Banner */}
          {locationStatus !== 'enabled' && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 w-full text-left animate-in fade-in slide-in-from-top-2 z-20">
              <div className="flex items-center gap-3">
                <span className="text-xl">📍</span>
                <div>
                  <h4 className="font-bold text-sm text-[#34413A]">Location Access Recommended</h4>
                  <p className="text-xs text-[#6B756E] mt-0.5">
                    {locationStatus === 'disabled'
                      ? "Location access is required for live delivery tracking. You can enable it from your browser/device settings."
                      : "Allow location access to enable Google Maps, delivery tracking, distance and ETA."}
                  </p>
                </div>
              </div>
              {locationStatus === 'prompt' && (
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          setLat(pos.coords.latitude);
                          setLng(pos.coords.longitude);
                          setLocationStatus('enabled');
                        },
                        (err) => {
                          setLocationStatus('disabled');
                        }
                      );
                    }
                  }}
                  className="px-4 py-2 bg-lime-600 text-white font-bold rounded-xl text-xs hover:bg-lime-500 transition-colors shrink-0"
                >
                  Allow Location
                </button>
              )}
            </div>
          )}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-full bg-[#DFF2E1] flex items-center justify-center border border-[#A8D5BA]/35">
              <Sprout className="w-9 h-9 text-[#34413A]" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight font-outfit text-[#34413A]">
              AgriConnect
            </h1>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#34413A] font-outfit mb-4">
            Connecting Farmers Directly With Customers
          </h2>
          <p className="text-sm md:text-base text-[#6B756E] font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
            Fresh farm products, direct from farmers to your doorstep. Grow understand soil, trade directly, and track live deliveries.
          </p>
 
          <h3 className="text-xs font-bold tracking-wider text-[#6B756E] uppercase mb-8">
            Choose Your Entry Portal
          </h3>
 
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Farmer Card */}
            <div className="bg-white border-2 border-[#A8D5BA]/40 rounded-3xl p-6 hover:border-[#A8D5BA] hover:shadow-[0_8px_30px_rgba(168,213,186,0.15)] transition-all group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#DFF2E1] flex items-center justify-center text-[#34413A] mb-6 group-hover:scale-110 transition-transform">
                  <Sprout className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold mb-3 font-outfit text-[#34413A]">
                  👨‍🌾 Farmer Portal
                </h4>
                <p className="text-xs text-[#6B756E] leading-relaxed mb-6 text-left font-sans">
                  Manage products, view stock levels, check reliability standings, and accept customer orders.
                </p>
              </div>
              <button
                onClick={() => { setSelectedRole('farmer'); setShowAuth('login'); }}
                className="w-full py-2.5 bg-[#A8D5BA] text-[#34413A] font-bold rounded-xl hover:opacity-90 transition-colors text-xs"
              >
                Continue as Farmer
              </button>
            </div>
 
            {/* Customer Card */}
            <div className="bg-white border-2 border-[#FFD6BA]/40 rounded-3xl p-6 hover:border-[#FFD6BA] hover:shadow-[0_8px_30px_rgba(255,214,186,0.2)] transition-all group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#FFF8E7] flex items-center justify-center text-[#34413A] mb-6 group-hover:scale-110 transition-transform">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold mb-3 font-outfit text-[#34413A]">
                  🛒 Customer Store
                </h4>
                <p className="text-xs text-[#6B756E] leading-relaxed mb-6 text-left font-sans">
                  Browse fresh harvested food listed by local farmers, check out, and track held payments.
                </p>
              </div>
              <button
                onClick={() => { setSelectedRole('customer'); setShowAuth('login'); }}
                className="w-full py-2.5 bg-[#FFD6BA] text-[#34413A] font-bold rounded-xl hover:opacity-90 transition-colors text-xs"
              >
                Continue as Customer
              </button>
            </div>
 
            {/* Delivery Partner Card */}
            <div className="bg-white border-2 border-[#C6DDF5]/40 rounded-3xl p-6 hover:border-[#C6DDF5] hover:shadow-[0_8px_30px_rgba(198,221,245,0.2)] transition-all group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#C6DDF5] flex items-center justify-center text-[#34413A] mb-6 group-hover:scale-110 transition-transform">
                  <Truck className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold mb-3 font-outfit text-[#34413A]">
                  🚚 Delivery Partner
                </h4>
                <p className="text-xs text-[#6B756E] leading-relaxed mb-6 text-left font-sans">
                  View assigned delivery runs, open maps routes, and update fulfillment progress.
                </p>
              </div>
              <button
                onClick={() => { setSelectedRole('delivery'); setShowAuth('login'); }}
                className="w-full py-2.5 bg-[#C6DDF5] text-[#34413A] font-bold rounded-xl hover:opacity-90 transition-colors text-xs"
              >
                Continue as Partner
              </button>
            </div>
          </div>
 
          <div className="text-xs text-[#6B756E] border-t border-[#DFF2E1] pt-6 font-medium">
            AgriConnect connects understanding the soil &rarr; growing the crop &rarr; direct selling &rarr; consumer fulfillment.
          </div>
        </div>
      </div>
    );
  }
 
  // Authentication Flow Page
  if (!isAuthenticated && showAuth) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center p-6 relative overflow-hidden`}>
        {/* Subtle Admin Panel Link in the Top-Left corner */}
        {selectedRole !== 'admin' && (
          <button
            onClick={() => { setSelectedRole('admin'); setShowAuth('login'); }}
            className="absolute top-6 left-6 z-40 flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 bg-white/60 hover:bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm transition-all"
            title="Admin Access"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        )}
        {/* Floating Top-Right Header controls */}
        <div className="absolute top-6 right-6 z-40 flex items-center gap-4">
          {locationStatus === 'enabled' ? (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1.5 rounded-xl select-none">
              📍 Location Access Enabled
            </span>
          ) : (
            <span className="text-xs text-red-500 font-semibold flex items-center gap-1 bg-red-500/10 border border-red-500/25 px-2.5 py-1.5 rounded-xl cursor-help select-none" title="Location access is required for live delivery tracking. You can enable it from your browser/device settings.">
              ⚠️ Location Access Disabled
            </span>
          )}
          {renderLanguageSelector(true)}
          {renderThemeSelector(true)}
        </div>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#A8D5BA]/10 rounded-full blur-[100px]" />
        
        <div className={`${cardClass} w-full max-w-md p-8 rounded-3xl shadow-xl z-10`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black font-outfit text-[#34413A] uppercase tracking-wide">
              {selectedRole?.toUpperCase()} PORTAL
            </h2>
            <button
              onClick={() => { setShowAuth(null); setSelectedRole(null); }}
              className="text-[#6B756E] hover:text-[#34413A] text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
 
          <h3 className="text-base font-bold mb-4 text-[#34413A]">
            {showAuth === 'login' ? 'Sign In to Your Workspace' : showAuth === 'register' ? 'Create New Account' : 'Reset Account Password'}
          </h3>
 
          <form onSubmit={showAuth === 'login' ? handleLoginSubmit : showAuth === 'register' ? handleRegisterSubmit : handleForgotPasswordSubmit} className="space-y-4 mb-6">
            {showAuth === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-[#6B756E] mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-[#BFD8C2] rounded-xl focus:border-[#A8D5BA] focus:outline-none text-[#34413A] text-sm font-medium"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-[#6B756E] mb-1">Username</label>
              <input
                type="text"
                placeholder="Enter your username or email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-[#BFD8C2] rounded-xl focus:border-[#A8D5BA] focus:outline-none text-[#34413A] text-sm font-medium"
              />
            </div>
            
            {(showAuth === 'login' || showAuth === 'register') && (
              <div>
                <label className="block text-xs font-semibold text-[#6B756E] mb-1">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-[#BFD8C2] rounded-xl focus:border-[#A8D5BA] focus:outline-none text-[#34413A] text-sm font-medium"
                />
                {showAuth === 'login' && (
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#6B756E] mt-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-[#BFD8C2] text-lime-600 focus:ring-lime-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Remember Me</span>
                  </label>
                )}
              </div>
            )}
 
            {showAuth === 'forgot' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#6B756E] mb-1">Enter New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-[#BFD8C2] rounded-xl focus:border-[#A8D5BA] focus:outline-none text-[#34413A] text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6B756E] mb-1">Confirm Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-[#BFD8C2] rounded-xl focus:border-[#A8D5BA] focus:outline-none text-[#34413A] text-sm font-medium"
                  />
                </div>
              </div>
            )}
 
            <button
              type="submit"
              className="w-full py-3 bg-[#A8D5BA] text-[#34413A] font-bold rounded-xl hover:opacity-90 transition-colors text-sm"
            >
              {showAuth === 'login' ? 'Login' : showAuth === 'register' ? 'Register' : 'Create Password'}
            </button>
          </form>
 
          <div className="flex justify-between items-center text-xs text-[#6B756E] mb-6 font-medium">
            {showAuth === 'login' && (
              <>
                <button
                  onClick={() => setShowAuth('register')}
                  className="hover:underline text-[#A8D5BA] text-left"
                >
                  Don't have an account? Sign up
                </button>
                <button
                  onClick={() => { setShowAuth('forgot'); setAuthPassword(''); }}
                  className="hover:underline text-[#6B756E] text-right"
                >
                  Create / Reset Password
                </button>
              </>
            )}
            {showAuth === 'register' && (
              <button
                onClick={() => setShowAuth('login')}
                className="hover:underline text-[#A8D5BA]"
              >
                Already registered? Log in
              </button>
            )}
            {showAuth === 'forgot' && (
              <button
                onClick={() => setShowAuth('login')}
                className="hover:underline text-[#A8D5BA]"
              >
                Go back to Login
              </button>
            )}
          </div>
 
          <div className="border-t border-[#DFF2E1] pt-6">
            <h4 className="text-xs font-bold text-[#6B756E] mb-3 text-center">OR EXPLORE WITH ONE-CLICK SEEDED DATA</h4>
            <button
              onClick={() => startDemoSession(selectedRole!)}
              className="w-full py-3 border border-[#BFD8C2] hover:bg-[#FAFCF8] bg-[#FFF8E7] rounded-xl text-[#34413A] font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Launch Seeded {selectedRole} Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 1a. SYSTEM ADMINISTRATOR PORTAL
  // ==========================================
  const renderAdminPortal = () => {
    const disputes = adminOrders.filter(o => o.status === 'DISPUTED');
    
    return (
      <div className={`min-h-screen ${bgClass} flex flex-col transition-colors duration-200`}>
        {/* Navigation bar */}
        <header className={`${headerClass} px-6 py-4 sticky top-0 backdrop-blur-md z-30 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-400" />
            <h1 className={`text-xl font-bold font-outfit tracking-tight ${textTitle}`}>
              AgriConnect <span className="text-[#A8D5BA] font-medium">{t('adminControl')}</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`text-sm px-3.5 py-2 rounded-xl transition-all font-semibold ${activeTab === 'dashboard' ? 'bg-[#DFF2E1] text-[#34413A]' : 'text-[#6B756E] hover:bg-[#DFF2E1]/40 hover:text-[#34413A]'}`}
            >
              {t('overview')}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`text-sm px-3.5 py-2 rounded-xl transition-all font-semibold ${activeTab === 'users' ? 'bg-[#DFF2E1] text-[#34413A]' : 'text-[#6B756E] hover:bg-[#DFF2E1]/40 hover:text-[#34413A]'}`}
            >
              {t('users')}
            </button>
            <button
              onClick={() => setActiveTab('farmers')}
              className={`text-sm px-3.5 py-2 rounded-xl transition-all font-semibold ${activeTab === 'farmers' ? 'bg-[#DFF2E1] text-[#34413A]' : 'text-[#6B756E] hover:bg-[#DFF2E1]/40 hover:text-[#34413A]'}`}
            >
              {t('farmers')}
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`text-sm px-3.5 py-2 rounded-xl transition-all font-semibold ${activeTab === 'orders' ? 'bg-[#DFF2E1] text-[#34413A]' : 'text-[#6B756E] hover:bg-[#DFF2E1]/40 hover:text-[#34413A]'}`}
            >
              {t('orderExplorer')}
            </button>
            <button
              onClick={() => setActiveTab('disputes')}
              className={`text-sm relative px-3.5 py-2 rounded-xl transition-all font-semibold ${activeTab === 'disputes' ? 'bg-[#DFF2E1] text-[#34413A]' : 'text-[#6B756E] hover:bg-[#DFF2E1]/40 hover:text-[#34413A]'}`}
            >
              {t('disputes')}
              {disputes.length > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-orange-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {disputes.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`text-sm px-3.5 py-2 rounded-xl transition-all font-semibold ${activeTab === 'products' ? 'bg-[#DFF2E1] text-[#34413A]' : 'text-[#6B756E] hover:bg-[#DFF2E1]/40 hover:text-[#34413A]'}`}
            >
              Products Directory
            </button>
            
            <div className={`border-l ${borderClass} pl-4 flex items-center gap-3`}>
              {renderLanguageSelector(true)}
              {renderThemeSelector(true)}
              <span className="text-xs text-slate-400 hidden md:inline">Administrator</span>
              <button
                onClick={() => { logout(); setSelectedRole(null); }}
                className="p-2 hover:bg-slate-800/10 text-slate-400 hover:text-red-400 rounded-lg"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            <div className={`${cardClass} p-4 rounded-2xl`}>
              <span className="text-[10px] uppercase font-bold text-slate-400">{t('totalFarmers')}</span>
              <div className="text-2xl font-black mt-1">{adminStats?.farmersCount ?? 0}</div>
            </div>
            <div className={`${cardClass} p-4 rounded-2xl`}>
              <span className="text-[10px] uppercase font-bold text-slate-400">{t('totalCustomers')}</span>
              <div className="text-2xl font-black mt-1">{adminStats?.customersCount ?? 0}</div>
            </div>
            <div className={`${cardClass} p-4 rounded-2xl`}>
              <span className="text-[10px] uppercase font-bold text-slate-400">{t('totalOrders')}</span>
              <div className="text-2xl font-black mt-1">{adminStats?.ordersCount ?? 0}</div>
            </div>
            <div className={`${cardClass} p-4 rounded-2xl`}>
              <span className="text-[10px] uppercase font-bold text-slate-400">{t('deliveries')}</span>
              <div className="text-2xl font-black text-emerald-500 mt-1">{adminStats?.successfulCount ?? 0}</div>
            </div>
            <div className={`${cardClass} p-4 rounded-2xl`}>
              <span className="text-[10px] uppercase font-bold text-slate-400">{t('failures')}</span>
              <div className="text-2xl font-black text-red-500 mt-1">{adminStats?.failedCount ?? 0}</div>
            </div>
            <div className={`${cardClass} p-4 rounded-2xl`}>
              <span className="text-[10px] uppercase font-bold text-slate-400 font-sans">{t('refunds')}</span>
              <div className="text-2xl font-black text-lime-600 mt-1 font-outfit">{adminStats?.refundsCount ?? 0}</div>
            </div>
            <div className={`${cardClass} p-4 rounded-2xl`}>
              <span className="text-[10px] uppercase font-bold text-slate-400">{t('activeDisputes')}</span>
              <div className="text-2xl font-black text-orange-500 mt-1">{adminStats?.disputedCount ?? 0}</div>
            </div>
          </div>

          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Suspicious/Restricted Farmers list */}
              <div className="lg:col-span-2 space-y-6">
                <div className={`${cardClass} p-6 rounded-3xl`}>
                  <h3 className="text-lg font-bold font-outfit mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" /> Farmers Requiring Attention
                  </h3>
                  {adminStats?.suspiciousFarmers?.length === 0 ? (
                    <p className="text-sm text-slate-500">All registered farmers are in good standing.</p>
                  ) : (
                    <div className="space-y-4">
                      {adminStats?.suspiciousFarmers?.map((f: any) => (
                        <div key={f.id} className={`${innerBoxClass} p-4 rounded-2xl flex justify-between items-center`}>
                          <div>
                            <h4 className="font-bold text-sm text-[#34413A]">{f.name}</h4>
                            <p className="text-xs text-slate-500">{f.email}</p>
                            <div className="flex gap-2 mt-1">
                              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${f.reliability_score < 70 ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                                Reliability: {f.reliability_score}/100
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${f.is_restricted ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                                {f.is_restricted ? '🔴 RESTRICTED' : '🟢 ACTIVE'}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              const action = f.is_restricted ? 'unrestrict' : 'restrict';
                              if (window.confirm(`Are you sure you want to ${action} this farmer account?`)) {
                                const res = await restrictFarmer(f.id, !f.is_restricted);
                                if (res?.success) {
                                  alert(`Farmer status updated successfully.`);
                                  loadAdminStats();
                                  loadAdminOrders();
                                }
                              }
                            }}
                            className={`px-4 py-2 text-xs font-bold rounded-xl ${f.is_restricted ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400' : 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400'}`}
                          >
                            {f.is_restricted ? 'Reinstate Farmer' : 'Restrict Farmer'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Quick Stats or reminders */}
              <div className="space-y-6">
                <div className={`${cardClass} p-6 rounded-3xl`}>
                  <h3 className="text-base font-bold font-outfit mb-3">Disputes Summary</h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Review disputed orders and apply resolution protection. Resolving a dispute as Refund refunds the held payment to the customer. Resolving as Release sends the held funds to the farmer.
                  </p>
                  <button
                    onClick={() => setActiveTab('disputes')}
                    className="w-full py-2.5 bg-slate-900 border border-slate-700 text-white hover:bg-slate-800 rounded-xl text-xs font-bold transition-all text-center block"
                  >
                    Go to disputes ({disputes.length})
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className={`${cardClass} p-6 rounded-3xl`}>
              <h2 className="text-xl font-bold font-outfit mb-6">Registered Users Directory</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 pb-3 text-slate-500 font-bold">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Username (Email)</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4">Created Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!adminStats?.allUsers || adminStats.allUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">
                          No users registered yet.
                        </td>
                      </tr>
                    ) : (
                      adminStats.allUsers.map((u: any) => (
                        <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-4 px-4 font-bold text-slate-800">{u.name}</td>
                          <td className="py-4 px-4 text-slate-500 font-mono">{u.email}</td>
                          <td className="py-4 px-4 font-bold uppercase">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                              u.role === 'admin' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                              u.role === 'farmer' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                              u.role === 'delivery' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                              'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-semibold text-slate-700">{u.phone || 'N/A'}</td>
                          <td className="py-4 px-4 text-slate-500">{new Date(u.created_at).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'farmers' && (
            <div className={`${cardClass} p-6 rounded-3xl`}>
              <h2 className="text-xl font-bold font-outfit mb-6">Registered Farmers Directory</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 pb-3 text-slate-500 font-bold">
                      <th className="py-3 px-4">Farmer Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Reliability Score</th>
                      <th className="py-3 px-4">Standing Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!adminStats?.allFarmers || adminStats.allFarmers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">
                          No farmers added yet.
                        </td>
                      </tr>
                    ) : (
                      adminStats.allFarmers.map((f: any) => {
                        let standing = "Good Standing";
                      let standingColor = "text-emerald-600 bg-emerald-500/10 border-emerald-500/20";
                      if (f.is_restricted) {
                        standing = "Restricted";
                        standingColor = "text-red-500 bg-red-500/10 border-red-500/20";
                      } else if (f.reliability_score < 70) {
                        standing = "Needs Review";
                        standingColor = "text-orange-500 bg-orange-500/10 border-orange-500/20";
                      }

                      return (
                        <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-4 px-4 font-bold text-slate-800">{f.name}</td>
                          <td className="py-4 px-4 text-slate-500">{f.email}</td>
                          <td className="py-4 px-4 font-bold font-outfit text-sm text-slate-700">{f.reliability_score}/100</td>
                          <td className="py-4 px-4">
                            <span className={`px-2.5 py-0.5 rounded border text-[10px] font-bold ${standingColor}`}>
                              {standing}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={async () => {
                                const action = f.is_restricted ? 'unrestrict' : 'restrict';
                                if (window.confirm(`Are you sure you want to ${action} ${f.name}?`)) {
                                  const res = await restrictFarmer(f.id, !f.is_restricted);
                                  if (res?.success) {
                                    alert(`Status of ${f.name} updated.`);
                                    loadAdminStats();
                                  }
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${f.is_restricted ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400' : 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400'}`}
                            >
                              {f.is_restricted ? 'Unrestrict' : 'Restrict'}
                            </button>
                          </td>
                        </tr>
                      );
                    }))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className={`${cardClass} p-6 rounded-3xl`}>
              <h2 className="text-xl font-bold font-outfit mb-6">Marketplace Order and Payment Ledger</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 pb-3 text-slate-500 font-bold">
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Buyer</th>
                      <th className="py-3 px-4">Farmer</th>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">Ordered Qty</th>
                      <th className="py-3 px-4">Price/Unit</th>
                      <th className="py-3 px-4">Total Amount</th>
                      <th className="py-3 px-4">Order Status</th>
                      <th className="py-3 px-4">Payment Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminOrders.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-500 font-medium">
                          No orders yet.
                        </td>
                      </tr>
                    ) : (
                      adminOrders.map((o) => {
                      const statusColors: { [key: string]: string } = {
                        PENDING: 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20',
                        ACCEPTED: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
                        DELIVERY_ASSIGNED: 'text-indigo-600 bg-indigo-500/10 border-indigo-500/20',
                        DELIVERY_ACCEPTED: 'text-teal-600 bg-teal-500/10 border-teal-500/20',
                        GOING_TO_PICKUP: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
                        PICKED_UP: 'text-orange-600 bg-orange-500/10 border-orange-500/20',
                        OUT_FOR_DELIVERY: 'text-sky-600 bg-sky-500/10 border-sky-500/20',
                        ARRIVED: 'text-pink-600 bg-pink-500/10 border-pink-500/20',
                        DELIVERED: 'text-green-600 bg-green-500/10 border-green-500/20',
                        COMPLETED: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
                        CANCELLED: 'text-red-500 bg-red-500/10 border-red-500/20',
                        DELIVERY_FAILED: 'text-red-500 bg-red-500/10 border-red-500/20',
                        DISPUTED: 'text-orange-500 bg-orange-500/10 border-orange-500/20'
                      };

                      const statusText: { [key: string]: string } = {
                        PENDING: 'Pending Farmer Approval',
                        ACCEPTED: 'Accepted by Farmer',
                        DELIVERY_ASSIGNED: 'Delivery Assigned',
                        DELIVERY_ACCEPTED: 'Accepted by Delivery Person',
                        GOING_TO_PICKUP: 'Going to Pickup',
                        PICKED_UP: 'Picked Up',
                        OUT_FOR_DELIVERY: 'Out for Delivery',
                        ARRIVED: 'Arrived',
                        DELIVERED: 'Delivered Successfully',
                        COMPLETED: 'Completed',
                        CANCELLED: 'Cancelled',
                        DELIVERY_FAILED: 'Delivery Failed',
                        DISPUTED: 'Disputed'
                      };

                      let orderBadgeColor = statusColors[o.status] || "text-slate-400 bg-slate-500/10 border-slate-500/20";

                      let payBadgeColor = "text-slate-400 bg-slate-500/10 border-slate-500/20";
                      if (o.payment_status === 'PENDING') payBadgeColor = "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
                      else if (o.payment_status === 'HELD') payBadgeColor = "text-orange-500 bg-orange-500/10 border-orange-500/20";
                      else if (o.payment_status === 'RELEASED') payBadgeColor = "text-green-500 bg-green-500/10 border-green-500/20";
                      else if (o.payment_status === 'REFUNDED') payBadgeColor = "text-green-500 bg-green-500/10 border-green-500/20";

                      return (
                        <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-4 px-4 font-mono font-semibold text-slate-800">{o.id}</td>
                          <td className="py-4 px-4 text-slate-500">{new Date(o.created_at).toLocaleString()}</td>
                          <td className="py-4 px-4 font-bold text-slate-800">{o.customer_name}</td>
                          <td className="py-4 px-4 font-bold text-slate-700">{o.farmer_name}</td>
                          <td className="py-4 px-4 text-slate-500 font-medium">{o.product_name || 'N/A'}</td>
                          <td className="py-4 px-4 font-bold text-slate-700">{o.quantity} {o.unit}</td>
                          <td className="py-4 px-4 text-slate-600">₹{o.price_per_unit || (o.total_amount / (o.quantity || 1)).toFixed(2)}</td>
                          <td className="py-4 px-4 text-sm font-black font-outfit text-slate-900">₹{o.total_amount}</td>
                          <td className="py-4 px-4">
                            <span className={`px-2.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${orderBadgeColor}`}>
                              {statusText[o.status] || o.status}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${payBadgeColor}`}>
                              {o.payment_status}
                            </span>
                          </td>
                        </tr>
                      );
                    }))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'disputes' && (
            <div className={`${cardClass} p-6 rounded-3xl`}>
              <h2 className="text-xl font-bold font-outfit mb-6">Customer Claims & Dispute Resolutions</h2>
              {disputes.length === 0 ? (
                <div className="text-center py-16">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                  <p className="text-slate-405 text-sm font-semibold">No active customer disputes requiring mediation.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {disputes.map((d) => (
                    <div key={d.id} className={`${innerBoxClass} p-6 rounded-2xl border-l-4 border-l-orange-500 flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-500">ORDER ID: {d.id}</span>
                          <span className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-0.5 rounded font-bold uppercase font-outfit">Disputed</span>
                        </div>
                        <h3 className="font-bold text-lg text-slate-800">Issue reported: "{d.dispute_reason}"</h3>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs text-slate-500">
                          <div>Buyer Customer: <strong className="text-slate-800">{d.customer_name}</strong></div>
                          <div>Seller Farmer: <strong className="text-slate-800">{d.farmer_name}</strong></div>
                          <div>Quantity: <strong className="text-slate-800">{d.quantity} {d.unit || 'units'}</strong></div>
                          <div>Held Amount: <strong className="text-emerald-600 font-bold">₹{d.total_amount}</strong></div>
                        </div>
                      </div>

                      <div className="flex gap-2.5">
                        <button
                          onClick={async () => {
                            if (window.confirm("Resolve dispute in customer favor? Held amount will be refunded to customer, and farmer reliability score penalized.")) {
                              const res = await resolveDispute(d.id, 'REFUND');
                              if (res?.success) {
                                alert("Dispute resolved: Payment refunded.");
                                loadAdminStats();
                                loadAdminOrders();
                              }
                            }
                          }}
                          className="px-4 py-2 bg-red-500 text-white font-bold rounded-xl text-xs hover:bg-red-650 transition-colors"
                        >
                          Resolve: Refund Customer
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm("Resolve dispute in farmer favor? Held payment will be released to the farmer.")) {
                              const res = await resolveDispute(d.id, 'RELEASE');
                              if (res?.success) {
                                alert("Dispute resolved: Payment released to farmer.");
                                loadAdminStats();
                                loadAdminOrders();
                              }
                            }
                          }}
                          className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-500 transition-colors"
                        >
                          Resolve: Release to Farmer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div className={`${cardClass} p-6 rounded-3xl`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold font-outfit">Products Stock & Directory</h2>
                <div className="text-xs bg-lime-500/10 text-lime-500 border border-lime-500/20 px-3 py-1 rounded-md font-bold uppercase">
                  Total Active Listings: {marketplaceProducts.length}
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 pb-3 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Product ID</th>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4">Farmer</th>
                      <th className="py-3 px-4 text-right">Available Qty</th>
                      <th className="py-3 px-4 text-center">Unit</th>
                      <th className="py-3 px-4 text-right">Price per Unit</th>
                      <th className="py-3 px-4 text-right font-bold">Total Stock Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketplaceProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                          No active marketplace products found.
                        </td>
                      </tr>
                    ) : (
                      marketplaceProducts.map((p) => {
                        const totalVal = p.quantity * p.price;
                        return (
                          <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="py-4 px-4 font-mono font-semibold text-slate-500">{p.id}</td>
                            <td className="py-4 px-4 font-bold text-slate-800">{p.name}</td>
                            <td className="py-4 px-4 text-slate-500">{p.farmer_name || 'N/A'}</td>
                            <td className="py-4 px-4 text-right font-bold">{p.quantity}</td>
                            <td className="py-4 px-4 text-center">
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                                {p.unit}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right text-slate-650">₹{p.price.toFixed(2)}</td>
                            <td className="py-4 px-4 text-right text-lime-600 font-black text-sm">
                              ₹{totalVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  };

  if (isAuthenticated && user?.role === 'admin') {
    return renderAdminPortal();
  }

  // ==========================================
  // 1. CUSTOMER PORTAL
  // ==========================================
  if (isAuthenticated && user?.role === 'customer') {
    return (
      <div className={`min-h-screen ${bgClass} flex flex-col transition-colors duration-200`}>
        {/* Navigation bar */}
        <header className={`${headerClass} px-6 py-4 sticky top-0 backdrop-blur-md z-30 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-[#A8D5BA]" />
            <h1 className={`text-xl font-bold font-outfit tracking-tight ${textTitle}`}>
              AgriConnect <span className="text-[#A8D5BA] font-medium">{t('marketplace')}</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`text-sm px-3.5 py-2 rounded-xl transition-all font-semibold ${activeTab === 'marketplace' ? 'bg-[#DFF2E1] text-[#34413A]' : 'text-[#6B756E] hover:bg-[#DFF2E1]/40 hover:text-[#34413A]'}`}
            >
              {t('marketplace')}
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`text-sm px-3.5 py-2 rounded-xl transition-all font-semibold ${activeTab === 'orders' ? 'bg-[#DFF2E1] text-[#34413A]' : 'text-[#6B756E] hover:bg-[#DFF2E1]/40 hover:text-[#34413A]'}`}
            >
              {t('myOrders')} ({customerOrders.length})
            </button>
            
            <button
              onClick={() => setCartOpen(true)}
              className={`relative p-2.5 bg-white border ${borderClass} rounded-xl hover:border-[#A8D5BA] hover:bg-[#DFF2E1]/20 text-[#34413A] flex items-center justify-center transition-all`}
            >
              <ShoppingCart className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-lime-500 text-slate-950 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>

            {/* Quick theme toggler for customer header */}
            <div className={`border-l ${borderClass} pl-4 flex items-center gap-3`}>
              {renderLanguageSelector(true)}
              {renderThemeSelector(true)}
              <span className="text-xs theme-text-muted hidden md:inline">Hi, {user.name}</span>
              <button
                onClick={() => { logout(); setSelectedRole(null); }}
                className="p-2 hover:bg-slate-800/10 text-slate-400 hover:text-red-400 rounded-lg"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
          {activeTab === 'marketplace' ? (
            <div>
              {/* Promo banner */}
              <div className="bg-gradient-to-r from-lime-600/30 via-emerald-600/20 to-slate-900 border border-lime-500/20 rounded-3xl p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <span className="bg-lime-500/10 text-lime-400 border border-lime-500/30 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                    Direct From Source
                  </span>
                  <h2 className="text-3xl font-bold font-outfit text-white mt-3">
                    Freshly Harvested, Zero Intermediaries
                  </h2>
                  <p className="text-slate-350 text-sm mt-1 max-w-xl">
                    By purchasing direct, you support local growers, access high-quality produce with full harvest date transparency, and optimize fresh deliveries.
                  </p>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center">
                  <div className="text-xs text-slate-400">Products Listed</div>
                  <div className="text-3xl font-extrabold text-lime-400 font-outfit">{marketplaceProducts.length}</div>
                </div>
              </div>

              {/* Filters & Search */}
              <div className={`flex flex-col md:flex-row justify-between items-center gap-4 mb-8 ${innerBoxClass} p-4 rounded-2xl`}>
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    placeholder="Search tomatoes, basmati, vegetables..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950/20 border border-slate-700/50 focus:border-lime-500 focus:outline-none rounded-xl text-sm"
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                  {['', 'Vegetables', 'Fruits', 'Grains', 'Leafy vegetables', 'Pulses', 'Spices', 'Organic produce'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-xs px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-lime-500 text-slate-900' : 'bg-slate-950/10 border border-slate-700/50 text-slate-400 hover:border-lime-500'}`}
                    >
                      {cat || 'All Categories'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products Catalog grid */}
              {marketplaceProducts.length === 0 ? (
                <div className="text-center py-16 border border-slate-900 rounded-3xl bg-slate-900/10">
                  <Store className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-400">No Fresh Listings Found</h3>
                  <p className="text-xs text-slate-500 mt-1">Try relaxing your search parameters or check back later.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {marketplaceProducts.map((p) => {
                    const dateHarvested = new Date(p.harvest_date);
                    const diffTime = Math.abs(new Date().getTime() - dateHarvested.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1;
                    
                    let freshnessBadge = "Fresh Listing";
                    let badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                    if (diffDays === 0) {
                      freshnessBadge = "Harvested Today";
                    } else if (diffDays === 1) {
                      freshnessBadge = "1 Day Since Harvest";
                    } else if (diffDays <= 3) {
                      freshnessBadge = `${diffDays} Days Since Harvest`;
                      badgeColor = "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
                    } else {
                      freshnessBadge = `${diffDays} Days Since Harvest`;
                      badgeColor = "bg-orange-500/10 text-orange-400 border-orange-500/20";
                    }

                    return (
                      <div key={p.id} className={`${cardClass} rounded-2xl overflow-hidden hover:border-lime-500/50 hover:shadow-lg transition-all flex flex-col justify-between`}>
                        <div>
                          <img
                            src={getProductImage(p.name, p.crop, p.image_url)}
                            alt={p.name}
                            className="w-full h-40 object-cover"
                          />
                          <div className="p-4">
                            <div className="flex justify-between items-start gap-1">
                              <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${badgeColor}`}>
                                {freshnessBadge}
                              </span>
                              <span className="text-[10px] bg-slate-950/20 border border-slate-700/50 px-2 py-0.5 rounded-full font-semibold">
                                {p.quality}
                              </span>
                            </div>

                            <h3 className={`font-bold text-lg mt-3 ${textTitle}`}>{p.name}</h3>
                            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-lime-500" />
                              <span>{p.farm_name || 'Green Valley Farm'} ({p.farm_region || 'Coimbatore'})</span>
                            </div>

                            <div className={`flex justify-between items-baseline mt-4 border-t ${borderClass} pt-3`}>
                              <div>
                                <span className="text-xl font-black text-lime-600 font-outfit">₹{p.price}</span>
                                <span className="text-xs text-slate-400">/{p.unit}</span>
                              </div>
                              <span className="text-xs text-slate-405">Stock: {p.quantity} {p.unit}</span>
                            </div>
                          </div>
                        </div>

                        <div className={`p-4 bg-slate-950/10 border-t ${borderClass} flex gap-2`}>
                          <button
                            onClick={() => setViewProductDetails(p)}
                            className="flex-1 py-2 bg-transparent border border-slate-700/50 hover:border-lime-500 rounded-lg text-xs font-semibold"
                          >
                            Details
                          </button>
                          {p.status === 'OUT OF STOCK' || p.quantity <= 0 ? (
                            <button
                              disabled
                              className="flex-1 py-2 bg-slate-800 text-slate-500 rounded-lg text-xs font-bold cursor-not-allowed border border-slate-700/30"
                            >
                              Currently Out of Stock
                            </button>
                          ) : (
                            <button
                              onClick={() => { addToCart(p, 1); alert('Added to cart!'); }}
                              className="flex-1 py-2 bg-lime-500 text-slate-950 hover:bg-lime-400 rounded-lg text-xs font-bold"
                            >
                              Add to Cart
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Customer Orders */}
              <h2 className={`text-2xl font-bold mb-6 ${textTitle}`}>My Orders & Payment Protection</h2>
              {customerOrders.length === 0 ? (
                <div className="text-center py-16 border border-slate-900 rounded-3xl bg-slate-900/10">
                  <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-400">No orders yet.</h3>
                  <p className="text-xs text-slate-500 mt-1">Visit the store and place a checkout.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {customerOrders.map((o) => {
                    const steps = ['PENDING', 'ACCEPTED', 'DELIVERY_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'ARRIVED', 'COMPLETED'];
                    const getStepIdx = (status: string) => {
                      if (status === 'DELIVERY_ACCEPTED' || status === 'GOING_TO_PICKUP') return 2; // maps to DELIVERY_ASSIGNED
                      return steps.indexOf(status);
                    };
                    const currentIdx = getStepIdx(o.status);

                    let remainingTimeStr = '';
                    if (o.delivery_deadline && o.status !== 'PENDING' && o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && o.status !== 'DELIVERY_FAILED') {
                      const diff = new Date(o.delivery_deadline).getTime() - Date.now();
                      if (diff > 0) {
                        const hrs = Math.floor(diff / (1000 * 60 * 60));
                        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                        remainingTimeStr = `${hrs}h ${mins}m left`;
                      } else {
                        remainingTimeStr = 'Expired';
                      }
                    }

                    // Status Colors mapping
                    const statusColors: { [key: string]: string } = {
                      PENDING: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
                      ACCEPTED: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
                      DISPATCHED: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
                      DELIVERED: 'text-green-500 bg-green-500/10 border-green-500/20',
                      CANCELLED: 'text-red-500 bg-red-500/10 border-red-500/20',
                      DELIVERY_FAILED: 'text-red-500 bg-red-500/10 border-red-500/20',
                      DISPUTED: 'text-orange-500 bg-orange-500/10 border-orange-500/20'
                    };

                    const payColors: { [key: string]: string } = {
                      PENDING: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
                      HELD: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
                      RELEASED: 'text-green-500 bg-green-500/10 border-green-500/20',
                      REFUNDED: 'text-green-500 bg-green-500/10 border-green-500/20'
                    };

                    return (
                      <div key={o.id} className={`${cardClass} rounded-2xl p-6`}>
                        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center border-b ${borderClass} pb-4 mb-4 gap-2`}>
                          <div>
                            <span className="text-xs font-mono text-slate-500">ORDER ID: {o.id}</span>
                            <h3 className={`text-lg mt-0.5 ${textTitle}`}>
                              Farmer: {o.farm_name} ({o.farmer_name})
                            </h3>
                          </div>
                          <div className="text-right flex flex-col md:items-end gap-1">
                            <div className="flex gap-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${statusColors[o.status] || 'text-slate-400 bg-slate-500/10 border-slate-500/20'}`}>
                                Order: {o.status}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${payColors[o.payment_status] || 'text-slate-400 bg-slate-500/10 border-slate-500/20'}`}>
                                Payment: {o.payment_status}
                              </span>
                            </div>
                            <div className={`text-xl font-bold mt-1 ${textTitle}`}>₹{o.total_amount}</div>
                          </div>
                        </div>

                        {/* Order items */}
                        <div className="mb-6 space-y-2">
                          {o.items?.map((item: any) => (
                            <div key={item.id} className={`flex justify-between text-sm ${textBody}`}>
                              <span>{item.product_name}</span>
                              <span className="text-xs text-slate-405 font-medium">
                                {item.quantity} {item.unit || 'units'} &times; ₹{item.price} = <strong className="text-slate-805 font-bold text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</strong>
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Middle Action Panels: OTP and countdown details */}
                        {o.status !== 'CANCELLED' && o.status !== 'DELIVERY_FAILED' && (
                          <div className={`mb-6 p-4 ${innerBoxClass} rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4 text-xs`}>
                            {o.delivery_otp && o.status !== 'PENDING' && o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && o.status !== 'DELIVERY_FAILED' && (
                              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex flex-col justify-center">
                                <span className="text-[10px] font-bold text-emerald-600 block uppercase tracking-wider">🔒 Security Delivery OTP</span>
                                <div className="text-2xl font-black text-white mt-1 tracking-widest">{o.delivery_otp}</div>
                                <span className="text-[9px] text-slate-400 mt-1">Provide this code to the farmer only upon receiving vegetables.</span>
                              </div>
                            )}

                            {remainingTimeStr && (
                              <div className="bg-slate-950/20 border border-slate-800 p-3 rounded-xl flex flex-col justify-center">
                                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">⏱️ Delivery Deadline Countdown</span>
                                <div className={`text-lg font-bold mt-1 ${remainingTimeStr === 'Expired' ? 'text-red-500' : 'text-orange-400'}`}>
                                  {remainingTimeStr}
                                </div>
                                <span className="text-[9px] text-slate-500 mt-1">Order will auto-refund if not delivered before deadline.</span>
                              </div>
                            )}
                          </div>
                        )}

                        {o.status !== 'CANCELLED' && o.status !== 'DELIVERY_FAILED' ? (
                          <>
                            {/* Visual timeline */}
                            {o.status !== 'DISPUTED' && (
                              <div className={`pt-4 border-t ${borderClass}`}>
                                <h4 className="text-xs font-bold text-slate-405 mb-6 uppercase tracking-wider font-outfit">Fulfillment Progress</h4>
                                <div className="relative flex justify-between items-center max-w-3xl mx-auto">
                                  {/* Connector line */}
                                  <div className="absolute left-0 right-0 h-1 bg-slate-800 top-[18px] -z-10" />
                                  <div
                                    className="absolute left-0 h-1 bg-lime-500 top-[18px] -z-10 transition-all duration-500"
                                    style={{ width: `${(Math.max(0, currentIdx) / (steps.length - 1)) * 100}%` }}
                                  />

                                  {steps.map((st, idx) => {
                                    const isActive = idx <= currentIdx;
                                    const isCurrent = idx === currentIdx;

                                    return (
                                      <div key={st} className="flex flex-col items-center relative">
                                        <div
                                          className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${isCurrent ? 'bg-lime-500 text-slate-950 border-lime-400 scale-110 shadow-lg shadow-lime-500/30' : isActive ? 'bg-slate-950 border-lime-500 text-lime-400' : 'bg-slate-950 border-slate-800 text-slate-650'}`}
                                        >
                                          {idx + 1}
                                        </div>
                                        <span className={`text-[10px] font-bold mt-2 text-center select-none ${isCurrent ? 'text-lime-500' : isActive ? 'text-slate-400' : 'text-slate-600'}`}>
                                          {st === 'PENDING' ? 'Placed' : st === 'ACCEPTED' ? 'Accepted' : st === 'DELIVERY_ASSIGNED' ? 'Assigned' : st === 'PICKED_UP' ? 'Picked Up' : st === 'OUT_FOR_DELIVERY' ? 'On Way' : st === 'ARRIVED' ? 'Arrived' : 'Completed'}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {o.status === 'DISPUTED' && (
                              <div className="p-4 bg-orange-500/10 border border-orange-500/25 rounded-2xl text-xs text-orange-400 mb-4">
                                <strong>⚠️ Order Disputed:</strong> "{o.dispute_reason}". Payment of ₹{o.total_amount} is held securely. Administrator is reviewing the complaint.
                              </div>
                            )}

                            {/* Actions panel */}
                            <div className="mt-6 pt-4 border-t border-slate-800/40 flex flex-wrap justify-between items-center gap-2">
                              <div>
                                {o.payment_status === 'PENDING' && (
                                  <button
                                    onClick={async () => {
                                      const res = await payOrder(o.id);
                                      if (res?.success) {
                                        alert('Payment successful! Funds held in secure vault.');
                                        loadCustomerOrders();
                                      }
                                    }}
                                    className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-slate-955 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md"
                                  >
                                    💳 Pay Now (Hold Vault)
                                  </button>
                                )}
                              </div>
                              <div className="flex gap-2">
                                {o.delivery_partner_id && o.status !== 'DISPUTED' && o.status !== 'DELIVERED' && (
                                  <button
                                    onClick={() => startTrackingPolling(o)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
                                  >
                                    <Truck className="w-4 h-4" fill="none" /> Live Tracking
                                  </button>
                                )}

                                {o.status !== 'DELIVERED' && o.status !== 'DISPUTED' && (
                                  <button
                                    onClick={() => setDisputeModalOrder(o)}
                                    className="px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 font-bold rounded-xl text-xs transition-colors"
                                  >
                                    Report Problem
                                  </button>
                                )}

                                {(o.status === 'PENDING' || o.status === 'ACCEPTED') && (
                                  <button
                                    onClick={() => setCancellationOrder(o)}
                                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold rounded-xl text-xs transition-colors"
                                  >
                                    Cancel Order
                                  </button>
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="mt-4 p-4 bg-red-500/5 border border-red-500/25 rounded-2xl flex flex-col gap-1 text-xs">
                            <div className="flex items-center gap-1.5 font-bold text-red-400">
                              <span>❌ {o.status}</span>
                            </div>
                            <div className="text-slate-450 mt-1">
                              Fulfillment Resolution: <span className="font-semibold text-slate-350">{o.status === 'DELIVERY_FAILED' ? 'Delivery Expired / Refunded' : 'Cancelled'}</span>
                            </div>
                            {o.cancelled_at && (
                              <div className="text-slate-450">
                                Cancelled at: <span className="font-semibold text-slate-350">{new Date(o.cancelled_at).toLocaleString()}</span>
                              </div>
                            )}
                            {o.cancellation_reason && (
                              <div className="text-slate-450 font-medium">
                                Reason: <span className="text-slate-350">{o.cancellation_reason}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Product Details Modal */}
        {viewProductDetails && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`${cardClass} w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl`}>
              <img
                src={getProductImage(viewProductDetails.name, viewProductDetails.crop, viewProductDetails.image_url)}
                alt={viewProductDetails.name}
                className="w-full md:w-1/2 h-64 md:h-auto object-cover"
              />
              <div className="p-6 md:w-1/2 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs bg-lime-500/10 text-lime-500 border border-lime-500/20 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                      {viewProductDetails.category}
                    </span>
                    <button
                      onClick={() => setViewProductDetails(null)}
                      className="text-slate-400 hover:text-red-400 text-sm"
                    >
                      Close
                    </button>
                  </div>

                  <h3 className={`text-2xl font-bold font-outfit mb-2 ${textTitle}`}>{viewProductDetails.name}</h3>
                  <div className="text-xs text-slate-450 flex items-center gap-1 mb-4">
                    <MapPin className="w-3.5 h-3.5 text-lime-500" />
                    <span>Listed by {viewProductDetails.farmer_name} at {viewProductDetails.farm_name || 'Green Valley Farm'}</span>
                  </div>

                  <div className={`text-sm leading-relaxed mb-4 ${textBody}`}>
                    {viewProductDetails.description || 'No description provided by the farmer. Freshly harvested local agricultural produce.'}
                  </div>

                  <div className={`${innerBoxClass} grid grid-cols-2 gap-4 p-3 rounded-xl mb-4 text-xs`}>
                    <div>
                      <span className="text-slate-500 block">Variety:</span>
                      <span className="font-semibold">{viewProductDetails.variety}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Quality Grade:</span>
                      <span className="font-semibold">{viewProductDetails.quality}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Harvest Date:</span>
                      <span className="font-semibold">{viewProductDetails.harvest_date}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Harvest freshness:</span>
                      <span className="font-semibold text-emerald-500">Direct Origin</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-baseline mb-4">
                    <span className="text-2xl font-black text-lime-600 font-outfit">₹{viewProductDetails.price} <span className="text-xs text-slate-500 font-normal">/{viewProductDetails.unit}</span></span>
                    <span className="text-xs text-slate-450">Available Qty: {viewProductDetails.quantity} {viewProductDetails.unit}</span>
                  </div>

                  {viewProductDetails.status === 'OUT OF STOCK' || viewProductDetails.quantity <= 0 ? (
                    <button
                      disabled
                      className="w-full py-3 bg-slate-800 text-slate-505 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed border border-slate-700/30 font-bold text-slate-450"
                    >
                      Currently Out of Stock
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-slate-400">How many {viewProductDetails.unit} do you want?</label>
                        <input
                          type="number"
                          step="any"
                          value={detailProductQty}
                          onChange={(e) => setDetailProductQty(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-950/10 border border-slate-700/50 focus:border-lime-500 focus:outline-none rounded-xl text-xs font-semibold text-slate-900"
                          placeholder={`Enter quantity in ${viewProductDetails.unit}`}
                        />
                        {(() => {
                          const numericQty = Number(detailProductQty) || 0;
                          const isQtyExceeded = numericQty > viewProductDetails.quantity;
                          const isQtyInvalid = numericQty <= 0;
                          if (isQtyExceeded) {
                            return <div className="text-[10px] text-red-505 font-bold text-red-500">Only {viewProductDetails.quantity} {viewProductDetails.unit} available.</div>;
                          }
                          if (isQtyInvalid) {
                            return <div className="text-[10px] text-red-505 font-bold text-red-500">Please enter a valid quantity.</div>;
                          }
                          return (
                            <div className="text-[10px] text-emerald-600 font-bold">
                              Estimated Amount: ₹{(numericQty * viewProductDetails.price).toFixed(2)}
                            </div>
                          );
                        })()}
                      </div>
                      <button
                        type="button"
                        disabled={(() => {
                          const numericQty = Number(detailProductQty) || 0;
                          return numericQty <= 0 || numericQty > viewProductDetails.quantity;
                        })()}
                        onClick={() => {
                          const numericQty = Number(detailProductQty) || 0;
                          addToCart(viewProductDetails, numericQty);
                          setViewProductDetails(null);
                          alert(`Added ${numericQty} ${viewProductDetails.unit} to cart!`);
                        }}
                        className={`w-full py-3 font-bold rounded-xl flex items-center justify-center gap-2 ${
                          (() => {
                            const numericQty = Number(detailProductQty) || 0;
                            return numericQty <= 0 || numericQty > viewProductDetails.quantity;
                          })()
                            ? 'bg-slate-850 text-slate-500 cursor-not-allowed'
                            : 'bg-lime-500 hover:bg-lime-400 text-slate-955'
                        }`}
                      >
                        <ShoppingCart className="w-5 h-5" /> Add Product to Cart
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cart Sidebar Panel */}
        {cartOpen && (
          <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs z-50 flex justify-end">
            <div className={`${cardClass} border-l w-full max-w-md h-full p-6 flex flex-col justify-between shadow-2xl`}>
              <div>
                <div className={`flex justify-between items-center border-b ${borderClass} pb-4 mb-6`}>
                  <h3 className="text-lg font-bold font-outfit flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-lime-500" /> Shopping Cart
                  </h3>
                  <button onClick={() => setCartOpen(false)} className="text-slate-400 hover:text-white text-sm">Close</button>
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 text-sm">Your cart is currently empty.</div>
                ) : (
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                    {cart.map((item) => {
                      const latestProduct = marketplaceProducts.find(p => p.id === item.product.id) || item.product;
                      const hasStockError = item.quantity > latestProduct.quantity;
                      const hasInvalidQty = item.quantity <= 0;

                      return (
                        <div key={item.product.id} className={`${innerBoxClass} p-4 rounded-xl flex gap-3 flex-col`}>
                          <div className="flex gap-3">
                            <img
                              src={getProductImage(item.product.name, item.product.crop, item.product.image_url)}
                              alt={item.product.name}
                              className="w-14 h-14 object-cover rounded-lg"
                            />
                            <div className="flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-start">
                                  <h4 className="font-bold text-sm">{item.product.name}</h4>
                                  <button
                                    onClick={() => removeFromCart(item.product.id)}
                                    className="text-slate-500 hover:text-red-400"
                                  >
                                    <Trash className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <span className="text-[10px] text-slate-400">From: {item.product.farm_name}</span>
                              </div>

                              <div className="flex justify-between items-center mt-2">
                                <span className="text-xs font-semibold text-lime-600">
                                  ₹{item.product.price} / {item.product.unit}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => updateCartQuantity(item.product.id, Math.max(0.01, item.quantity - 1))}
                                    className="w-5 h-5 bg-slate-950/20 border border-slate-700/50 text-slate-400 rounded flex items-center justify-center font-bold text-xs"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    step="any"
                                    value={item.quantity}
                                    onChange={(e) => updateCartQuantity(item.product.id, Number(e.target.value) || 0)}
                                    className="w-12 px-1 py-0.5 text-center bg-white border border-slate-300 focus:border-lime-500 focus:outline-none rounded text-[10px] font-bold text-slate-900"
                                  />
                                  <button
                                    onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                                    className="w-5 h-5 bg-slate-950/20 border border-slate-700/50 text-slate-400 rounded flex items-center justify-center font-bold text-xs"
                                  >
                                    +
                                  </button>
                                  <span className="text-[10px] text-slate-400 font-semibold">{item.product.unit}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Line items details & warnings */}
                          <div className="flex justify-between items-center pt-2 border-t border-slate-700/10 text-[10px]">
                            {hasStockError ? (
                              <span className="text-red-500 font-bold">
                                ⚠️ Only {latestProduct.quantity} {latestProduct.unit} available.
                              </span>
                            ) : hasInvalidQty ? (
                              <span className="text-red-500 font-bold">
                                ⚠️ Invalid quantity.
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium">
                                {item.quantity} {item.product.unit} &times; ₹{item.product.price}
                              </span>
                            )}
                            <span className="font-bold text-slate-800">
                              ₹{(item.quantity * item.product.price).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className={`border-t ${borderClass} pt-6 space-y-4`}>
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-400 text-sm">Cart Total Amount:</span>
                    <span className="text-2xl font-black text-lime-600 font-outfit">
                      ₹{cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toFixed(2)}
                    </span>
                  </div>

                  {(() => {
                    const hasErrors = cart.some(item => {
                      const latestProduct = marketplaceProducts.find(p => p.id === item.product.id) || item.product;
                      return item.quantity > latestProduct.quantity || item.quantity <= 0;
                    });

                    return (
                      <button
                        disabled={hasErrors}
                        onClick={() => {
                          const currentLat = lat || 11.1271;
                          const currentLng = lng || 78.6569;
                          setShippingLat(currentLat);
                          setShippingLng(currentLng);
                          setShippingLocationSource(lat ? 'gps' : 'manual');
                          
                          if (lat && lng) {
                            fetch(`https://nominatim.openstreetmap.org/reverse?lat=${currentLat}&lon=${currentLng}&format=json`)
                              .then(res => res.json())
                              .then(data => {
                                setShippingAddress(data.display_name || `GPS Location: Lat ${currentLat.toFixed(6)}, Lng ${currentLng.toFixed(6)}`);
                                const addr = data.address || {};
                                const city = addr.city || addr.town || addr.village || addr.suburb || '';
                                const state = addr.state || '';
                                const pincode = addr.postcode || '';
                                if (city) setShippingCity(city);
                                if (state) setShippingStateInput(state);
                                if (pincode) setShippingPincode(pincode);
                              })
                              .catch(() => {
                                setShippingAddress(`GPS Location: Lat ${currentLat.toFixed(6)}, Lng ${currentLng.toFixed(6)}`);
                              });
                          } else {
                            if (!shippingAddress) {
                              setShippingAddress('');
                            }
                          }
                          setCheckoutOpen(true);
                          setCheckoutStep(1);
                        }}
                        className={`w-full py-3 font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                          hasErrors
                            ? 'bg-slate-850 text-slate-500 cursor-not-allowed border border-slate-700/30'
                            : 'bg-lime-500 hover:bg-lime-400 text-slate-955'
                        }`}
                      >
                        {hasErrors ? 'Resolve Stock Errors to Checkout' : 'Proceed to Checkout'}
                      </button>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Checkout Modal Form */}
        {checkoutOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`${cardClass} w-full sm:max-w-[520px] w-[92%] p-6 rounded-3xl backdrop-blur-md shadow-2xl`}>
              
              {/* Progress Indicator */}
              <div className="flex items-center justify-between border-b border-slate-700/30 pb-3 mb-4 text-xs font-semibold">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full ${checkoutStep === 1 ? 'bg-lime-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>1</span>
                  <span className={checkoutStep === 1 ? 'text-lime-500 font-bold' : 'text-slate-400'}>Contact</span>
                  
                  <span className="text-slate-700 font-light">&rarr;</span>
                  
                  <span className={`px-2 py-0.5 rounded-full ${checkoutStep === 2 ? 'bg-lime-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>2</span>
                  <span className={checkoutStep === 2 ? 'text-lime-500 font-bold' : 'text-slate-400'}>Location</span>
                  
                  <span className="text-slate-700 font-light">&rarr;</span>
                  
                  <span className={`px-2 py-0.5 rounded-full ${checkoutStep === 3 ? 'bg-lime-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>3</span>
                  <span className={checkoutStep === 3 ? 'text-lime-500 font-bold' : 'text-slate-400'}>Confirm</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setCheckoutOpen(false); setCheckoutStep(1); setCheckoutError(null); }}
                  className="text-slate-400 hover:text-white text-xs font-bold font-outfit"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                {/* STEP 1: CONTACT DETAILS */}
                {checkoutStep === 1 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-300 font-outfit">Contact Details</h4>
                    
                    {checkoutError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold rounded-xl">
                        ⚠️ {checkoutError}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Recipient Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Doe"
                        value={shippingName}
                        onChange={(e) => {
                          setShippingName(e.target.value);
                          setCheckoutError(null);
                        }}
                        className="w-full px-4 py-2.5 bg-slate-950/10 border border-slate-700/50 focus:border-lime-500 focus:outline-none rounded-xl text-sm text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9876543210"
                        value={shippingPhone}
                        onChange={(e) => {
                          setShippingPhone(e.target.value);
                          setCheckoutError(null);
                        }}
                        className="w-full px-4 py-2.5 bg-slate-950/10 border border-slate-700/50 focus:border-lime-500 focus:outline-none rounded-xl text-sm text-slate-200"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => { setCheckoutOpen(false); setCheckoutStep(1); setCheckoutError(null); }}
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleStep1Next}
                        className="flex-1 py-2.5 bg-lime-500 hover:bg-lime-400 text-slate-955 font-bold rounded-xl text-xs transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: DELIVERY LOCATION */}
                {checkoutStep === 2 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-300 font-outfit">Delivery Location</h4>

                    {checkoutError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold rounded-xl">
                        ⚠️ {checkoutError}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Delivery Address *</label>
                      <textarea
                        required
                        rows={2}
                        placeholder="Enter street name, building number..."
                        value={shippingAddress}
                        onChange={(e) => {
                          setShippingAddress(e.target.value);
                          setCheckoutError(null);
                        }}
                        className="w-full px-4 py-2.5 bg-slate-950/10 border border-slate-700/50 focus:border-lime-500 focus:outline-none rounded-xl text-sm text-slate-200 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">City *</label>
                        <input
                          type="text"
                          required
                          placeholder="Coimbatore"
                          value={shippingCity}
                          onChange={(e) => {
                            setShippingCity(e.target.value);
                            setCheckoutError(null);
                          }}
                          className="w-full px-3 py-2 bg-slate-950/10 border border-slate-700/50 focus:border-lime-500 focus:outline-none rounded-xl text-xs font-medium text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">State *</label>
                        <input
                          type="text"
                          required
                          placeholder="Tamil Nadu"
                          value={shippingStateInput}
                          onChange={(e) => {
                            setShippingStateInput(e.target.value);
                            setCheckoutError(null);
                          }}
                          className="w-full px-3 py-2 bg-slate-950/10 border border-slate-700/50 focus:border-lime-500 focus:outline-none rounded-xl text-xs font-medium text-slate-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Pincode *</label>
                        <input
                          type="text"
                          required
                          placeholder="641018"
                          value={shippingPincode}
                          onChange={(e) => {
                            setShippingPincode(e.target.value);
                            setCheckoutError(null);
                          }}
                          className="w-full px-3 py-2 bg-slate-950/10 border border-slate-700/50 focus:border-lime-500 focus:outline-none rounded-xl text-xs font-medium text-slate-200"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <GoogleMapLocationPicker
                        lat={shippingLat}
                        lng={shippingLng}
                        accuracy={shippingAccuracy}
                        timestamp={shippingTimestamp}
                        locationSource={shippingLocationSource}
                        permissionState={locationPermissionState}
                        onLocationChange={(newLat, newLng, newAccuracy, newSource, newTimestamp, newPermissionState) => {
                          setShippingLat(newLat);
                          setShippingLng(newLng);
                          if (newAccuracy !== undefined) setShippingAccuracy(newAccuracy);
                          if (newSource !== undefined) setShippingLocationSource(newSource);
                          if (newTimestamp !== undefined) setShippingTimestamp(newTimestamp);
                          if (newPermissionState !== undefined) setLocationPermissionState(newPermissionState);
                          setCheckoutError(null);
                        }}
                        shippingAddress={shippingAddress}
                        setShippingAddress={setShippingAddress}
                        shippingCity={shippingCity}
                        setShippingCity={setShippingCity}
                        shippingState={shippingStateInput}
                        setShippingState={setShippingStateInput}
                        shippingPincode={shippingPincode}
                        setShippingPincode={setShippingPincode}
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => { setCheckoutStep(1); setCheckoutError(null); }}
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleStep2Next}
                        className="flex-1 py-2.5 bg-lime-500 hover:bg-lime-400 text-slate-955 font-bold rounded-xl text-xs transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: REVIEW & CONFIRM */}
                {checkoutStep === 3 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-300 font-outfit">Review Order</h4>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-800">
                        <div className="font-bold text-slate-400 mb-1 uppercase tracking-wider text-[9px]">Contact</div>
                        <div className="font-semibold text-slate-200 truncate">{shippingName}</div>
                        <div className="text-slate-400 mt-0.5">{shippingPhone}</div>
                      </div>
                      <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-800">
                        <div className="font-bold text-slate-400 mb-1 uppercase tracking-wider text-[9px]">Delivery</div>
                        <div className="text-slate-200 truncate">{shippingAddress}</div>
                        <div className="text-slate-400 mt-0.5 truncate">{shippingCity}, {shippingStateInput} - {shippingPincode}</div>
                        <div className="text-[9px] text-lime-500 font-bold mt-1 uppercase">
                          Source: {shippingLocationSource === 'gps' ? '🛰️ GPS' : '📝 Manual'}
                        </div>
                      </div>
                    </div>

                    {/* Items Summary */}
                    <div className="space-y-1 bg-slate-900/40 p-3 rounded-xl border border-slate-800 text-[11px] max-h-[110px] overflow-y-auto">
                      <div className="font-bold text-slate-400 border-b border-slate-850 pb-1 mb-1 uppercase tracking-wider text-[9px]">Order Details</div>
                      {cart.map((item) => (
                        <div key={item.product.id} className="flex justify-between items-center text-slate-300 py-0.5">
                          <span className="truncate max-w-[200px]">{item.product.name} ({item.quantity} {item.product.unit})</span>
                          <span className="font-semibold text-slate-200">₹{(item.product.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-1 border-t border-slate-850 font-black text-slate-100 text-xs">
                        <span>Total Amount:</span>
                        <span className="text-lime-500">₹{cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Preference & Notes */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Delivery Method</label>
                        <select
                          value={deliveryPreference}
                          onChange={(e) => setDeliveryPreference(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950/10 border border-slate-700/50 focus:border-lime-500 focus:outline-none rounded-xl text-xs text-slate-200"
                        >
                          <option value="Delivery">Home Delivery</option>
                          <option value="Pickup">Self-Pickup</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Order Notes (Optional)</label>
                        <input
                          type="text"
                          placeholder="Notes..."
                          value={orderNotes}
                          onChange={(e) => setOrderNotes(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950/10 border border-slate-700/50 focus:border-lime-500 focus:outline-none rounded-xl text-xs text-slate-200"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-950/20 p-2.5 border border-slate-800 rounded-xl text-[10px] text-slate-400 leading-normal">
                      Cash on Delivery available. Your order will be saved for farmer confirmation.
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => { setCheckoutStep(2); setCheckoutError(null); }}
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-lime-500 hover:bg-lime-400 text-slate-955 font-bold rounded-xl text-xs transition-colors"
                      >
                        Confirm Order (₹{cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toFixed(0)})
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* Cancellation Reason Modal */}
        {cancellationOrder && (
          <div className="fixed inset-0 bg-slate-955/25 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`${cardClass} w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col`}>
              <div className={`p-6 border-b ${borderClass} flex justify-between items-center`}>
                <h3 className={`text-xl font-bold font-outfit ${textTitle}`}>Cancel Order #{cancellationOrder.id}</h3>
                <button 
                  onClick={() => setCancellationOrder(null)} 
                  className="text-slate-400 hover:text-white text-sm"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleCancelOrderSubmit} className="p-6 space-y-4">
                <p className="text-xs text-slate-405">
                  Are you sure you want to cancel this order? Please select a reason below to confirm.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-405 mb-1 text-slate-400">Reason for Cancellation</label>
                  <select
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-xl text-sm text-white bg-slate-900 border-slate-800"
                  >
                    <option value="Ordered by mistake">Ordered by mistake</option>
                    <option value="Found another product">Found another product</option>
                    <option value="Changed my mind">Changed my mind</option>
                    <option value="Delivery taking too long">Delivery taking too long</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {cancellationReason === 'Other' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Specify Reason</label>
                    <textarea
                      required
                      rows={2}
                      value={cancellationReasonOther}
                      onChange={(e) => setCancellationReasonOther(e.target.value)}
                      placeholder="Please specify why you are cancelling..."
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm resize-none text-white"
                    />
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCancellationOrder(null)}
                    className="flex-1 py-3 border border-slate-700/50 text-slate-400 font-bold rounded-xl text-xs hover:bg-slate-900 transition-colors"
                  >
                    NO, KEEP ORDER
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-red-500 text-slate-950 hover:bg-red-400 font-bold rounded-xl text-xs transition-colors"
                  >
                    YES, CANCEL ORDER
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Dispute Resolution Modal */}
        {disputeModalOrder && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`${cardClass} w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col`}>
              <div className={`p-6 border-b ${borderClass} flex justify-between items-center`}>
                <h3 className={`text-xl font-bold font-outfit ${textTitle}`}>Report Problem (Dispute)</h3>
                <button 
                  onClick={() => setDisputeModalOrder(null)} 
                  className="text-slate-400 hover:text-white text-sm"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleDisputeOrderSubmit} className="p-6 space-y-4">
                <p className="text-xs text-slate-405">
                  If the farmer failed to deliver, sent incorrect produce, or wrong quantity, you can lodge a formal claim. This halts payment release.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Reason for Dispute</label>
                  <select
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    className="w-full px-4 py-2.5 border rounded-xl text-sm text-white bg-slate-900 border-slate-800"
                  >
                    <option value="Order not received">Order not received</option>
                    <option value="Poor produce quality">Poor produce quality</option>
                    <option value="Incorrect weight/quantity">Incorrect weight/quantity</option>
                    <option value="Incorrect items received">Incorrect items received</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {disputeReason === 'Other' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Specify Details</label>
                    <textarea
                      required
                      rows={2}
                      value={disputeReasonOther}
                      onChange={(e) => setDisputeReasonOther(e.target.value)}
                      placeholder="Please clarify the problem details..."
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm resize-none text-white"
                    />
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setDisputeModalOrder(null)}
                    className="flex-1 py-3 border border-slate-700/50 text-slate-400 font-bold rounded-xl text-xs hover:bg-slate-900 transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#FF9F1C] text-slate-955 font-bold rounded-xl text-xs transition-colors"
                  >
                    Submit Dispute
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delivery Live Tracking Modal Panel */}
        {trackingOrder && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
            <div className={`${cardClass} w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[90vh] md:h-[80vh]`}>
              
              {/* Left Side: Mock Map Container */}
              <div className="flex-1 bg-slate-900 border-r border-slate-800 relative flex flex-col justify-between overflow-hidden min-h-[300px] md:min-h-0">
                <div className="flex-1 w-full h-full relative">
                  <GoogleMapComponent
                    pickup={{ lat: 10.9970, lng: 76.9616, name: trackingOrder.farm_name || 'Green Valley Farm' }}
                    customer={{ lat: trackingOrder.latitude || 11.0168, lng: trackingOrder.longitude || 76.9558, name: trackingOrder.shipping_name || 'Customer' }}
                    delivery={liveTrackingInfo?.latestLocation ? { lat: liveTrackingInfo.latestLocation.latitude, lng: liveTrackingInfo.latestLocation.longitude, name: 'Arun' } : { lat: 10.9970, lng: 76.9616, name: 'Arun' }}
                  />
                </div>
              </div>

              {/* Right Side: Tracking Details & Timeline */}
              <div className="w-full md:w-[400px] p-6 flex flex-col justify-between overflow-y-auto h-full text-slate-205">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <span className="text-[10px] text-slate-500 font-mono tracking-wider block">ORDER ID: {trackingOrder.id}</span>
                      <h3 className={`text-xl font-bold font-outfit ${textTitle}`}>Track Your Order</h3>
                    </div>
                    <button
                      onClick={stopTrackingPolling}
                      className="text-slate-450 hover:text-red-400 text-sm font-semibold"
                    >
                      Close Tracker
                    </button>
                  </div>

                  {/* Proximity Alert Banner */}
                  {liveTrackingInfo?.delivery?.remaining_distance_km !== undefined && 
                   liveTrackingInfo?.delivery?.remaining_distance_km !== null && 
                   liveTrackingInfo.delivery.remaining_distance_km <= 0.5 && 
                   liveTrackingInfo.delivery.remaining_distance_km > 0 && (
                    <div className="bg-gradient-to-r from-red-600/35 to-rose-600/20 border border-red-500/30 p-4 rounded-2xl mb-6 pulse-green">
                      <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5 font-outfit">
                        <AlertTriangle className="w-4 h-4 text-red-500" /> YOUR ORDER IS NEARBY!
                      </h4>
                      <p className="text-[11px] text-slate-250 mt-1 leading-relaxed font-normal">
                        The delivery agent is approximately **{Math.round(liveTrackingInfo.delivery.remaining_distance_km * 1000)} meters** away. Please keep your phone handy!
                      </p>
                    </div>
                  )}

                  {/* Live Status Indicators */}
                  <div className={`${innerBoxClass} p-4 rounded-2xl space-y-3 mb-6`}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-700 bg-slate-850 flex items-center justify-center">
                        <img 
                          src={liveTrackingInfo?.delivery?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"} 
                          alt="Avatar" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">DELIVERY PARTNER:</span>
                        <h4 className="text-sm font-bold text-white">{liveTrackingInfo?.delivery?.partner_name || 'Arun'}</h4>
                        <span className="text-[10px] text-slate-455 block">{liveTrackingInfo?.delivery?.vehicle_type} &bull; {liveTrackingInfo?.delivery?.vehicle_number}</span>
                        <span className="mt-1.5 inline-block text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/35 px-2 py-0.5 rounded-lg font-bold font-mono">
                          {(() => {
                            const status = liveTrackingInfo?.delivery?.status || 'ASSIGNED';
                            if (status === 'ASSIGNED') return 'Delivery person assigned';
                            if (status === 'ACCEPTED') return 'Delivery accepted - Preparing';
                            if (status === 'GOING_TO_PICKUP') return 'Courier heading to pickup';
                            if (status === 'PICKED_UP') return 'Order picked up at farm';
                            if (status === 'OUT_FOR_DELIVERY') return 'Courier is on the way to you';
                            if (status === 'ARRIVED') return 'Courier has arrived';
                            if (status === 'DELIVERED') return 'Order successfully completed';
                            return status;
                          })()}
                        </span>
                      </div>
                    </div>

                    <div className={`grid grid-cols-2 gap-4 border-t ${borderClass} pt-3 text-xs`}>
                      <div>
                        <span className="text-slate-500 block">Distance Remaining:</span>
                        <span className="text-sm font-bold text-white font-outfit">
                          {liveTrackingInfo?.delivery?.remaining_distance_km !== undefined && liveTrackingInfo?.delivery?.remaining_distance_km !== null 
                            ? `${liveTrackingInfo.delivery.remaining_distance_km} km` 
                            : '8.5 km'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Estimated ETA:</span>
                        <span className="text-sm font-bold text-emerald-400 font-outfit">
                          {liveTrackingInfo?.delivery?.estimated_arrival_minutes !== undefined && liveTrackingInfo?.delivery?.estimated_arrival_minutes !== null 
                            ? `${liveTrackingInfo.delivery.estimated_arrival_minutes} mins` 
                            : '15 mins'} (LIVE ETA)
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 border-t border-slate-800/40 pt-2 flex justify-between">
                      <span>Last Updated:</span>
                      <span className="font-mono text-emerald-500">
                        {liveTrackingInfo?.lastUpdated 
                          ? `${new Date(liveTrackingInfo.lastUpdated).toLocaleTimeString()}` 
                          : 'Just Now'}
                      </span>
                    </div>
                  </div>

                  {/* Detailed Timeline list */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-405 uppercase tracking-wider mb-4 font-outfit">Delivery Timeline Progress</h4>
                    
                    {(() => {
                      const deliverySteps = ['ASSIGNED', 'ACCEPTED', 'GOING_TO_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'ARRIVED', 'DELIVERED'];
                      const activeStep = liveTrackingInfo?.delivery?.status || 'ASSIGNED';
                      const currentIdx = deliverySteps.indexOf(activeStep);

                      return (
                        <div className="space-y-4 pl-3 relative border-l border-slate-800">
                          {deliverySteps.map((step, idx) => {
                            const isDone = idx < currentIdx;
                            const isCurrent = idx === currentIdx;

                            let stepTitle = "Delivery Partner Assigned";
                            let stepDesc = "Agent has been assigned to delivery.";
                            if (step === 'ACCEPTED') {
                              stepTitle = "Delivery Accepted";
                              stepDesc = "Courier accepted the delivery request.";
                            } else if (step === 'GOING_TO_PICKUP') {
                              stepTitle = "Going to Pickup";
                              stepDesc = "Courier is en route to pickup farm.";
                            } else if (step === 'PICKED_UP') {
                              stepTitle = "Order Picked Up";
                              stepDesc = "Courier collected items from farm.";
                            } else if (step === 'OUT_FOR_DELIVERY') {
                              stepTitle = "Out for Delivery";
                              stepDesc = "Delivery partner is en route to customer house.";
                            } else if (step === 'ARRIVED') {
                              stepTitle = "Arrived";
                              stepDesc = "Courier has reached customer address.";
                            } else if (step === 'DELIVERED') {
                              stepTitle = "Delivered successfully";
                              stepDesc = "Order handed over to recipient. OTP verified.";
                            }

                            return (
                              <div key={step} className="relative pl-6">
                                {/* Dot indicator */}
                                <div
                                  className={`absolute -left-[19px] top-1.5 w-3.5 h-3.5 rounded-full border-2 ${isCurrent ? 'bg-emerald-500 border-emerald-400 scale-110 shadow-lg shadow-emerald-500/40 animate-pulse' : isDone ? 'bg-emerald-500 border-emerald-600' : 'bg-slate-950 border-slate-800'}`}
                                />
                                <h5 className={`text-xs font-bold ${isCurrent ? 'text-emerald-400' : isDone ? 'text-slate-350' : 'text-slate-500'}`}>
                                  {stepTitle}
                                </h5>
                                <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">{stepDesc}</p>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Items Summaries */}
                <div className={`mt-6 pt-4 border-t ${borderClass} text-xs space-y-2`}>
                  <div className="flex justify-between font-bold">
                    <span>Order Total:</span>
                    <span className="text-sm font-black text-lime-600">₹{trackingOrder.total_amount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // 2. DELIVERY PARTNER PORTAL
  // ==========================================
  if (isAuthenticated && user?.role === 'delivery') {
    const handleDeliveryStatusUpdate = async (orderId: string, status: string) => {
      try {
        const res = await fetch(`/api/delivery/orders/${orderId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('agrimind_token')}`
          },
          body: JSON.stringify({ status })
        });
        if (res.ok) {
          alert(`Status updated to ${status}!`);
          loadDeliveryPersonOrders();
          if (selectedDeliveryOrder && selectedDeliveryOrder.order_id === orderId) {
            const detailRes = await fetch(`/api/delivery/orders/${orderId}`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('agrimind_token')}` }
            });
            if (detailRes.ok) {
              const updated = await detailRes.json();
              setSelectedDeliveryOrder(updated);
            }
          }
        } else {
          const err = await res.json();
          alert(err.error || 'Failed to update status.');
        }
      } catch (e) {
        alert('Error updating status.');
      }
    };

    const triggerGPSPositionUpdate = async (lat: number, lng: number) => {
      try {
        await fetch(`/api/delivery/location`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('agrimind_token')}`
          },
          body: JSON.stringify({
            orderId: selectedDeliveryOrder.order_id,
            latitude: lat,
            longitude: lng
          })
        });
      } catch (e) {
        console.error('Error uploading coordinates:', e);
      }
    };

    const startGeolocating = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          await triggerGPSPositionUpdate(lat, lng);
          alert(`GPS Coordinates shared: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }, (err) => {
          alert('GPS unavailable. Please use Demo GPS Tracking mode.');
        });
      } else {
        alert('Geolocation is not supported by this browser.');
      }
    };

    const runDemoTrackingSim = () => {
      if (isDemoTracking) return;
      setIsDemoTracking(true);
      setDemoTrackingIndex(0);
      let stepIdx = 0;
      
      const interval = setInterval(async () => {
        if (stepIdx >= demoRoute.length) {
          clearInterval(interval);
          setIsDemoTracking(false);
          await handleDeliveryStatusUpdate(selectedDeliveryOrder.order_id, 'DELIVERED');
          alert('Simulated delivery completed!');
          return;
        }

        const point = demoRoute[stepIdx];
        await triggerGPSPositionUpdate(point.lat, point.lng);
        setDemoTrackingIndex(stepIdx);
        stepIdx++;
      }, 3000);
    };

    return (
      <div className={`min-h-screen ${bgClass} flex flex-col md:flex-row transition-colors duration-200`}>
        {/* Navigation Sidebar */}
        <div className={`w-full md:w-64 ${sidebarClass} flex flex-col justify-between z-20`}>
          <div>
            <div className={`p-6 border-b ${borderClass} flex items-center gap-2`}>
              <Truck className="w-6 h-6 text-[#C6DDF5]" />
              <div>
                <h1 className="text-lg font-bold font-outfit tracking-tight text-[#34413A]">{t('deliveryPortal')}</h1>
                <span className="text-[10px] text-[#C6DDF5] font-bold tracking-wider uppercase">{t('fulfillmentPartner')}</span>
              </div>
            </div>

            <nav className="p-4 space-y-1">
              <button
                onClick={() => { setActiveTab('dashboard'); setSelectedDeliveryOrder(null); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'dashboard' || activeTab === 'delivery-details' ? 'bg-[#C6DDF5]/40 text-[#34413A] border-l-4 border-[#C6DDF5] font-bold' : 'text-[#6B756E] hover:bg-[#C6DDF5]/20 hover:text-[#34413A]'}`}
              >
                <LayoutDashboard className="w-4 h-4 text-[#6B756E]" /> {t('assignedRuns')}
              </button>
            </nav>
          </div>

          <div className="space-y-1">
            <div className={`p-4 border-t ${borderClass} space-y-2`}>
              <div className="text-xs text-[#6B756E] font-medium">{t('signedIn')}: <strong>{user.name}</strong></div>
              <button
                onClick={() => { logout(); setSelectedRole(null); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" /> {t('signOut')}
              </button>
            </div>
          </div>
        </div>

        {/* Content Panel */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-5xl mx-auto w-full text-left">
          {/* Global Dashboard Header Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b theme-border gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-sky-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                  {t('fulfillmentPartner')}: <strong className="theme-text">{user.name}</strong>
                </span>
              </div>
              
              {/* Availability Toggle */}
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="text-slate-400">{t('availability')}:</span>
                <select
                  value={deliveryPartnerProfile?.status || 'Available'}
                  onChange={async (e) => {
                    const newStatus = e.target.value;
                    const res = await updateDeliveryAvailability(newStatus);
                    if (res?.success) {
                      alert(`Availability set to ${newStatus}!`);
                      loadDeliveryPersonOrders();
                    } else {
                      alert("Failed to update availability.");
                    }
                  }}
                  className={`px-3 py-1.5 border rounded-xl text-xs font-bold focus:outline-none bg-white border-slate-200 text-slate-905`}
                >
                  <option value="Available">{t('available')}</option>
                  <option value="Not Available">{t('paused')}</option>
                </select>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                {renderLanguageSelector(true)}
                {renderThemeSelector(true)}
              </div>
            </div>
          </div>
          {activeTab === 'dashboard' || !selectedDeliveryOrder ? (
            <div>
              <div className="mb-8 text-left">
                <h2 className={`text-3xl font-extrabold tracking-tight ${textTitle}`}>{t('deliveryDashboard')}</h2>
                <p className="text-slate-500 text-sm mt-1">{t('deliveryDesc')}</p>
              </div>

              {/* Status Counters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className={`${cardClass} p-5 flex items-center gap-4 bg-white border border-[#DFF2E1]`}>
                  <div className="w-12 h-12 rounded-2xl bg-[#C6DDF5] flex items-center justify-center text-[#34413A]">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs text-slate-500 block font-semibold uppercase tracking-wider">Assigned Orders</span>
                    <span className="text-2xl font-black text-[#34413A] font-outfit">
                      {deliveryPersonOrders.filter(o => o.delivery_status !== 'DELIVERED').length}
                    </span>
                  </div>
                </div>

                <div className={`${cardClass} p-5 flex items-center gap-4 bg-white border border-[#DFF2E1]`}>
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-[#34413A]">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs text-slate-500 block font-semibold uppercase tracking-wider">Active Delivery</span>
                    <span className="text-2xl font-black text-[#34413A] font-outfit">
                      {deliveryPersonOrders.filter(o => o.delivery_status === 'OUT_FOR_DELIVERY' || o.delivery_status === 'NEAR CUSTOMER').length}
                    </span>
                  </div>
                </div>

                <div className={`${cardClass} p-5 flex items-center gap-4 bg-white border border-[#DFF2E1]`}>
                  <div className="w-12 h-12 rounded-2xl bg-[#DFF2E1] flex items-center justify-center text-[#34413A]">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs text-slate-500 block font-semibold uppercase tracking-wider">Completed</span>
                    <span className="text-2xl font-black text-[#34413A] font-outfit">
                      {deliveryPersonOrders.filter(o => o.delivery_status === 'DELIVERED').length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assigned runs list */}
              <div className="space-y-8">
                {/* 1. New Delivery Requests (Notification Section) */}
                <div>
                  <h3 className="text-lg font-bold font-outfit text-[#34413A] mb-4 flex items-center gap-2">
                    🔔 New Delivery Requests
                  </h3>
                  {(() => {
                    const requests = deliveryPersonOrders.filter(o => o.delivery_status === 'ASSIGNED');
                    if (requests.length === 0) {
                      return (
                        <div className="p-6 text-center border border-dashed border-slate-200 rounded-3xl text-xs text-slate-500 bg-white">
                          No pending delivery requests.
                        </div>
                      );
                    }
                    return (
                      <div className="grid grid-cols-1 gap-6">
                        {requests.map((o) => (
                          <div key={o.delivery_id} className="bg-[#FFF8E7] border-2 border-[#FFD6BA]/40 rounded-3xl p-6 hover:shadow-sm transition-all text-left">
                            <div className="flex justify-between items-start gap-4 mb-4 border-b border-[#FFD6BA]/30 pb-3">
                              <div>
                                <span className="text-[10px] bg-[#FFD6BA] text-amber-900 px-2 py-0.5 rounded font-black tracking-widest uppercase">
                                  New Request Assigned
                                </span>
                                <h4 className="text-sm font-bold text-[#34413A] mt-1.5 font-outfit">
                                  New delivery request assigned to you for Order #{o.order_id}
                                </h4>
                              </div>
                              <span className="text-[10px] font-mono text-slate-400">Status: ASSIGNED</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-4">
                              <div>
                                <span className="text-slate-500 block font-medium">📍 Farmer Pickup:</span>
                                <strong className="text-slate-800">{o.farmer_name} &bull; {o.farm_name}</strong>
                                <span className="block text-slate-400 font-medium">Contact: {o.farmer_email || '98430 12345'}</span>
                                <span className="block text-slate-400">Location: {o.pickup_location}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block font-medium">📍 Customer Destination:</span>
                                <strong className="text-slate-800">{o.shipping_name} ({o.shipping_phone})</strong>
                                <span className="block text-slate-400">Address: {o.shipping_address}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block font-medium">Item & Quantity:</span>
                                <strong className="text-slate-850">{o.product_name} &times; {o.quantity} {o.unit}</strong>
                              </div>
                              <div>
                                <span className="text-slate-500 block font-medium">Special Notes:</span>
                                <span className="text-slate-500 italic font-medium">"{o.order_notes || 'No special notes'}"</span>
                              </div>
                            </div>

                            <div className="flex gap-3 justify-end border-t border-[#FFD6BA]/30 pt-4">
                              <button
                                onClick={() => handleDeliveryStatusUpdate(o.order_id, 'ACCEPTED')}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors"
                              >
                                Accept Delivery Request
                              </button>
                              <button
                                onClick={async () => {
                                  if (window.confirm("Reject this delivery run? It will be released back to the farmer.")) {
                                    const res = await fetch(`/api/delivery/orders/${o.order_id}/status`, {
                                      method: 'PUT',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${localStorage.getItem('agrimind_token')}`
                                      },
                                      body: JSON.stringify({ status: 'REJECTED' })
                                    });
                                    if (res.ok) {
                                      alert("Delivery rejected. Released back to marketplace pool.");
                                      loadDeliveryPersonOrders();
                                    } else {
                                      alert("Failed to reject delivery.");
                                    }
                                  }
                                }}
                                className="px-4 py-2 bg-slate-950/10 border border-slate-700/50 text-slate-500 hover:text-red-400 rounded-xl text-xs transition-colors"
                              >
                                Reject Delivery
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* 2. Active & Completed Deliveries */}
                <div>
                  <h3 className={`text-lg font-bold font-outfit ${textTitle} text-left mb-4`}>
                    Active & Completed Deliveries
                  </h3>
                  {(() => {
                    const activeRuns = deliveryPersonOrders.filter(o => o.delivery_status !== 'ASSIGNED');
                    if (activeRuns.length === 0) {
                      return (
                        <div className="p-8 text-center border border-[#DFF2E1] rounded-3xl bg-slate-50 text-xs text-slate-500">
                          No active runs. Accept a pending request above to begin.
                        </div>
                      );
                    }
                    return (
                      <div className="grid grid-cols-1 gap-6">
                        {activeRuns.map((o) => (
                          <div key={o.delivery_id} className={`${cardClass} p-6 border border-[#DFF2E1] text-left flex flex-col justify-between`}>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#DFF2E1] pb-4 mb-4 gap-2">
                              <div>
                                <span className="text-[10px] font-mono text-slate-450 uppercase block">ORDER ID: {o.order_id}</span>
                                <h4 className="text-lg font-bold text-[#34413A] mt-0.5 font-outfit">Customer: {o.shipping_name}</h4>
                              </div>
                              <div>
                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-widest ${
                                  o.delivery_status === 'DELIVERED' ? 'bg-[#DFF2E1] text-[#34413A] border-[#A8D5BA]' : 'bg-[#C6DDF5] text-[#34413A] border-sky-200'
                                }`}>
                                  {o.delivery_status}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-6">
                              <div>
                                <span className="text-slate-500 block font-medium">📍 Pickup from (Farmer):</span>
                                <span className="font-semibold text-[#34413A]">{o.farmer_name} - {o.farm_name} ({o.pickup_location})</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block font-medium">📍 Destination:</span>
                                <span className="font-semibold text-[#34413A]">{o.shipping_address}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block font-medium">Product / Qty:</span>
                                <span className="font-bold text-[#34413A]">{o.product_name} &times; {o.quantity} {o.unit}</span>
                              </div>
                              <div>
                                <span className="text-slate-505 block font-medium">Order Total:</span>
                                <span className="font-bold text-[#34413A]">₹{o.total_amount}</span>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2.5 mt-4">
                              {(() => {
                                const recState = voiceRecordingStates[o.order_id] || 'IDLE';
                                let btnText = "🎤 Start Recording";
                                let btnClass = "bg-slate-900 text-white hover:bg-slate-800";
                                if (recState === 'RECORDING') {
                                  btnText = "🔴 Stop Recording";
                                  btnClass = "bg-red-500 text-white animate-pulse hover:bg-red-600";
                                } else if (recState === 'UPLOADING') {
                                  btnText = "☁ Uploading...";
                                  btnClass = "bg-amber-500 text-white cursor-not-allowed animate-pulse";
                                } else if (recState === 'PROCESSING') {
                                  btnText = "🤖 AI Processing...";
                                  btnClass = "bg-sky-500 text-white cursor-not-allowed animate-pulse";
                                } else if (recState === 'COMPLETED') {
                                  btnText = "✅ Voice Update Successful";
                                  btnClass = "bg-emerald-500 text-white cursor-not-allowed";
                                } else if (recState === 'FAILED') {
                                  btnText = "❌ Upload Failed";
                                  btnClass = "bg-red-600 text-white cursor-not-allowed";
                                }

                                return (
                                  <button
                                    disabled={recState !== 'IDLE' && recState !== 'RECORDING'}
                                    onClick={() => {
                                      if (recState === 'IDLE') {
                                        startVoiceUpdateRecording(o.order_id, o.delivery_id);
                                      } else if (recState === 'RECORDING') {
                                        stopVoiceUpdateRecording(o.order_id);
                                      }
                                    }}
                                    className={`px-4 py-2.5 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all ${btnClass}`}
                                  >
                                    {btnText}
                                  </button>
                                );
                              })()}

                              <button
                                onClick={() => { setSelectedDeliveryOrder(o); setActiveTab('delivery-details'); }}
                                className="px-6 py-2.5 bg-[#A8D5BA] hover:opacity-90 text-[#34413A] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                              >
                                <Eye className="w-3.5 h-3.5" /> VIEW DELIVERY RUN
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          ) : (
            /* Detailed Run View */
            <div className="text-left">
              <button
                onClick={() => { setSelectedDeliveryOrder(null); setActiveTab('dashboard'); }}
                className="px-4 py-2 bg-[#FFF8E7] hover:bg-[#FFF8E7]/80 text-[#34413A] font-bold rounded-xl text-xs border border-[#BFD8C2] mb-6 flex items-center gap-1.5 transition-all"
              >
                &larr; Back to Dashboard
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Panel: Delivery Details & Control */}
                <div className="lg:col-span-1 space-y-6">
                  <div className={`${cardClass} p-6`}>
                    <span className="text-[10px] font-mono text-slate-450 uppercase block font-medium">ORDER ID: {selectedDeliveryOrder.order_id}</span>
                    <h3 className="text-xl font-bold font-outfit text-[#34413A] mt-1">Delivery Details</h3>

                    <div className="space-y-4 pt-4 border-t border-[#DFF2E1] text-xs">
                      <div>
                        <span className="text-slate-500 block font-medium">Customer Name:</span>
                        <span className="text-sm font-bold text-[#34413A]">{selectedDeliveryOrder.shipping_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block font-medium">Customer Phone:</span>
                        <span className="text-sm font-semibold text-[#34413A]">{selectedDeliveryOrder.shipping_phone}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block font-medium">Delivery Address:</span>
                        <span className="text-sm font-medium text-[#34413A]">{selectedDeliveryOrder.shipping_address}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block font-medium">Farmer / Pickup Location:</span>
                        <span className="text-sm font-medium text-[#34413A]">{selectedDeliveryOrder.farm_name} ({selectedDeliveryOrder.pickup_location})</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block font-medium">Product / Quantity:</span>
                        <span className="text-sm font-bold text-[#34413A]">{selectedDeliveryOrder.product_name} &times; {selectedDeliveryOrder.quantity} {selectedDeliveryOrder.unit}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 bg-[#FFF8E7] border border-[#BFD8C2]/45 rounded-xl mt-4">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">Status / Distance / ETA</span>
                          <span className="text-xs font-semibold text-[#34413A]">
                            {selectedDeliveryOrder.delivery_status} &bull; {selectedDeliveryOrder.remaining_distance_km !== null ? `${selectedDeliveryOrder.remaining_distance_km} km` : '8.5 km'} &bull; {selectedDeliveryOrder.estimated_arrival_minutes !== null ? `${selectedDeliveryOrder.estimated_arrival_minutes} mins` : '15 mins'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      {/* Voice Update Action */}
                      {(() => {
                        const recState = voiceRecordingStates[selectedDeliveryOrder.order_id] || 'IDLE';
                        let btnText = "🎤 Start Recording";
                        let btnClass = "bg-slate-900 text-white hover:bg-slate-800";
                        if (recState === 'RECORDING') {
                          btnText = "🔴 Stop Recording";
                          btnClass = "bg-red-500 text-white animate-pulse hover:bg-red-600";
                        } else if (recState === 'UPLOADING') {
                          btnText = "☁ Uploading...";
                          btnClass = "bg-amber-500 text-white cursor-not-allowed animate-pulse";
                        } else if (recState === 'PROCESSING') {
                          btnText = "🤖 AI Processing...";
                          btnClass = "bg-sky-500 text-white cursor-not-allowed animate-pulse";
                        } else if (recState === 'COMPLETED') {
                          btnText = "✅ Voice Update Successful";
                          btnClass = "bg-emerald-500 text-white cursor-not-allowed";
                        } else if (recState === 'FAILED') {
                          btnText = "❌ Upload Failed";
                          btnClass = "bg-red-600 text-white cursor-not-allowed";
                        }

                        return (
                          <button
                            disabled={recState !== 'IDLE' && recState !== 'RECORDING'}
                            onClick={() => {
                              if (recState === 'IDLE') {
                                startVoiceUpdateRecording(selectedDeliveryOrder.order_id, selectedDeliveryOrder.delivery_id);
                              } else if (recState === 'RECORDING') {
                                stopVoiceUpdateRecording(selectedDeliveryOrder.order_id);
                              }
                            }}
                            className={`w-full py-2.5 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all ${btnClass}`}
                          >
                            {btnText}
                          </button>
                        );
                      })()}

                      {selectedDeliveryOrder.delivery_status === 'ASSIGNED' && (
                        <button
                          onClick={() => handleDeliveryStatusUpdate(selectedDeliveryOrder.order_id, 'ACCEPTED')}
                          className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-955 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
                        >
                          Accept Delivery Request
                        </button>
                      )}
                      
                      {selectedDeliveryOrder.delivery_status === 'ACCEPTED' && (
                        <button
                          onClick={() => handleDeliveryStatusUpdate(selectedDeliveryOrder.order_id, 'GOING_TO_PICKUP')}
                          className="w-full py-2.5 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
                        >
                          Mark Going to Pickup
                        </button>
                      )}

                      {selectedDeliveryOrder.delivery_status === 'GOING_TO_PICKUP' && (
                        <button
                          onClick={() => handleDeliveryStatusUpdate(selectedDeliveryOrder.order_id, 'PICKED_UP')}
                          className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
                        >
                          Confirm Picked Up from Farmer
                        </button>
                      )}

                      {selectedDeliveryOrder.delivery_status === 'PICKED_UP' && (
                        <button
                          onClick={() => handleDeliveryStatusUpdate(selectedDeliveryOrder.order_id, 'OUT_FOR_DELIVERY')}
                          className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
                        >
                          Mark Out for Delivery
                        </button>
                      )}

                      {selectedDeliveryOrder.delivery_status === 'OUT_FOR_DELIVERY' && (
                        <button
                          onClick={() => handleDeliveryStatusUpdate(selectedDeliveryOrder.order_id, 'ARRIVED')}
                          className="w-full py-2.5 bg-pink-500 hover:bg-pink-400 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
                        >
                          Mark Arrived at Customer Location
                        </button>
                      )}

                      {selectedDeliveryOrder.delivery_status === 'ARRIVED' && (
                        <div className="p-4 bg-slate-955/25 bg-slate-950/20 border border-slate-800 rounded-2xl space-y-3 text-left">
                          <span className="text-[10px] font-bold text-amber-500 block uppercase tracking-wider font-outfit">Awaiting Customer Verification</span>
                          <p className="text-[11px] text-slate-400">Please collect the 4-digit security OTP from the customer to finalize this delivery.</p>
                          <form
                            onSubmit={async (e) => {
                              e.preventDefault();
                              const inputOtp = (e.target as any).otp.value;
                              if (!inputOtp) return alert('Please enter OTP');
                              const res = await deliverOrder(selectedDeliveryOrder.order_id, inputOtp);
                              if (res?.success) {
                                alert('Delivery completed successfully!');
                                setSelectedDeliveryOrder(null);
                                loadDeliveryPersonOrders();
                              } else {
                                alert(res?.error || 'Incorrect OTP.');
                              }
                            }}
                            className="space-y-2 font-outfit"
                          >
                            <input
                              name="otp"
                              type="text"
                              maxLength={4}
                              placeholder="Enter 4-digit OTP"
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white text-center tracking-widest font-mono font-bold"
                            />
                            <button
                              type="submit"
                              className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-955 font-bold rounded-xl text-xs transition-colors"
                            >
                              Verify OTP & Complete Delivery
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`${cardClass} p-6 space-y-4`}>
                    <h3 className="text-base font-bold font-outfit text-[#34413A] border-b border-[#DFF2E1] pb-2">GPS Tracking Control</h3>
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (isSharingLocation) {
                            setIsSharingLocation(false);
                            setCourierAccuracy(null);
                            setCourierTimestamp(null);
                          } else {
                            if (navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition(
                                (pos) => {
                                  setIsSharingLocation(true);
                                  setCourierAccuracy(pos.coords.accuracy);
                                  setCourierTimestamp(pos.timestamp);
                                },
                                (err) => {
                                  alert("GPS access denied. Please enable location permissions in your browser.");
                                }
                              );
                            } else {
                              alert("Geolocation is not supported by this browser.");
                            }
                          }
                        }}
                        className={`w-full py-2.5 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all ${
                          isSharingLocation 
                            ? 'bg-red-500 text-white hover:bg-red-600' 
                            : 'bg-[#C6DDF5] text-[#34413A] hover:opacity-90'
                        }`}
                      >
                        {isSharingLocation ? '🛑 Stop Live Location Sharing' : '📡 Share Live Location'}
                      </button>

                      {isSharingLocation && courierAccuracy !== null && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-[#34413A] space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-500">GPS Status:</span>
                            <span className="font-bold text-emerald-600">ACTIVE</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Accuracy:</span>
                            <span className="font-semibold">{courierAccuracy.toFixed(1)} meters</span>
                          </div>
                          {courierTimestamp && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">Last Sync:</span>
                              <span className="font-mono">{new Date(courierTimestamp).toLocaleTimeString()}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={runDemoTrackingSim}
                        className={`w-full py-2.5 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all ${isDemoTracking ? 'bg-orange-500 text-white animate-pulse' : 'bg-orange-100 hover:bg-orange-200 text-orange-800'}`}
                      >
                        {isDemoTracking ? 'Simulating Movement...' : 'Start Demo GPS Tracking'}
                      </button>
                    </div>
                    {isDemoTracking && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-[11px] text-orange-850 text-center font-medium animate-pulse">
                        🚚 **Simulated Delivery Tracking Active**
                        <div className="mt-1 font-mono">
                          Coords: {demoRoute[Math.min(demoTrackingIndex, demoRoute.length - 1)].lat.toFixed(4)}, {demoRoute[Math.min(demoTrackingIndex, demoRoute.length - 1)].lng.toFixed(4)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Panel: Google Map */}
                <div className="lg:col-span-2 space-y-6">
                  <div className={`${cardClass} p-6 h-[450px] relative flex flex-col`}>
                    <h3 className="text-base font-bold font-outfit text-[#34413A] mb-3 flex items-center justify-between">
                      <span>Fulfillment Navigation Route</span>
                      {isDemoTracking && <span className="text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded font-black tracking-widest uppercase">Demo GPS Active</span>}
                    </h3>
                    <div className="flex-1 relative rounded-2xl overflow-hidden min-h-[300px]">
                      <GoogleMapComponent 
                        pickup={{ lat: 10.9970, lng: 76.9616, name: selectedDeliveryOrder.farm_name }}
                        customer={{ lat: selectedDeliveryOrder.customer_lat || 11.0168, lng: selectedDeliveryOrder.customer_lng || 76.9558, name: selectedDeliveryOrder.shipping_name }}
                        delivery={isDemoTracking ? { lat: demoRoute[Math.min(demoTrackingIndex, demoRoute.length - 1)].lat, lng: demoRoute[Math.min(demoTrackingIndex, demoRoute.length - 1)].lng, name: 'Delivery Partner (Simulated)' } : (courierLat && courierLng ? { lat: courierLat, lng: courierLng, name: 'Delivery Partner (GPS)' } : { lat: 11.0012, lng: 76.9602, name: 'Delivery Partner' })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // 3. FARMER PORTAL (COMMAND CENTER)
  // ==========================================
  const activeField = fields.find(f => f.id === activeFieldId);

  const handleAssignPartner = async (partnerId: string) => {
    if (!assigningOrder) return;
    const res = await assignDeliveryPartner(assigningOrder.id, partnerId);
    if (res?.success) {
      alert("Delivery assigned successfully.");
      setAssigningOrder(null);
      loadFarmerOrders();
      loadDeliveryPartners();
    } else {
      alert(res?.error || "Failed to assign delivery.");
    }
  };

  const handleManualAssign = async () => {
    if (!assigningOrder) return;
    if (!manualDriverName || !manualDriverPhone) {
      alert("Please fill in the driver's Name and Phone Number.");
      return;
    }
    const res = await assignDeliveryPartner(assigningOrder.id, null, {
      name: manualDriverName,
      phone: manualDriverPhone,
      vehicleType: manualDriverVehicle,
      pickupLocation: manualPickupLocation || farm?.location || 'Coimbatore, TN',
      deliveryLocation: manualDeliveryLocation || assigningOrder.shipping_address,
      notes: manualNotes
    });
    if (res?.success) {
      alert("Delivery assigned successfully.");
      setAssigningOrder(null);
      // Reset fields
      setManualDriverName('');
      setManualDriverPhone('');
      setManualDriverVehicle('Bike');
      setManualPickupLocation('');
      setManualDeliveryLocation('');
      setManualNotes('');
      loadFarmerOrders();
      loadDeliveryPartners();
    } else {
      alert(res?.error || "Failed to assign delivery.");
    }
  };

  return (
    <div className={`min-h-screen ${bgClass} flex flex-col md:flex-row transition-colors duration-200`}>
      {/* Sidebar Navigation */}
      <div className={`w-full md:w-64 ${sidebarClass} flex flex-col justify-between z-20`}>
        <div>
          <div className={`p-6 border-b ${borderClass} flex items-center gap-2`}>
            <Sprout className="w-6 h-6 text-[#A8D5BA]" />
            <div>
              <h1 className={`text-lg font-bold font-outfit tracking-tight ${textTitle}`}>AgriConnect</h1>
              <span className="text-[10px] text-[#A8D5BA] font-bold tracking-wider uppercase">Farmer Portal</span>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'dashboard' ? 'bg-[#DFF2E1] text-[#34413A] border-l-4 border-[#A8D5BA] font-bold' : 'text-[#6B756E] hover:bg-[#DFF2E1]/30 hover:text-[#34413A]'}`}
            >
              <LayoutDashboard className="w-4 h-4 text-[#6B756E]" /> {t('dashboard')}
            </button>
            <button
              onClick={() => setActiveTab('crop-recommendations')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'crop-recommendations' ? 'bg-[#DFF2E1] text-[#34413A] border-l-4 border-[#A8D5BA] font-bold' : 'text-[#6B756E] hover:bg-[#DFF2E1]/30 hover:text-[#34413A]'}`}
            >
              <Sprout className="w-4 h-4 text-[#6B756E]" /> {t('seasonalCrops')}
            </button>
            <button
              onClick={() => setActiveTab('soil-analysis')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'soil-analysis' ? 'bg-[#DFF2E1] text-[#34413A] border-l-4 border-[#A8D5BA] font-bold' : 'text-[#6B756E] hover:bg-[#DFF2E1]/30 hover:text-[#34413A]'}`}
            >
              <Database className="w-4 h-4 text-[#6B756E]" /> {t('soilAnalysis')}
            </button>
            <button
              onClick={() => setActiveTab('plant-health')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'plant-health' ? 'bg-[#DFF2E1] text-[#34413A] border-l-4 border-[#A8D5BA] font-bold' : 'text-[#6B756E] hover:bg-[#DFF2E1]/30 hover:text-[#34413A]'}`}
            >
              <Camera className="w-4 h-4 text-[#6B756E]" /> {t('plantHealth')}
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'products' ? 'bg-[#DFF2E1] text-[#34413A] border-l-4 border-[#A8D5BA] font-bold' : 'text-[#6B756E] hover:bg-[#DFF2E1]/30 hover:text-[#34413A]'}`}
            >
              <Store className="w-4 h-4 text-[#6B756E]" /> {t('products')}
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'inventory' ? 'bg-[#DFF2E1] text-[#34413A] border-l-4 border-[#A8D5BA] font-bold' : 'text-[#6B756E] hover:bg-[#DFF2E1]/30 hover:text-[#34413A]'}`}
            >
              <List className="w-4 h-4 text-[#6B756E]" /> {t('myProducts')} ({farmerInventory.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'orders' ? 'bg-[#DFF2E1] text-[#34413A] border-l-4 border-[#A8D5BA] font-bold' : 'text-[#6B756E] hover:bg-[#DFF2E1]/30 hover:text-[#34413A]'}`}
            >
              <ShoppingBag className="w-4 h-4 text-[#6B756E]" /> {t('orders')} ({farmerOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('deliveries')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'deliveries' ? 'bg-[#DFF2E1] text-[#34413A] border-l-4 border-[#A8D5BA] font-bold' : 'text-[#6B756E] hover:bg-[#DFF2E1]/30 hover:text-[#34413A]'}`}
            >
              <Truck className="w-4 h-4 text-[#6B756E]" /> {t('delivery')}
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'notifications' ? 'bg-[#DFF2E1] text-[#34413A] border-l-4 border-[#A8D5BA] font-bold' : 'text-[#6B756E] hover:bg-[#DFF2E1]/30 hover:text-[#34413A]'}`}
            >
              <Bell className="w-4 h-4 text-[#6B756E]" /> {t('notifications')} ({alerts.length})
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === 'profile' ? 'bg-[#DFF2E1] text-[#34413A] border-l-4 border-[#A8D5BA] font-bold' : 'text-[#6B756E] hover:bg-[#DFF2E1]/30 hover:text-[#34413A]'}`}
            >
              <User className="w-4 h-4 text-[#6B756E]" /> {t('profile')}
            </button>
          </nav>
        </div>

        <div className="space-y-1">
          <div className={`p-4 border-t ${borderClass} space-y-2`}>
            <div className="text-xs text-slate-500">{t('signedIn')}: <strong>{user.name}</strong></div>
            
            <div className="p-2.5 rounded-xl bg-slate-950/20 border border-slate-700/30 text-[10px] space-y-1 font-mono">
              <div className="flex justify-between font-bold">
                <span>{t('reliability')}:</span>
                <span className={user.reliability_score < 70 ? 'text-red-500 font-black' : 'text-emerald-500'}>
                  {user.reliability_score ?? 100}/100
                </span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>{t('standing')}:</span>
                <span className={user.is_restricted ? 'text-red-500 font-black' : 'text-slate-400'}>
                  {user.is_restricted ? t('restricted') : t('active')}
                </span>
              </div>
            </div>

            <button
              onClick={() => { logout(); setSelectedRole(null); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" /> {t('signOut')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Global Dashboard Header Bar */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b theme-border">
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              {t('farmerWorkspace')}: <strong className="theme-text">{user.name}</strong>
            </span>
          </div>
            <div className="flex items-center gap-2">
              {renderLanguageSelector(true)}
              {renderThemeSelector(true)}
            </div>
        </div>
        {activeTab === 'dashboard' ? (
          <div>
            {/* 1. TOP WELCOME SECTION */}
            <div className="bg-gradient-to-r from-[#DFF2E1] to-[#FFF8E7] rounded-3xl p-6 md:p-8 mb-8 border border-[#A8D5BA]/40 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-[#34413A] border border-[#A8D5BA]/35 shadow-sm">
                  <Sprout className="w-9 h-9" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold font-outfit text-[#34413A]">
                    {t('welcome')}, {user?.name || 'Farmer'}
                  </h2>
                  <p className="text-xs text-[#6B756E] font-medium mt-0.5">
                    Here is what you can grow this season based on weather and soil.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">{t('locationFarm')}</span>
                <span className="text-xs font-bold text-[#34413A] bg-white border border-slate-200 px-3 py-1 rounded-xl shadow-sm">
                  📍 {farm?.location || 'Coimbatore, TN'} &bull; {farm?.name || 'Green Valley Farm'}
                </span>
              </div>
            </div>

            {/* 2. CURRENT SEASON HIGHLIGHT */}
            <div className="bg-white border-2 border-[#DFF2E1] rounded-3xl p-6 mb-8 hover:shadow-[0_8px_30px_rgba(168,213,186,0.1)] transition-all">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-3">
                <h3 className="text-lg font-bold text-[#34413A] font-outfit">{t('bestCrops')}</h3>
                <span className="px-3.5 py-1 bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-full">
                  {t('currentSeason')}
                </span>
              </div>
              <p className="text-xs text-[#6B756E] leading-relaxed max-w-3xl mb-4 font-medium">
                {t('seasonReason')}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-[#DFF2E1] text-[#34413A] text-[10px] font-bold rounded-lg border border-[#A8D5BA]/30">
                  {t('goodRain')}
                </span>
                <span className="px-3 py-1 bg-[#FFF8E7] text-[#34413A] text-[10px] font-bold rounded-lg border border-[#FFD6BA]/30">
                  {t('warmTemp')}
                </span>
                <span className="px-3 py-1 bg-[#C6DDF5]/30 text-[#34413A] text-[10px] font-bold rounded-lg border border-[#C6DDF5]/50">
                  {t('moistureAvail')}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-3 font-semibold font-mono">
                {t('suggestedSeason')}
              </p>
            </div>

            {/* 3. RECOMMENDED CROP CARDS */}
            <h3 className="text-xl font-bold font-outfit text-[#34413A] mb-4">{t('seasonalCropGuide')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Rice Card */}
              <div className="bg-white border border-[#DFF2E1] rounded-3xl p-5 hover:shadow-[0_8px_30px_rgba(168,213,186,0.12)] transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className="text-2xl">🌾</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-150 text-green-700 border border-green-200 uppercase">
                      {t('highlySuitable')}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-[#34413A] mb-1">{t('rice')}</h4>
                  <p className="text-xs text-[#6B756E] leading-relaxed mb-4 font-medium">
                    {t('riceDesc')}
                  </p>
                  <div className="space-y-1 text-[11px] text-slate-500 font-semibold pb-4">
                    <div className="flex justify-between">
                      <span>{t('duration')}:</span>
                      <strong className="text-slate-800">90-120 days</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('waterNeed')}:</span>
                      <strong className="text-[#34413A]">{t('high')}</strong>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCropTips({
                      name: t('rice'),
                      season: t('monsoon'),
                      soil: t('clayeyLoamy'),
                      water: t('high'),
                      duration: '90-120 days',
                      tips: [t('riceTip1'), t('riceTip2'), t('riceTip3')]
                    })}
                    className="flex-1 py-2 bg-[#DFF2E1] text-[#34413A] font-bold rounded-xl text-[10px] hover:bg-[#A8D5BA] transition-colors"
                  >
                    Growing Tips
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('plant-health');
                      setSelectedPlantForHealth('Rice');
                    }}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[10px] transition-colors"
                  >
                    Check Health
                  </button>
                </div>
              </div>

              {/* Maize Card */}
              <div className="bg-white border border-[#DFF2E1] rounded-3xl p-5 hover:shadow-[0_8px_30px_rgba(168,213,186,0.12)] transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className="text-2xl">🌽</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                      {t('suitable')}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-[#34413A] mb-1">{t('maize')}</h4>
                  <p className="text-xs text-[#6B756E] leading-relaxed mb-4 font-medium">
                    {t('maizeDesc')}
                  </p>
                  <div className="space-y-1 text-[11px] text-slate-500 font-semibold pb-4">
                    <div className="flex justify-between">
                      <span>{t('duration')}:</span>
                      <strong className="text-slate-800">80-100 days</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('waterNeed')}:</span>
                      <strong className="text-[#34413A]">{t('medium')}</strong>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCropTips({
                      name: t('maize'),
                      season: t('monsoon'),
                      soil: t('wellDrainedLoamy'),
                      water: t('medium'),
                      duration: '80-100 days',
                      tips: [t('maizeTip1'), t('maizeTip2'), t('maizeTip3')]
                    })}
                    className="flex-1 py-2 bg-[#DFF2E1] text-[#34413A] font-bold rounded-xl text-[10px] hover:bg-[#A8D5BA] transition-colors"
                  >
                    Growing Tips
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('plant-health');
                      setSelectedPlantForHealth('Maize');
                    }}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[10px] transition-colors"
                  >
                    Check Health
                  </button>
                </div>
              </div>

              {/* Groundnut Card */}
              <div className="bg-white border border-[#DFF2E1] rounded-3xl p-5 hover:shadow-[0_8px_30px_rgba(168,213,186,0.12)] transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className="text-2xl">🥜</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                      {t('suitable')}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-[#34413A] mb-1">{t('groundnut')}</h4>
                  <p className="text-xs text-[#6B756E] leading-relaxed mb-4 font-medium">
                    {t('groundnutDesc')}
                  </p>
                  <div className="space-y-1 text-[11px] text-slate-500 font-semibold pb-4">
                    <div className="flex justify-between">
                      <span>{t('duration')}:</span>
                      <strong className="text-slate-800">100-120 days</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('waterNeed')}:</span>
                      <strong className="text-[#34413A]">{t('medium')}</strong>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCropTips({
                      name: t('groundnut'),
                      season: t('monsoon'),
                      soil: t('sandyLoam'),
                      water: t('medium'),
                      duration: '100-120 days',
                      tips: [t('groundnutTip1'), t('groundnutTip2'), t('groundnutTip3')]
                    })}
                    className="flex-1 py-2 bg-[#DFF2E1] text-[#34413A] font-bold rounded-xl text-[10px] hover:bg-[#A8D5BA] transition-colors"
                  >
                    Growing Tips
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('plant-health');
                      setSelectedPlantForHealth('Groundnut');
                    }}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[10px] transition-colors"
                  >
                    Check Health
                  </button>
                </div>
              </div>

              {/* Soybean Card */}
              <div className="bg-white border border-[#DFF2E1] rounded-3xl p-5 hover:shadow-[0_8px_30px_rgba(168,213,186,0.12)] transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className="text-2xl">🌱</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-150 text-green-700 border border-green-200 uppercase">
                      {t('highlySuitable')}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-[#34413A] mb-1">{t('soybean')}</h4>
                  <p className="text-xs text-[#6B756E] leading-relaxed mb-4 font-medium">
                    {t('soybeanDesc')}
                  </p>
                  <div className="space-y-1 text-[11px] text-slate-500 font-semibold pb-4">
                    <div className="flex justify-between">
                      <span>{t('duration')}:</span>
                      <strong className="text-slate-800">90-110 days</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('waterNeed')}:</span>
                      <strong className="text-[#34413A]">{t('medium')}</strong>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCropTips({
                      name: t('soybean'),
                      season: t('monsoon'),
                      soil: t('fertileWellDrained'),
                      water: t('medium'),
                      duration: '90-110 days',
                      tips: [t('soybeanTip1'), t('soybeanTip2'), t('soybeanTip3')]
                    })}
                    className="flex-1 py-2 bg-[#DFF2E1] text-[#34413A] font-bold rounded-xl text-[10px] hover:bg-[#A8D5BA] transition-colors"
                  >
                    Growing Tips
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('plant-health');
                      setSelectedPlantForHealth('Soybean');
                    }}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[10px] transition-colors"
                  >
                    Check Health
                  </button>
                </div>
              </div>

              {/* Cotton Card */}
              <div className="bg-white border border-[#DFF2E1] rounded-3xl p-5 hover:shadow-[0_8px_30px_rgba(168,213,186,0.12)] transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className="text-2xl">☁️</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                      {t('moderate')}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-[#34413A] mb-1">{t('cotton')}</h4>
                  <p className="text-xs text-[#6B756E] leading-relaxed mb-4 font-medium">
                    {t('cottonDesc')}
                  </p>
                  <div className="space-y-1 text-[11px] text-slate-500 font-semibold pb-4">
                    <div className="flex justify-between">
                      <span>{t('duration')}:</span>
                      <strong className="text-slate-800">150-180 days</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('waterNeed')}:</span>
                      <strong className="text-[#34413A]">{t('medium')}</strong>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCropTips({
                      name: t('cotton'),
                      season: t('monsoon'),
                      soil: t('deepClayeyBlack'),
                      water: t('medium'),
                      duration: '150-180 days',
                      tips: [t('cottonTip1'), t('cottonTip2'), t('cottonTip3')]
                    })}
                    className="flex-1 py-2 bg-[#DFF2E1] text-[#34413A] font-bold rounded-xl text-[10px] hover:bg-[#A8D5BA] transition-colors"
                  >
                    Growing Tips
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('plant-health');
                      setSelectedPlantForHealth('Cotton');
                    }}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[10px] transition-colors"
                  >
                    Check Health
                  </button>
                </div>
              </div>

              {/* Tomato Card */}
              <div className="bg-white border border-[#DFF2E1] rounded-3xl p-5 hover:shadow-[0_8px_30px_rgba(168,213,186,0.12)] transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className="text-2xl">🍅</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                      {t('moderate')}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-[#34413A] mb-1">{t('tomato')}</h4>
                  <p className="text-xs text-[#6B756E] leading-relaxed mb-4 font-medium">
                    {t('tomatoDesc')}
                  </p>
                  <div className="space-y-1 text-[11px] text-slate-500 font-semibold pb-4">
                    <div className="flex justify-between">
                      <span>{t('duration')}:</span>
                      <strong className="text-slate-800">70-90 days</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('waterNeed')}:</span>
                      <strong className="text-[#34413A]">{t('medium')}</strong>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCropTips({
                      name: t('tomato'),
                      season: t('monsoon'),
                      soil: t('fertileWellDrained') || 'Fertile Well-Drained',
                      water: t('medium'),
                      duration: '70-90 days',
                      tips: ['Ensure staking/support for optimal airflow.', 'Water at base to keep foliage dry.', 'Watch for early leaf yellowing or blight spots.']
                    })}
                    className="flex-1 py-2 bg-[#DFF2E1] text-[#34413A] font-bold rounded-xl text-[10px] hover:bg-[#A8D5BA] transition-colors"
                  >
                    Growing Tips
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('plant-health');
                      setSelectedPlantForHealth('Tomato');
                    }}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[10px] transition-colors"
                  >
                    Check Health
                  </button>
                </div>
              </div>

              {/* Potato Card */}
              <div className="bg-white border border-[#DFF2E1] rounded-3xl p-5 hover:shadow-[0_8px_30px_rgba(168,213,186,0.12)] transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className="text-2xl">🥔</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                      {t('suitable')}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-[#34413A] mb-1">{t('potato') || 'Potato'}</h4>
                  <p className="text-xs text-[#6B756E] leading-relaxed mb-4 font-medium">
                    Grows well in sandy-loam soils with moderate rainfall and cool to moderate temperatures.
                  </p>
                  <div className="space-y-1 text-[11px] text-slate-500 font-semibold pb-4">
                    <div className="flex justify-between">
                      <span>{t('duration')}:</span>
                      <strong className="text-slate-800">90-120 days</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('waterNeed')}:</span>
                      <strong className="text-[#34413A]">{t('medium')}</strong>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCropTips({
                      name: 'Potato',
                      season: t('monsoon'),
                      soil: t('sandyLoam') || 'Sandy Loam',
                      water: t('medium'),
                      duration: '90-120 days',
                      tips: ['Ensure good soil drainage to prevent tuber rot.', 'Use disease-free certified seed tubers.', 'Apply balanced NPK and watch for early/late blight symptoms.']
                    })}
                    className="flex-1 py-2 bg-[#DFF2E1] text-[#34413A] font-bold rounded-xl text-[10px] hover:bg-[#A8D5BA] transition-colors"
                  >
                    Growing Tips
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('plant-health');
                      setSelectedPlantForHealth('Potato');
                    }}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[10px] transition-colors"
                  >
                    Check Health
                  </button>
                </div>
              </div>
            </div>

            {/* Today's Reminders Section */}
            <div className="max-w-2xl mx-auto bg-white border border-slate-150 rounded-3xl p-6 shadow-sm mb-8">
              <h3 className="text-lg font-bold font-outfit text-[#34413A] mb-3 flex items-center justify-center gap-2">
                🔔 {t('todaysReminders')}
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-xs text-[#6B756E] font-medium mb-5 text-left max-w-md mx-auto">
                <li>{t('checkSoilMoistureRemind')}</li>
                <li>{t('useDiseaseDetection')}</li>
                <li>{t('chooseCropsWater')}</li>
              </ul>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setActiveTab('notifications')}
                  className="px-6 py-2.5 bg-[#34413A] text-white hover:bg-slate-800 rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  {t('viewNotifications')}
                </button>
              </div>
            </div>

            {/* Modal for crop detail tips */}
            {selectedCropTips && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-200">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#DFF2E1]/50">
                    <h3 className="text-lg font-bold font-outfit text-[#34413A]">{selectedCropTips.name} {t('growingGuide')}</h3>
                    <button 
                      onClick={() => setSelectedCropTips(null)} 
                      className="text-slate-500 hover:text-slate-700 text-xs font-bold"
                    >
                      {t('close')}
                    </button>
                  </div>

                  <div className="p-6 space-y-4 text-xs text-[#6B756E] font-medium">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#FAFCF8] p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold">{t('bestSeason')}</span>
                        <strong className="text-[#34413A] text-sm">{selectedCropTips.season}</strong>
                      </div>
                      <div className="bg-[#FAFCF8] p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold">{t('duration')}</span>
                        <strong className="text-[#34413A] text-sm">{selectedCropTips.duration}</strong>
                      </div>
                      <div className="bg-[#FAFCF8] p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold">{t('soilType')}</span>
                        <strong className="text-[#34413A] text-sm">{selectedCropTips.soil}</strong>
                      </div>
                      <div className="bg-[#FAFCF8] p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold">{t('waterNeed')}</span>
                        <strong className="text-[#34413A] text-sm">{selectedCropTips.water}</strong>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                      <h4 className="text-xs font-bold text-[#34413A] uppercase tracking-wider mb-2">{t('essentialCareTips')}</h4>
                      <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-500">
                        {selectedCropTips.tips.map((tip: string, idx: number) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => setSelectedCropTips(null)}
                        className="w-full py-2.5 bg-[#A8D5BA] text-[#34413A] font-bold rounded-xl text-xs hover:opacity-90 transition-colors"
                      >
                        {t('gotItThanks')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Floating Farm Assistant Copilot */}
            <Copilot />
          </div>
        ) : activeTab === 'crops' ? (
          <div>
            <h2 className={`text-2xl font-bold mb-6 ${textTitle}`}>Crop Lifecycle Tracker</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fields.map((f) => {
                const crop = f.crop;
                if (!crop) return null;
                
                const stages = ['Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Maturity', 'Harvest'];
                const stageIdx = stages.indexOf(crop.growth_stage);
                const progressPct = ((stageIdx + 1) / stages.length) * 100;
                const isMature = crop.growth_stage === 'Maturity' || crop.growth_stage === 'Harvest';

                return (
                  <div key={f.id} className={`${cardClass} rounded-2xl p-6 flex flex-col justify-between`}>
                    <div>
                      <div className={`flex justify-between items-start border-b ${borderClass} pb-3 mb-4`}>
                        <div>
                          <span className="text-xs text-emerald-500 font-bold uppercase tracking-wider">{f.name}</span>
                          <h3 className={`text-xl mt-0.5 ${textTitle}`}>
                            {crop.name} ({crop.variety})
                          </h3>
                        </div>
                        <span className="text-xs bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-lg border border-emerald-500/20 font-semibold">{crop.growth_stage}</span>
                      </div>

                      <div className="text-xs text-slate-500 space-y-1 mb-6">
                        <div>Planted Date: <span className="font-medium">{crop.planting_date}</span></div>
                        <div>Est. Harvest Date: <span className="font-medium">{crop.expected_harvest}</span></div>
                        <div>Planted Area: <span className="font-medium">{crop.area} Acres</span></div>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-6">
                        <div className="flex justify-between text-xs mb-1.5 font-semibold text-slate-500">
                          <span>Lifecycle Progress</span>
                          <span>{Math.round(progressPct)}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-950/20 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progressPct}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Direct marketplace connection button */}
                    {isMature && (
                      <button
                        onClick={() => triggerHarvestListing(crop)}
                        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-lime-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 hover:scale-[1.01] transition-all"
                      >
                        <ShoppingBag className="w-4 h-4" /> Ready to Harvest - Create Product Listing
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : activeTab === 'products' ? (
          <div>
            <h2 className={`text-2xl font-bold mb-6 ${textTitle}`}>{t('addNewProduct')}</h2>
            <div className={`${cardClass} rounded-3xl p-6 max-w-2xl`}>
              <form onSubmit={handleCreateProduct} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-505 mb-1">{t('productTitle')}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Organic Beefsteak Tomatoes"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-955/10 border border-slate-700/50 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-505 mb-1">{t('category')}</label>
                    <select
                      value={newProductCategory}
                      onChange={(e) => setNewProductCategory(e.target.value)}
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm ${
                        true
                          ? 'text-slate-900 bg-white border-slate-200'
                          : 'text-white bg-slate-900 border-slate-800'
                      }`}
                    >
                      <option value="Vegetables" className={true ? 'text-slate-900 bg-white' : 'text-white bg-slate-900'}>{t('vegetables')}</option>
                      <option value="Fruits" className={true ? 'text-slate-900 bg-white' : 'text-white bg-slate-900'}>{t('fruits')}</option>
                      <option value="Grains" className={true ? 'text-slate-900 bg-white' : 'text-white bg-slate-900'}>{t('grains')}</option>
                      <option value="Pulses" className={true ? 'text-slate-900 bg-white' : 'text-white bg-slate-900'}>{t('pulses')}</option>
                      <option value="Leafy vegetables" className={true ? 'text-slate-900 bg-white' : 'text-white bg-slate-900'}>{t('leafyVegetables')}</option>
                      <option value="Spices" className={true ? 'text-slate-900 bg-white' : 'text-white bg-slate-900'}>{t('spices')}</option>
                      <option value="Organic produce" className={true ? 'text-slate-900 bg-white' : 'text-white bg-slate-900'}>{t('organicProduce')}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-505 mb-1">{t('cropType')}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tomato"
                      value={newProductCrop}
                      onChange={(e) => setNewProductCrop(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-955/10 border border-slate-700/50 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-505 mb-1">{t('variety')}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Arka Rakshak"
                      value={newProductVariety}
                      onChange={(e) => setNewProductVariety(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-955/10 border border-slate-700/50 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-505 mb-1">Available Quantity *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 50"
                      value={newProductQty}
                      onChange={(e) => setNewProductQty(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-955/10 border border-slate-700/50 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-555 mb-1">Unit *</label>
                    <select
                      value={newProductUnit}
                      onChange={(e) => setNewProductUnit(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white text-slate-900 border border-slate-300 rounded-xl text-sm"
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="ton">ton</option>
                      <option value="piece">piece</option>
                      <option value="bunch">bunch</option>
                      <option value="bag">bag</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-505 mb-1">Price per {newProductUnit} (₹) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 40"
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-955/10 border border-slate-700/50 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {newProductQty && newProductPrice && (
                  <div className="p-3 bg-lime-500/10 border border-lime-500/20 text-lime-600 rounded-xl text-xs font-bold flex justify-between">
                    <span>Total Stock Value:</span>
                    <span>₹{(Number(newProductQty) * Number(newProductPrice)).toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-505 mb-1">Harvest Date</label>
                    <input
                      type="date"
                      value={newProductHarvest}
                      onChange={(e) => setNewProductHarvest(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-955/10 border border-slate-700/50 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-505 mb-1">Quality Grade</label>
                    <select
                      value={newProductQuality}
                      onChange={(e) => setNewProductQuality(e.target.value)}
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm ${
                        true
                          ? 'text-slate-900 bg-white border-slate-200'
                          : 'text-white bg-slate-900 border-slate-800'
                      }`}
                    >
                      <option value="Grade A" className={true ? 'text-slate-900 bg-white' : 'text-white bg-slate-900'}>Grade A Premium</option>
                      <option value="Grade B" className={true ? 'text-slate-900 bg-white' : 'text-white bg-slate-900'}>Grade B Standard</option>
                      <option value="Organic Premium" className={true ? 'text-slate-900 bg-white' : 'text-white bg-slate-900'}>Organic Certified</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-505 mb-1">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Provide details about harvest freshness, pesticide usage..."
                    value={newProductDesc}
                    onChange={(e) => setNewProductDesc(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-955/10 border border-slate-700/50 rounded-xl text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-505 mb-1">Product Image</label>
                  
                  {newProductImage ? (
                    <div className="relative border border-slate-200 rounded-2xl overflow-hidden group bg-slate-50 p-2 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-left">
                        <img 
                          src={newProductImage} 
                          alt="Product Preview" 
                          className="w-14 h-14 object-cover rounded-xl border border-slate-200" 
                        />
                        <div>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase tracking-wider block w-max">Uploaded</span>
                          <span className="text-xs text-slate-500 font-mono block truncate max-w-[200px] mt-1">{newProductImage}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewProductImage('')}
                        className="px-3 py-1.5 bg-red-50 text-red-600 font-bold rounded-xl text-xs hover:bg-red-500 hover:text-white transition-colors"
                        title="Remove Image"
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center bg-slate-50 hover:bg-slate-100/50 transition-colors relative">
                      {uploadingImage ? (
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs text-slate-500 font-bold animate-pulse">Uploading product image...</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-2xl">📸</div>
                          <div className="text-xs text-slate-500">
                            Upload a product photo from your device gallery or capture it live using your camera.
                          </div>
                          <div className="flex gap-3 justify-center pt-2">
                            <label className="px-4 py-2 bg-[#A8D5BA] text-[#34413A] hover:opacity-90 font-bold rounded-xl text-xs cursor-pointer transition-colors shadow-sm flex items-center gap-1">
                              📁 Upload Photo
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageFileChange(e, false)}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => startProductCamera(false)}
                              className="px-4 py-2 bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center gap-1"
                            >
                              📷 Take Photo
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fallback Paste Input (for versatility) */}
                  <input
                    type="url"
                    placeholder="Or paste an image URL (optional)"
                    value={newProductImage}
                    onChange={(e) => setNewProductImage(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-955/10 border border-slate-700/50 rounded-xl text-xs mt-3"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold rounded-xl text-sm"
                >
                  {t('listProductToMarketplace')}
                </button>
              </form>
            </div>
          </div>
        ) : activeTab === 'inventory' ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${textTitle}`}>{t('myProducts')}</h2>
              {farmerInventory.length > 0 && (
                <button
                  onClick={() => setActiveTab('products')}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 transition-colors"
                >
                  + {t('addProduct')}
                </button>
              )}
            </div>

            {farmerInventory.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/10 border border-slate-800 rounded-3xl p-8 max-w-2xl mx-auto flex flex-col items-center justify-center">
                <Store className="w-16 h-16 text-slate-655 mb-4 animate-bounce" />
                <h3 className={`text-xl font-bold mb-2 ${textTitle}`}>{t('noProductsAdded')}</h3>
                <p className="text-slate-400 text-xs mb-6 max-w-sm">{t('startSellingDirect')}</p>
                <button
                  onClick={() => setActiveTab('products')}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-colors"
                >
                  {t('addFirstProduct')}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 1. Summary Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`${cardClass} p-4 rounded-2xl flex flex-col justify-between border ${borderClass}`}>
                    <span className="text-xs text-slate-400">{t('totalProducts')}</span>
                    <span className={`text-2xl font-black mt-2 font-outfit ${textTitle}`}>{farmerInventory.length}</span>
                  </div>
                  <div className={`${cardClass} p-4 rounded-2xl flex flex-col justify-between border ${borderClass}`}>
                    <span className="text-xs text-slate-400">{t('available')}</span>
                    <span className="text-2xl font-black mt-2 text-emerald-505 font-outfit font-bold">
                      {farmerInventory.filter(p => p.status === 'AVAILABLE' || p.status === 'ACTIVE').length}
                    </span>
                  </div>
                  <div className={`${cardClass} p-4 rounded-2xl flex flex-col justify-between border ${borderClass}`}>
                    <span className="text-xs text-slate-400">{t('outOfStock')}</span>
                    <span className="text-2xl font-black mt-2 text-yellow-500 font-outfit font-bold">
                      {farmerInventory.filter(p => p.status === 'OUT OF STOCK' || p.quantity <= 0).length}
                    </span>
                  </div>
                  <div className={`${cardClass} p-4 rounded-2xl flex flex-col justify-between border ${borderClass}`}>
                    <span className="text-xs text-slate-400">{t('paused')}</span>
                    <span className="text-2xl font-black mt-2 text-slate-500 font-outfit font-bold">
                      {farmerInventory.filter(p => p.status === 'PAUSED').length}
                    </span>
                  </div>
                </div>

                {/* 2. Search & Filter Bar */}
                <div className={`${cardClass} p-4 rounded-2xl border ${borderClass} flex flex-col md:flex-row gap-4 justify-between items-center`}>
                  <div className="w-full md:w-1/3">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={farmerSearch}
                      onChange={(e) => setFarmerSearch(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-xl text-sm ${true ? 'text-slate-900 bg-white border-slate-200 font-medium' : 'text-white bg-slate-905 border-slate-800'}`}
                    />
                  </div>
                  <div className="w-full md:w-2/3 flex flex-wrap gap-2 justify-end">
                    <select
                      value={farmerCategoryFilter}
                      onChange={(e) => setFarmerCategoryFilter(e.target.value)}
                      className={`px-3 py-2 border rounded-xl text-xs focus:outline-none ${true ? 'text-slate-900 bg-white border-slate-200 font-medium' : 'text-white bg-slate-900 border-slate-800'}`}
                    >
                      <option value="">All Categories</option>
                      <option value="Vegetables">Vegetables</option>
                      <option value="Fruits">Fruits</option>
                      <option value="Grains">Grains</option>
                      <option value="Pulses">Pulses</option>
                      <option value="Leafy vegetables">Leafy vegetables</option>
                      <option value="Spices">Spices</option>
                      <option value="Organic produce">Organic produce</option>
                    </select>

                    <select
                      value={farmerStatusFilter}
                      onChange={(e) => setFarmerStatusFilter(e.target.value)}
                      className={`px-3 py-2 border rounded-xl text-xs focus:outline-none ${true ? 'text-slate-900 bg-white border-slate-200 font-medium' : 'text-white bg-slate-900 border-slate-800'}`}
                    >
                      <option value="">All Statuses</option>
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="OUT OF STOCK">OUT OF STOCK</option>
                      <option value="PAUSED">PAUSED</option>
                    </select>

                    <select
                      value={farmerSortFilter}
                      onChange={(e) => setFarmerSortFilter(e.target.value)}
                      className={`px-3 py-2 border rounded-xl text-xs focus:outline-none ${true ? 'text-slate-900 bg-white border-slate-200 font-medium' : 'text-white bg-slate-900 border-slate-800'}`}
                    >
                      <option value="recent">Recently Added</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                      <option value="qty_asc">Qty: Low to High</option>
                      <option value="qty_desc">Qty: High to Low</option>
                    </select>
                  </div>
                </div>

                {/* 3. Products Table */}
                {(() => {
                  const filtered = farmerInventory
                    .filter(p => {
                      const matchSearch = p.name.toLowerCase().includes(farmerSearch.toLowerCase()) || 
                                          p.crop.toLowerCase().includes(farmerSearch.toLowerCase());
                      const matchCategory = farmerCategoryFilter === '' || p.category === farmerCategoryFilter;
                      const matchStatus = farmerStatusFilter === '' || 
                                          (farmerStatusFilter === 'AVAILABLE' && (p.status === 'AVAILABLE' || p.status === 'ACTIVE')) ||
                                          (farmerStatusFilter === 'OUT OF STOCK' && p.status === 'OUT OF STOCK') ||
                                          (farmerStatusFilter === 'PAUSED' && p.status === 'PAUSED');
                      return matchSearch && matchCategory && matchStatus;
                    })
                    .sort((a, b) => {
                      if (farmerSortFilter === 'recent') {
                        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
                      }
                      if (farmerSortFilter === 'price_asc') return a.price - b.price;
                      if (farmerSortFilter === 'price_desc') return b.price - a.price;
                      if (farmerSortFilter === 'qty_asc') return a.quantity - b.quantity;
                      if (farmerSortFilter === 'qty_desc') return b.quantity - a.quantity;
                      return 0;
                    });

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-12 border border-dashed border-slate-800 rounded-3xl">
                        <p className="text-slate-500 text-sm">No products matches the filter criteria.</p>
                      </div>
                    );
                  }

                  return (
                    <div className={`${cardClass} rounded-3xl overflow-hidden border ${borderClass}`}>
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-950/20 border-b border-slate-800 text-xs text-slate-500 font-bold uppercase tracking-wider">
                            <th className="p-4">Product</th>
                            <th className="p-4">Crop & Variety</th>
                            <th className="p-4">Listed Qty</th>
                            <th className="p-4">Unit Price</th>
                            <th className="p-4">Availability</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((p) => {
                            const dateAdded = p.created_at ? new Date(p.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently';
                            const harvestDateFormatted = p.harvest_date ? new Date(p.harvest_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown';
                            return (
                              <tr key={p.id} className="border-b border-slate-800/60 hover:bg-slate-950/40 text-sm">
                                <td className="p-4 font-bold flex items-center gap-2">
                                  <img
                                    src={getProductImage(p.name, p.crop, p.image_url)}
                                    alt={p.name}
                                    className="w-10 h-10 rounded-lg object-cover"
                                  />
                                  <div>
                                    <span className={true ? 'text-slate-900 font-bold block text-sm' : 'text-white font-bold block text-sm'}>{p.name}</span>
                                    <span className="block text-[10px] text-slate-500 font-normal mt-0.5">Added: {dateAdded} &bull; Harvested: {harvestDateFormatted}</span>
                                  </div>
                                </td>
                                <td className="p-4">{p.crop} &bull; {p.variety}</td>
                                <td className="p-4">{p.quantity} {p.unit}</td>
                                <td className="p-4 font-bold text-emerald-505">₹{p.price}/{p.unit}</td>
                                <td className="p-4">
                                  <select
                                    value={p.status === 'ACTIVE' ? 'AVAILABLE' : p.status}
                                    onChange={async (e) => {
                                      const newStatus = e.target.value;
                                      const res = await updateMarketplaceProduct(p.id, { status: newStatus });
                                      if (res?.success) {
                                        alert('Product status updated successfully.');
                                        loadFarmerInventory();
                                      } else {
                                        alert('Failed to update status.');
                                      }
                                    }}
                                    className={`px-3 py-1.5 border rounded-xl text-xs font-bold focus:outline-none ${
                                      true
                                        ? 'text-slate-900 bg-white border-slate-200'
                                        : 'text-white bg-slate-900 border-slate-800'
                                    }`}
                                  >
                                    <option value="AVAILABLE">AVAILABLE</option>
                                    <option value="OUT OF STOCK">OUT OF STOCK</option>
                                    <option value="PAUSED">PAUSED</option>
                                  </select>
                                </td>
                                <td className="p-4 text-right space-x-1.5">
                                  <button
                                    onClick={() => handleEditClick(p)}
                                    className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded text-xs font-semibold"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleUpdateProductQty(p.id, p.quantity)}
                                    className="px-2.5 py-1 bg-slate-955/10 hover:bg-slate-955/20 rounded border border-slate-700/50 text-xs"
                                  >
                                    Update Qty
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(p.id)}
                                    className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 rounded border border-red-500/20 text-xs text-red-400"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        ) : activeTab === 'deliveries' ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${textTitle}`}>Fulfillment & Deliveries</h2>
              {assigningOrder && (
                <button
                  onClick={() => setAssigningOrder(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                >
                  &larr; Back to Tracking
                </button>
              )}
            </div>

            {assigningOrder ? (
              <div className="space-y-8 text-left">
                {/* Info summary */}
                <div className="bg-[#FFF8E7] border border-[#FFD6BA]/40 rounded-3xl p-5 text-xs text-[#34413A] font-medium">
                  <h3 className="font-bold text-sm mb-1 text-[#34413A]">Assigning Order: #{assigningOrder.id}</h3>
                  <p className="text-slate-500 mb-2">Buyer: <strong>{assigningOrder.shipping_name}</strong> &bull; Destination: <strong>{assigningOrder.shipping_address}</strong></p>
                  <p className="text-slate-500">Produce: <strong>{assigningOrder.items?.[0]?.product_name || 'Vegetables'} &times; {assigningOrder.items?.[0]?.quantity || 1}</strong></p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left: Available Delivery Partners */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold font-outfit text-[#34413A]">Available Delivery Persons</h3>
                    {deliveryPartners.length === 0 ? (
                      <div className="p-8 text-center bg-white border border-[#DFF2E1] rounded-3xl text-xs text-slate-500">
                        No delivery persons added yet.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {deliveryPartners.map((p) => {
                          const isAvailable = p.status === 'Available' || p.status === 'ACTIVE';
                          const isBusy = p.status === 'Busy';
                          return (
                            <div key={p.id} className="bg-white border border-[#DFF2E1] rounded-3xl p-5 hover:shadow-sm transition-all flex justify-between items-center gap-4">
                              <div>
                                <h4 className="font-bold text-sm text-[#34413A]">{p.name}</h4>
                                <p className="text-xs text-slate-505 font-mono mt-0.5">{p.phone_number || 'No Phone'}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase">
                                    🚗 {p.vehicle_type || 'Bike'}
                                  </span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                    isAvailable ? 'bg-green-100 text-green-700 border border-green-200' :
                                    isBusy ? 'bg-blue-100 text-blue-750' : 'bg-red-100 text-red-700 border border-red-200'
                                  }`}>
                                    {p.status}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  if (p.status === 'Not Available') {
                                    alert("This delivery person is currently not available.");
                                  } else {
                                    handleAssignPartner(p.id);
                                  }
                                }}
                                className={`px-4 py-2 font-bold rounded-xl text-xs transition-colors ${
                                  isAvailable ? 'bg-[#A8D5BA] text-[#34413A] hover:bg-[#A8D5BA]/85' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                Assign Partner
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right: Manual Entry Form */}
                  <div className="bg-white border border-[#DFF2E1] rounded-3xl p-6 space-y-4">
                    <h3 className="text-lg font-bold font-outfit text-[#34413A]">Manual Delivery Entry</h3>
                    <p className="text-xs text-slate-500 font-medium">If your preferred driver is not in the list, enter details manually to assign them and generate their account credentials.</p>
                    
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-505 mb-1">Driver Name *</label>
                        <input
                          type="text"
                          required
                          value={manualDriverName}
                          onChange={(e) => setManualDriverName(e.target.value)}
                          placeholder="e.g. Ramesh Kumar"
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-505 mb-1">Driver Phone Number *</label>
                        <input
                          type="tel"
                          required
                          value={manualDriverPhone}
                          onChange={(e) => setManualDriverPhone(e.target.value)}
                          placeholder="e.g. 9876543210"
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-505 mb-1">Vehicle Type *</label>
                        <select
                          value={manualDriverVehicle}
                          onChange={(e) => setManualDriverVehicle(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none text-slate-805 bg-white font-medium"
                        >
                          <option value="Bike">Bike</option>
                          <option value="Auto">Auto</option>
                          <option value="Mini Truck">Mini Truck</option>
                          <option value="Van">Van</option>
                          <option value="Tractor">Tractor</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-505 mb-1">Pickup Location</label>
                        <input
                          type="text"
                          value={manualPickupLocation}
                          onChange={(e) => setManualPickupLocation(e.target.value)}
                          placeholder="e.g. Coimbatore Green Valley Farm"
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-505 mb-1">Delivery Location</label>
                        <input
                          type="text"
                          value={manualDeliveryLocation}
                          onChange={(e) => setManualDeliveryLocation(e.target.value)}
                          placeholder="e.g. Chennai Destination"
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-505 mb-1">Special Notes</label>
                        <textarea
                          rows={2}
                          value={manualNotes}
                          onChange={(e) => setManualNotes(e.target.value)}
                          placeholder="Instructions like 'fragile crop packets'..."
                          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 font-medium resize-none"
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleManualAssign}
                          className="w-full py-3 bg-[#A8D5BA] hover:bg-[#A8D5BA]/90 text-[#34413A] font-bold rounded-xl text-xs transition-colors"
                        >
                          Assign Delivery
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Standard runs tracking */
              <div className="space-y-6">
                <div className="bg-[#DFF2E1]/20 border border-[#A8D5BA]/25 rounded-3xl p-5 text-xs text-[#34413A] font-medium flex justify-between items-center gap-4">
                  <div>
                    <span className="font-bold text-sm block text-[#34413A] mb-0.5">Need to ship a new order?</span>
                    <span className="text-slate-500">Go to your Orders tab and click "Assign Delivery Person" on any accepted order to dispatch.</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="px-3.5 py-2 bg-[#DFF2E1] hover:bg-[#A8D5BA] text-[#34413A] font-bold rounded-xl transition-colors shrink-0"
                  >
                    Open Orders
                  </button>
                </div>

                {(() => {
                  const deliveryOrders = farmerOrders.filter(o => o.delivery_partner_id);

                  if (deliveryOrders.length === 0) {
                    return (
                      <div className="text-center py-16 border border-[#DFF2E1] rounded-3xl bg-[#FFF8E7]/30 flex flex-col items-center justify-center">
                        <Truck className="w-14 h-14 text-slate-400 mb-4 animate-bounce" />
                        <h4 className="text-base font-bold text-[#34413A]">No delivery assignments yet.</h4>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      <h3 className="text-lg font-bold font-outfit text-[#34413A]">Assigned Deliveries</h3>
                      <div className={`${cardClass} rounded-3xl overflow-hidden border ${borderClass} shadow-sm`}>
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-505 font-bold uppercase tracking-wider">
                              <th className="p-4">Order ID</th>
                              <th className="p-4">Customer</th>
                              <th className="p-4">Courier</th>
                              <th className="p-4">Fulfillment Status</th>
                              <th className="p-4">Distance & ETA</th>
                              <th className="p-4 text-right">Live Map</th>
                            </tr>
                          </thead>
                          <tbody>
                            {deliveryOrders.map((o) => {
                              return (
                                <tr key={o.id} className="border-b border-slate-100/60 hover:bg-slate-50/50 text-xs text-slate-600 font-medium">
                                  <td className="p-4 font-mono font-bold text-slate-800">{o.id}</td>
                                  <td className="p-4">{o.shipping_name}</td>
                                  <td className="p-4 font-semibold text-[#34413A]">
                                    {o.delivery_partner_name || 'Arun (Bike)'}
                                  </td>
                                  <td className="p-4">
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${
                                      o.status === 'DELIVERED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                                    }`}>
                                      {o.status}
                                    </span>
                                  </td>
                                  <td className="p-4 text-slate-500">
                                    {o.remaining_distance_km !== null ? `${o.remaining_distance_km} km` : '8.5 km'} &bull; {o.estimated_arrival_minutes !== null ? `${o.estimated_arrival_minutes} mins` : '15 mins'}
                                  </td>
                                  <td className="p-4 text-right">
                                    <button
                                      onClick={async () => {
                                        const trackInfo = await fetchOrderTracking(o.id);
                                        setTrackingOrder(o);
                                        setLiveTrackingInfo(trackInfo);
                                      }}
                                      className="px-3.5 py-1.5 bg-[#C6DDF5]/40 hover:bg-[#C6DDF5] text-[#34413A] font-bold rounded-xl text-[10px] transition-colors"
                                    >
                                      VIEW ON MAP
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        ) : activeTab === 'notifications' ? (
          <div>
            <h2 className={`text-2xl font-bold mb-6 ${textTitle}`}>Farmer Notifications</h2>
            <div className="space-y-4 max-w-2xl">
              {alerts.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/10 border border-slate-900 rounded-3xl">
                  <Bell className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-400 text-sm">No notifications yet.</p>
                </div>
              ) : (
                alerts.map((a) => (
                  <div key={a.id} className={`${cardClass} p-5 rounded-2xl border-l-4 border-l-emerald-500 flex justify-between items-start gap-4 shadow-sm`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{a.type}</span>
                        <span className="text-[10px] text-slate-500">&bull; {a.severity}</span>
                      </div>
                      <h4 className={`font-bold text-sm ${textTitle}`}>{a.title}</h4>
                      <p className="text-xs text-slate-450 leading-relaxed">{a.message}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">Just Now</span>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : activeTab === 'profile' ? (
          <div>
            <h2 className={`text-2xl font-bold mb-6 ${textTitle}`}>Profile Page</h2>
            <div className={`${cardClass} max-w-md p-6 rounded-3xl border ${borderClass} space-y-6`}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-3xl font-bold font-outfit uppercase">
                  {user?.name?.[0] || 'F'}
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${textTitle}`}>{user?.name || 'Demo Farmer'}</h3>
                  <span className="text-xs text-slate-400">Registered Farm Owner</span>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Email Address:</span>
                  <span className={`font-semibold ${textTitle}`}>{user?.email || 'demo@agrimind.ai'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Role Status:</span>
                  <span className="font-bold text-emerald-500 uppercase">FARMER</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Farm Region:</span>
                  <span className={`font-semibold ${textTitle}`}>Coimbatore, Tamil Nadu</span>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'soil-analysis' ? (
          <div>
            <div className="mb-8">
              <h2 className={`text-2xl font-bold ${textTitle}`}>Soil Quality Assessment</h2>
              <p className="text-slate-500 text-sm mt-1">
                Enter your farm's laboratory soil parameters to evaluate health conditions and see suitability percentages.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Inputs Form */}
              <div className={`lg:col-span-1 ${cardClass} p-6 h-fit`}>
                <h3 className="text-base font-bold font-outfit mb-4 border-b border-[#DFF2E1] pb-2">Soil Parameters Form</h3>
                
                <form onSubmit={handleAdvisorSoilSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1 font-outfit">pH Level</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={soilPh}
                        onChange={(e) => setSoilPh(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#BFD8C2] rounded-xl text-sm focus:border-[#A8D5BA] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1 font-outfit font-medium">Organic Carbon (%)</label>
                      <input
                        type="number"
                        step="0.05"
                        required
                        value={soilCarbon}
                        onChange={(e) => setSoilCarbon(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#BFD8C2] rounded-xl text-sm focus:border-[#A8D5BA] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1 font-outfit">Nitrogen (N)</label>
                      <select
                        value={soilN}
                        onChange={(e) => setSoilN(e.target.value)}
                        className="w-full px-2 py-2 bg-white border border-[#BFD8C2] rounded-xl text-xs focus:border-[#A8D5BA] focus:outline-none"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1 font-outfit">Phosphorus (P)</label>
                      <select
                        value={soilP}
                        onChange={(e) => setSoilP(e.target.value)}
                        className="w-full px-2 py-2 bg-white border border-[#BFD8C2] rounded-xl text-xs focus:border-[#A8D5BA] focus:outline-none"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1 font-outfit font-medium font-semibold">Potassium (K)</label>
                      <select
                        value={soilK}
                        onChange={(e) => setSoilK(e.target.value)}
                        className="w-full px-2 py-2 bg-white border border-[#BFD8C2] rounded-xl text-xs focus:border-[#A8D5BA] focus:outline-none"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1 font-outfit">Soil Type</label>
                      <select
                        value={soilTypeInput}
                        onChange={(e) => setSoilTypeInput(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#BFD8C2] rounded-xl text-sm focus:border-[#A8D5BA] focus:outline-none"
                      >
                        <option value="Clay Loam">Clay Loam</option>
                        <option value="Sandy Loam">Sandy Loam</option>
                        <option value="Silt">Silt</option>
                        <option value="Peat">Peat</option>
                        <option value="Sandy">Sandy</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1 font-outfit">Moisture Level</label>
                      <select
                        value={soilMoisture}
                        onChange={(e) => setSoilMoisture(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#BFD8C2] rounded-xl text-sm focus:border-[#A8D5BA] focus:outline-none"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="Good">Good/Adequate</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#A8D5BA] text-[#34413A] hover:bg-[#A8D5BA]/85 font-bold rounded-xl text-sm transition-all"
                  >
                    ANALYZE SOIL
                  </button>
                </form>
              </div>

              {/* Assessment results */}
              <div className="lg:col-span-2 space-y-6">
                {advisorResults.length === 0 ? (
                  <div className="text-center py-20 border border-[#DFF2E1] rounded-3xl bg-[#FFF8E7]/30 flex flex-col items-center justify-center">
                    <Sprout className="w-12 h-12 text-[#6B756E] mb-4 animate-bounce" />
                    <h3 className="text-lg font-bold text-[#34413A]">Ready for Diagnostics</h3>
                    <p className="text-xs text-[#6B756E] mt-1 max-w-xs leading-normal">
                      Submit parameters to calculate soil condition, suitable crops, and specific recommendations.
                    </p>
                  </div>
                ) : (
                  <div className={`${cardClass} p-6`}>
                    <h3 className="text-lg font-bold font-outfit mb-6 border-b border-[#DFF2E1] pb-3 text-[#34413A]">Assessment Diagnostics</h3>
                    
                    <div className="p-4 bg-[#DFF2E1]/45 rounded-2xl border border-[#BFD8C2]/30 mb-6 text-left">
                      <span className="text-[10px] font-bold text-[#A8D5BA] uppercase tracking-wider block mb-1">Soil Analysis Summary</span>
                      <p className="text-sm font-semibold text-[#34413A]">Soil Condition: pH {soilPh} is optimal. {soilN} Nitrogen, {soilP} Phosphorus, and {soilK} Potassium levels suggest favorable growing parameters.</p>
                      <p className="text-xs text-[#6B756E] mt-1">Suitable crop recommendations lists are generated below.</p>
                    </div>

                    <div className="space-y-4">
                      {advisorResults.map((r) => {
                        return (
                          <div key={r.cropName} className={`${innerBoxClass} p-4 rounded-xl border border-[#BFD8C2]/30 flex justify-between items-center`}>
                            <div className="text-left">
                              <h4 className="font-bold text-base font-outfit text-[#34413A] flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#A8D5BA]" />
                                {r.cropName}
                              </h4>
                              <p className="text-xs text-[#6B756E] mt-1 text-left">**Reason**: {r.reason}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-xl font-black font-outfit text-[#34413A]">
                                {r.suitabilityScore}%
                              </span>
                              <span className="text-[10px] text-[#6B756E] block font-semibold">Suitable</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'crop-recommendations' ? (
          <div>
            <div className="mb-6 text-left">
              <h2 className={`text-2xl font-bold ${textTitle}`}>Crop Recommendations</h2>
              <p className="text-slate-500 text-sm mt-1">
                Displaying suitable crop species, farming suggestions, and nutrient management tips based on your latest soil diagnostics.
              </p>
            </div>

            {advisorResults.length === 0 ? (
              <div className="text-center py-20 border border-[#DFF2E1] rounded-3xl bg-[#FFF8E7]/30 flex flex-col items-center justify-center max-w-2xl mx-auto">
                <Sprout className="w-12 h-12 text-[#6B756E] mb-4" />
                <h3 className="text-lg font-bold text-[#34413A]">No Recommendations Available</h3>
                <p className="text-xs text-[#6B756E] mt-1 max-w-sm">
                  Please perform a Soil Analysis first to calculate crop suitabilities.
                </p>
                <button
                  onClick={() => setActiveTab('soil-analysis')}
                  className="mt-6 px-6 py-2.5 bg-[#A8D5BA] text-[#34413A] font-bold rounded-xl text-xs hover:opacity-90 transition-all"
                >
                  Go to Soil Analysis
                </button>
              </div>
            ) : (
              <div className="space-y-6 max-w-4xl">
                {advisorResults.map((r) => (
                  <div key={r.cropName} className={`${cardClass} p-6 border-l-8 border-l-[#A8D5BA]`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-left">
                        <h3 className="text-xl font-bold font-outfit text-[#34413A]">{r.cropName} Recommendations</h3>
                        <span className="text-xs text-[#6B756E] block mt-0.5">Primary Category: Grain/Produce</span>
                      </div>
                      <div className="px-3.5 py-1.5 bg-[#DFF2E1] border border-[#BFD8C2] rounded-xl text-right font-medium">
                        <span className="text-lg font-black text-[#34413A] font-outfit block">{r.suitabilityScore}%</span>
                        <span className="text-[9px] text-[#6B756E] block font-bold uppercase tracking-wider">Suitability</span>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm text-left">
                      <div className="p-3 bg-[#FFF8E7] rounded-xl border border-[#BFD8C2]/20">
                        <strong className="text-xs text-[#34413A] uppercase tracking-wider block mb-1">Reason for rating</strong>
                        <p className="text-xs text-[#6B756E]">{r.reason}</p>
                      </div>

                      <div className="p-3 bg-[#FAFCF8] rounded-xl border border-[#DFF2E1]">
                        <strong className="text-xs text-[#34413A] uppercase tracking-wider block mb-1">Farming suggestions</strong>
                        <ul className="list-disc pl-4 text-xs text-[#6B756E] space-y-1 mt-1">
                          <li>Maintain optimal soil pH between 6.0 and 7.0 for optimal nutrient uptake.</li>
                          <li>Apply nitrogen-rich organic compost to boost growth stage yield.</li>
                          <li>Monitor irrigation runs to sustain appropriate moisture level limits.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'plant-health' ? (
          <div>
            {renderPlantHealthDetection()}
          </div>
        ) : activeTab === 'orders' ? (
          <div>
            <h2 className={`text-2xl font-bold mb-6 ${textTitle}`}>Direct Customer Orders</h2>
            {farmerOrders.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/10 border border-slate-900 rounded-3xl">
                <ShoppingBag className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400 text-sm">No orders yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {farmerOrders.map((o) => (
                  <div key={o.id} className={`${cardClass} rounded-2xl p-6`}>
                    <div className={`flex flex-col md:flex-row justify-between items-start md:items-center border-b ${borderClass} pb-4 mb-4 gap-2`}>
                      <div>
                        <span className="text-xs font-mono text-slate-500">ORDER ID: {o.id}</span>
                        <h3 className={`text-lg mt-0.5 ${textTitle}`}>
                          Buyer: {o.shipping_name} ({o.shipping_phone})
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">📍 Address: {o.shipping_address}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400">Fulfillment Status: </span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border uppercase tracking-wider ${o.status === 'CANCELLED' ? 'text-red-405 bg-red-500/10 border-red-500/20' : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'}`}>
                          {o.status === 'CANCELLED' ? '❌ CANCELLED' : o.status}
                        </span>
                        <div className="text-xl font-bold mt-1">₹{o.total_amount}</div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6">
                      {o.items?.map((item: any) => (
                        <div key={item.id} className={`flex justify-between text-sm ${textBody}`}>
                          <span>{item.product_name}</span>
                          <span className="text-xs text-slate-405 font-medium">
                            {item.quantity} {item.unit} &times; ₹{item.price} = <strong className="text-slate-805 font-bold text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</strong>
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Deadline and OTP status details for farmer */}
                    {o.status !== 'PENDING' && o.status !== 'COMPLETED' && o.status !== 'CANCELLED' && o.status !== 'DELIVERY_FAILED' && (
                      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {o.delivery_deadline && (
                          <div className="p-3 bg-slate-950/20 border border-slate-700/20 rounded-xl flex items-center justify-between">
                            <span className="text-slate-400">Delivery Deadline:</span>
                            <span className={`font-bold font-mono px-2 py-0.5 rounded ${new Date(o.delivery_deadline).getTime() - Date.now() < 3 * 3600 * 1000 ? 'text-red-500 bg-red-500/10' : 'text-orange-400 bg-orange-500/10'}`}>
                              {(() => {
                                const diff = new Date(o.delivery_deadline).getTime() - Date.now();
                                if (diff > 0) {
                                  const hrs = Math.floor(diff / (3600 * 1000));
                                  const mins = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
                                  return `${hrs}h ${mins}m remaining`;
                                }
                                return 'Expired (Delivery Failed)';
                              })()}
                            </span>
                          </div>
                        )}
                        <div className="p-3 bg-slate-950/20 border border-slate-700/20 rounded-xl flex items-center justify-between">
                          <span className="text-slate-400">Payment Escrow:</span>
                          <span className="text-emerald-500 font-bold font-mono">Vault HELD</span>
                        </div>
                      </div>
                    )}

                    {/* Order action triggers */}
                    <div className={`border-t ${borderClass} pt-4 flex flex-wrap gap-2`}>
                      {(o.status === 'PLACED' || o.status === 'PENDING') && (
                        <>
                          <button
                            onClick={async () => {
                              if (user?.is_restricted || (user?.reliability_score !== undefined && user?.reliability_score < 50)) {
                                alert(`Order Acceptance Blocked!\n\nReason: Your account is restricted or your reliability score (${user?.reliability_score}/100) is below the minimum threshold of 50.\n\nPlease contact AgriConnect administration to resolve this issue.`);
                                return;
                              }
                              const res = await acceptOrder(o.id);
                              if (res?.success) {
                                alert('Order accepted! Secure delivery OTP generated.');
                                loadFarmerOrders();
                              } else {
                                alert(res?.error || 'Failed to accept order.');
                              }
                            }}
                            className="px-4 py-2 bg-emerald-500 text-slate-955 font-bold rounded-xl text-xs hover:bg-emerald-400 transition-colors"
                          >
                            Accept Order
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm("Reject this order? Reserved stock will be released back to inventory.")) {
                                const res = await cancelOrder(o.id, 'Farmer rejected order');
                                if (res?.success) {
                                  alert('Order rejected and stock released.');
                                  loadFarmerOrders();
                                  loadFarmerInventory();
                                }
                              }
                            }}
                            className="px-4 py-2 bg-slate-950/10 border border-slate-700/50 text-slate-500 hover:text-red-400 rounded-xl text-xs transition-colors"
                          >
                            Reject Order
                          </button>
                        </>
                      )}
                      {(o.status === 'ACCEPTED' || o.status === 'DELIVERY_ASSIGNED') && (
                        <button
                          onClick={() => {
                            setAssigningOrder(o);
                            setManualPickupLocation(farm?.location || 'Coimbatore, TN');
                            setManualDeliveryLocation(o.shipping_address);
                            setActiveTab('deliveries');
                          }}
                          className="px-4 py-2 bg-blue-500 text-white font-bold rounded-xl text-xs hover:bg-blue-400 transition-colors"
                        >
                          Assign Delivery Person
                        </button>
                      )}
                      {o.status === 'ARRIVED' && (
                        <button
                          onClick={() => setOtpInputOrder(o)}
                          className="px-4 py-2 bg-emerald-500 text-slate-955 font-bold rounded-xl text-xs hover:bg-emerald-400 transition-colors"
                        >
                          🟢 Confirm Delivery (Verify OTP)
                        </button>
                      )}
                    </div>

                    {o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && (
                      <div className="mt-4 flex flex-wrap gap-2 w-full pt-3 border-t border-slate-800/40">
                        {!o.delivery_partner_id && (
                          <div className="flex items-center gap-3 p-2 bg-slate-950/20 border border-slate-800 rounded-xl w-full max-w-md">
                            <span className="text-xs text-slate-400 whitespace-nowrap">Select Agent:</span>
                            <select
                              value={selectedPartners[o.id] || ''}
                              onChange={(e) => setSelectedPartners(prev => ({ ...prev, [o.id]: e.target.value }))}
                              className="px-2 py-1.5 bg-slate-900 border border-slate-700/50 rounded-lg text-xs focus:outline-none flex-1 text-white"
                            >
                              <option value="">-- Choose Arun / Kumar --</option>
                              {deliveryPartners.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.vehicle_type} - {p.status})</option>
                              ))}
                            </select>
                            <button
                              onClick={async () => {
                                const pid = selectedPartners[o.id];
                                if (!pid) return alert('Select a delivery agent first.');
                                const r = await assignDeliveryPartner(o.id, pid);
                                if (r?.success) {
                                  alert('Delivery partner assigned!');
                                  loadFarmerOrders();
                                }
                              }}
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-955 font-bold rounded-lg text-xs"
                            >
                              Assign Agent
                            </button>
                          </div>
                        )}

                        {o.delivery_partner_id && (
                          <div className="p-3 bg-slate-950/20 border border-slate-800 rounded-2xl w-full flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-850 border border-slate-800 overflow-hidden flex items-center justify-center">
                                {o.delivery_partner_avatar ? (
                                  <img src={o.delivery_partner_avatar} alt="Agent" className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-5 h-5 text-slate-500" />
                                )}
                              </div>
                              <div>
                                <span className="text-xs text-slate-500 block">Assigned Partner:</span>
                                <span className="text-sm font-bold text-white">{o.delivery_partner_name || 'Arun'} ({o.delivery_vehicle || 'Bike'})</span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => startTrackingPolling(o)}
                                className="px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 rounded-xl text-xs font-semibold flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" /> View Live Tracking
                              </button>
                              
                              {o.status !== 'DELIVERED' && (
                                <button
                                  onClick={async () => {
                                    const dlvId = `dlv_${o.id}`;
                                    const res = await simulateDelivery(dlvId);
                                    if (res?.success) {
                                      alert('Delivery simulation triggered! Polling started.');
                                      startTrackingPolling(o);
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold flex items-center gap-1"
                                >
                                  <Sparkles className="w-3.5 h-3.5" /> Simulate Delivery
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {o.status === 'CANCELLED' && (
                      <div className="mt-4 p-4 bg-red-500/5 border border-red-500/25 rounded-2xl flex flex-col gap-1 text-xs text-left">
                        <div className="flex items-center gap-1.5 font-bold text-red-400">
                          <span>❌ CANCELLED</span>
                        </div>
                        <div className="text-slate-450 mt-1">
                          Cancelled by: <span className="font-semibold text-slate-300">{o.cancelled_by || 'Customer'}</span>
                        </div>
                        {o.cancelled_at && (
                          <div className="text-slate-455">
                            Cancelled at: <span className="font-semibold text-slate-300">{new Date(o.cancelled_at).toLocaleString()}</span>
                          </div>
                        )}
                        {o.cancellation_reason && (
                          <div className="text-slate-455 font-medium">
                            Reason: <span className="text-slate-350">{o.cancellation_reason}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Settings & Webhooks */}
            <h2 className={`text-2xl font-bold mb-6 ${textTitle}`}>Settings & Webhooks</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Webhooks config */}
              <div className={`${cardClass} rounded-3xl p-6`}>
                <h3 className="text-lg font-bold font-outfit mb-2 flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-500" /> n8n Automation Engine Webhooks
                </h3>
                <p className="text-slate-400 text-xs mb-6 font-light">
                  Set headers for automated weather feeds, daily briefs and telemetry syncs.
                </p>

                <div className="space-y-4 text-xs">
                  <div className={`${innerBoxClass} p-3 rounded-xl`}>
                    <span className="text-slate-500 block">Webhook URI:</span>
                    <span className="font-mono">POST /api/n8n/webhook</span>
                  </div>
                  <div className={`${innerBoxClass} p-3 rounded-xl`}>
                    <span className="text-slate-500 block">Required Header Name:</span>
                    <span className="font-mono text-emerald-555 font-bold">x-n8n-secret</span>
                  </div>
                  <div className={`${innerBoxClass} p-3 rounded-xl`}>
                    <span className="text-slate-505 block">Required Header Value:</span>
                    <span className="font-mono">n8n-webhook-passkey</span>
                  </div>
                </div>
              </div>

              {/* Demo reset/trigger panel */}
              <div className={`${cardClass} rounded-3xl p-6`}>
                <h3 className="text-lg font-bold font-outfit mb-2 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-red-500" /> Platform Demo Sequence Control
                </h3>
                <p className="text-slate-450 text-xs mb-6 font-light">
                  Use this controller to reset databases or run presentation simulation scenarios.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={async () => { await triggerDemo('smart-farm'); alert('Rain override demo successfully run!'); }}
                    className="w-full py-3 bg-slate-950/10 border border-slate-700/50 text-emerald-555 hover:border-emerald-500 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    <Sparkles className="w-4 h-4" /> Trigger Smart Farm Rain Override Demo
                  </button>
                  <button
                    onClick={resetAllDemoData}
                    className="w-full py-3 bg-red-550 hover:bg-red-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    Reset System Databases
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Live Tracking Modal Panel */}
        {trackingOrder && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
            <div className={`${cardClass} w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[90vh] md:h-[80vh]`}>
              
              {/* Left Side: Mock Map Container */}
              <div className="flex-1 bg-slate-900 border-r border-slate-800 relative flex flex-col justify-between overflow-hidden min-h-[300px] md:min-h-0">
                <div className="flex-1 w-full h-full relative">
                  <GoogleMapComponent
                    pickup={{ lat: 10.9970, lng: 76.9616, name: trackingOrder.farm_name || 'Green Valley Farm' }}
                    customer={{ lat: trackingOrder.latitude || 11.0168, lng: trackingOrder.longitude || 76.9558, name: trackingOrder.shipping_name || 'Customer' }}
                    delivery={liveTrackingInfo?.latestLocation ? { lat: liveTrackingInfo.latestLocation.latitude, lng: liveTrackingInfo.latestLocation.longitude, name: 'Arun' } : { lat: 10.9970, lng: 76.9616, name: 'Arun' }}
                  />
                </div>
              </div>

              {/* Right Side: Tracking Details & Timeline */}
              <div className="w-full md:w-[400px] p-6 flex flex-col justify-between overflow-y-auto h-full">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <span className="text-[10px] text-slate-500 font-mono tracking-wider block">ORDER ID: {trackingOrder.id}</span>
                      <h3 className={`text-xl font-bold font-outfit ${textTitle}`}>Track Your Order</h3>
                    </div>
                    <button
                      onClick={stopTrackingPolling}
                      className="text-slate-450 hover:text-red-400 text-sm font-semibold"
                    >
                      Close Tracker
                    </button>
                  </div>

                  {/* Proximity Alert Banner */}
                  {liveTrackingInfo?.delivery?.remaining_distance_km !== undefined && 
                   liveTrackingInfo?.delivery?.remaining_distance_km !== null && 
                   liveTrackingInfo.delivery.remaining_distance_km <= 0.5 && 
                   liveTrackingInfo.delivery.remaining_distance_km > 0 && (
                    <div className="bg-gradient-to-r from-red-600/35 to-rose-600/20 border border-red-500/30 p-4 rounded-2xl mb-6 pulse-green">
                      <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5 font-outfit">
                        <AlertTriangle className="w-4 h-4 text-red-500" /> YOUR ORDER IS NEARBY!
                      </h4>
                      <p className="text-[11px] text-slate-250 mt-1 leading-relaxed">
                        The delivery agent is approximately **{Math.round(liveTrackingInfo.delivery.remaining_distance_km * 1000)} meters** away. Please keep your phone handy!
                      </p>
                    </div>
                  )}

                  {/* Live Status Indicators */}
                  <div className={`${innerBoxClass} p-4 rounded-2xl space-y-3 mb-6`}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-700 bg-slate-850 flex items-center justify-center">
                        <img 
                          src={liveTrackingInfo?.delivery?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150"} 
                          alt="Avatar" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">DELIVERY PARTNER:</span>
                        <h4 className="text-sm font-bold text-white">{liveTrackingInfo?.delivery?.partner_name || 'Arun'}</h4>
                        <span className="text-[10px] text-slate-455 block">{liveTrackingInfo?.delivery?.vehicle_type} &bull; {liveTrackingInfo?.delivery?.vehicle_number}</span>
                        <span className="mt-1.5 inline-block text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/35 px-2 py-0.5 rounded-lg font-bold font-mono">
                          {(() => {
                            const status = liveTrackingInfo?.delivery?.status || 'ASSIGNED';
                            if (status === 'ASSIGNED') return 'Delivery person assigned';
                            if (status === 'ACCEPTED') return 'Delivery accepted - Preparing';
                            if (status === 'GOING_TO_PICKUP') return 'Courier heading to pickup';
                            if (status === 'PICKED_UP') return 'Order picked up at farm';
                            if (status === 'OUT_FOR_DELIVERY') return 'Courier is on the way to you';
                            if (status === 'ARRIVED') return 'Courier has arrived';
                            if (status === 'DELIVERED') return 'Order successfully completed';
                            return status;
                          })()}
                        </span>
                      </div>
                    </div>

                    <div className={`grid grid-cols-2 gap-4 border-t ${borderClass} pt-3 text-xs`}>
                      <div>
                        <span className="text-slate-500 block">Distance Remaining:</span>
                        <span className="text-sm font-bold text-white font-outfit">
                          {liveTrackingInfo?.delivery?.remaining_distance_km !== undefined && liveTrackingInfo?.delivery?.remaining_distance_km !== null 
                            ? `${liveTrackingInfo.delivery.remaining_distance_km} km` 
                            : '8.5 km'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Estimated ETA:</span>
                        <span className="text-sm font-bold text-emerald-400 font-outfit">
                          {liveTrackingInfo?.delivery?.estimated_arrival_minutes !== undefined && liveTrackingInfo?.delivery?.estimated_arrival_minutes !== null 
                            ? `${liveTrackingInfo.delivery.estimated_arrival_minutes} mins` 
                            : '15 mins'} (LIVE ETA)
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 border-t border-slate-800/40 pt-2 flex justify-between">
                      <span>Last Updated:</span>
                      <span className="font-mono text-emerald-500">
                        {liveTrackingInfo?.lastUpdated 
                          ? `${new Date(liveTrackingInfo.lastUpdated).toLocaleTimeString()}` 
                          : 'Just Now'}
                      </span>
                    </div>
                  </div>

                  {/* Detailed Timeline list */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-405 uppercase tracking-wider mb-4 font-outfit">Delivery Timeline Progress</h4>
                    
                    {(() => {
                      const deliverySteps = ['ASSIGNED', 'ACCEPTED', 'GOING_TO_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'ARRIVED', 'DELIVERED'];
                      const activeStep = liveTrackingInfo?.delivery?.status || 'ASSIGNED';
                      const currentIdx = deliverySteps.indexOf(activeStep);

                      return (
                        <div className="space-y-4 pl-3 relative border-l border-slate-800">
                          {deliverySteps.map((step, idx) => {
                            const isDone = idx < currentIdx;
                            const isCurrent = idx === currentIdx;

                            let stepTitle = "Delivery Partner Assigned";
                            let stepDesc = "Agent has been assigned to delivery.";
                            if (step === 'ACCEPTED') {
                              stepTitle = "Delivery Accepted";
                              stepDesc = "Courier accepted the delivery request.";
                            } else if (step === 'GOING_TO_PICKUP') {
                              stepTitle = "Going to Pickup";
                              stepDesc = "Courier is en route to pickup farm.";
                            } else if (step === 'PICKED_UP') {
                              stepTitle = "Order Picked Up";
                              stepDesc = "Courier collected items from farm.";
                            } else if (step === 'OUT_FOR_DELIVERY') {
                              stepTitle = "Out for Delivery";
                              stepDesc = "Delivery partner is en route to customer house.";
                            } else if (step === 'ARRIVED') {
                              stepTitle = "Arrived";
                              stepDesc = "Courier has reached customer address.";
                            } else if (step === 'DELIVERED') {
                              stepTitle = "Delivered successfully";
                              stepDesc = "Order handed over to recipient. OTP verified.";
                            }

                            return (
                              <div key={step} className="relative pl-6">
                                {/* Dot indicator */}
                                <div
                                  className={`absolute -left-[19px] top-1.5 w-3.5 h-3.5 rounded-full border-2 ${isCurrent ? 'bg-emerald-500 border-emerald-400 scale-110 shadow-lg shadow-emerald-500/40 animate-pulse' : isDone ? 'bg-emerald-500 border-emerald-600' : 'bg-slate-950 border-slate-800'}`}
                                />
                                <h5 className={`text-xs font-bold ${isCurrent ? 'text-emerald-400' : isDone ? 'text-slate-350' : 'text-slate-500'}`}>
                                  {stepTitle}
                                </h5>
                                <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">{stepDesc}</p>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Items Summaries */}
                <div className={`mt-6 pt-4 border-t ${borderClass} text-xs space-y-2`}>
                  <div className="flex justify-between font-bold">
                    <span>Order Total:</span>
                    <span className="text-sm font-black text-lime-600">₹{trackingOrder.total_amount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Product Camera Capture Modal */}
        {productCameraActive && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 text-center space-y-4">
              <h3 className="text-sm font-bold text-slate-300 font-outfit uppercase tracking-wider">📷 Capture Product Photo</h3>
              
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-955 border border-slate-800 flex items-center justify-center">
                <video 
                  ref={productVideoRef} 
                  playsInline 
                  autoPlay 
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  type="button"
                  onClick={captureProductPhoto}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-955 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md"
                >
                  ⚡ Capture & Upload
                </button>
                <button
                  type="button"
                  onClick={stopProductCamera}
                  className="px-6 py-3 bg-slate-955/20 border border-slate-700/50 text-slate-400 hover:text-white rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Edit Product Modal */}
        {editingProduct && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`${cardClass} w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col`}>
              <div className={`p-6 border-b ${borderClass} flex justify-between items-center`}>
                <h3 className={`text-xl font-bold font-outfit ${textTitle}`}>Edit Product Details</h3>
                <button 
                  onClick={() => setEditingProduct(null)} 
                  className="text-slate-405 hover:text-white text-sm"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleUpdateProductSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Product Title *</label>
                    <input
                      type="text"
                      required
                      value={editProductName}
                      onChange={(e) => setEditProductName(e.target.value)}
                      className={`w-full px-4 py-2 bg-slate-950/10 border border-slate-700/50 rounded-xl text-sm ${true ? 'text-slate-900 bg-white border-slate-200' : 'text-white'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Category *</label>
                    <select
                      value={editProductCategory}
                      onChange={(e) => setEditProductCategory(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-xl text-sm ${
                        true
                          ? 'text-slate-900 bg-white border-slate-200'
                          : 'text-white bg-slate-900 border-slate-800'
                      }`}
                    >
                      <option value="Vegetables" className={true ? 'text-slate-900 bg-white' : 'text-white bg-slate-900'}>Vegetables</option>
                      <option value="Fruits" className={true ? 'text-slate-900 bg-white' : 'text-white bg-slate-900'}>Fruits</option>
                      <option value="Grains" className={true ? 'text-slate-900 bg-white' : 'text-white bg-slate-900'}>Grains</option>
                      <option value="Pulses" className={true ? 'text-slate-900 bg-white' : 'text-white bg-slate-900'}>Pulses</option>
                      <option value="Leafy vegetables" className={true ? 'text-slate-900 bg-white' : 'text-white bg-slate-900'}>Leafy vegetables</option>
                      <option value="Spices" className={true ? 'text-slate-900 bg-white' : 'text-white bg-slate-900'}>Spices</option>
                      <option value="Organic produce" className={true ? 'text-slate-900 bg-white' : 'text-white bg-slate-900'}>Organic produce</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Crop Type *</label>
                    <input
                      type="text"
                      required
                      value={editProductCrop}
                      onChange={(e) => setEditProductCrop(e.target.value)}
                      className={`w-full px-4 py-2 bg-slate-950/10 border border-slate-700/50 rounded-xl text-sm ${true ? 'text-slate-900 bg-white border-slate-200' : 'text-white'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Variety *</label>
                    <input
                      type="text"
                      required
                      value={editProductVariety}
                      onChange={(e) => setEditProductVariety(e.target.value)}
                      className={`w-full px-4 py-2 bg-slate-950/10 border border-slate-700/50 rounded-xl text-sm ${true ? 'text-slate-900 bg-white border-slate-200' : 'text-white'}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Listed Qty *</label>
                    <input
                      type="number"
                      required
                      value={editProductQty}
                      onChange={(e) => setEditProductQty(e.target.value)}
                      className={`w-full px-4 py-2 bg-slate-950/10 border border-slate-700/50 rounded-xl text-sm ${true ? 'text-slate-900 bg-white border-slate-200' : 'text-white'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Quantity Unit *</label>
                    <input
                      type="text"
                      required
                      value={editProductUnit}
                      onChange={(e) => setEditProductUnit(e.target.value)}
                      className={`w-full px-4 py-2 bg-slate-950/10 border border-slate-700/50 rounded-xl text-sm ${true ? 'text-slate-900 bg-white border-slate-200' : 'text-white'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Price per Unit (₹) *</label>
                    <input
                      type="number"
                      required
                      value={editProductPrice}
                      onChange={(e) => setEditProductPrice(e.target.value)}
                      className={`w-full px-4 py-2 bg-slate-950/10 border border-slate-700/50 rounded-xl text-sm ${true ? 'text-slate-900 bg-white border-slate-200' : 'text-white'}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Harvest Date</label>
                    <input
                      type="date"
                      value={editProductHarvest}
                      onChange={(e) => setEditProductHarvest(e.target.value)}
                      className={`w-full px-4 py-2 bg-slate-950/10 border border-slate-700/50 rounded-xl text-sm ${true ? 'text-slate-900 bg-white border-slate-200' : 'text-white'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Quality Grade</label>
                    <select
                      value={editProductQuality}
                      onChange={(e) => setEditProductQuality(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-xl text-sm ${
                        true
                          ? 'text-slate-900 bg-white border-slate-200'
                          : 'text-white bg-slate-900 border-slate-800'
                      }`}
                    >
                      <option value="Grade A" className={true ? 'text-slate-900 bg-white' : 'text-white bg-slate-900'}>Grade A Premium</option>
                      <option value="Grade B" className={true ? 'text-slate-900 bg-white' : 'text-white bg-slate-900'}>Grade B Standard</option>
                      <option value="Organic Premium" className={true ? 'text-slate-900 bg-white' : 'text-white bg-slate-900'}>Organic Certified</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={editProductDesc}
                    onChange={(e) => setEditProductDesc(e.target.value)}
                    className={`w-full px-4 py-2 bg-slate-950/10 border border-slate-700/50 rounded-xl text-sm resize-none ${true ? 'text-slate-900 bg-white border-slate-200' : 'text-white'}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Product Image</label>
                  
                  {editProductImage ? (
                    <div className="relative border border-slate-200 rounded-2xl overflow-hidden group bg-slate-50 p-2 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-left">
                        <img 
                          src={editProductImage} 
                          alt="Product Preview" 
                          className="w-14 h-14 object-cover rounded-xl border border-slate-200" 
                        />
                        <div>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase tracking-wider block w-max">Uploaded</span>
                          <span className="text-xs text-slate-500 font-mono block truncate max-w-[200px] mt-1">{editProductImage}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditProductImage('')}
                        className="px-3 py-1.5 bg-red-50 text-red-600 font-bold rounded-xl text-xs hover:bg-red-500 hover:text-white transition-colors"
                        title="Remove Image"
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center bg-slate-50 hover:bg-slate-100/50 transition-colors relative">
                      {uploadingImage ? (
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs text-slate-500 font-bold animate-pulse">Uploading product image...</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-2xl">📸</div>
                          <div className="text-xs text-slate-500">
                            Upload a product photo from your device gallery or capture it live using your camera.
                          </div>
                          <div className="flex gap-3 justify-center pt-2">
                            <label className="px-4 py-2 bg-[#A8D5BA] text-[#34413A] hover:opacity-90 font-bold rounded-xl text-xs cursor-pointer transition-colors shadow-sm flex items-center gap-1">
                              📁 Upload Photo
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageFileChange(e, true)}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => startProductCamera(true)}
                              className="px-4 py-2 bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center gap-1"
                            >
                              📷 Take Photo
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fallback Paste Input */}
                  <input
                    type="url"
                    placeholder="Or paste an image URL (optional)"
                    value={editProductImage}
                    onChange={(e) => setEditProductImage(e.target.value)}
                    className={`w-full px-4 py-2.5 bg-slate-950/10 border border-slate-700/50 rounded-xl text-xs mt-3 ${true ? 'text-slate-900 bg-white border-slate-200' : 'text-white'}`}
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold rounded-xl text-sm transition-colors"
                  >
                    Save Changes & Update List
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Cancellation Reason Modal */}
        {cancellationOrder && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`${cardClass} w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col`}>
              <div className={`p-6 border-b ${borderClass} flex justify-between items-center`}>
                <h3 className={`text-xl font-bold font-outfit ${textTitle}`}>Cancel Order #{cancellationOrder.id}</h3>
                <button 
                  onClick={() => setCancellationOrder(null)} 
                  className="text-slate-400 hover:text-white text-sm"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleCancelOrderSubmit} className="p-6 space-y-4">
                <p className="text-xs text-slate-405">
                  Are you sure you want to cancel this order? Please select a reason below to confirm.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Reason for Cancellation</label>
                  <select
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm ${
                      true
                        ? 'text-slate-900 bg-white border-slate-200'
                        : 'text-white bg-slate-900 border-slate-800'
                    }`}
                  >
                    <option value="Ordered by mistake">Ordered by mistake</option>
                    <option value="Found another product">Found another product</option>
                    <option value="Changed my mind">Changed my mind</option>
                    <option value="Delivery taking too long">Delivery taking too long</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {cancellationReason === 'Other' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Specify Reason</label>
                    <textarea
                      required
                      rows={2}
                      value={cancellationReasonOther}
                      onChange={(e) => setCancellationReasonOther(e.target.value)}
                      placeholder="Please specify why you are cancelling..."
                      className={`w-full px-4 py-2 bg-slate-950/10 border border-slate-700/50 rounded-xl text-sm resize-none ${true ? 'text-slate-900 bg-white border-slate-200' : 'text-white'}`}
                    />
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCancellationOrder(null)}
                    className="flex-1 py-3 border border-slate-700/50 text-slate-400 font-bold rounded-xl text-xs hover:bg-slate-900 transition-colors"
                  >
                    NO, KEEP ORDER
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-red-500 text-slate-950 hover:bg-red-400 font-bold rounded-xl text-xs transition-colors"
                  >
                    YES, CANCEL ORDER
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Dispute Resolution Modal */}
        {disputeModalOrder && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`${cardClass} w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col`}>
              <div className={`p-6 border-b ${borderClass} flex justify-between items-center`}>
                <h3 className={`text-xl font-bold font-outfit ${textTitle}`}>Report Problem (Dispute)</h3>
                <button 
                  onClick={() => setDisputeModalOrder(null)} 
                  className="text-slate-400 hover:text-white text-sm"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleDisputeOrderSubmit} className="p-6 space-y-4">
                <p className="text-xs text-slate-405">
                  If the farmer failed to deliver, sent incorrect produce, or wrong quantity, you can lodge a formal claim. This halts payment release.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Reason for Dispute</label>
                  <select
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    className={`w-full px-4 py-2.5 border rounded-xl text-sm ${
                      true
                        ? 'text-slate-900 bg-white border-slate-200'
                        : 'text-white bg-slate-900 border-slate-800'
                    }`}
                  >
                    <option value="Order not received">Order not received</option>
                    <option value="Wrong quantity">Wrong quantity</option>
                    <option value="Wrong vegetable">Wrong vegetable</option>
                    <option value="Damaged vegetables">Damaged vegetables</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {disputeReason === 'Other' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Specify Problem Details</label>
                    <textarea
                      required
                      rows={2}
                      value={disputeReasonOther}
                      onChange={(e) => setDisputeReasonOther(e.target.value)}
                      placeholder="Please details the issue..."
                      className={`w-full px-4 py-2 bg-slate-950/10 border border-slate-700/50 rounded-xl text-sm resize-none ${true ? 'text-slate-900 bg-white border-slate-200' : 'text-white'}`}
                    />
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setDisputeModalOrder(null)}
                    className="flex-1 py-3 border border-slate-700/50 text-slate-400 font-bold rounded-xl text-xs hover:bg-slate-900 transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-orange-500 text-slate-950 hover:bg-orange-400 font-bold rounded-xl text-xs transition-colors"
                  >
                    Submit Dispute
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Farmer Delivery OTP Input Modal */}
        {otpInputOrder && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`${cardClass} w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col`}>
              <div className={`p-6 border-b ${borderClass} flex justify-between items-center`}>
                <h3 className={`text-xl font-bold font-outfit ${textTitle}`}>Complete Delivery Verification</h3>
                <button 
                  onClick={() => { setOtpInputOrder(null); setOtpInputValue(''); setOtpError(''); }} 
                  className="text-slate-405 hover:text-white text-sm"
                >
                  Cancel
                </button>
              </div>

              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  setOtpError('');
                  const res = await deliverOrder(otpInputOrder.id, otpInputValue);
                  if (res?.success) {
                    alert('Delivery completed successfully! Payment released to your earnings.');
                    setOtpInputOrder(null);
                    setOtpInputValue('');
                    loadFarmerOrders();
                    loadFarmerInventory(); // refresh stock reservation count
                  } else {
                    setOtpError(res?.error || 'Verification failed. Incorrect OTP.');
                  }
                }} 
                className="p-6 space-y-4"
              >
                <p className="text-xs text-slate-400">
                  Ask the customer for the 4-digit security code they received on their portal. Incorrect attempts will trigger penalties.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Enter Customer's 4-Digit OTP</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    pattern="\d{4}"
                    value={otpInputValue}
                    onChange={(e) => setOtpInputValue(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 1234"
                    className="w-full text-center tracking-widest text-2xl font-black px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                {otpError && (
                  <div className="text-xs text-red-505 font-bold bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">
                    {otpError}
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setOtpInputOrder(null); setOtpInputValue(''); setOtpError(''); }}
                    className="flex-1 py-3 border border-slate-700/50 text-slate-400 font-bold rounded-xl text-xs hover:bg-slate-900 transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-lime-500 hover:bg-lime-400 text-slate-955 font-bold rounded-xl text-xs transition-colors"
                  >
                    Verify Code & Deliver
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <FarmProvider>
      <AppContent />
    </FarmProvider>
  );
}
