<?php
/**
 * フォルダ一覧表示スクリプト
 * images.if-juku.net のルートディレクトリに配置してください
 */

header('Content-Type: text/html; charset=utf-8');

$baseDir = __DIR__;

echo "<h1>フォルダ一覧: " . htmlspecialchars($baseDir) . "</h1>";
echo "<ul>";

$items = scandir($baseDir);
foreach ($items as $item) {
    if ($item === '.' || $item === '..') continue;

    $fullPath = $baseDir . '/' . $item;
    if (is_dir($fullPath)) {
        echo "<li><strong>[DIR]</strong> " . htmlspecialchars($item);

        // サブフォルダの内容を表示
        $subItems = scandir($fullPath);
        echo "<ul>";
        foreach ($subItems as $subItem) {
            if ($subItem === '.' || $subItem === '..') continue;
            $subPath = $fullPath . '/' . $subItem;
            $type = is_dir($subPath) ? "[DIR]" : "[FILE]";
            echo "<li>" . htmlspecialchars($type) . " " . htmlspecialchars($subItem) . "</li>";
        }
        echo "</ul>";

        echo "</li>";
    } else {
        echo "<li>[FILE] " . htmlspecialchars($item) . "</li>";
    }
}

echo "</ul>";
?>
