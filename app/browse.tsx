import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, useWindowDimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { Doc } from '../convex/_generated/dataModel';

type SortByType = 'plays' | 'score';

function GameCard({ game, numColumns }: { game: Doc<"customGames">; numColumns: number }) {
    const router = useRouter();
    const birdImageUrl = useQuery(api.games.getStorageUrl, game.birdImageId ? { storageId: game.birdImageId } : "skip");

    return (
        <TouchableOpacity style={[styles.card, { flex: 1 / numColumns }]} onPress={() => router.push(`/play/${game._id}`)}>
            <View style={styles.imageContainer}>
                {birdImageUrl ? (
                    <Image source={{ uri: birdImageUrl }} style={styles.birdImage} />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Ionicons name="image-outline" size={32} color="#CBD5E0" />
                    </View>
                )}
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={1}>{game.name}</Text>
                <Text style={styles.cardSubtitle} numberOfLines={1}>by {game.creatorName}</Text>
                {game.description && <Text style={styles.cardDescription} numberOfLines={2}>{game.description}</Text>}
                <View style={styles.statsContainer}>
                    <Ionicons name="game-controller" size={16} color="#718096" />
                    <Text style={styles.statsText}>{game.playCount} plays</Text>
                </View>
                <View style={styles.statsContainer}>
                    <Ionicons name="star" size={16} color="#718096" />
                    <Text style={styles.statsText}>High Score: {game.highScore}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

export default function BrowseGamesScreen() {
    const router = useRouter();
    const [sortBy, setSortBy] = useState<SortByType>('plays');
    const publicGames = useQuery(api.games.getPublicGames, { sortBy });
    const { width } = useWindowDimensions();
    const isWeb = Platform.OS === 'web';

    const getNumColumns = () => {
        if (!isWeb) return 1;
        if (width < 640) return 1;
        if (width < 1024) return 2;
        return 3;
    };

    const numColumns = getNumColumns();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FF6B35" />
                </TouchableOpacity>
                <Text style={styles.title}>Browse Public Games</Text>
            </View>

            <View style={styles.sortContainer}>
                <TouchableOpacity
                    style={[styles.sortButton, sortBy === 'plays' && styles.sortButtonActive]}
                    onPress={() => setSortBy('plays')}
                >
                    <Text style={[styles.sortButtonText, sortBy === 'plays' && styles.sortButtonTextActive]}>Most Played</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.sortButton, sortBy === 'score' && styles.sortButtonActive]}
                    onPress={() => setSortBy('score')}
                >
                    <Text style={[styles.sortButtonText, sortBy === 'score' && styles.sortButtonTextActive]}>Top Score</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.listContainer}>
                {publicGames === undefined && (
                    <ActivityIndicator size="large" color="#FF6B35" style={{ marginTop: 50 }} />
                )}

                {publicGames && publicGames.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="sad-outline" size={64} color="#A0AEC0" />
                        <Text style={styles.emptyText}>No public games found.</Text>
                        <Text style={styles.emptySubtext}>Why not be the first to create one?</Text>
                    </View>
                )}

                {publicGames && publicGames.length > 0 && (
                    <FlatList
                        key={numColumns} // Re-renders the list when number of columns change
                        data={publicGames}
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
    sortContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'center',
        gap: 12,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#E2E8F0',
    },
    sortButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    sortButtonActive: {
        backgroundColor: '#FF6B35',
        borderColor: '#FF6B35',
    },
    sortButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A5568',
    },
    sortButtonTextActive: {
        color: 'white',
    },
    listContainer: {
        flex: 1,
        width: '100%',
        maxWidth: 1200,
    },
    list: { padding: 8 },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        margin: 8,
        flexDirection: 'column',
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
    cardContent: { flex: 1 },
    cardTitle: { fontSize: 18, fontWeight: '600', color: '#2D3748' },
    cardSubtitle: { fontSize: 14, color: '#718096', marginTop: 2 },
    cardDescription: { fontSize: 14, color: '#4A5568', marginTop: 8, fontStyle: 'italic' },
    statsContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8, },
    statsText: { marginLeft: 4, fontSize: 12, color: '#718096' },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#4A5568',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 16,
        color: '#718096',
        marginTop: 8,
        textAlign: 'center',
    },
});