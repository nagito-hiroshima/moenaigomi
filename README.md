# moenaigomi.com

Cloudflare Pages + Cloudflare D1 で動作する作品リンク集です。

## Cloudflare への移行手順

1. Cloudflare で D1 データベースを作成します。

   ```bash
   npx wrangler d1 create moenaigomi
   ```

2. 表示された `database_id` を `wrangler.toml` の `database_id` に設定します。

3. D1 にテーブルを作成します。

   ```bash
   npx wrangler d1 migrations apply moenaigomi --remote
   ```

4. Cloudflare Pages にこのリポジトリを接続してデプロイします。ビルドコマンドは不要で、出力ディレクトリは `.` です。


## Cloudflare の画面で迷ったとき

このリポジトリは **Workers の「Worker を作成」画面ではなく、Cloudflare Pages** としてデプロイしてください。スクリーンショットのように `npx wrangler deploy` / `npx wrangler versions upload` を入力する Worker 作成画面にいる場合は、いったん戻って **Workers & Pages → Pages → Git に接続** から作成します。

Pages のビルド設定は以下です。

| 項目 | 入力値 |
| --- | --- |
| Framework preset | None / なし |
| Build command | 空欄 |
| Build output directory | `.` |
| Root directory | `/` |

Cloudflare Pages に接続した後、D1 binding の名前は `DB` にしてください。`wrangler.toml` も同じ binding 名を使っています。

## 管理ページ

`/admin/` から作品データを追加・編集・削除できます。ログイン認証はアプリ側では行わないため、必要に応じて Cloudflare Zero Trust などで `/admin/` と編集 API を保護してください。


## CSV インポート / エクスポート

管理ページの「CSVエクスポート」から現在の D1 データを CSV でダウンロードできます。「CSVインポート」では、以下のヘッダーを持つ CSV または TSV を読み込めます。インポート時は現在の登録データを CSV の内容で置き換えます。

```csv
作品名,画像,掲載先リンク,背景色,サイズ
ランダムカラーコード,https://nagito-hiroshima.github.io/random-color/favicons/icon-256x256.png,https://www.moenaigomi.com/colorcode/,#14D8A7,1
猫ジェネレーター,https://moenaigomi.com/cat/cat.png,https://www.moenaigomi.com/cat/,#BC3E71,1
```

## データ構造

作品データは D1 の `items` テーブルに保存します。旧 GAS/スプレッドシートの列との対応は以下です。

| 旧スプレッドシート列 | D1/API フィールド |
| --- | --- |
| 作品名 | `text` |
| 画像 | `imageSrc` |
| 背景色 | `backgroundColor` |
| 掲載先リンク | `url` |
| サイズ | `size` |
| 休止 | `paused` |

サイト本体は `/api/items` からデータを取得します。
