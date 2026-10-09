import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import FloodMapPage from './pages/FloodMapPage';
import Prediction from './pages/Prediction';
import Alerts from './pages/Alerts';
import Weather from './pages/Weather';
import Recommendations from './pages/Recommendations';
import GlofMonitor from './pages/GlofMonitor';
import { getLocations } from './services/api';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [lastUpdated, setLastUpdated] = useState(() => new Date().toISOString());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getLocations()
      .then((data) => {
        if (isMounted) setLocations(data);
      })
      .catch((e) => {
        console.error('Failed to load locations in root app:', e);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleGlobalRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await getLocations();
      setLocations(data);
      setLastUpdated(new Date().toISOString());
    } catch (e) {
      console.error('Refresh failed:', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans text-slate-800">
        {/* Left Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
          {/* Header */}
          <Header
            locations={locations}
            selectedLocationId={selectedLocationId}
            onSelectLocation={setSelectedLocationId}
            lastUpdated={lastUpdated}
            onRefresh={handleGlobalRefresh}
            isLoading={isRefreshing}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />

          {/* Main Workspace Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <Routes>
              <Route
                path="/"
                element={
                  <Dashboard
                    selectedLocationId={selectedLocationId}
                    onSelectLocation={setSelectedLocationId}
                  />
                }
              />
              <Route
                path="/map"
                element={
                  <FloodMapPage
                    selectedLocationId={selectedLocationId}
                    onSelectLocation={setSelectedLocationId}
                  />
                }
              />
              <Route
                path="/predict"
                element={<Prediction />}
              />
              <Route
                path="/glof"
                element={<GlofMonitor />}
              />
              <Route
                path="/alerts"
                element={<Alerts selectedLocationId={selectedLocationId} />}
              />
              <Route
                path="/weather"
                element={<Weather selectedLocationId={selectedLocationId} />}
              />
              <Route
                path="/recommendations"
                element={<Recommendations />}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-200/80 bg-white py-4 px-6 text-center text-xs text-slate-500">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
              <span>
                <strong>FloodGuard AI</strong> — Intelligent Urban Flood Prediction System • 24-Hour Hackathon
              </span>
              <span className="font-mono text-[11px] text-slate-400">
                FastAPI • React • Leaflet • Scikit-Learn • Open-Meteo
              </span>
            </div>
          </footer>
        </div>
      </div>
    </BrowserRouter>
  );
}
