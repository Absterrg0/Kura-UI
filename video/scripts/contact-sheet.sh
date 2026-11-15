#!/usr/bin/env bash
# A contact sheet of the rendered film: one frame a second, labelled, 8 across.
# Usage: scripts/contact-sheet.sh out/kura-launch.mp4 out/contact-sheet.png
set -euo pipefail
in=${1:-out/kura-launch.mp4}
out=${2:-out/contact-sheet.png}
ffmpeg -v error -y -i "$in" \
  -vf "fps=1,scale=480:-1,drawtext=text='%{pts\:hms}':x=8:y=8:fontsize=14:fontcolor=white@0.8,tile=8x7:padding=4:color=0x28282c" \
  -frames:v 1 "$out"
echo "$out"
