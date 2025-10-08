import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import './MyGames.css';
import GameCard from '../components/GameCard';
import { useCreatorName } from '../hooks/useCreatorName';

export default function MyGamesScreen() {
    const navigate = useNavigate();
    const { creatorName, setCreatorName, isNameLoaded } = useCreatorName();

    const myGames = useQuery(
        api.games.getMyGames,
        isNameLoaded && creatorName ? { creatorName } : 'skip'
    );

    return (
        <div className="my-games-container">
            <header className="my-games-header">
                <button onClick={() => navigate(-1)} className="my-games-back-button">
                    <Ionicons name="arrow-back" size={24} color="#FF6B35" />
                </button>
                <h1 className="my-games-title">My Games</h1>
            </header>

            <main className="my-games-list-container">
                <div className="my-games-input-container">
                    <input
                        className="my-games-input"
                        placeholder="Enter Your Creator Name..."
                        value={creatorName}
                        onChange={(e) => setCreatorName(e.target.value)}
                        disabled={!isNameLoaded}
                    />
                    {/* Subtle loading spinner for when the name is being loaded from storage */}
                    {!isNameLoaded && <div className="my-games-spinner"></div>}
                </div>
                
                {/* Loading indicator for when games are being fetched */}
                {isNameLoaded && creatorName && myGames === undefined && (
                    <div className="my-games-loading">
                        <div className="my-games-spinner"></div>
                        <p>Searching for games...</p>
                    </div>
                )}
                
                {isNameLoaded && creatorName && myGames && myGames.length === 0 && (
                    <div className="my-games-empty-container">
                        <Ionicons name="sad-outline" size={64} color="#A0AEC0" />
                        <p className="my-games-empty-text">No games found for "{creatorName}".</p>
                    </div>
                )}

                {myGames && myGames.length > 0 && (
                    <div className="my-games-grid">
                        {myGames.map(game => <GameCard key={game._id} game={game} showShare />)}
                    </div>
                )}
            </main>
        </div>
    );
}