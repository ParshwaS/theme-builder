<?php

require_once 'database.php';

$dir = $_SERVER['DOCUMENT_ROOT']."/projects/theme-editor".$_GET['url'];
$it = new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS);
$files = new RecursiveIteratorIterator($it,
             RecursiveIteratorIterator::CHILD_FIRST);
foreach($files as $file) {
    if ($file->isDir()){
        rmdir($file->getRealPath());
    } else {
        unlink($file->getRealPath());
    }
}

rmdir($dir);

$template = $_GET['template'];
$id = $_GET['id'];
$sql = "DELETE $template WHERE id = '$id'";
$db->query($sql);

?>