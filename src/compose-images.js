import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import FormData from 'form-data';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// アップロード設定
const UPLOAD_URL = 'https://images.if-juku.net/upload.php';
const UPLOAD_PASSWORD = 'IFjuku19841121';

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

/**
 * テキストを行分割（\\nで分割）
 */
function splitText(text) {
  if (!text) return [];
  return text.split('\\n');
}

/**
 * テキストをCanvas上に描画
 */
function drawText(ctx, text, font, fontSize, alignment, effect, posY, canvasWidth, canvasHeight) {
  if (!text || !text.trim()) return;

  const textLines = splitText(text);

  ctx.save();
  ctx.font = `bold ${fontSize}px "${font}"`;
  ctx.textAlign = alignment;
  ctx.textBaseline = 'middle';

  const lineHeight = fontSize * 1.2;
  const startY = posY;

  let x;
  switch (alignment) {
    case 'left':
      x = 50;
      break;
    case 'center':
      x = canvasWidth / 2;
      break;
    case 'right':
      x = canvasWidth - 50;
      break;
    default:
      x = canvasWidth / 2;
  }

  textLines.forEach((line, index) => {
    if (!line.trim()) return;

    const lineY = startY + (index * lineHeight);

    ctx.save();

    // アウトライン効果
    if (effect === 'outline') {
      // 白の外側のアウトライン
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 20;
      ctx.strokeText(line, x, lineY);

      // 黒のアウトライン
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 12;
      ctx.strokeText(line, x, lineY);

      // メインテキスト（白）
      ctx.fillStyle = '#ffffff';
      ctx.fillText(line, x, lineY);
    } else {
      // エフェクトなし
      ctx.fillStyle = '#ffffff';
      ctx.fillText(line, x, lineY);
    }

    ctx.restore();
  });

  ctx.restore();
}

/**
 * 画像にテキストを重ねて3:4にリサイズ
 */
async function composeImage(imagePath, titleText, contentText) {
  const canvasWidth = 1080;
  const canvasHeight = 1440; // 3:4の比率

  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  // 背景画像を読み込み
  const img = await loadImage(imagePath);

  // 背景を白で塗りつぶし
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 画像を3:4にフィットさせる
  let sourceX = 0, sourceY = 0;
  let sourceWidth = img.width;
  let sourceHeight = img.height;

  // 正方形の画像を3:4にトリミング
  if (img.width === img.height) {
    sourceHeight = img.width * (4/3);
    if (sourceHeight > img.height) {
      sourceHeight = img.height;
      sourceWidth = img.height * (3/4);
      sourceX = (img.width - sourceWidth) / 2;
    }
  }

  const scale = Math.max(canvasWidth / sourceWidth, canvasHeight / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const drawX = (canvasWidth - drawWidth) / 2;
  const drawY = (canvasHeight - drawHeight) / 2;

  ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, drawX, drawY, drawWidth, drawHeight);

  // タイトルを描画（上部10%固定）
  if (titleText && titleText.trim()) {
    const titlePosY = canvasHeight * 0.1;
    drawText(
      ctx,
      titleText,
      'BIZ UDGothic',
      120,
      'center',
      'outline',
      titlePosY,
      canvasWidth,
      canvasHeight
    );
  }

  // コンテンツを描画（縦位置45%）
  if (contentText && contentText.trim()) {
    const contentPosY = canvasHeight * 0.45;
    drawText(
      ctx,
      contentText,
      'M PLUS 2',
      90,
      'center',
      'outline',
      contentPosY,
      canvasWidth,
      canvasHeight
    );
  }

  return canvas.toBuffer('image/png');
}

/**
 * 画像をサーバーにアップロード
 */
async function uploadImage(imageBuffer, path) {
  try {
    const formData = new FormData();
    formData.append('file', imageBuffer, { filename: 'image.png' });
    formData.append('path', path);
    formData.append('password', UPLOAD_PASSWORD);

    const response = await fetch(UPLOAD_URL, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.success) {
      return result.url;
    } else {
      throw new Error(result.error || 'アップロード失敗');
    }
  } catch (error) {
    throw new Error(`アップロードエラー: ${error.message}`);
  }
}

/**
 * カレンダーCSVから画像を合成してアップロード
 */
async function composeAndUploadImages() {
  try {
    console.log('🎨 画像合成とアップロードを開始...\n');

    // カレンダーCSVを読み込む
    const calendarPath = join(__dirname, '..', 'output', 'calendar.csv');
    if (!existsSync(calendarPath)) {
      throw new Error('calendar.csvが見つかりません。先にgenerate-calendar.jsを実行してください。');
    }

    const calendarContent = readFileSync(calendarPath, 'utf-8');
    const lines = calendarContent.split('\n').filter(line => line.trim());

    console.log(`📊 カレンダー行数: ${lines.length}日分\n`);

    // AI生成画像のディレクトリ
    const imagesDir = join(__dirname, '..', 'output', 'images');
    if (!existsSync(imagesDir)) {
      throw new Error('output/images/が見つかりません。先にgenerate-images.jsを実行してください。');
    }

    // 合成画像の出力ディレクトリ
    const composedDir = join(__dirname, '..', 'output', 'composed');
    if (!existsSync(composedDir)) {
      mkdirSync(composedDir, { recursive: true });
    }

    // 現在の年月を取得（フォルダ名用）
    const now = new Date();
    const folderName = `if_juku_post_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`;

    let totalComposed = 0;
    let totalUploaded = 0;
    let totalFailed = 0;

    // 各日の画像を合成
    for (let dayIndex = 0; dayIndex < lines.length; dayIndex++) {
      const line = lines[dayIndex];
      const columns = parseCSVLine(line);

      if (columns.length < 13) {
        console.log(`⚠️  日${dayIndex + 1}: 列数が不足（${columns.length}列）- スキップ`);
        continue;
      }

      console.log(`\n📅 日${dayIndex + 1}の画像合成中...`);

      // 各日4枚の画像
      const imageConfigs = [
        { index: 1, titleCol: 1, contentCol: 2, name: '表紙' },     // B列、C列
        { index: 2, titleCol: 4, contentCol: 5, name: '内容1' },    // E列、F列
        { index: 3, titleCol: 7, contentCol: 8, name: '内容2' },    // H列、I列
        { index: 4, titleCol: 10, contentCol: 11, name: '内容3' }   // K列、L列
      ];

      for (const config of imageConfigs) {
        const dayNum = String(dayIndex + 1).padStart(2, '0');
        const imgNum = String(config.index).padStart(2, '0');

        // AI生成画像のパス
        const aiImagePath = join(imagesDir, `day${dayNum}_${imgNum}.png`);

        if (!existsSync(aiImagePath)) {
          console.log(`  ⚠️  ${config.name}: AI生成画像が見つかりません - スキップ`);
          totalFailed++;
          continue;
        }

        // テキストを取得
        const titleText = columns[config.titleCol].trim();
        const contentText = columns[config.contentCol].trim();

        console.log(`  🎨 ${config.name}を合成中...`);
        console.log(`     タイトル: ${titleText}`);
        console.log(`     コンテンツ: ${contentText.substring(0, 30)}...`);

        try {
          // 画像を合成
          const composedBuffer = await composeImage(aiImagePath, titleText, contentText);

          // ローカルに保存
          const composedFilename = `${String(totalComposed).padStart(3, '0')}.png`;
          const composedPath = join(composedDir, composedFilename);
          writeFileSync(composedPath, composedBuffer);

          console.log(`  💾 ${composedFilename} 保存完了`);
          totalComposed++;

          // サーバーにアップロード
          const uploadPath = `${folderName}/${composedFilename}`;
          console.log(`  ⬆️  アップロード中...`);

          const uploadedUrl = await uploadImage(composedBuffer, uploadPath);
          console.log(`  ✅ アップロード完了: ${uploadedUrl}`);
          totalUploaded++;

        } catch (error) {
          console.error(`  ❌ エラー:`, error.message);
          totalFailed++;
        }

        // API制限を考慮して少し待機
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ 画像合成・アップロード完了`);
    console.log(`📊 合成成功: ${totalComposed}枚`);
    console.log(`⬆️  アップロード成功: ${totalUploaded}枚`);
    console.log(`❌ 失敗: ${totalFailed}枚`);
    console.log(`💾 ローカル保存先: ${composedDir}`);
    console.log(`🌐 サーバー保存先: https://images.if-juku.net/${folderName}/\n`);

    return composedDir;
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
    process.exit(1);
  }
}

// メイン処理
composeAndUploadImages();
