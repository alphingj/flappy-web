import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity, Alert, TextInput, Share, ImageBackground, useWindowDimensions, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Ionicons } from '@expo/vector-icons';
import FlappyGame from '../../components/Game';
import { Audio } from 'expo-av';

// FIX: Moved Medal type definition and added an explicit return type to getMedal to fix type mismatch.
type Medal = { name: string; icon: keyof typeof Ionicons.glyphMap; color: string } | null;

// Medal System Configuration
const getMedal = (score: number): Medal => {
    if (score >= 40) return { name: 'Platinum', icon: 'diamond', color: '#6E7A8A' };
    if (score >= 30) return { name: 'Gold', icon: 'medal', color: '#FFD700' };
    if (score >= 20) return { name: 'Silver', icon: 'medal', color: '#C0C0C0' };
    if (score >= 10) return { name: 'Bronze', icon: 'medal', color: '#CD7F32' };
    return null;
};

export default function PlayGameScreen() {
    const router = useRouter();
    const { gameId } = useLocalSearchParams<{ gameId: Id<"customGames"> }>();
    const [gameState, setGameState] = useState<'loading' | 'ready' | 'playing' | 'gameover'>('loading');
    const [score, setScore] = useState(0);
    const [medal, setMedal] = useState<Medal>(null);
    
    // High Score State
    const [isNewHighScore, setIsNewHighScore] = useState(false);
    const [highScoreName, setHighScoreName] = useState('');
    const [scoreSubmitted, setScoreSubmitted] = useState(false);

    // Responsive State
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const isWeb = Platform.OS === 'web';
    const isMobile = windowWidth < 768;

    // Fetch game data from Convex
    const game = useQuery(api.games.getGame, gameId ? { gameId } : "skip");
    const scores = useQuery(api.games.getGameScores, gameId ? { gameId } : "skip");
    const birdImageUrl = useQuery(api.games.getStorageUrl, game?.birdImageId ? { storageId: game.birdImageId } : "skip");
    const backgroundImageUrl = useQuery(api.games.getStorageUrl, game?.backgroundImageId ? { storageId: game.backgroundImageId } : "skip");
    const jumpSoundUrl = useQuery(api.games.getStorageUrl, game?.jumpSoundId ? { storageId: game.jumpSoundId } : "skip");
    const deathSoundUrl = useQuery(api.games.getStorageUrl, game?.deathSoundId ? { storageId: game.deathSoundId } : "skip");
    const updateHighScore = useMutation(api.games.updateHighScore);

    // Sound objects
    const [jumpSound, setJumpSound] = useState<Audio.Sound>();
    const [deathSound, setDeathSound] = useState<Audio.Sound>();

    // Load sounds
    useEffect(() => {
        const loadSounds = async () => {
            if (jumpSoundUrl) {
                const { sound } = await Audio.Sound.createAsync({ uri: jumpSoundUrl });
                setJumpSound(sound);
            }
            if (deathSoundUrl) {
                const { sound } = await Audio.Sound.createAsync({ uri: deathSoundUrl });
                setDeathSound(sound);
            }
        };
        loadSounds();
        return () => {
            jumpSound?.unloadAsync();
            deathSound?.unloadAsync();
        };
    }, [jumpSoundUrl, deathSoundUrl]);


    useEffect(() => {
        // Game is ready to play once the core assets are loaded. Background is optional.
        if (game && birdImageUrl !== undefined) {
            setGameState('ready');
        }
    }, [game, birdImageUrl]);

    const handleGameEvent = useCallback(async (event: { type: string, score?: number }) => {
        if (event.type === 'game-over') {
            deathSound?.replayAsync();
            const finalScore = event.score ?? 0;
            setScore(finalScore);
            setMedal(getMedal(finalScore)); // Set the medal
            setGameState('gameover');

            // Check if it's a new high score
            if (game && finalScore > game.highScore) {
                setIsNewHighScore(true);
            } else if (gameId) {
                // If not a high score, just submit the play count and score anonymously
                await updateHighScore({ gameId, score: finalScore, playerName: 'Player' });
            }
        } else if (event.type === 'score') {
            setScore(event.score ?? 0);
        } else if (event.type === 'jump') {
            jumpSound?.replayAsync();
        }
    }, [deathSound, jumpSound, gameId, updateHighScore, game]);
    
    const submitHighScore = async () => {
        if (!highScoreName.trim()) {
            Alert.alert('Enter a name', 'Please enter your name for the leaderboard.');
            return;
        }
        if (gameId) {
            await updateHighScore({ gameId, score, playerName: highScoreName });
            setScoreSubmitted(true);
        }
    };

    const handleShare = async () => {
        if (!game || !gameId) return;
        try {
          await Share.share({
            message: `Check out this Flappy Bird game: "${game.name}"! myapp://play/${gameId}`,
          });
        } catch (error) {
          console.error('Error sharing game:', error);
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
        setHighScoreName('');
    };

    // Calculate game dimensions for responsiveness
    const gameAspectRatio = 9 / 16;
    let gameHeight = windowHeight;
    let gameWidth = windowWidth;

    if (isWeb) {
        // Letterbox the game on web
        if (windowWidth / windowHeight > gameAspectRatio) {
            gameWidth = windowHeight * gameAspectRatio;
        } else {
            gameHeight = windowWidth / gameAspectRatio;
        }
    }

    const styles = getStyles({ isMobile });

    if (gameState === 'loading' || !game || birdImageUrl === undefined) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#FF6B35" />
                <Text style={styles.loadingText}>Loading Game...</Text>
            </SafeAreaView>
        );
    }
    
    const GameScreenContent = (
        <View style={{ width: gameWidth, height: gameHeight, backgroundColor: '#87CEEB', overflow: 'hidden' }}>
            {backgroundImageUrl ? (
                <ImageBackground source={{ uri: backgroundImageUrl }} style={styles.backgroundImage}>
                    {gameState === 'playing' && birdImageUrl && (
                        <FlappyGame onEvent={handleGameEvent} birdImageUri={birdImageUrl} width={gameWidth} height={gameHeight} />
                    )}
                </ImageBackground>
            ) : (
                <>
                    {gameState === 'playing' && birdImageUrl && (
                        <FlappyGame onEvent={handleGameEvent} birdImageUri={birdImageUrl} width={gameWidth} height={gameHeight} />
                    )}
                </>
            )}
            <SafeAreaView style={StyleSheet.absoluteFill} pointerEvents="box-none">
                 <View style={styles.overlay}>
                    {gameState === 'playing' && <Text style={styles.score}>{score}</Text>}

                    {gameState === 'ready' && (
                        <View style={styles.centerContainer}>
                            <Text style={styles.gameTitle}>{game.name}</Text>
                            <TouchableOpacity style={styles.playButton} onPress={startGame}>
                                <Ionicons name="play" size={48} color="white" />
                            </TouchableOpacity>
                            <Text style={styles.playText}>Tap to Play</Text>
                        </View>
                    )}

                    {gameState === 'gameover' && (
                        <View style={styles.centerContainer}>
                            <View style={styles.gameOverCard}>
                                <Text style={styles.gameOverTitle}>Game Over</Text>

                                {medal && (
                                    <View style={styles.medalContainer}>
                                        <Ionicons name={medal.icon} size={40} color={medal.color} />
                                        <Text style={[styles.medalText, { color: medal.color }]}>{medal.name} Medal!</Text>
                                    </View>
                                )}

                                {isNewHighScore && !scoreSubmitted ? (
                                    <>
                                        <Text style={styles.newHighScoreText}>New High Score!</Text>
                                        <Text style={styles.finalScore}>Score: {score}</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter Your Name"
                                            placeholderTextColor="#A0AEC0"
                                            value={highScoreName}
                                            onChangeText={setHighScoreName}
                                            maxLength={20}
                                        />
                                        <TouchableOpacity style={[styles.restartButton, {marginTop: 12, width: '100%'}]} onPress={submitHighScore}>
                                            <Ionicons name="send" size={20} color="white" />
                                            <Text style={styles.restartButtonText}>Submit Score</Text>
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <>
                                        {scoreSubmitted && <Text style={styles.scoreSubmittedText}>Score Submitted!</Text>}
                                        <Text style={styles.finalScore}>Score: {score}</Text>
                                    </>
                                )}

                                <Text style={styles.highScore}>High Score: {Math.max(game.highScore, score)}</Text>
                                
                                <View style={styles.leaderboardContainer}>
                                    <Text style={styles.leaderboardTitle}>Top Scores</Text>
                                    {scores === undefined ? (
                                        <ActivityIndicator color="#FF6B35" />
                                    ) : scores.length === 0 ? (
                                        <Text style={styles.noScoresText}>No scores yet. Be the first!</Text>
                                    ) : (
                                        scores.slice(0, 5).map((s, index) => (
                                            <View key={s._id} style={styles.scoreRow}>
                                                <Text style={styles.scoreRank}>{index + 1}.</Text>
                                                <Text style={styles.scoreName} numberOfLines={1}>{s.playerName}</Text>
                                                <Text style={styles.scoreValue}>{s.score}</Text>
                                            </View>
                                        ))
                                    )}
                                </View>

                                <TouchableOpacity style={styles.restartButton} onPress={restartGame}>
                                    <Ionicons name="refresh" size={24} color="white" />
                                    <Text style={styles.restartButtonText}>Play Again</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.secondaryButton} onPress={handleShare}>
                                    <Ionicons name="share-social" size={20} color="#FF6B35" />
                                    <Text style={styles.secondaryButtonText}>Share Game</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/')}>
                                    <Ionicons name="home" size={20} color="#FF6B35" />
                                    <Text style={styles.secondaryButtonText}>Home</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.secondaryButton} onPress={() => Alert.alert("Coming Soon", "Full leaderboards are on the way!")}>
                                    <Ionicons name="list" size={20} color="#FF6B35" />
                                    <Text style={styles.secondaryButtonText}>View All Scores</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </SafeAreaView>
        </View>
    );

    if (isWeb) {
        return <View style={styles.rootContainer}>{GameScreenContent}</View>;
    }
    return GameScreenContent;
}

const getStyles = ({ isMobile }: { isMobile: boolean }) => StyleSheet.create({
    rootContainer: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: { flex: 1, alignItems: 'center' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
    loadingText: { marginTop: 16, fontSize: 18, color: '#4A5568' },
    score: { fontSize: 80, fontWeight: 'bold', color: 'white', marginTop: 100, textShadowColor: 'rgba(0, 0, 0, 0.25)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 5 },
    gameTitle: { fontSize: isMobile ? 48 : 64, fontWeight: 'bold', color: 'white', textAlign: 'center', paddingHorizontal: 20, textShadowColor: 'rgba(0, 0, 0, 0.25)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 5 },
    playButton: { marginTop: 32, backgroundColor: '#FF6B35', padding: 20, borderRadius: 100 },
    playText: { marginTop: 16, fontSize: 22, color: 'white', fontWeight: '600' },
    gameOverCard: { backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: 24, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8, width: '90%', maxWidth: 400, gap: 10 },
    gameOverTitle: { fontSize: 32, fontWeight: 'bold', color: '#2D3748' },
    medalContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginVertical: 4,
    },
    medalText: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    finalScore: { fontSize: 24, color: '#4A5568' },
    highScore: { fontSize: 18, color: '#718096' },
    newHighScoreText: { fontSize: 22, fontWeight: 'bold', color: '#38A169' },
    scoreSubmittedText: { fontSize: 16, color: '#38A169', fontStyle: 'italic' },
    input: {
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        width: '100%',
        textAlign: 'center',
        marginTop: 8,
    },
    leaderboardContainer: {
        width: '100%',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E2E8F0',
        paddingVertical: 12,
        marginVertical: 4,
    },
    leaderboardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4A5568',
        textAlign: 'center',
        marginBottom: 8,
    },
    scoreRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    scoreRank: {
        fontSize: 16,
        color: '#718096',
        fontWeight: 'bold',
        flex: 1,
    },
    scoreName: {
        fontSize: 16,
        color: '#4A5568',
        flex: 4,
        textAlign: 'left',
        paddingHorizontal: 8,
    },
    scoreValue: {
        fontSize: 16,
        color: '#2D3748',
        fontWeight: 'bold',
        flex: 2,
        textAlign: 'right',
    },
    noScoresText: {
        textAlign: 'center',
        color: '#718096',
        fontStyle: 'italic',
    },
    restartButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 16, gap: 12, backgroundColor: '#FF6B35', width: '100%' },
    restartButtonText: { fontSize: 18, fontWeight: '600', color: 'white' },
    secondaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 16, gap: 12, borderWidth: 2, borderColor: '#FF6B35', width: '100%' },
    secondaryButtonText: { fontSize: 16, fontWeight: '600', color: '#FF6B35' },
});