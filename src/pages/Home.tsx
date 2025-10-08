import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ionicons } from '@expo/vector-icons';
import './Home.css';
import AdBanner from '../components/AdBanner';

export default function HomeScreen() {
  const navigate = useNavigate();
  const [adRefreshKey, setAdRefreshKey] = useState(0);

  // IMPORTANT: Replace '1234567890' with the actual Ad Unit ID from your AdSense account.
  const AD_SLOT_ID = '1234567890';
  const AD_CLIENT_ID = 'ca-pub-4688177552487842';

  useEffect(() => {
    const adRefreshInterval = setInterval(() => {
      setAdRefreshKey(key => key + 1);
    }, 30000); // Refresh ad every 30 seconds

    return () => clearInterval(adRefreshInterval); // Cleanup interval on component unmount
  }, []);

  return (
    <div className="home-container">
      <div className="home-content-wrapper">
        <div className="home-content">
          <header className="home-header">
            <Ionicons name="game-controller" size={80} color="#FF6B35" />
            <h1 className="home-title">Flappy Creator</h1>
            <p className="home-subtitle">Create & Share Custom Flappy Games</p>
          </header>

          <div className="home-button-container">
            <button
              className="home-button home-primary-button"
              onClick={() => navigate('/create')}
            >
              <Ionicons name="add-circle" size={24} color="white" />
              <span>Create Game</span>
            </button>

            <button
              className="home-button home-secondary-button"
              onClick={() => navigate('/browse')}
            >
              <Ionicons name="library" size={24} color="#FF6B35" />
              <span>Browse Games</span>
            </button>

            <button
              className="home-button home-secondary-button"
              onClick={() => navigate('/my-games')}
            >
              <Ionicons name="person" size={24} color="#FF6B35" />
              <span>My Games</span>
            </button>
          </div>
        </div>
      </div>
      {/* Ad Banner at the bottom of the screen */}
      <div className="home-ad-container">
        <AdBanner key={adRefreshKey} adClient={AD_CLIENT_ID} adSlot={AD_SLOT_ID} />
      </div>
    </div>
  );
}
