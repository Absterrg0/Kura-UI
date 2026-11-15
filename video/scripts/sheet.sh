#!/usr/bin/env bash
# Tiles the PNG stills in a folder into one labelled contact sheet: scripts/sheet.sh <dir> <out.png> [cols]
set -euo pipefail
cols=${3:-4}
n=$(ls "$1"/f*.png | wc -l)
rows=$(( (n + cols - 1) / cols ))
ffmpeg -v error -y -pattern_type glob -i "$1/f*.png" \
  -vf "scale=480:-2,drawtext=text='%{metadata\:lavf.image2dec.source_basename}':x=6:y=6:fontsize=16:fontcolor=white,tile=${cols}x${rows}:padding=4:color=0x333333" \
  -frames:v 1 "$2"
