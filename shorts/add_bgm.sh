#!/usr/bin/env bash
# 無音版MP4にBGMを付ける。使い方: ./add_bgm.sh <BGMのmp3> [曲の開始秒=115.54]
# 既定の115.54秒は「Believe (Instrumental) / NEFFEX」で、118.05秒のドロップが動画2.5秒（記録シーンの頭）に来る位置。
# 別の曲を使う場合は、盛り上がり位置(秒) - 2.5 を第2引数に渡す。
set -euo pipefail
cd "$(dirname "$0")"
BGM="${1:?BGMのmp3を指定してください}"; SS="${2:-115.54}"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
# 1) 20秒分の音量を測る（目標 -14 LUFS / TP -1.5dB）
ffmpeg -hide_banner -nostats -ss "$SS" -t 20 -i "$BGM" -af "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p' > "$TMP/ln.json"
g() { python3 -c "import json;print(json.load(open('$TMP/ln.json'))['$1'])"; }
# 2) 測定値でリニア正規化 + フェードイン0.25秒 / フェードアウト1.5秒 → AAC 48kHz
AF="loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,afade=t=in:st=0:d=0.25,afade=t=out:st=18.5:d=1.5,aresample=48000"
ffmpeg -v error -y -ss "$SS" -t 20 -i "$BGM" -af "$AF" -c:a aac -b:a 192k -ar 48000 "$TMP/bgm.m4a"
# 3) 映像は再エンコードせずそのまま合成
ffmpeg -v error -y -i nobiru_short_20s.mp4 -i "$TMP/bgm.m4a" -map 0:v:0 -map 1:a:0 -c:v copy -c:a copy -t 20 -movflags +faststart nobiru_short_20s_bgm.mp4
echo "done: shorts/nobiru_short_20s_bgm.mp4"
