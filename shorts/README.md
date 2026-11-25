# 株ノートNOBIRU YouTubeショート動画（20秒・縦・無音）

`nobiru_short_20s.mp4` — 1080x1920 / 30fps / H.264(yuv420p, +faststart) / 無音 / 20.0秒。BGMはYouTube側で後から付ける想定。

## 仕組み
- `nobiru_short.html` … 全シーンを1枚のHTMLで構成。`window.setTime(t)`（秒）を呼ぶと全要素の状態がtだけで決まる（決定論的）。素材は親ディレクトリ（`../nobiru_logo_light.png`, `../screenshots/`, `../取引履歴.png`）を参照。
- `export.js` … 一時ローカルHTTPサーバでHTMLを開き、ヘッドレスChromium(Playwright)で 30fps×600フレームを `frames/` にPNG出力 → ffmpegでMP4化。
- フォントは npm の `@fontsource/noto-sans-jp`（Noto Sans JP, OFL）を使用。`node_modules/` と `frames/` は git 管理外。

## 再生成手順
必要なもの: Node.js、Playwright（`require('playwright')` が使えること）とChromium、ffmpeg。

```bash
cd shorts
npm install                      # Noto Sans JP を取得
node export.js                   # frames/ 出力 → nobiru_short_20s.mp4 を上書き（約40秒）
```

確認用:

```bash
node export.js --stills 1,4,8,12,16,19          # 指定秒のPNGを stills/ に出力
node export.js --guides --stills 4.9,8.6        # セーフエリア(上150/下380/右120px)のガイドを重ねて出力
```

## シーン構成（秒）
0–2.5 フック / 2.5–6 記録 / 6–10.5 分析 / 10.5–14.5 同期 / 14.5–17 iOS・Android両対応 / 17–20 CTA。
文言・タイミングは `nobiru_short.html` 内のHTMLと `setTime` 関数で調整できる。

## 注意
- 画面は全てサンプルデータ。動画内に「※画面はサンプルデータです」「※投資助言ではありません」を入れている。利益を保証する表現は使っていない。
- ストアバッジはLP(`index.html`)と同じ見た目の自作HTML/CSS。公式バッジ画像ではない。

## BGM付き版
`nobiru_short_20s_bgm.mp4` — 無音版にBGMを付けたもの（映像は同一、音声のみ追加）。

```bash
./add_bgm.sh /path/to/Believe_Instrumental_-_NEFFEX.mp3
```

- 曲: Believe (Instrumental) / NEFFEX。曲の115.54秒から20秒を使用。118.05秒のドロップが動画2.5秒（記録シーンの頭）に入る。
- 音量: 約 -14 LUFS、ピーク約 -5 dBFS。フェードイン0.25秒・フェードアウト1.5秒。AAC 48kHz。
- 元のmp3はライセンスの都合でリポジトリに含めていない。クレジット表記は不要（運用者確認済み）。
