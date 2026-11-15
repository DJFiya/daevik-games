import { z } from "zod";

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 8;
export const MAX_MESSAGE_BYTES = 4096;

export const PlayerName = z.string().trim().min(3).max(20);

export const ClientMessage = z.discriminatedUnion("type", [
  z.object({ type: z.literal("join"), name: PlayerName }),
  z.object({ type: z.literal("start") }),
]);
export type ClientMessage = z.infer<typeof ClientMessage>;

export const Player = z.object({ id: z.string(), name: z.string(), host: z.boolean() });
export type Player = z.infer<typeof Player>;

export const Phase = z.enum(["lobby", "playing"]);
export type Phase = z.infer<typeof Phase>;

export const ServerMessage = z.discriminatedUnion("type", [
  z.object({ type: z.literal("welcome"), you: z.string() }),
  z.object({ type: z.literal("players"), players: z.array(Player) }),
  z.object({ type: z.literal("phase"), phase: Phase }),
  z.object({ type: z.literal("rejected"), reason: z.enum(["full", "started", "invalid"]) }),
]);
export type ServerMessage = z.infer<typeof ServerMessage>;
