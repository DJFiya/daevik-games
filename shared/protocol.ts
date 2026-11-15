import { z } from "zod";

export const MAX_PLAYERS = 8;
export const MAX_MESSAGE_BYTES = 4096;

export const PlayerName = z.string().trim().min(1).max(20);

export const ClientMessage = z.discriminatedUnion("type", [
  z.object({ type: z.literal("join"), name: PlayerName }),
]);
export type ClientMessage = z.infer<typeof ClientMessage>;

export const Player = z.object({ id: z.string(), name: z.string() });
export type Player = z.infer<typeof Player>;

export const ServerMessage = z.discriminatedUnion("type", [
  z.object({ type: z.literal("welcome"), you: z.string() }),
  z.object({ type: z.literal("players"), players: z.array(Player) }),
  z.object({ type: z.literal("rejected"), reason: z.enum(["full", "invalid"]) }),
]);
export type ServerMessage = z.infer<typeof ServerMessage>;
