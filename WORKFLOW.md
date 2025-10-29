# Instagram自動投稿ワークフロー - 完全ガイド

## 全体の流れ

```
1. ホームページ解析
   ↓ (analyze-homepage.js)
2. 投稿カレンダー生成（AIで30日分のカルーセル投稿を生成）
   ↓ (generate-calendar.js)
3. AI画像生成（プロンプトから画像を生成）
   ↓ (magicalnanobanana.html - マジカルナノバナナ∞)
4. 画像に文字を追加（タイトル・コンテンツをオーバーレイ）
   ↓ (imagegenerator.html - Instagram画像ジェネレーター)
5. サーバーにアップロード
   ↓ (imagegenerator.html - ファイルアップロード)
6. Publer用CSV作成
   ↓ (imagegenerator.html - CSV作成)
7. Publerにインポートして投稿

```

## 詳細手順

### ステップ1: ホームページ解析

**目的**: 事業内容を自動抽出

```bash
npm run analyze-homepage
```

**出力**:
- `output/business-info.json` - 構造化された事業情報
- `output/business-summary.txt` - AIプロンプト用サマリー

### ステップ2: 投稿カレンダー生成

**目的**: 30日分のカルーセル投稿コンテンツをAIで生成

```bash
npm run generate-calendar
```

**出力**:
- `output/calendar.csv` - 13列形式のカルーセルカレンダー

**CSV構造** (各行が1日分):
1. 表紙画像説明（英語プロンプト）
2. 表紙テキスト1（8文字×2行）
3. 表紙テキスト2（12文字×4行）
4. 内容1画像説明
5. 内容1テキスト1
6. 内容1テキスト2
7. 内容2画像説明
8. 内容2テキスト1
9. 内容2テキスト2
10. 内容3画像説明
11. 内容3テキスト1
12. 内容3テキスト2
13. 投稿テキスト・ハッシュタグ

### ステップ3: AI画像生成

**ツール**: `magicalnanobanana.html` (マジカルナノバナナ∞)

1. ブラウザで `magicalnanobanana.html` を開く
2. パスワードを入力してログイン
3. **画像生成タブ**を選択
4. カレンダーCSVから画像プロンプト（列1, 4, 7, 10）をコピー
5. プロンプトを1行ずつ貼り付け
6. 縦横比を選択（正方形推奨）
7. 「画像を生成」をクリック
8. 完了後「ZIPでダウンロード」

**オプション**:
- 一貫性設定: キャラクター・背景を統一（CSVから読み込み可能）
- 画像編集: 既存画像を編集する場合は「画像編集」タブ

**出力**: `nanobanana_images_YYYY-MM-DD.zip`

### ステップ4: 画像に文字を追加

**ツール**: `imagegenerator.html` (Instagram画像ジェネレーター)

1. ブラウザで `imagegenerator.html` を開く
2. **画像生成タブ**を選択
3. 画像ファイルをアップロード（ステップ3で生成した画像）
4. **タイトルテキスト入力**:
   - カレンダーCSVの列2, 5, 8, 11を貼り付け
   - 改行は `\n` で表現
5. **コンテンツテキスト入力**:
   - カレンダーCSVの列3, 6, 9, 12を貼り付け
6. フォント・サイズ・配置・エフェクトを調整
7. 「画像を生成」をクリック
8. 完了後「ZIPでダウンロード」
   - 事業名を入力（例: `iftech`）
   - フォルダ名: `{事業名}_post_{年}_{月}`

**出力**: `{事業名}_post_{年}_{月}.zip`

### ステップ5: サーバーにアップロード

**ツール**: `imagegenerator.html` - **ファイルアップロードタブ**

1. パスワードを入力して「パスワード確認」
2. ZIPを解凍したフォルダをドラッグ&ドロップ
3. フォルダ構造を確認
4. 「アップロード開始」をクリック

**アップロード先**: `https://images.if-juku.net/{フォルダ名}/`

**例**:
- ローカル: `iftech_post_2025_10/001.png`
- アップロード後: `https://images.if-juku.net/iftech_post_2025_10/001.png`

### ステップ6: Publer用CSV作成

**ツール**: `imagegenerator.html` - **CSV作成タブ**

1. **フォルダ名**: `iftech_post_2025_10`（ステップ5でアップロードしたフォルダ名）
2. **画像の枚数**: カルーセル用画像の枚数（4の倍数）
   - 例: 30日分 × 4枚 = 120枚
3. **サンクスメッセージ画像名**: 各投稿の最後に追加する画像
   - 例: `iftech_thanks.png`
4. **テキストデータ入力**:
   - カレンダーCSVの列13（投稿テキスト・ハッシュタグ）を貼り付け
5. 「CSV生成」をクリック
6. プレビューを確認
7. 「CSVダウンロード」

**CSV形式**:
```csv
Date,Text,Link(s),Media URL(s)
2025-10-30 18:00,投稿テキストとハッシュタグ,,https://images.if-juku.net/iftech_post_2025_10/001.png,https://images.if-juku.net/iftech_post_2025_10/002.png,https://images.if-juku.net/iftech_post_2025_10/003.png,https://images.if-juku.net/iftech_post_2025_10/004.png,https://images.if-juku.net/iftech_post_2025_10/iftech_thanks.png
```

### ステップ7: Publerにインポート

1. [Publer](https://publer.io/)にログイン
2. 「Bulk Upload」を選択
3. 生成したCSVをアップロード
4. プレビューを確認
5. インポートを実行

## 自動化（GitHub Actions）

現在は手動ステップが必要ですが、以下を自動化可能：

- ステップ1-2: Node.jsスクリプト（自動化済み）
- ステップ3: Gemini APIで画像生成
- ステップ4: Canvasでテキストオーバーレイ
- ステップ5: サーバーアップロード
- ステップ6: CSV生成

## ファイル構成

```
SNSWorkFlow/
├── index.html                   # ホームページ（事業情報ソース）
├── magicalnanobanana.html       # AI画像生成ツール
├── imagegenerator.html          # 画像加工+アップロード+CSV作成
├── src/
│   ├── analyze-homepage.js      # ホームページ解析
│   ├── generate-calendar.js     # カレンダー生成
│   └── (その他スクリプト)
├── output/
│   ├── business-info.json
│   ├── business-summary.txt
│   └── calendar.csv
└── README.md
```

## トラブルシューティング

### カレンダー生成が失敗する
- OpenAI APIキーが正しく設定されているか確認
- `output/business-summary.txt`が存在するか確認

### 画像生成でフォントが反映されない
- Google Fontsが読み込まれるまで待つ
- ブラウザのキャッシュをクリア

### アップロードが失敗する
- パスワードが正しいか確認
- ネットワーク接続を確認
- ファイルサイズ制限を確認

### CSV作成で行数が合わない
- 画像枚数が4の倍数か確認
- テキスト行数が `画像枚数÷4` になっているか確認

## コスト試算

- OpenAI GPT-4: $0.01-0.03 / カレンダー生成
- Gemini API: 無料（一定量まで）
- サーバー: 既存インフラ利用
- Publer: プラン次第
