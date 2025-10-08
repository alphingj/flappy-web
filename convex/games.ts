// FIX: Correcting the import path to point to the `_generatedtest` directory.
import { query, mutation } from "./_generatedtest/server";
import { v } from "convex/values";

export const createGame = mutation({
  args: {
    name: v.string(),
    creatorName: v.string(),
    birdImageId: v.optional(v.id("_storage")),
    backgroundImageId: v.optional(v.id("_storage")),
    jumpSoundId: v.optional(v.id("_storage")),
    deathSoundId: v.optional(v.id("_storage")),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const gameId = await ctx.db.insert("customGames", {
      name: args.name,
      creatorName: args.creatorName,
      birdImageId: args.birdImageId,
      backgroundImageId: args.backgroundImageId,
      jumpSoundId: args.jumpSoundId,
      deathSoundId: args.deathSoundId,
      description: args.description,
      isPublic: args.isPublic,
      highScore: 0,
      playCount: 0,
    });
    return gameId;
  },
});

export const getGame = query({
  args: { gameId: v.id("customGames") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.gameId);
  },
});

export const getPublicGames = query({
  args: { sortBy: v.union(v.literal("plays"), v.literal("score")) },
  handler: async (ctx, args) => {
    const index =
      args.sortBy === "plays"
        ? "by_public_play_count"
        : "by_public_high_score";

    return await ctx.db
      .query("customGames")
      .withIndex(index, (q) => q.eq("isPublic", true))
      .order("desc")
      .collect();
  },
});

export const getMyGames = query({
  args: { creatorName: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("customGames")
      .withIndex("by_creator", (q) => q.eq("creatorName", args.creatorName))
      .order("desc")
      .collect();
  },
});

export const updateHighScore = mutation({
  args: {
    gameId: v.id("customGames"),
    score: v.number(),
    playerName: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    // Update high score if this is a new record
    if (args.score > game.highScore) {
      await ctx.db.patch(args.gameId, { highScore: args.score });
    }

    // Record the score
    await ctx.db.insert("gameScores", {
      gameId: args.gameId,
      playerName: args.playerName,
      score: args.score,
    });

    // Increment play count
    await ctx.db.patch(args.gameId, { playCount: game.playCount + 1 });
  },
});

export const getGameScores = query({
  args: { gameId: v.id("customGames") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("gameScores")
      .withIndex("by_game_and_score", (q) => q.eq("gameId", args.gameId))
      .order("desc")
      .take(10);
  },
});

// Generic query to get a URL for any file in storage
export const getStorageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});