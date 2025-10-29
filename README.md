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
├── character/                   # キャラクター設定（一貫性）
│   ├── 塾長山﨑琢己.csv
│   ├── ゆうま.csv
│   ├── CTO井上陽斗.csv
│   ├── 塾頭高崎翔太.csv
│   └── 渡辺ゆづき.csv           # 全て自動読み込み
├── imagerule/                   # 画像一貫性ルール
│   └── ifjuku.csv              # 場所・照明・スタイル設定（全て自動読み込み）
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
GEMINI_API_KEY=your_gemini_api_key_here
```

**注意**: APIキーは絶対に公開リポジトリにコミットしないでください！

### 3. ワークフローの実行

#### ステップ1-2: カレンダー生成（自動化）

```bash
npm run workflow
```

または、カレンダー生成のみを実行：

```bash
npm run generate-calendar
```

**自動読み込み機能**:
- `character/` フォルダの**全てのキャラクターCSV**を自動読み込み
- `imagerule/` フォルダの**全ての一貫性ルールCSV**を自動読み込み
- 30日分の投稿で、全キャラクター・全ルールをバランス良く配分

**現在使用中のキャラクター**（全て自動読み込み）:
- 塾長山﨑琢己
- ゆうま（CFO加賀屋結眞）
- CTO井上陽斗
- 塾頭高崎翔太
- 渡辺ゆづき

**現在使用中のルール**（全て自動読み込み）:
- ifjuku（サイバーパンク風オンラインプログラミング塾）

これで以下が生成されます：
- `output/business-info.json` - 事業情報
- `output/business-summary.txt` - サマリー
- `output/calendar.csv` - 30日分の投稿カレンダー（13列×30行）

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
   - `GEMINI_API_KEY`

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

各行が1日分の投稿（カルーセル形式・4枚構成）：

| 列 | 内容 | 備考 |
|----|------|------|
| A(1) | 表紙画像説明 | **日本語**（キャラクター・一貫性ルール反映） |
| B(2) | 表紙テキスト1 | 8文字×2行（`\n`で改行） |
| C(3) | 表紙テキスト2 | 12文字×4行（`\n`で改行） |
| D(4) | 内容1画像説明 | **日本語**（キャラクター・一貫性ルール反映） |
| E(5) | 内容1テキスト1 | 8文字×2行（`\n`で改行） |
| F(6) | 内容1テキスト2 | 12文字×4行（`\n`で改行） |
| G(7) | 内容2画像説明 | **日本語**（キャラクター・一貫性ルール反映） |
| H(8) | 内容2テキスト1 | 8文字×2行（`\n`で改行） |
| I(9) | 内容2テキスト2 | 12文字×4行（`\n`で改行） |
| J(10) | 内容3画像説明 | **日本語**（キャラクター・一貫性ルール反映） |
| K(11) | 内容3テキスト1 | 8文字×2行（`\n`で改行） |
| L(12) | 内容3テキスト2 | 12文字×4行（`\n`で改行） |
| M(13) | 投稿テキスト+ハッシュタグ | 200文字程度（句読点で区切り、改行なし） |

**重要**:
- 画像説明は**日本語**で出力
- `character/`と`imagerule/`の**全てのファイル**を自動読み込み
- 30日分で全キャラクター・全ルールがバランス良く登場
- テキストエリアの改行は`\n`で表現

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

### Gemini API
- 無料枠: 60リクエスト/分（十分な量）
- カレンダー生成: 無料
- 画像生成: 無料（一定量まで）

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

### キャラクター設定の追加

新しいキャラクターを追加する場合：

1. `character/` フォルダに新しいCSVファイルを作成（日本語推奨）
2. 以下の列を含める：
   - `name`: キャラクター名
   - `appearance`: 外見
   - `hair`: 髪型
   - `eyes`: 目
   - `face`: 顔
   - `body`: 体型
   - `clothing`: 服装
   - `personality`: 性格
   - `additional`: 追加情報

3. **次回の実行で自動的に読み込まれます** - コマンド引数は不要

### 画像一貫性ルールの追加

新しいルールを追加する場合：

1. `imagerule/` フォルダに新しいCSVファイルを作成（日本語推奨）
2. 以下の列を含める：
   - `name`: ルール名
   - `location`: 場所の説明
   - `characters`: 登場人物の描写
   - `lighting`: 照明設定
   - `style`: アートスタイル
   - `additional`: 追加情報（ハッシュタグのルールも含める）

3. **次回の実行で自動的に読み込まれます** - コマンド引数は不要

### 使用するファイルの管理

- `character/` と `imagerule/` フォルダのCSVファイルは**全て自動的に読み込まれます**
- 使いたくないキャラクターやルールは、フォルダから削除するか、別の場所に移動してください
- ファイルを追加・削除したら、`npm run generate-calendar` を実行してください

### 投稿テーマをカスタマイズ

`src/generate-calendar.js` のプロンプト内「投稿テーマ例」を編集して、独自のテーマを追加できます。

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
