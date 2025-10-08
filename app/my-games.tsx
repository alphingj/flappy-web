import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Share, useWindowDimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { Doc } from '../convex/_generated/dataModel';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CREATOR_NAME_KEY = 'creatorName';

const handleShare = async (game: Doc<"customGames">) => {
    try {
      await Share.share({
        message: `Check out this Flappy Bird game I made: "${game.name}"! myapp://play/${game._id}`,
      });
    } catch (error) {
      console.error('Error sharing game:', error);
    }
};

function GameCard({ game, numColumns }: { game: Doc<"customGames">; numColumns: number }) {
    const router = useRouter();
    const birdImageUrl = useQuery(api.games.getStorageUrl, game.birdImageId ? { storageId: game.birdImageId } : "skip");

    return (
        <TouchableOpacity style={[styles.card, { flex: 1 / numColumns }]} onPress={() => router.push(`/play/${game._id}`)}>
            <View style={styles.imageContainer}>
                {birdImageUrl ? (
                    <Image source={{ uri: birdImageUrl }} style={styles.birdImage} />
                ) : (
                    <View style={styles.imagePlaceholder} />
                )}
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{game.name}</Text>
                <Text style={styles.cardSubtitle}>by {game.creatorName}</Text>
                <View style={styles.statsContainer}>
                    <Ionicons name="game-controller" size={16} color="#718096" />
                    <Text style={styles.statsText}>{game.playCount} plays</Text>
                </View>
                <View style={styles.statsContainer}>
                    <Ionicons name="star" size={16} color="#718096" />
                    <Text style={styles.statsText}>High Score: {game.highScore}</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.shareIcon} onPress={() => handleShare(game)}>
                <Ionicons name="share-social" size={24} color="#FF6B35" />
            </TouchableOpacity>
        </TouchableOpacity>
    );
}

export default function MyGamesScreen() {
    const router = useRouter();
    const [creatorName, setCreatorName] = useState('');
    const [isNameLoaded, setIsNameLoaded] = useState(false);
    
    const { width } = useWindowDimensions();
    const isWeb = Platform.OS === 'web';

    const getNumColumns = () => {
        if (!isWeb) return 1;
        if (width < 640) return 1;
        if (width < 1024) return 2;
        return 3;
    };
    const numColumns = getNumColumns();

    // Load creator name from storage on initial render
    useEffect(() => {
        const loadName = async () => {
            try {
                const storedName = await AsyncStorage.getItem(CREATOR_NAME_KEY);
                if (storedName) {
                    setCreatorName(storedName);
                }
            } catch (e) {
                console.error("Failed to load creator name.", e);
            } finally {
                setIsNameLoaded(true);
            }
        };
        loadName();
    }, []);

    const myGames = useQuery(api.games.getMyGames, isNameLoaded && creatorName ? { creatorName } : 'skip');

    const handleNameChange = async (name: string) => {
        setCreatorName(name);
        try {
            await AsyncStorage.setItem(CREATOR_NAME_KEY, name);
        } catch (e) {
            console.error("Failed to save creator name.", e);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FF6B35" />
                </TouchableOpacity>
                <Text style={styles.title}>My Games</Text>
            </View>

            <View style={styles.listContainer}>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter Your Creator Name to Find Your Games"
                        value={creatorName}
                        onChangeText={handleNameChange}
                        editable={isNameLoaded} // Prevent editing until name is loaded
                    />
                </View>

                {!isNameLoaded && (
                     <ActivityIndicator size="large" color="#FF6B35" style={{ marginTop: 50 }} />
                )}

                {isNameLoaded && creatorName && myGames === undefined && (
                    <ActivityIndicator size="large" color="#FF6B35" style={{ marginTop: 50 }} />
                )}
                
                {isNameLoaded && creatorName && myGames && myGames.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="sad-outline" size={64} color="#A0AEC0" />
                        <Text style={styles.emptyText}>No games found for "{creatorName}".</Text>
                    </View>
                )}

                {myGames && myGames.length > 0 && (
                    <FlatList
                        key={numColumns}
                        data={myGames}
                        numColumns={numColumns}
                        renderItem={({ item }) => <GameCard game={item} numColumns={numColumns} />}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={styles.list}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        width: '100%',
    },
    backButton: { padding: 8 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#2D3748', marginLeft: 16 },
    listContainer: {
        flex: 1,
        width: '100%',
        maxWidth: 1200,
    },
    inputContainer: {
        padding: 16,
    },
    input: {
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    list: { paddingHorizontal: 8, paddingBottom: 16 },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        margin: 8,
        flexDirection: 'column',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    birdImage: { width: '75%', height: '75%', resizeMode: 'contain' },
    imagePlaceholder: {},
    cardContent: { flex: 1, width: '100%' },
    cardTitle: { fontSize: 18, fontWeight: '600', color: '#2D3748' },
    cardSubtitle: { fontSize: 14, color: '#718096', marginTop: 2 },
    statsContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    statsText: { marginLeft: 4, fontSize: 12, color: '#718096' },
    shareIcon: {
        position: 'absolute',
        top: 8,
        right: 8,
        padding: 8,
        zIndex: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#4A5568',
        marginTop: 16,
        textAlign: 'center'
    },
});