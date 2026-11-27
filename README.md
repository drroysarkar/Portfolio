# Divyanshu Kumar — Atlas Portfolio (next-gen redesign)

Same Next.js 16 / React 19 / Tailwind 4 / zustand stack and same data (`src/lib/data.ts`) — new everything else.

Run: `bun install && bun dev`   (or npm install && npm run dev)

## What changed
- **Theme**: "Obsidian & Volt" night / "Paper & Indigo" day (tokens in `src/app/globals.css`).
- **Drive map → ATLAS** (`src/lib/atlas*.ts`, `components/DriveMode.tsx`): dependency-free top-down canvas map, 6 districts, ring road + 6 avenues, minimap, traffic, drift/skids, boost pads, shards, 6 expeditions, teleport menu, touch joystick, map follows site theme.
- **Museum** (`components/Museum.tsx`, `app/museum.css`): first-person CSS-3D gallery, 8 halls, framed generative art, museum labels, catalogue dossier, plan view.
- **AI assistant**: fixed bottom-right ("Ask AI"), above all overlays, no HUD element uses that corner.
- Hero, top bar, journey timeline, projects, stack board, contact, command palette, preloader all rebuilt.
- Cell Lab + Stack graph logic unchanged, re-skinned. `/api/chat` and `lib/bot.ts` kept (copy updated).
- Removed the three.js world; `three`/`@react-three/*` are now unused and can be dropped from package.json.
