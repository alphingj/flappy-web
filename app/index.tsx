import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

// This is your Ad Unit ID from your AdMob account.
const adUnitID = 'ca-app-pub-4688177552487842/2076960112';

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const styles = getStyles(isMobile);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentWrapper}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Ionicons name="game-controller" size={80} color="#FF6B35" />
            <Text style={styles.title}>Flappy Creator</Text>
            <Text style={styles.subtitle}>Create & Share Custom Flappy Games</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]}
              onPress={() => router.push('/create')}
            >
              <Ionicons name="add-circle" size={24} color="white" />
              <Text style={styles.buttonText}>Create Game</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]}
              onPress={() => router.push('/browse')}
            >
              <Ionicons name="library" size={24} color="#FF6B35" />
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>Browse Games</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]}
              onPress={() => router.push('/my-games')}
            >
              <Ionicons name="person" size={24} color="#FF6B35" />
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>My Games</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Ad Banner at the bottom - only show on native platforms */}
      {Platform.OS !== 'web' && (
        <View style={styles.adContainer}>
          <BannerAd
            unitId={adUnitID}
            size={BannerAdSize.FULL_BANNER}
            onAdFailedToLoad={(error) => console.error('Ad failed to load', error)}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const getStyles = (isMobile: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    width: '100%',
    maxWidth: 500,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: isMobile ? 36 : 48,
    fontWeight: 'bold',
    color: '#2D3748',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: isMobile ? 18 : 20,
    color: '#718096',
    marginTop: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#FF6B35',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  secondaryButtonText: {
    color: '#FF6B35',
  },
  adContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 10, // Some padding for the ad banner
  },
});