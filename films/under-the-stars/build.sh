#!/bin/sh
# One command: rebuild "Under the Stars" (score -> events -> mix -> picture -> master).
# Needs the library's core + music tiers (setup.sh deps music) and ffmpeg. Fonts are fetched if missing.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"; mkdir -p "$HERE/out"
GF=https://raw.githubusercontent.com/google/fonts/main/ofl
for f in delagothicone/DelaGothicOne-Regular kanit/Kanit-BlackItalic kanit/Kanit-ExtraBoldItalic kanit/Kanit-SemiBoldItalic \
         barlowsemicondensed/BarlowSemiCondensed-Medium barlowsemicondensed/BarlowSemiCondensed-SemiBold barlowsemicondensed/BarlowSemiCondensed-Bold; do
  [ -f "$HERE/fonts/${f#*/}.ttf" ] || curl -sSfL -o "$HERE/fonts/${f#*/}.ttf" "$GF/$f.ttf"
done
cd "$LIB"
"$PY" "$HERE/music/score.py"                                  # -> music/score.wav, song.json (word timings)
node core/render/events.mjs "$HERE"                          # -> events.json
"$PY" "$HERE/mix.py"                                         # -> out/mix.wav at -14 LUFS, <= -1.5 dBTP
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --out "$HERE/out/video.mp4"
# master: picture + mix (already loudness-normalised in mix.py), light tape noise, AAC 256k
ffmpeg -y -loglevel error -i "$HERE/out/video.mp4" -i "$HERE/out/mix.wav" -map 0:v -map 1:a \
  -vf "noise=c0s=2:allf=t" -c:v libx264 -crf 22 -preset slow -pix_fmt yuv420p -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "$HERE/under-the-stars.mp4"
node core/render/still.mjs "$HERE" 26.2 --q nosub=1 --out "$HERE/out/still" --prefix p_ && cp "$HERE/out/still/p_26.2.jpg" "$HERE/poster.jpg"
echo "done: $HERE/under-the-stars.mp4"
