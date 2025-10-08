
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';
import FlappyGame from '../components/Game';
import AdBanner from '../components/AdBanner';
import './PlayGame.css';
import { useCreatorName } from '../hooks/useCreatorName';

type Medal = { name: string; icon: keyof typeof Ionicons.glyphMap; color: string } | null;

const getMedal = (score: number): Medal => {
    if (score >= 40) return { name: 'Platinum', icon: 'diamond', color: '#6E7A8A' };
    if (score >= 30) return { name: 'Gold', icon: 'medal', color: '#FFD700' };
    if (score >= 20) return { name: 'Silver', icon: 'medal', color: '#C0C0C0' };
    if (score >= 10) return { name: 'Bronze', icon: 'medal', color: '#CD7F32' };
    return null;
};

// Custom hook for window dimensions
const useWindowDimensions = () => {
    const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
    useEffect(() => {
        const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return dimensions;
};

export default function PlayGameScreen() {
    const navigate = useNavigate();
    const { gameId } = useParams<{ gameId: Id<"customGames"> }>();
    const [gameState, setGameState] = useState<'loading' | 'ready' | 'playing' | 'gameover'>('loading');
    const [score, setScore] = useState(0);
    const [medal, setMedal] = useState<Medal>(null);
    
    const [isNewHighScore, setIsNewHighScore] = useState(false);
    const { creatorName, setCreatorName, isNameLoaded } = useCreatorName();
    const [scoreSubmitted, setScoreSubmitted] = useState(false);
    const [adRefreshKey, setAdRefreshKey] = useState(0);

    // IMPORTANT: Replace '1234567890' with the actual Ad Unit ID from your AdSense account.
    const AD_SLOT_ID = '1234567890';
    const AD_CLIENT_ID = 'ca-pub-4688177552487842';

    const { width: windowWidth, height: windowHeight } = useWindowDimensions();

    const game = useQuery(api.games.getGame, gameId ? { gameId } : "skip");
    const scores = useQuery(api.games.getGameScores, gameId ? { gameId } : "skip");
    const birdImageUrl = useQuery(api.games.getStorageUrl, game?.birdImageId ? { storageId: game.birdImageId } : "skip");
    const backgroundImageUrl = useQuery(api.games.getStorageUrl, game?.backgroundImageId ? { storageId: game.backgroundImageId } : "skip");
    const jumpSoundUrl = useQuery(api.games.getStorageUrl, game?.jumpSoundId ? { storageId: game.jumpSoundId } : "skip");
    const deathSoundUrl = useQuery(api.games.getStorageUrl, game?.deathSoundId ? { storageId: game.deathSoundId } : "skip");
    const updateHighScore = useMutation(api.games.updateHighScore);

    const jumpSound = useMemo(() => jumpSoundUrl ? new Audio(jumpSoundUrl) : null, [jumpSoundUrl]);
    const deathSound = useMemo(() => deathSoundUrl ? new Audio(deathSoundUrl) : null, [deathSoundUrl]);

    useEffect(() => {
        if (game && birdImageUrl !== undefined) {
            setGameState('ready');
        }
    }, [game, birdImageUrl]);

    // Effect to handle ad refreshing only on the game over screen
    useEffect(() => {
        let adRefreshInterval: number | undefined;

        if (gameState === 'gameover') {
            adRefreshInterval = window.setInterval(() => {
                setAdRefreshKey(key => key + 1);
            }, 30000); // Refresh ad every 30 seconds
        }

        return () => {
            if (adRefreshInterval) {
                clearInterval(adRefreshInterval);
            }
        };
    }, [gameState]);

    const playSound = (sound: HTMLAudioElement | null) => {
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.error("Error playing sound:", e));
        }
    };

    const handleGameEvent = useCallback(async (event: { type: string, score?: number }) => {
        if (event.type === 'game-over') {
            playSound(deathSound);
            const finalScore = event.score ?? 0;
            setScore(finalScore);
            setMedal(getMedal(finalScore));
            setGameState('gameover');

            if (game && finalScore > game.highScore) {
                setIsNewHighScore(true);
            } else if (gameId) {
                await updateHighScore({ gameId, score: finalScore, playerName: 'Player' });
            }
        } else if (event.type === 'score') {
            setScore(event.score ?? 0);
        } else if (event.type === 'jump') {
            playSound(jumpSound);
        }
    }, [deathSound, jumpSound, gameId, updateHighScore, game, playSound]);
    
    const submitHighScore = async () => {
        if (!creatorName.trim()) {
            alert('Please enter your name for the leaderboard.');
            return;
        }
        if (gameId) {
            await updateHighScore({ gameId, score, playerName: creatorName });
            setScoreSubmitted(true);
        }
    };

    const handleShare = async () => {
        if (!game || !gameId) return;
        const gameUrl = `${window.location.origin}/play/${gameId}`;
        const shareData = {
            title: `Flappy Creator: ${game.name}`,
            text: `Check out this Flappy Bird game: "${game.name}"!`,
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

    const startGame = () => {
        setScore(0);
        setMedal(null);
        setGameState('playing');
    };

    const restartGame = () => {
        setScore(0);
        setMedal(null);
        setGameState('playing');
        setIsNewHighScore(false);
        setScoreSubmitted(false);
    };

    const gameAspectRatio = 9 / 16;
    let gameHeight = windowHeight;
    let gameWidth = windowWidth;

    if (windowWidth / windowHeight > gameAspectRatio) {
        gameWidth = windowHeight * gameAspectRatio;
    } else {
        gameHeight = windowWidth / gameAspectRatio;
    }

    if (gameState === 'loading' || !game || birdImageUrl === undefined) {
        return (
            <div className="play-center-container">
                <p className="play-loading-text">Loading Game...</p>
            </div>
        );
    }
    
    const gameScreenStyle = {
        width: gameWidth,
        height: gameHeight,
        backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#87CEEB',
        overflow: 'hidden',
        position: 'relative' as 'relative',
    };
    
    return (
        <div className="play-root-container">
            <div className="play-game-screen" style={gameScreenStyle}>
                {gameState === 'playing' && birdImageUrl && (
                    <FlappyGame onEvent={handleGameEvent} birdImageUri={birdImageUrl} width={gameWidth} height={gameHeight} />
                )}

                <div className="play-overlay">
                    {gameState === 'playing' && <p className="play-score">{score}</p>}

                    {gameState === 'ready' && (
                        <div className="play-center-container">
                            <h1 className="play-game-title">{game.name}</h1>
                            <button className="play-button" onClick={startGame}>
                                <Ionicons name="play" size={48} color="white" />
                            </button>
                            <p className="play-text">Click or Press Space to Play</p>
                        </div>
                    )}

                    {gameState === 'gameover' && (
                        <div className="play-center-container">
                            <div className="play-game-over-card">
                                <h2 className="play-game-over-title">Game Over</h2>

                                {medal && (
                                    <div className="play-medal-container">
                                        <Ionicons name={medal.icon} size={40} color={medal.color} />
                                        <p className="play-medal-text" style={{ color: medal.color }}>{medal.name} Medal!</p>
                                    </div>
                                )}

                                {isNewHighScore && !scoreSubmitted ? (
                                    <>
                                        <p className="play-new-high-score-text">New High Score!</p>
                                        <p className="play-final-score">Score: {score}</p>
                                        <input
                                            className="play-input"
                                            placeholder="Enter Your Name"
                                            value={creatorName}
                                            onChange={(e) => setCreatorName(e.target.value)}
                                            maxLength={20}
                                            disabled={!isNameLoaded}
                                        />
                                        <button className="play-restart-button" onClick={submitHighScore}>
                                            <Ionicons name="send" size={20} color="white" />
                                            <span>Submit Score</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {scoreSubmitted && <p className="play-score-submitted-text">Score Submitted!</p>}
                                        <p className="play-final-score">Score: {score}</p>
                                    </>
                                )}

                                <p className="play-high-score">High Score: {Math.max(game.highScore, score)}</p>
                                
                                <div className="play-leaderboard-container">
                                    <h3 className="play-leaderboard-title">Top Scores</h3>
                                    {scores === undefined ? (
                                        <p>Loading Scores...</p>
                                    ) : scores.length === 0 ? (
                                        <p className="play-no-scores-text">No scores yet. Be the first!</p>
                                    ) : (
                                        scores.slice(0, 5).map((s, index) => (
                                            <div key={s._id} className="play-score-row">
                                                <span className="play-score-rank">{index + 1}.</span>
                                                <span className="play-score-name">{s.playerName}</span>
                                                <span className="play-score-value">{s.score}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                                
                                <div className="play-game-over-ad-container">
                                    <AdBanner key={adRefreshKey} adClient={AD_CLIENT_ID} adSlot={AD_SLOT_ID} />
                                </div>

                                <button className="play-restart-button" onClick={restartGame}>
                                    <Ionicons name="refresh" size={24} color="white" />
                                    <span>Play Again</span>
                                </button>
                                <button className="play-secondary-button" onClick={handleShare}>
                                    <Ionicons name="share-social" size={20} color="#FF6B35" />
                                    <span>Share Game</span>
                                </button>
                                <button className="play-secondary-button" onClick={() => navigate('/')}>
                                    <Ionicons name="home" size={20} color="#FF6B35" />
                                    <span>Home</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
