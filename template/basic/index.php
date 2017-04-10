<?php

require_once 'database.php';

session_start();
if (isset($_SESSION['uid'])){
    $uid = $_SESSION['uid'];
}

$ids = explode("\n", file_get_contents('id.txt'));
$id = $ids[0];

$sql = "SELECT * FROM basic WHERE id = '$id'";
$query = $db->query($sql);
$result = mysqli_fetch_assoc($query);
$owner = $result['uid'];

?>

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!-- The above 3 meta tags *must* come first in the head; any other head content must come *after* these tags -->
    <title>Editable</title>

    <!-- Bootstrap -->
    <link href="//netdna.bootstrapcdn.com/bootstrap/3.0.0/css/bootstrap.min.css" rel="stylesheet">
	<script src="http://code.jquery.com/jquery-2.0.3.min.js"></script> 
	<script src="//netdna.bootstrapcdn.com/bootstrap/3.0.0/js/bootstrap.min.js"></script>


    <link href="bootstrap3-editable/css/bootstrap-editable.css" rel="stylesheet">
    <link rel="stylesheet" type="text/css" href="style.css">
    <script src="bootstrap3-editable/js/bootstrap-editable.js"></script>
    <!-- HTML5 shim and Respond.js for IE8 support of HTML5 elements and media queries -->
    <!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
    <!--[if lt IE 9]>
      <script src="https://oss.maxcdn.com/html5shiv/3.7.3/html5shiv.min.js"></script>
      <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
    <![endif]-->
  </head>
  <body>
    <div class="container text-center">
    <?php
    if($_SESSION['uid'] && ($owner == $uid)){
        if(isset($_GET['edit'])){
            echo '<a href="index.php?edit" class="btn btn-info">Edit Mode</a>';
        } else {
            echo '<a href="index.php" class="btn btn-info">View Mode</a>';
        }
    }?>
    </div>
    <h1>Hello, world!</h1><br><br><br><br>
    <div id="content">
    	<h2 data-type="text" data-pk="<?= $id ?>" data-name="name" class="username text-center"><?= $result['name'] ?></h2>
    </div>
    <!-- jQuery (necessary for Bootstrap's JavaScript plugins) -->
	<?php if(isset($_SESSION['uid']) && ($owner == $uid) && isset($_GET['edit'])): ?>
    <script>
    	$(document).ready(function(){
    		
    		$.fn.editable.defaults.mode = 'inline';

    		$('#content').editable({
    			container: 'body',
    			selector: 'h2.username',
    			url: 'upload.php',
                title: 'Enter User Name',
                type: 'POST',
                validate: function(value){
                    if($.trim(value) == '')
                    {
                        return 'Field Can not be Empty...';
                    }
                }
    		});

    	});
   	</script>
   <?php endif; ?>
  </body>
</html>