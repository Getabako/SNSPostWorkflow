import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * CSVファイルをパース
 */
function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return null;

  const headers = lines[0].split(',');
  const values = lines[1].split(',');

  const result = {};
  headers.forEach((header, i) => {
    result[header.trim()] = values[i] ? values[i].trim().replace(/^"|"$/g, '') : '';
  });

  return result;
}

/**
 * characterフォルダのCSVファイルをリストアップ
 */
function listCharacters() {
  const characterDir = join(__dirname, '..', 'character');
  if (!existsSync(characterDir)) return [];

  return readdirSync(characterDir)
    .filter(file => file.endsWith('.csv'))
    .map(file => file.replace('.csv', ''));
}

/**
 * imageruleフォルダのCSVファイルをリストアップ
 */
function listImageRules() {
  const imageruleDir = join(__dirname, '..', 'imagerule');
  if (!existsSync(imageruleDir)) return [];

  return readdirSync(imageruleDir)
    .filter(file => file.endsWith('.csv'))
    .map(file => file.replace('.csv', ''));
}

/**
 * キャラクター設定を読み込み
 */
function loadCharacter(characterName) {
  const characterPath = join(__dirname, '..', 'character', `${characterName}.csv`);
  if (!existsSync(characterPath)) {
    throw new Error(`キャラクター設定が見つかりません: ${characterName}`);
  }

  const content = readFileSync(characterPath, 'utf-8');
  return parseCSV(content);
}

/**
 * 画像一貫性ルールを読み込み
 */
function loadImageRule(ruleName) {
  const rulePath = join(__dirname, '..', 'imagerule', `${ruleName}.csv`);
  if (!existsSync(rulePath)) {
    throw new Error(`一貫性ルールが見つかりません: ${ruleName}`);
  }

  const content = readFileSync(rulePath, 'utf-8');
  return parseCSV(content);
}

/**
 * AIで投稿カレンダー（CSV）を生成
 */
async function generateCalendar() {
  try {
    console.log('📅 Instagram投稿カレンダーを生成中...\n');

    // コマンドライン引数またはデフォルト値
    const args = process.argv.slice(2);
    const characterName = args.find(arg => arg.startsWith('--character='))?.split('=')[1] || '塾長山﨑琢己';
    const ruleName = args.find(arg => arg.startsWith('--rule='))?.split('=')[1] || 'iftech';

    console.log(`📌 使用するキャラクター: ${characterName}`);
    console.log(`📌 使用する一貫性ルール: ${ruleName}\n`);

    // 利用可能な設定をリスト表示
    const availableCharacters = listCharacters();
    const availableRules = listImageRules();

    if (availableCharacters.length > 0) {
      console.log('✅ 利用可能なキャラクター:', availableCharacters.join(', '));
    }
    if (availableRules.length > 0) {
      console.log('✅ 利用可能なルール:', availableRules.join(', '));
    }
    console.log();

    // APIキーの確認
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEYが設定されていません。.envファイルを確認してください。');
    }

    // 事業情報の読み込み
    const businessSummaryPath = join(__dirname, '..', 'output', 'business-summary.txt');
    if (!existsSync(businessSummaryPath)) {
      throw new Error('business-summary.txtが見つかりません。先にanalyze-homepage.jsを実行してください。');
    }
    const businessSummary = readFileSync(businessSummaryPath, 'utf-8');

    // キャラクター設定と一貫性ルールの読み込み
    const character = loadCharacter(characterName);
    const imageRule = loadImageRule(ruleName);

    console.log('✅ 事業情報を読み込みました');
    console.log('✅ キャラクター設定を読み込みました');
    console.log('✅ 一貫性ルールを読み込みました\n');

    // Gemini APIクライアントの初期化
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // カレンダー生成用プロンプト
    const prompt = `
あなたはInstagramマーケティングの専門家です。以下の情報をもとに、30日分のInstagram投稿カレンダー（カルーセル形式）を作成してください。

# 事業情報
${businessSummary}

# キャラクター設定（登場人物の一貫性）
名前: ${character.name}
外見: ${character.appearance}
髪: ${character.hair}
目: ${character.eyes}
顔: ${character.face}
体型: ${character.body}
服装: ${character.clothing}
性格: ${character.personality}
追加情報: ${character.additional}

# 画像一貫性ルール
名前: ${imageRule.name}
場所: ${imageRule.location}
キャラクター: ${imageRule.characters}
照明: ${imageRule.lighting}
スタイル: ${imageRule.style}
追加情報: ${imageRule.additional}

# カルーセル投稿の構成
各日の投稿は4枚の画像で構成されます：
1. 表紙（キャッチー）
2. 内容1（詳細説明）
3. 内容2（詳細説明）
4. 内容3（まとめ・CTA）

# CSVフォーマット（13列）
A列: 表紙画像説明（日本語）
B列: 表紙テキストエリア1
C列: 表紙テキストエリア2
D列: 内容1画像説明（日本語）
E列: 内容1テキストエリア1
F列: 内容1テキストエリア2
G列: 内容2画像説明（日本語）
H列: 内容2テキストエリア1
I列: 内容2テキストエリア2
J列: 内容3画像説明（日本語）
K列: 内容3テキストエリア1
L列: 内容3テキストエリア2
M列: 投稿のテキスト+ハッシュタグ

## 画像説明（A,D,G,J列）の作成ルール
- **必ず日本語で記述**
- 上記の「キャラクター設定」と「画像一貫性ルール」を必ず反映
- 人物が登場する場合は、キャラクター設定の外見・服装・性格を正確に描写
- 場所・照明・スタイルは画像一貫性ルールに従う
- 具体的で詳細な描写（AIが画像生成できるレベルの詳細さ）
- 各画像は異なる構図・アングルにする

## テキストエリア1（B,E,H,K列）のルール
- 1行あたり最大8文字
- 最大2行まで
- 単語の途中では改行しない
- 改行は単語の区切り目で行う
- **改行は「\\n」で表現する**（例: "AIと\\n起業"）
- キャッチーで短いフレーズ

## テキストエリア2（C,F,I,L列）のルール
- 1行あたり最大12文字
- 最大4行まで
- 単語の途中では改行しない
- 改行は単語の区切り目で行う
- **改行は「\\n」で表現する**（例: "プログラミング\\nオンライン塾\\nif(塾)へ\\nようこそ！"）
- より詳細な説明

## 投稿テキスト+ハッシュタグ（M列）のルール
- 投稿テキストは改行を使わず、句読点（、。）で区切る
- 200文字程度の魅力的な文章
- 投稿テキストの後にハッシュタグを続ける（スペースで区切る）
- ハッシュタグは#で始め、5〜10個程度

## 投稿テーマ例（30日分に多様性を）
- サービス紹介
- 生徒の成功事例
- 学習Tips
- 業界トレンド
- イベント告知
- Q&A
- ビフォーアフター
- 講師紹介
- お客様の声
- 豆知識
- プログラミング基礎
- AI活用事例
- 起業家精神
- マインクラフト活用
- 無料体験案内

## 重要な制約
- **1日=1行**（必ず13列を1行にまとめる）
- ヘッダーは不要、データ行のみ30行出力
- フィールドにカンマが含まれる場合はダブルクォートで囲む
- **画像説明は必ず日本語**
- **テキスト内の改行は必ず「\\n」で表現**
- **キャラクター設定と一貫性ルールを必ず反映**

## 出力例（1日分）
"明るい教室でプログラミングを教える山﨑琢己塾長。紺のポロシャツ姿で笑顔。背景にマインクラフト画面。自然光が差し込む明るい雰囲気。","AIと\\n起業","プログラミング\\nオンライン塾\\nif(塾)へ\\nようこそ！","生徒がマインクラフトで遊びながらプログラミング学習。画面にはコードブロック。山﨑塾長がサポート。明るい教室。","遊びが\\n学び","マインクラフトで\\n探求する力\\nAI先生が\\nサポート","思考を巡らせる生徒。ホワイトボードにビジネスモデル図。山﨑塾長が助言。暖かい照明。","未来を\\n創る","AI活用で\\nビジネス\\nモデル構築\\n体験","オンラインで山﨑塾長とメンターが生徒をサポート。画面越しに笑顔。多様な生徒が参加。","実践力\\nを育む","メンターと\\n仕事体験\\n収益化も\\n経験","if(塾)はAIと起業を学ぶオンラインプログラミング塾です。マインクラフトで楽しく学び、AI先生のサポートを受けながら、未来を創る力を養います。ビジネスモデル構築から実際の仕事経験まで、お子様の可能性を最大限に引き出します。 #if塾 #オンラインプログラミング #AI学習 #起業家教育 #マインクラフト #子供の習い事 #未来を学ぶ"

**必ず30日分、30行のCSVを出力してください。**
`;

    console.log('🤖 Gemini AIでカレンダーを生成中...');
    console.log('⏳ 処理には1〜2分かかる場合があります\n');

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let calendarCSV = response.text().trim();

    // コードブロックのマークダウンを削除
    calendarCSV = calendarCSV.replace(/```csv\n/g, '').replace(/```\n/g, '').replace(/```/g, '');

    // CSVファイルとして保存
    const csvPath = join(__dirname, '..', 'output', 'calendar.csv');
    writeFileSync(csvPath, calendarCSV, 'utf-8');

    console.log('✅ カレンダーCSVを生成しました');
    console.log(`💾 保存先: ${csvPath}\n`);

    // CSVをパースして検証
    const lines = calendarCSV.split('\n').filter(line => line.trim());
    console.log(`📊 生成された投稿数: ${lines.length}日分\n`);

    // サンプルを表示
    if (lines.length > 0) {
      console.log('📝 最初の投稿のプレビュー:');
      const firstLine = parseCSVLine(lines[0]);
      console.log(`  列数: ${firstLine.length}列`);
      console.log('  表紙画像: ', firstLine[0]?.substring(0, 60) + '...');
      console.log('  表紙テキスト1: ', firstLine[1]);
      console.log('  表紙テキスト2: ', firstLine[2]);
      console.log('  投稿テキスト: ', firstLine[12]?.substring(0, 80) + '...');
    }

    return csvPath;
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

/**
 * CSV行をパース（クォート対応）
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

// メイン処理
generateCalendar();
