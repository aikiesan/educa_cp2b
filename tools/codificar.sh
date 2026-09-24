#!/usr/bin/env bash
# Codifica a versão de distribuição (H.264 High, 2 passagens, ~9 Mb/s) a partir da pasta de quadros PNG
# que o render deixa com --keep.   uso: tools/codificar.sh <pasta_quadros> <audio.wav> <saida.mp4> [kbps]
set -euo pipefail
Q="$1"; A="$2"; OUT="$3"; KB="${4:-9000}"
LOG="$(mktemp -d)/x264"
COMMON=(-framerate 24 -i "$Q/q%05d.png")
V=(-c:v libx264 -preset slow -b:v "${KB}k" -maxrate "$((KB * 2))k" -bufsize "$((KB * 3))k" -pix_fmt yuv420p -profile:v high -level 4.1 -tune film
   -x264-params aq-mode=3:deblock=-1,-1 -colorspace bt709 -color_primaries bt709 -color_trc bt709 -g 48 -keyint_min 24)
ffmpeg -hide_banner -loglevel error -y "${COMMON[@]}" "${V[@]}" -pass 1 -passlogfile "$LOG" -an -f mp4 NUL
ffmpeg -hide_banner -loglevel error -y "${COMMON[@]}" -i "$A" "${V[@]}" -pass 2 -passlogfile "$LOG" -c:a aac -b:a 256k -ar 48000 -movflags +faststart "$OUT"
ls -la "$OUT"
