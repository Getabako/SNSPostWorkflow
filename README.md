# Instagram自動投稿ワークフロー

既存の画像生成ツールとAIを組み合わせて、Instagram投稿を自動化するプロジェクトです。

## 概要

ホームページの内容を分析し、30日分のカルーセル投稿カレンダーをAIで自動生成。既存の画像生成ツールで画像を作成し、Publerで一括投稿できます。

## プロジェクト構成

```
SNSWorkFlow/
├── index copy.html              # ホームページ（事業情報ソース）
├── index copy 2.html            # AI画像生成ツール（マジカルナノバナナ∞）
├── index copy 3.html            # 画像加工+アップロード+CSV作成
├── src/
│   ├── analyze-homepage.js      # ホームページ解析スクリプト
│   └── generate-calendar.js     # カレンダー生成スクリプト
├── output/                      # 生成物の出力先
│   ├── business-info.json       # 抽出された事業情報
│   ├── business-summary.txt     # AIプロンプト用サマリー
│   └── calendar.csv             # 30日分の投稿カレンダー
├── .github/workflows/
│   └── content-generation.yml   # GitHub Actionsワークフロー
├── WORKFLOW.md                  # 詳細な手順ガイド
└── README.md
```

## クイックスタート

### 1. セットアップ

```bash
# リポジトリのクローン
git clone <your-repo-url>
cd SNSWorkFlow

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集してAPIキーを設定
```

### 2. APIキーの設定

`.env` ファイルに以下を設定：

```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaSyCB484iyfZOA79svA7rJ7QNB-P5HJmt-Tw
```

**注意**: APIキーは絶対に公開リポジトリにコミットしないでください！

### 3. ワークフローの実行

#### ステップ1-2: カレンダー生成（自動化）

```bash
npm run workflow
```

これで以下が生成されます：
- `output/business-info.json` - 事業情報
- `output/business-summary.txt` - サマリー
- `output/calendar.csv` - 30日分の投稿カレンダー

#### ステップ3: AI画像生成（手動）

1. ブラウザで `index copy 2.html` を開く
2. パスワード: `IFjuku19841121`
3. 画像生成タブでプロンプトを入力
4. 画像を生成してZIPでダウンロード

#### ステップ4-6: 画像加工→アップロード→CSV作成（手動）

1. ブラウザで `index copy 3.html` を開く
2. 画像生成タブで文字を追加
3. ファイルアップロードタブでサーバーにアップロード
4. CSV作成タブでPubler用CSVを生成

詳細は [WORKFLOW.md](./WORKFLOW.md) を参照してください。

## GitHub Actionsで自動実行

### セットアップ

1. リポジトリのSettings > Secrets > Actionsで以下を設定：
   - `OPENAI_API_KEY`

2. 自動実行タイミング：
   - 毎月1日 午前9時（JST）
   - `index copy.html` が更新されたとき
   - 手動実行（GitHub Actions UI）

### 手動実行

1. GitHubリポジトリの「Actions」タブ
2. 「Instagram投稿コンテンツ生成」を選択
3. 「Run workflow」をクリック

### 生成物のダウンロード

1. GitHub Actionsの実行結果ページ
2. 「Artifacts」から `instagram-calendar-XXX` をダウンロード
3. ZIPを解凍して `calendar.csv` を使用

## ワークフロー全体の流れ

```
1. ホームページ解析 (自動)
   ↓ analyze-homepage.js

2. 投稿カレンダー生成 (自動)
   ↓ generate-calendar.js → calendar.csv

3. AI画像生成 (手動)
   ↓ index copy 2.html → 画像ZIP

4. 画像に文字追加 (手動)
   ↓ index copy 3.html → 加工画像ZIP

5. サーバーアップロード (手動)
   ↓ index copy 3.html → images.if-juku.net

6. Publer CSV作成 (手動)
   ↓ index copy 3.html → 一括投稿データ.csv

7. Publerにインポート (手動)
   ↓ Publer → Instagram投稿
```

## カレンダーCSVの構造

各行が1日分の投稿（カルーセル形式）：

| 列 | 内容 | 備考 |
|----|------|------|
| 1 | 表紙画像説明 | 英語プロンプト |
| 2 | 表紙テキスト1 | 8文字×2行 |
| 3 | 表紙テキスト2 | 12文字×4行 |
| 4 | 内容1画像説明 | 英語プロンプト |
| 5 | 内容1テキスト1 | 8文字×2行 |
| 6 | 内容1テキスト2 | 12文字×4行 |
| 7 | 内容2画像説明 | 英語プロンプト |
| 8 | 内容2テキスト1 | 8文字×2行 |
| 9 | 内容2テキスト2 | 12文字×4行 |
| 10 | 内容3画像説明 | 英語プロンプト |
| 11 | 内容3テキスト1 | 8文字×2行 |
| 12 | 内容3テキスト2 | 12文字×4行 |
| 13 | 投稿テキスト・ハッシュタグ | 200文字程度 |

## 使用している既存ツール

### index copy 2.html - マジカルナノバナナ∞

**機能**:
- 画像生成（Gemini API）
- 画像編集（Image to Image）
- 動画生成（PixVerse API）

**特徴**:
- CSVからプロンプト/キャラクター設定を読み込み可能
- 一括生成機能
- ZIPでダウンロード

### index copy 3.html - Instagram画像ジェネレーター

**機能**:
1. 画像生成タブ: 画像に文字をオーバーレイ（4:5形式）
2. ファイルアップロードタブ: サーバーに画像をアップロード
3. CSV作成タブ: Publer用CSVを自動生成

**特徴**:
- 豊富な日本語フォント
- テキストエフェクト（影、アウトライン、グロー、3D）
- フォルダ構造を保持したアップロード

## NPMスクリプト

```bash
# ホームページ解析
npm run analyze-homepage

# カレンダー生成
npm run generate-calendar

# 全自動（ステップ1-2）
npm run workflow
```

## コスト試算

### OpenAI API（GPT-4）
- カレンダー生成: $0.01-0.03 / 回
- 月1回実行: $0.01-0.03 / 月

### Gemini API
- 無料枠: 1,500リクエスト/日
- 画像生成: 基本無料

### サーバー
- 既存インフラ利用（`https://images.if-juku.net/`）

### Publer
- プランに応じた料金

## トラブルシューティング

### カレンダー生成が失敗する

```bash
# 事業情報が正しく抽出されているか確認
cat output/business-summary.txt

# APIキーが設定されているか確認
echo $OPENAI_API_KEY
```

### 画像生成でエラーが出る

- Gemini APIキーが正しいか確認
- ブラウザのコンソールでエラーを確認
- ネットワーク接続を確認

### アップロードが失敗する

- パスワードが正しいか確認
- サーバーが稼働しているか確認
- ファイルサイズ制限を確認

## カスタマイズ

### カレンダーの投稿テーマを変更

`src/generate-calendar.js` のプロンプトを編集：

```javascript
## 投稿テーマ例
- サービス紹介
- 生徒の成功事例
- 学習Tips
// ここに独自のテーマを追加
```

### 画像のスタイルを統一

`index copy 2.html` で一貫性設定を使用：
1. `imagerule/` フォルダにCSVを配置
2. 場所、照明、スタイルなどを定義
3. ツールで設定を選択

### 投稿頻度を変更

`index copy 3.html` のCSV作成タブで調整：
- 現在: 毎日18:00
- カスタマイズ可能

## セキュリティ

- APIキーは `.env` ファイルで管理（Gitignore済み）
- アップロードはパスワード認証必須
- 公開リポジトリでは GitHub Secrets を使用

## 今後の拡張予定

- [ ] 完全自動化（画像生成〜CSV作成まで）
- [ ] 複数SNS対応（Twitter, Facebook）
- [ ] パフォーマンス分析の統合
- [ ] Webhook通知機能

## ライセンス

MIT

## サポート

問題が発生した場合は、GitHubのIssuesで報告してください。

## 参考リンク

- [WORKFLOW.md](./WORKFLOW.md) - 詳細な手順ガイド
- [Publer](https://publer.io/) - 投稿管理ツール
- [カルーセルマニュアル](https://if-juku.net/carouselmanual.html) - 投稿カレンダーの作り方
