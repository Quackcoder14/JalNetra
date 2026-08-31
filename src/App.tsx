/**
 * JalNetra - National Groundwater Intelligence Platform
 * Main App Router with Center Opening Intro Animation and PWA/Vercel support
 */

import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { NationalOverview } from './pages/NationalOverview';
import { DistrictDrillDown } from './pages/DistrictDrillDown';
import { AlertsDashboard } from './pages/AlertsDashboard';
import { About } from './pages/About';
import { Simulator } from './pages/Simulator';
import { SplashIntro } from './components/SplashIntro';

function App() {
  // Always show opening animation on initial app launch, then smoothly enter dashboard
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleReplayIntro = () => {
    setShowSplash(true);
  };

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {showSplash && <SplashIntro onComplete={handleSplashComplete} />}
      <div className="min-h-screen bg-ground flex flex-col selection:bg-sky-200 selection:text-sky-900">
        <Navbar onReplayIntro={handleReplayIntro} />
        <main id="main-content" className="flex-1">
          <Routes>
            <Route path="/" element={<NationalOverview />} />
            <Route path="/district/:id" element={<DistrictDrillDown />} />
            <Route path="/alerts" element={<AlertsDashboard />} />
            <Route path="/simulator" element={<Simulator />} />
            <Route path="/simulator/:id" element={<Simulator />} />
            <Route path="/about" element={<About />} />
            {/* Fallback route */}
            <Route path="*" element={<NationalOverview />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;