# Pichhwai Night (પિછવાઈ) — Style Prompt
Made from a blank page; techniques from Ukiyo-e (ukiyo-e) in Lemo-Opuscar.

> A painted temple cloth come alive: the devotional painting of Nathdwara (Gujarat–Rajasthan) — flat mineral colour on deep night-indigo, gold borders, lotus ponds, cows, a full moon — animated as layered painted panels, framed by Kutchi mirror-work.

## 1. Essence, and what it is not
A **painting on cloth**, not a cartoon: every frame sits inside an ornamented border, as if the camera moves across one huge pichhwai. Flat opaque colour, fine dark outlines, gold ornament, symmetrical repeating motifs (lotus, leaves, flowers, cows). Figures in strict **profile** with the long lotus-petal eye drawn frontally, slender, upright.
Not Bollywood glamour, not flat vector "Indian clip-art" (no gradients-in-everything, no generic mandala wallpaper), not a photographic look. No deity is depicted: the tradition's motifs serve a human story.

## 2. Materials & rendering
- Ground: deep indigo (#0f1a4a → #1c2a6e) or saffron; a cloth weave and slight pigment mottling painted once over the whole frame.
- Fills flat; one hard shadow tone at most; fine outlines in a darker shade of the fill (black only for hair and eye lines).
- Gold: ochre fill + a lighter edge, never a gradient chrome; it glints by a moving highlight band.
- Lotus pond: rows of pink/white lotuses on round pads, regimented as in the paintings, fish in pale outlines, wave lines in white.
- Borders: a stack of bands — gold, a red band with a repeating flower, mirror-work circles (small silver discs ringed in thread colour).
- Figures: profile head, straight nose line from the forehead, large almond eye with the iris at the front corner, kohl line extending back; long neck; jewellery as dots and loops in gold.

## 3. Colour logic
Night: indigo ground, white moon, lotus pink #f39ab5, leaf green #2f8a5a, gold #d8a83a, vermilion #d8402c, cream #f4e6c4. Dawn courtyard: saffron/terracotta ground #d9772f, whitewashed walls, tulsi green. Her accent: **vermilion and gold** (ghagra and odhni). His: **white and saffron** (kediyu and pagdi).

## 4. Type & subtitles
Gujarati lyric subtitles in Noto Serif Gujarati SemiBold ~60 px, cream with a dark indigo outline, on a small cloth-coloured band with a gold rule; English translation under it, ~30 px. Title: Baloo Bhai 2 ExtraBold in gold with a vermilion outline, set in a border cartouche.

## 5. Motion quality
Painted layers move; figures move like puppets of the painting: limbs and skirts on twos (12 fps), the camera and light on ones. Graceful, slow, never bouncy. Petals and lamps flicker on threes.

## 6. Camera grammar
Pans across the cloth, slow pushes into a framed niche (jharokha arch), parallax between painted layers (sky, trees, pond, foreground lotus), side tracking for walks, a slow circle for the dance. Transitions made of the medium: the cloth unrolls, a border band wipes across, lotus petals fill the frame.

## 7. Sound palette
The user's song carries the film. Effects only if asked (temple bell, payal/anklets, water).

## 8. Native moves
Cloth unrolling; lotus blooming in rows; mirror-work and gold glinting as light passes; the frame-within-frame arch; a field of falling flowers.

## 9. Pitfalls
- Faces drawn 3/4 or frontal break the tradition — stay in profile.
- Too many gradients turn it into vector clip-art.
- Depicting a deity (Shrinathji) in a love song is disrespectful — never.
- Gujarati needs a real Gujarati font: canvas silently falls back; `document.fonts.load` with Gujarati text first.

## 10. Engine
`demo/`: `paint.js` (plates, borders, lotus, cows, moon, cloth texture), `figures.js` (her and him in profile, poses), `main.js` (shots, subtitles).

## 11. Variation space
Any human story with devotion, festivity or longing: a wedding, Navratri, a harvest, a homecoming. Colours shift with time of day (indigo night, saffron dawn, white Sharad Purnima moonlight).
