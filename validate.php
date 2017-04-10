<?php

require_once 'database.php';

if(isset($_GET['url'])){

	$url = $_GET['url'];

	if (!is_dir($url)) {
		
	} else {
		header('HTTP/1.0 404 Not Found');
	}

}

?>