# moenaigomi.com

Cloudflare Pages + Cloudflare D1 で動作する作品リンク集です。

## Cloudflare への移行手順

1. Cloudflare で D1 データベースを作成します。

   ```bash
   npx wrangler d1 create moenaigomi-db
   ```

2. 表示された `database_id` を `wrangler.toml` の `database_id` に設定します。

3. D1 にテーブルを作成します。

   ```bash
   npx wrangler d1 migrations apply moenaigomi-db --remote
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

## D1 の更新コマンド

`/api/items` が HTTP 500 になった場合は、デプロイ先の D1 に最新マイグレーションが適用されているか確認します。このリポジトリのデータベース名は `moenaigomi-db`、Pages Functions から参照する binding 名は `DB` です。

```bash
# 必要な場合のみ、最初に Cloudflare へログイン
npx wrangler login

# 未適用のマイグレーションを確認
npx wrangler d1 migrations list moenaigomi-db --remote

# 0001、0002 などの未適用マイグレーションを本番 D1 へ適用
npx wrangler d1 migrations apply moenaigomi-db --remote

# description / additionalImages / additionalInfo 列を確認
npx wrangler d1 execute moenaigomi-db --remote --command "PRAGMA table_info(items);"
```

新しいDBを作り直す場合は、`npx wrangler d1 create moenaigomi-db` の出力にある `database_id` を `wrangler.toml` に設定し、Cloudflare Pages の **Settings → Bindings** でも D1 binding `DB` を同じデータベースへ接続してから再デプロイします。

## Cloudflare Access と manifest の CORS エラー

`/z-favicon/site.webmanifest` が `moenaigomi.cloudflareaccess.com/cdn-cgi/access/login/...` へリダイレクトされて CORS エラーになる場合、manifest 自体ではなく、Pages のプレビューURLが Cloudflare Access の認証画面へ転送されていることが原因です。これは `/api/items` の HTTP 500 とは別の問題です。

1. プレビューURLを通常のタブで開いて Cloudflare Access の認証を完了します。
2. Zero Trust の Access Application で、対象ホストとポリシーが意図どおりか確認します。
3. 公開サイトなら公開ホストを Access の対象から外します。管理画面だけ保護する場合は `/admin/*` と書き込みAPIだけを対象にし、サイト全体や favicon/manifest をログイン画面へリダイレクトしない構成にします。
4. 認証・設定変更後にページを再読み込みします。

Access の長いログインURLに含まれる `meta` や署名値は一時的な認証情報なので、コマンドや設定ファイルには貼り付けません。

## 管理ページ

`/admin/` から作品データを追加・編集・削除できます。ログイン認証はアプリ側では行わないため、必要に応じて Cloudflare Zero Trust などで `/admin/` と編集 API を保護してください。


## CSV インポート / エクスポート

管理ページの「CSVエクスポート」から現在の D1 データを CSV でダウンロードできます。「CSVインポート」では、以下のヘッダーを持つ CSV または TSV を読み込めます。インポート時は現在の登録データを CSV の内容で置き換えます。

```csv
作品名,画像,説明文,追加画像,追加情報,掲載先リンク,背景色,サイズ
ランダムカラーコード,https://example.com/icon.png,配色を楽しむツール,https://example.com/screen.png,使用技術: JavaScript,https://www.moenaigomi.com/colorcode/,#14D8A7,1
```

## データ構造

作品データは D1 の `items` テーブルに保存します。旧 GAS/スプレッドシートの列との対応は以下です。

| 旧スプレッドシート列 | D1/API フィールド |
| --- | --- |
| 作品名 | `text` |
| 画像 | `imageSrc` |
| 説明文 | `description` |
| 追加画像（改行区切り） | `additionalImages` |
| 追加情報 | `additionalInfo` |
| 背景色 | `backgroundColor` |
| 掲載先リンク | `url` |
| サイズ | `size` |
| 休止 | `paused` |

サイト本体は `/api/items` からデータを取得します。
