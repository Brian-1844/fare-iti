# Fare Iti — handover kit (for the next session)

Upload this whole folder (or `fare-iti.zip`) at the start of the next session and say: "Continue Fare Iti from HANDOVER.md".

## State
- Version: **v56** (`sw.js` VERSION `fare-iti-v56`). Live on GitHub Pages: https://brian-1844.github.io/fare-iti/ once these files are uploaded. Preview artifact: https://claude.ai/artifact/9Ec7YmhELs6LGAw9bGC6dM
- Stack: plain HTML/CSS/JS, three.js r128 (`lib/three.min.js`), no build step. `game.js` = everything (blocks appended before the `Main loop` marker), `data.js` = base data, `fr.js` = French strings (built from English), `lang.js` = language, welcome, PWA install/updates, scroll helpers.
- Bilingual pattern: new text uses `LG(fr,en)`; containers with `data-notr` are not auto-translated.
- Override pattern: `const _f0=f; f=function(...){...; return _f0(...)}`.
- Debug: open `index.html#debug` → `window.__fare` (S, give, openSheet, fr.*, expe.*, …).
- Save: `localStorage['fare-iti-v3']`.

## Done in v55–v56
- Performance audit (2026-11-09, low quality, phone viewport): ~200 draw calls, ~130k triangles, 1,450 meshes (830 visible), 395 shadow casters, 7 lights (4 point lights computed even at 0 intensity), 365 materials, 109 sprites. JS per frame is small (~3% of a frame on desktop); the cost is on the GPU: shadow pass, pixel count, lights, transparent sprites.
- Done: quality levels `eco`/`ultra` (`ECO`, `ULTRA` flags; `LOWQ` includes eco, `HIQ` includes ultra), shadow-map throttling, half-rate rendering behind sheets, eco point lights off, FPS advisor (`FPSA`), PCF (not soft) shadows on low.
- Not done yet (next perf steps): merge static meshes of buildings (draw calls), `matrixAutoUpdate=false` on static objects, fewer shadow casters (only big objects), cheaper materials in eco (Toon → Lambert needs care with `toonify`), texture atlas for sprites.
- Craft search (`CRAFT_Q`, `craftMatch`), trade specialities (`SPEC`, `specOK`), every recipe without `cat` now goes to 'crafts' (the fireworks recipe was invisible).
- Map: `mapSheet`/`drawMap` (sheet `carte`, M key). No HUD button on purpose: the top bar is already full on narrow phones.
- Fixed: trade tools ʻō and toʻi reused the item keys of the basic tools `oo`/`toi`; now `oometier`/`toimetier`.

## Done in v54
Paths `S.paths` {a,b,m,deco} (`PATHS` 5 materials, `PDECO`), walking speed via `pathSpeed()` patched into the main-loop speed line, wooden boardwalk walkable over shallow water (walkable/groundY wrappers). Cables `S.cables` {a,b,k,broken} (`CABLE`), wired lamps −25% use, overhead lines may break in `cycHit`. Team `S.team` {home, list} (`STAFF_R`), daily `teamDay()`, staff bodies via `makePerson`. Secret trade `plombier`. Debug `__fare.v54`.

## Done in v53
Craft menu (`craftSheet`) shows only recipes with `lv <= S.level`, tabs appear when they have one, and a teaser line gives the count for the next level (Brian: showing everything from the start is confusing).

## Done in v52 · Trades
`MET` (15 trades, 9 secret), `S.met` {k, xp, quest, bld, day, found}; XP comes from `stat()` keys (wrapper); capacities wrap finishCast, growBonus, harvest, workDur, finishWork, addLove, v10Rating, priceOf, addTrust, expeHours, expeRisk, v10Sim, lagLimit; buildings `metbld` (recipe, one per trade, daily action), quests `MQ`, fireworks `fireShow()`. Debug `__fare.v52`.

## Brian's long-term vision (2026-11-09)
- Players develop ports, villages and market towns that stay ecological and respectful of people, nature, resources and animals; a place for public debate.
- Trade between players, each specialised in a trade (done locally in v52; trade between players still to do, same fair-value rule as island trade).
- Special buildings (vet clinic, police post, weather station, school: done as trade buildings) and, at some level of development, inhabitants living on your island.
- Suggested order: trade between friends → shared village + real assembly between players → port market → town with a central fare pōteʻe; inhabitants on the island.

## Done in v51 · Friends’ vaʻa (Supabase)
- Supabase project **fare-iti** (ref `zzghnxjcddawcwfwvvus`, us-west-1, org "Pièce Fenua", separate from the `piece-fenua` project). Schema = `supabase.sql` (applied as migration `fare_iti_entraide`). Tables closed (RLS, no policies); everything goes through `fi_*` security-definer RPCs (advisor warnings about this are intentional).
- Client: `config.js` (URL + publishable key), block v51 in game.js: anonymous sign-in via `/auth/v1/signup`, `rpc()`, `commSync()`, sheet `amis`. Debug `__fare.v51`.
- **Brian must turn on** Authentication › Sign In / Providers › "Allow anonymous sign-ins" (not possible through the MCP tools).
- Tested end to end with two browsers against a local copy of the schema; on the real project only SQL was tested (the sandbox can't reach supabase.co). The claude.ai preview artifact doesn't load config.js, so the friends' vaʻa shows "Coming soon" there; test it on GitHub Pages.

## Done in v48–v50
- v48: `catchUp(sec)` grows plants offline (on load from `S.lastT`, and on return from background when the frame gap > 15 s); dead leaves `S.leaves` (+ item `leaves`) → compost. Debug `__fare.v48`.
- v49: `S.solarp` (bat), `S.still` (w cups), `S.hydro` (w, fert, out); shop items `spanel`, `glass`; electric lamps use the solar battery first (`v10Sim` wrapper restores the generator fuel). Debug `__fare.v49`.
- v50: extra bungalows `S.bungx` (the v32 single-bungalow code is reused by swapping `S.bungalow` in `withB`); treetop course `S.acro` {trees, end, lad} with the ride `RIDE`. Debug `__fare.v50`.
- Brian asked (2026-11-09) at which level islands open: expeditions lv 5 + vaʻa; sailing yourself lv 12 + sail (lv 10). He may want these earlier.

## Done in v47
Creation mode (`CRE`, `creItems()` lists {obj, mesh, r}; moving shifts the mesh by the delta and updates `S.x/z`; the main-loop camera uses `CRE.x/z/d` when `CRE.on`; `overlayOpen()` is true so time stops). Fixed the goélette lying on its side (`makeBoat`: `g.add(...).rotation.set` rotated the whole group). Debug `__fare.v47`.
Not movable yet: canoe, pontoon/port/pearl farm (tied to the wharf), bungalow and pflot (on the water), helipad, assembly buildings (`S.gov.b`).

## Done in v46
Bird companions (`COMP`, `S.comp` {k, names, skin, met}): Manu, ʻitatae (lagoon health 80 → `S.flags.lag80`; white-tern marker over the best shoal), ʻōmamao (5 planted native trees → `S.flags.omamaoOk`; no bonus). The chosen bird repaints the guide model (`paintManu` override) and takes its name. Debug `__fare.v46`. Brian chose only these two new birds (not vini, ʻura, ʻōtatare, ʻūʻupa) and wants the companion to replace Manu as guide.

## Done in v44–v45 (rebuilt on 2026-11-09 from the preview artifact, which was ahead of the v43 zip)
- v44: Charte du fenua (accepted on arrival), lagoon health (`S.lagoon`, daily limit, release choice, rāhui in 4 sectors with a pou), win-win trade between islands (`S.trade`: fair value, trust, return gifts). Debug `__fare.v44`.
- v45: Te ʻĀpoʻoraʻa, the assembly of the neighbouring motu (`S.gov`: proposals, amendments, one person one vote, shared buildings), gendered texts (`GF`), "Ce que tu apportes" (sincere thanks and roles, no ranking). Debug `__fare.v45`.
- Always take the latest files from the preview artifact if it is newer than the zip (`list_files` / `read_file`).

## Done in v43
Intro story (no gods), name + clearly sexed character, 5 gear slots with unlockable models and a limited edition, 360° view, animals as friends (names, love levels 1–10, gifts, babies, loneliness, accessories, sheet), Manu levels/abilities/gear, mandatory tutorial, real-time building jobs and level-scaled growth, vaʻa expeditions (10 islands, exploration %, weather/cyclone/lean months). See README "v43".

## Vision (Brian, 2026-11-08)
The game promotes friendship, mutual help, respect for others and for nature, taking care of nature and of people, cultivating relationships, free win-win trade (never winner/loser, never "us against them"), everyone united in the same wish for prosperity, all equal before the law.

## Start the next session with
Items 1–3 of the old list (trade, lagoon/rāhui, charter) are done in v44. Next: check anonymous sign-ins are on, test the friends' vaʻa on GitHub Pages with 2 phones, Brian's feedback on v46–v51 (and maybe earlier island levels), then item 5–7.

## To do next (Brian's requests, in his order)
1. ~~Bird companions~~ done in v46.
2. ~~Creation mode~~ done in v47 (land buildings).
3. ~~Community between players~~ done in v51 (Supabase). Next ideas there: trade between players with the same fair-value rule, visiting a friend's motu (read-only snapshot).
4. ~~Offline growth for plants~~ done in v48.
5. Skins/limited editions with real brands later (sell in game): needs Google merchant profile; keep `GEAR` catalogue (`ed` flag = limited).
6. APK: Capacitor project; needs `dl.google.com`, `maven.google.com`, `repo.maven.apache.org` allowed in claude.ai settings, or Android Studio on a PC.
7. Test on real phones with ~10 players and simplify.

## Rules from Brian to keep
- Win-win only: no pay-to-win, no winner/loser trade, no us-against-them.
- Multiplayer safety: ready-made messages instead of free chat, friends added by code only.
- No money amounts in sponsor decks; open to any exchange (tickets…).
- UV / hunger penalties stay light.
- Animals are friends: no harm, no killing, love is rewarded.
- No gods in the intro storytelling.
- Promote mutual help, community and friendship, not competition.
