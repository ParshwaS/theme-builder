<?php

require_once 'database.php';

session_start();

$errors = array();
$display = '';

$url = $_POST['url'];
$id = $_POST['id'];
$place = $_POST['place'];

if(!isset($_SESSION['uid'])){
	header("Location: login.php");
} else {
	$uid = $_SESSION['uid'];
}

if(!empty($_FILES['file'])){
	$image = $_FILES['file'];
	$name = $image['name'];
	if(empty($name)){
		$errors[] .= "Please Select A File:";
	} else {
	$namearray = explode(".", $name);
	$ext = end($namearray);
	$mime = explode("/", $image['type']);
	$mimetype = $mime[0];
	$mimeext = $mime[1];
	$allowed = array('jpg', 'png', 'jpeg', 'gif');
	$tmpLoc = $image['tmp_name'];
	$uploadname = md5(microtime()).'.'.$ext;
	$uploadpath = $_SERVER['DOCUMENT_ROOT'].'/projects/theme-editor'.$url.'img/users/'.$uploadname;
	$dbpath = 'img/users/'.$uploadname;
	$size = $image['size'];

	if ($mimetype != "image") {
		$errors[] .= "This File Must Be Image";
	}

	if (!in_array($ext, $allowed)) {
		$errors[] .= "This File Is Not Allowed";
	}

	if ($ext != $mimeext && ($mimeext == "jpeg" && $ext != "jpg")) {
		$errors[] .= "You Can't Change Image Extension";
	}

	if ($size > 15000000) {
		$errors[] = "This File's Size Is A Lot Big. Please Upload File Under 15MB";
	}
}

if (!empty($errors)) {
		foreach ($errors as $error) {
		echo    '<div class="text-center" style="background-color: #f2dede">
				<p class="text-danger">'.$error.'</p>
			</div>';
		}
	} else {
		move_uploaded_file($tmpLoc, $uploadpath);
		$sql = "UPDATE amoeba SET $place = '$dbpath' WHERE id = '$id'";
		$db->query($sql);
		header("Location: index.php?edit");
	}

}

?>

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!-- The above 3 meta tags *must* come first in the head; any other head content must come *after* these tags -->
    <title>Create Now</title>

    <!-- Bootstrap -->
    <link href="//netdna.bootstrapcdn.com/bootstrap/3.0.0/css/bootstrap.min.css" rel="stylesheet">
	<script src="http://code.jquery.com/jquery-2.0.3.min.js"></script> 
    <script type="text/javascript" src="js/validator.min.js"></script>
	<script src="//netdna.bootstrapcdn.com/bootstrap/3.0.0/js/bootstrap.min.js"></script>
    <link rel="stylesheet" type="text/css" href="css/style.css">

    <!-- HTML5 shim and Respond.js for IE8 support of HTML5 elements and media queries -->
    <!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
    <!--[if lt IE 9]>
      <script src="https://oss.maxcdn.com/html5shiv/3.7.3/html5shiv.min.js"></script>
      <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
    <![endif]-->
</head>
<body>
	<div class="container">
		<div class="row">
			<div class="col-md-4"></div>
			<div class="col-md-4">
				<div class="text-center well">
					<?= $display ?>
				</div>
			</div>
			<div class="col-md-4"></div>
		</div>
	</div>
</body>
</html>

<?php

// if (!empty($errors)) {
// 	sleep(10);
// 	header("Location: index.php?edit");
// }

?>