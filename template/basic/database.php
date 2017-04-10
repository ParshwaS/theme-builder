<?php
	
$db = mysqli_connect('localhost', 'root', '', 'theme');

if (mysqli_connect_errno()) {
	echo 'Error: ' . mysqli_connect_errno();
	die();
}

require_once $_SERVER['DOCUMENT_ROOT'].'/projects/theme-editor/helpers/helpers.php';

?>