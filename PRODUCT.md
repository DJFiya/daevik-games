# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: anyone online who lands on games.daevik.ca and wants a quick party game with other people, including strangers with no voice chat.
Secondary use case: friends on a call, where one person starts a room and drops the link in a group chat or Discord.

## Product Purpose

A small collection of browser multiplayer party games, starting with social deduction games where one hidden player blends in (impostor-style). games.daevik.ca is a hub: a page of cards, one per game, each leading into that game. Each game has its own visual world (The Odd One, the word impostor game, uses a 1970s game show set). Success: a group gets from a link to playing in seconds, on any device, without accounts.

## Positioning

Personal games site under the daevik.ca name; original games, not clones of branded titles.

## Operating Context

- Played on phones and laptops equally; every screen must work well on both.
- Sessions are short rounds, a few minutes each, 3 to 10 players.
- Rooms are joined by link or short code. No accounts.

## Capabilities and Constraints

- Server-authoritative rooms on Cloudflare Durable Objects; the server hides secret roles and words from players who must not see them.
- Lobby today: pick a name, start a room, join by code, see who is in the room.
- Undecided: public rooms / quick play with strangers, the first game, moderation for public play.

## Brand Commitments

- Must not read as AI-generated or template-made (see CLAUDE.md design rules).
- Personality shown through interaction, not explanatory copy. Plain, confident copy; no puns or taglines.
- Slate blue preferred over green as a default accent.

## Evidence on Hand

No game art, logos, or player numbers yet. Do not invent player counts, testimonials or stats.

## Product Principles

- Link to playing in seconds.
- Fair secrets: hidden information is never sent to a player who should not have it.
- Works without voice chat, better with it.
