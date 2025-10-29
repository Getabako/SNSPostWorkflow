import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * AIで投稿カレンダー（CSV）を生成
 * カルーセル投稿用の30日分のコンテンツを作成
 */
async function generateCalendar() {
  try {
    console.log('📅 投稿カレンダーを生成中...\n');

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
    console.log('✅ 事業情報を読み込みました\n');

    // Gemini APIクライアントの初期化
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // カレンダー生成用プロンプト
    const prompt = `
あなたはInstagramマーケティングの専門家です。以下の事業情報をもとに、30日分のInstagram投稿カレンダーを作成してください。

# 事業情報
${businessSummary}

# カレンダー形式
各日の投稿は、カルーセル形式（表紙＋内容スライド3枚）で構成されます。
以下のCSV形式で30行（30日分）のデータを生成してください。

## CSV列構成（13列）
1. 表紙画像説明（英語のAI画像生成プロンプト）
2. 表紙テキスト1（最大8文字/行、2行まで）
3. 表紙テキスト2（最大12文字/行、4行まで）
4. 内容1画像説明（英語のAI画像生成プロンプト）
5. 内容1テキスト1（最大8文字/行、2行まで）
6. 内容1テキスト2（最大12文字/行、4行まで）
7. 内容2画像説明（英語のAI画像生成プロンプト）
8. 内容2テキスト1（最大8文字/行、2行まで）
9. 内容2テキスト2（最大12文字/行、4行まで）
10. 内容3画像説明（英語のAI画像生成プロンプト）
11. 内容3テキスト1（最大8文字/行、2行まで）
12. 内容3テキスト2（最大12文字/行、4行まで）
13. 投稿テキスト・ハッシュタグ（200文字程度）

## 重要な制約
- テキスト1は改行で区切った場合、各行8文字以内、最大2行
- テキスト2は改行で区切った場合、各行12文字以内、最大4行
- 画像説明は英語で、Gemini/DALL-Eで生成可能な具体的なプロンプト
- 投稿テキストには関連するハッシュタグを5〜10個含める
- 30日分の内容は多様性を持たせ、事業の異なる側面を紹介する

## 投稿テーマ例
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

## 出力形式の重要なルール
- **1日=1行**（必ず13個のフィールドをカンマで区切って1行にまとめる）
- ヘッダーは不要、データ行のみ30行出力
- テキスト内の改行は「\\n」に置き換える（実際の改行は入れない）
- フィールドにカンマが含まれる場合のみダブルクォートで囲む
- 画像説明は改行なし、1行で完結する英語プロンプト
- テキスト1とテキスト2は改行記号「\\n」で行を区切る（例: "AIと起業\\nを学ぶ"）

例（1日分）:
"A bright scene...",AIと\\n起業,プログラミング\\nオンライン塾\\nで学ぶ,"A child coding...",マイクラで,プログラミング\\n創造力を\\n育む,...(以下省略)

**必ず30日分、30行のCSVを出力してください。**
`;

    console.log('🤖 Gemini AIでカレンダーを生成中...');
    console.log('⏳ 処理には1〜2分かかる場合があります\n');

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let calendarCSV = response.text().trim();

    // コードブロックのマークダウンを削除（Geminiが返す場合がある）
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
    console.log('📝 最初の投稿のプレビュー:');
    if (lines.length > 0) {
      const firstLine = parseCSVLine(lines[0]);
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
