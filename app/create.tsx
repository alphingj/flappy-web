import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';

// Helper to convert base64 to a Blob for uploading
const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};


export default function CreateGameScreen() {
  const router = useRouter();

  // Form State
  const [gameName, setGameName] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  
  // Asset State
  const [birdImageBase64, setBirdImageBase64] = useState<string | null>(null);
  const [backgroundImageBase64, setBackgroundImageBase64] = useState<string | null>(null);
  const [jumpSound, setJumpSound] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [deathSound, setDeathSound] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  // Loading State
  const [isCreatingGame, setIsCreatingGame] = useState(false);

  // Convex Hooks
  const generateUploadUrl = useMutation(api.games.generateUploadUrl);
  const createGameMutation = useMutation(api.games.createGame);

  const handlePickImage = async (setter: React.Dispatch<React.SetStateAction<string | null>>, aspect: [number, number] = [1,1]) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: aspect,
      quality: 1,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0].base64) {
      setter(result.assets[0].base64);
    }
  };


  const pickSound = async (setter: React.Dispatch<React.SetStateAction<DocumentPicker.DocumentPickerAsset | null>>) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled === false && result.assets && result.assets[0]) {
        setter(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Could not select the file.');
    }
  };

  const handleCreateGame = async () => {
    if (!gameName || !creatorName || !birdImageBase64) {
      Alert.alert('Missing Info', 'Please fill out Game Name, Your Name, and select a bird image.');
      return;
    }

    setIsCreatingGame(true);

    try {
      const birdImageBlob = base64ToBlob(birdImageBase64, 'image/png');
      const birdPostUrl = await generateUploadUrl();
      const birdResult = await fetch(birdPostUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'image/png' },
        body: birdImageBlob,
      });
      const { storageId: birdImageId } = await birdResult.json();
      
      let backgroundImageId: Id<"_storage"> | undefined = undefined;
      if (backgroundImageBase64) {
        const bgImageBlob = base64ToBlob(backgroundImageBase64, 'image/png');
        const bgPostUrl = await generateUploadUrl();
        const bgResult = await fetch(bgPostUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'image/png' },
            body: bgImageBlob,
        });
        const { storageId } = await bgResult.json();
        backgroundImageId = storageId;
      }

      let jumpSoundId: Id<"_storage"> | undefined = undefined;
      if (jumpSound?.uri) {
        const jumpResponse = await fetch(jumpSound.uri);
        const jumpBlob = await jumpResponse.blob();
        const jumpPostUrl = await generateUploadUrl();
        const jumpResult = await fetch(jumpPostUrl, {
            method: 'POST',
            headers: { 'Content-Type': jumpSound.mimeType || 'application/octet-stream' },
            body: jumpBlob,
        });
        const { storageId } = await jumpResult.json();
        jumpSoundId = storageId;
      }
      
      let deathSoundId: Id<"_storage"> | undefined = undefined;
      if (deathSound?.uri) {
        const deathResponse = await fetch(deathSound.uri);
        const deathBlob = await deathResponse.blob();
        const deathPostUrl = await generateUploadUrl();
        const deathResult = await fetch(deathPostUrl, {
            method: 'POST',
            headers: { 'Content-Type': deathSound.mimeType || 'application/octet-stream' },
            body: deathBlob,
        });
        const { storageId } = await deathResult.json();
        deathSoundId = storageId;
      }

      await createGameMutation({
        name: gameName,
        creatorName,
        description,
        isPublic,
        birdImageId,
        backgroundImageId,
        jumpSoundId,
        deathSoundId,
      });

      Alert.alert('Success!', 'Your game has been created.');
      router.push('/');

    } catch (error) {
      console.error('Error creating game:', error);
      Alert.alert('Error', 'Failed to create the game. Please try again.');
    } finally {
      setIsCreatingGame(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FF6B35" />
            </TouchableOpacity>
            <Text style={styles.title}>Create New Game</Text>
          </View>

          <View style={styles.form}>
            {/* Game Info */}
            <Text style={styles.label}>Game Name</Text>
            <TextInput style={styles.input} placeholder="My Awesome Flappy Game" value={gameName} onChangeText={setGameName} />
            <Text style={styles.label}>Your Name</Text>
            <TextInput style={styles.input} placeholder="Creator" value={creatorName} onChangeText={setCreatorName} />
            <Text style={styles.label}>Description</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="A short description of your game" value={description} onChangeText={setDescription} multiline />

            <View style={styles.divider} />

            {/* Bird Asset */}
            <Text style={styles.sectionTitle}>Custom Bird (Required)</Text>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => handlePickImage(setBirdImageBase64, [1, 1])}>
              <Ionicons name="image" size={20} color="#FF6B35" />
              <Text style={styles.secondaryButtonText}>Select Image</Text>
            </TouchableOpacity>
            <View style={styles.imagePreviewContainer}>
              {birdImageBase64 ? <Image source={{ uri: `data:image/png;base64,${birdImageBase64}` }} style={styles.birdImage} /> : <Text style={styles.placeholderText}>Bird Preview</Text>}
            </View>

            <View style={styles.divider} />

            {/* Background Asset */}
            <Text style={styles.sectionTitle}>Custom Background (Optional)</Text>
             <TouchableOpacity style={styles.secondaryButton} onPress={() => handlePickImage(setBackgroundImageBase64, [9, 16])}>
                <Ionicons name="map" size={20} color="#FF6B35" />
                <Text style={styles.secondaryButtonText}>Select Image</Text>
              </TouchableOpacity>
            <View style={styles.imagePreviewContainer}>
              {backgroundImageBase64 ? <Image source={{ uri: `data:image/png;base64,${backgroundImageBase64}` }} style={styles.backgroundImagePreview} /> : <Text style={styles.placeholderText}>Background Preview</Text>}
            </View>

            <View style={styles.divider} />

            {/* Sound Assets */}
            <Text style={styles.sectionTitle}>Custom Sounds (Optional)</Text>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => pickSound(setJumpSound)}>
              <Ionicons name="musical-notes" size={20} color="#FF6B35" />
              <Text style={styles.secondaryButtonText}>{jumpSound ? `Jump: ${jumpSound.name}` : 'Select Jump Sound'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => pickSound(setDeathSound)}>
              <Ionicons name="skull" size={20} color="#FF6B35" />
              <Text style={styles.secondaryButtonText}>{deathSound ? `Death: ${deathSound.name}` : 'Select Death Sound'}</Text>
            </TouchableOpacity>
            
            <View style={styles.divider} />

            {/* Public Switch */}
            <View style={styles.switchContainer}>
              <Text style={styles.label}>Make Game Public</Text>
              <Switch trackColor={{ false: "#767577", true: "#FFB399" }} thumbColor={isPublic ? "#FF6B35" : "#f4f3f4"} onValueChange={setIsPublic} value={isPublic} />
            </View>
             <Text style={styles.subtitle}>Anyone will be able to find and play your game.</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer / Create Button */}
      <View style={styles.footer}>
          <TouchableOpacity style={[styles.button, styles.primaryButton, isCreatingGame && styles.disabledButton]} onPress={handleCreateGame} disabled={isCreatingGame}>
            {isCreatingGame ? <ActivityIndicator color="white" /> : <><Ionicons name="add-circle" size={24} color="white" /><Text style={styles.buttonText}>Create Game</Text></>}
          </TouchableOpacity>
      </View>

      {/* Loading Overlay */}
      {isCreatingGame && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Creating Your Game...</Text>
          <Text style={styles.loadingSubtext}>Uploading assets may take a moment.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContainer: { 
    alignItems: 'center', // Center content on web
  },
  scrollContent: { 
    width: '100%',
    maxWidth: 800, // Max width for form content
    padding: 24, 
    paddingBottom: 120 
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backButton: { padding: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2D3748', marginLeft: 16 },
  form: { gap: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#2D3748', paddingBottom: 4, borderBottomWidth: 2, borderColor: '#FF6B35' },
  label: { fontSize: 16, fontWeight: '600', color: '#4A5568' },
  subtitle: { fontSize: 14, color: '#718096', marginTop: -12 },
  input: { backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  textArea: { height: 100, textAlignVertical: 'top' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 16 },
  imagePreviewContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 16, backgroundColor: 'white', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', minHeight: 160 },
  placeholderText: { color: '#A0AEC0', fontStyle: 'italic' },
  birdImage: { width: 128, height: 128, resizeMode: 'contain' },
  backgroundImagePreview: { width: 128, height: 128 * 16 / 9, resizeMode: 'contain', borderRadius: 8 },
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footer: { 
    position: Platform.OS === 'web' ? 'fixed' as any : 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    alignItems: 'center',
  },
  button: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 16, 
    paddingHorizontal: 24, 
    borderRadius: 16, 
    gap: 12,
    width: '100%',
    maxWidth: 800,
    backgroundColor: '#F8F9FA', 
    borderTopWidth: 1, 
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: {
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
      }
    }),
  },
  primaryButton: { backgroundColor: '#FF6B35' },
  disabledButton: { backgroundColor: '#FFB399' },
  secondaryButton: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: 'white', borderWidth: 2, borderColor: '#FF6B35', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, justifyContent: 'center' },
  buttonText: { fontSize: 18, fontWeight: '600', color: 'white' },
  secondaryButtonText: { fontSize: 16, fontWeight: '600', color: '#FF6B35' },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(248, 249, 250, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 16,
    color: '#718096',
  },
});