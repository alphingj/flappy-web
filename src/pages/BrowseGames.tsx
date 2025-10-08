import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import './BrowseGames.css';
import GameCard from '../components/GameCard';

type SortByType = 'plays' | 'score';

export default function BrowseGamesScreen() {
    const navigate = useNavigate();
    const [sortBy, setSortBy] = useState<SortByType>('plays');
    const publicGames = useQuery(api.games.getPublicGames, { sortBy });

    return (
        <div className="browse-container">
            <header className="browse-header">
                <button onClick={() => navigate(-1)} className="browse-back-button">
                    <Ionicons name="arrow-back" size={24} color="#FF6B35" />
                </button>
                <h1 className="browse-title">Browse Public Games</h1>
            </header>

            <div className="browse-sort-container">
                <button
                    className={`browse-sort-button ${sortBy === 'plays' ? 'active' : ''}`}
                    onClick={() => setSortBy('plays')}
                >
                    Most Played
                </button>
                <button
                    className={`browse-sort-button ${sortBy === 'score' ? 'active' : ''}`}
                    onClick={() => setSortBy('score')}
                >
                    Top Score
                </button>
            </div>

            <main className="browse-list-container">
                {publicGames === undefined && (
                     <div className="browse-loading">Loading...</div>
                )}

                {publicGames && publicGames.length === 0 && (
                    <div className="browse-empty-container">
                        <Ionicons name="sad-outline" size={64} color="#A0AEC0" />
                        <p className="browse-empty-text">No public games found.</p>
                        <p className="browse-empty-subtext">Why not be the first to create one?</p>
                    </div>
                )}

                {publicGames && publicGames.length > 0 && (
                    <div className="browse-grid">
                        {publicGames.map(game => <GameCard key={game._id} game={game} />)}
                    </div>
                )}
            </main>
        </div>
    );
}
