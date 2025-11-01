<?php
/**
 * ファイルアップロード用API
 * images.if-juku.net のルートディレクトリに配置してください
 */

// CORS設定（必要に応じて調整）
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// OPTIONSリクエストの処理
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// POSTリクエストのみ受け付ける
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'error' => 'POSTリクエストのみ受け付けます'
    ]);
    exit;
}

// 設定
define('ALLOWED_PASSWORDS', ['IFjuku19841121', 'higashinarusemura1001']); // アップロード用パスワード
define('ALLOWED_EXTENSIONS', ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']);
define('MAX_FILE_SIZE', 10 * 1024 * 1024); // 10MB

// パスワード認証
$password = $_POST['password'] ?? '';
if (!in_array($password, ALLOWED_PASSWORDS, true)) {
    echo json_encode([
        'success' => false,
        'error' => 'パスワードが正しくありません'
    ]);
    exit;
}

// ファイルとパスの取得
if (!isset($_FILES['file']) || !isset($_POST['path'])) {
    echo json_encode([
        'success' => false,
        'error' => 'ファイルまたはパスが指定されていません'
    ]);
    exit;
}

$file = $_FILES['file'];
$relativePath = $_POST['path'];

// ファイルアップロードエラーチェック
if ($file['error'] !== UPLOAD_ERR_OK) {
    echo json_encode([
        'success' => false,
        'error' => 'ファイルのアップロードに失敗しました (エラーコード: ' . $file['error'] . ')'
    ]);
    exit;
}

// ファイルサイズチェック
if ($file['size'] > MAX_FILE_SIZE) {
    echo json_encode([
        'success' => false,
        'error' => 'ファイルサイズが大きすぎます (最大: ' . (MAX_FILE_SIZE / 1024 / 1024) . 'MB)'
    ]);
    exit;
}

// 拡張子チェック
$pathInfo = pathinfo($file['name']);
$extension = strtolower($pathInfo['extension'] ?? '');

if (!in_array($extension, ALLOWED_EXTENSIONS)) {
    echo json_encode([
        'success' => false,
        'error' => '許可されていないファイル形式です'
    ]);
    exit;
}

// パスのサニタイズ（ディレクトリトラバーサル攻撃対策）
$relativePath = str_replace(['../', '..\\'], '', $relativePath);
$relativePath = ltrim($relativePath, '/');

// アップロード先のパスを作成
$uploadDir = __DIR__; // images.if-juku.netのルートディレクトリ
$targetPath = $uploadDir . '/' . $relativePath;

// ディレクトリが存在しない場合は作成
$targetDir = dirname($targetPath);
if (!file_exists($targetDir)) {
    if (!mkdir($targetDir, 0755, true)) {
        echo json_encode([
            'success' => false,
            'error' => 'ディレクトリの作成に失敗しました'
        ]);
        exit;
    }
}

// ファイルの移動
if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    echo json_encode([
        'success' => false,
        'error' => 'ファイルの保存に失敗しました'
    ]);
    exit;
}

// パーミッションを設定
chmod($targetPath, 0644);

// 成功レスポンス
$url = 'https://images.if-juku.net/' . $relativePath;
echo json_encode([
    'success' => true,
    'url' => $url,
    'path' => $relativePath
]);
