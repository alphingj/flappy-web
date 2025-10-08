// FIX: Define import.meta.env for TypeScript to resolve Vite client type errors. This replaces the problematic `/// <reference types="vite/client" />` which was causing a "Cannot find type definition file" error.
declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_CONVEX_URL: string;
    };
  }
}

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomeScreen from "./pages/Home";
import CreateGameScreen from "./pages/CreateGame";
import BrowseGamesScreen from "./pages/BrowseGames";
import MyGamesScreen from "./pages/MyGames";
import PlayGameScreen from "./pages/PlayGame";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

export default function App() {
  return (
    <ConvexProvider client={convex}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/create" element={<CreateGameScreen />} />
          <Route path="/browse" element={<BrowseGamesScreen />} />
          <Route path="/my-games" element={<MyGamesScreen />} />
          <Route path="/play/:gameId" element={<PlayGameScreen />} />
        </Routes>
      </BrowserRouter>
    </ConvexProvider>
  );
}