import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  customGames: defineTable({
    name: v.string(),
    creatorName: v.string(),
    birdImageId: v.optional(v.id("_storage")),
    backgroundImageId: v.optional(v.id("_storage")), // New field for custom background
    jumpSoundId: v.optional(v.id("_storage")),
    deathSoundId: v.optional(v.id("_storage")),
    highScore: v.number(),
    isPublic: v.boolean(),
    playCount: v.number(),
    description: v.optional(v.string()),
  })
    .index("by_creator", ["creatorName"])
    .index("by_public", ["isPublic"])
    .index("by_public_play_count", ["isPublic", "playCount"])
    .index("by_public_high_score", ["isPublic", "highScore"]),

  gameScores: defineTable({
    gameId: v.id("customGames"),
    playerName: v.string(),
    score: v.number(),
  })
    .index("by_game_and_score", ["gameId", "score"])
    .index("by_game", ["gameId"]),
});