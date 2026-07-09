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

4. Cloudflare Pages の環境変数に管理者パスワードを設定します。

   - 変数名: `ADMIN_PASSWORD`
   - 値: 任意の強いパスワード

5. Cloudflare Pages にこのリポジトリを接続してデプロイします。ビルドコマンドは不要で、出力ディレクトリは `.` です。

## 管理ページ

`/admin/` から作品データを追加・編集・削除できます。ログインには `ADMIN_PASSWORD` を使用します。

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
