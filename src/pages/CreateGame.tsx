import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import './CreateGame.css';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};

export default function CreateGameScreen() {
  const navigate = useNavigate();

  const [gameName, setGameName] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  
  const [birdImage, setBirdImage] = useState<{file: File, preview: string} | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<{file: File, preview: string} | null>(null);
  const [jumpSound, setJumpSound] = useState<File | null>(null);
  const [deathSound, setDeathSound] = useState<File | null>(null);

  const [isCreatingGame, setIsCreatingGame] = useState(false);

  const generateUploadUrl = useMutation(api.games.generateUploadUrl);
  const createGameMutation = useMutation(api.games.createGame);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (file: File | null) => void) => {
    const file = e.target.files?.[0];
    if (file) setter(file);
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (img: {file: File, preview: string} | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      setter({ file, preview: URL.createObjectURL(file) });
    }
  };

  const handleCreateGame = async () => {
    if (!gameName || !creatorName || !birdImage) {
      alert('Missing Info: Please fill out Game Name, Your Name, and select a bird image.');
      return;
    }

    setIsCreatingGame(true);

    try {
      // Helper function to upload a file and get storage ID
      const uploadFile = async (file: File): Promise<Id<"_storage">> => {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: 'POST',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        const { storageId } = await result.json();
        return storageId;
      };

      const birdImageId = await uploadFile(birdImage.file);
      const backgroundImageId = backgroundImage ? await uploadFile(backgroundImage.file) : undefined;
      const jumpSoundId = jumpSound ? await uploadFile(jumpSound) : undefined;
      const deathSoundId = deathSound ? await uploadFile(deathSound) : undefined;

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

      alert('Success! Your game has been created.');
      navigate('/');

    } catch (error) {
      console.error('Error creating game:', error);
      alert('Error: Failed to create the game. Please try again.');
    } finally {
      setIsCreatingGame(false);
    }
  };

  return (
    <div className="create-container">
      <main className="create-scroll-content">
        <header className="create-header">
          <button onClick={() => navigate(-1)} className="create-back-button">
            <Ionicons name="arrow-back" size={24} color="#FF6B35" />
          </button>
          <h1 className="create-title">Create New Game</h1>
        </header>

        <form className="create-form" onSubmit={(e) => { e.preventDefault(); handleCreateGame(); }}>
          <label className="create-label" htmlFor="gameName">Game Name</label>
          <input id="gameName" className="create-input" type="text" placeholder="My Awesome Flappy Game" value={gameName} onChange={(e) => setGameName(e.target.value)} />
          
          <label className="create-label" htmlFor="creatorName">Your Name</label>
          <input id="creatorName" className="create-input" type="text" placeholder="Creator" value={creatorName} onChange={(e) => setCreatorName(e.target.value)} />

          <label className="create-label" htmlFor="description">Description</label>
          <textarea id="description" className="create-input create-textarea" placeholder="A short description of your game" value={description} onChange={(e) => setDescription(e.target.value)} />

          <hr className="create-divider" />

          <h2 className="create-section-title">Custom Bird (Required)</h2>
          <label className="create-file-button">
            <Ionicons name="image" size={20} color="#FF6B35" />
            <span>Select Image</span>
            <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, setBirdImage)} style={{ display: 'none' }} />
          </label>
          <div className="create-image-preview-container">
            {birdImage ? <img src={birdImage.preview} alt="Bird Preview" className="create-bird-image" /> : <p className="create-placeholder-text">Bird Preview</p>}
          </div>

          <hr className="create-divider" />

          <h2 className="create-section-title">Custom Background (Optional)</h2>
          <label className="create-file-button">
              <Ionicons name="map" size={20} color="#FF6B35" />
              <span>Select Image</span>
              <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, setBackgroundImage)} style={{ display: 'none' }} />
          </label>
          <div className="create-image-preview-container">
            {backgroundImage ? <img src={backgroundImage.preview} alt="Background Preview" className="create-background-image" /> : <p className="create-placeholder-text">Background Preview</p>}
          </div>

          <hr className="create-divider" />

          <h2 className="create-section-title">Custom Sounds (Optional)</h2>
          <label className="create-file-button">
            <Ionicons name="musical-notes" size={20} color="#FF6B35" />
            <span>{jumpSound ? `Jump: ${jumpSound.name}` : 'Select Jump Sound'}</span>
            <input type="file" accept="audio/*" onChange={(e) => handleFileChange(e, setJumpSound)} style={{ display: 'none' }} />
          </label>
          <label className="create-file-button">
            <Ionicons name="skull" size={20} color="#FF6B35" />
            <span>{deathSound ? `Death: ${deathSound.name}` : 'Select Death Sound'}</span>
            <input type="file" accept="audio/*" onChange={(e) => handleFileChange(e, setDeathSound)} style={{ display: 'none' }} />
          </label>
          
          <hr className="create-divider" />

          <div className="create-switch-container">
            <label className="create-label" htmlFor="isPublic">Make Game Public</label>
            <input id="isPublic" type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
          </div>
          <p className="create-subtitle">Anyone will be able to find and play your game.</p>
        </form>
      </main>

      <footer className="create-footer">
        <button className="create-submit-button" onClick={handleCreateGame} disabled={isCreatingGame}>
          {isCreatingGame ? 'Creating...' : <><Ionicons name="add-circle" size={24} color="white" /><span>Create Game</span></>}
        </button>
      </footer>

      {isCreatingGame && (
        <div className="create-loading-overlay">
          <div className="create-loading-content">
            <p className="create-loading-text">Creating Your Game...</p>
            <p className="create-loading-subtext">Uploading assets may take a moment.</p>
          </div>
        </div>
      )}
    </div>
  );
}
