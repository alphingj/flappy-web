import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import type { Doc } from '../../convex/_generated/dataModel';
import './GameCard.css';

interface GameCardProps {
    game: Doc<"customGames">;
    showShare?: boolean;
}

export default function GameCard({ game, showShare = false }: GameCardProps) {
    const navigate = useNavigate();
    const birdImageUrl = useQuery(api.games.getStorageUrl, game.birdImageId ? { storageId: game.birdImageId } : "skip");

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const gameUrl = `${window.location.origin}/play/${game._id}`;
        const shareData = {
            title: `Flappy Creator: ${game.name}`,
            text: `Check out this Flappy Bird game I made: "${game.name}"!`,
            url: gameUrl,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            navigator.clipboard.writeText(gameUrl);
            alert("Game link copied to clipboard!");
        }
    };
    
    return (
        <div className="card" onClick={() => navigate(`/play/${game._id}`)}>
            {showShare && (
                <button className="card-share-button" onClick={handleShare}>
                    <Ionicons name="share-social" size={24} color="#FF6B35" />
                </button>
            )}
            <div className="card-image-container">
                {birdImageUrl ? (
                    <img src={birdImageUrl} className="card-bird-image" alt={game.name} />
                ) : (
                    <div className="card-image-placeholder">
                        <Ionicons name="image-outline" size={32} color="#CBD5E0" />
                    </div>
                )}
            </div>
            <div className="card-content">
                <h3 className="card-title">{game.name}</h3>
                <p className="card-subtitle">by {game.creatorName}</p>
                {game.description && <p className="card-description">{game.description}</p>}
                <div className="card-stats-container">
                    <Ionicons name="game-controller" size={16} color="#718096" />
                    <span className="card-stats-text">{game.playCount} plays</span>
                </div>
                <div className="card-stats-container">
                    <Ionicons name="star" size={16} color="#718096" />
                    <span className="card-stats-text">High Score: {game.highScore}</span>
                </div>
            </div>
        </div>
    );
}