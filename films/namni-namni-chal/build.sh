#!/bin/sh
# One command: rebuild "Namni Namni Chal" (master the song -> render the picture -> mux).
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
mkdir -p "$HERE/out"
[ -f "$HERE/audio/song.wav" ] || ffmpeg -loglevel error -y -i "$HERE/audio/song.mp3" -ar 48000 "$HERE/audio/song.wav"
"$LIB/.venv/bin/python" "$HERE/master.py"
cd "$LIB" && node core/render/video.mjs "$HERE" --fps 24 --workers 4 --out "$HERE/out/video.mp4"
ffmpeg -y -loglevel error -i "$HERE/out/video.mp4" -i "$HERE/out/mix.wav" -map 0:v -map 1:a -c:v libx264 -crf 20 -preset slow -pix_fmt yuv420p \
  -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart "$HERE/namni-namni-chal.mp4"
echo "done: $HERE/namni-namni-chal.mp4"
