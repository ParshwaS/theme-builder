<?php

	session_start();

	require_once 'database.php';
	include 'includes/head.php';

	if(isset($_SESSION['uid'])){
		header("Location: index.php");
	}

	$errors = array();
	$display = "";

	if (isset($_POST['login'])) {
		$email = senitize($_POST['email']);
		$password = senitize($_POST['password']);

		if ($email == "") {
			$errors[] .= "Email Can Not Be Empty";
		}
		
		if($password == ""){
			$errors[] .= "Password Can Not Be Empty";
		}

		if(!empty($errors)){
			$display = displayError($errors);
		} else {
			$sql = "SELECT * FROM users WHERE uname = '$email'";
			$query = $db->query($sql);
			$result = mysqli_fetch_assoc($query);
			$queryPass = $result['password'];
			if (md5($password) == $queryPass) {
				$_SESSION['uid'] = $result['id'];
				header("Location: index.php");
			} else {
				$display = '<ul class="bg-danger" type="none"><li class="text-danger">Wrong Credintials</li></ul>';
			}
		}

	}

?>

<div class="container">
	<div class="wrapper">
		<form class="form-signin" method="POST" action="login.php">       
	      <h2 class="form-signin-heading text-center">Login</h2>
	      <p class="text-center">or <a href="register.php">Register</a></p>
	    <div>
			<?= $display; ?>
		</div>
	      <input type="text" class="form-control" name="email" placeholder="Username" autofocus="" /> <br/>
	      <input type="password" class="form-control" name="password" placeholder="Password"/><br />
	      <button class="btn btn-lg btn-primary btn-block" type="submit" name="login">Login</button>
	    </form><br /> <br />
	</div>
</div>

<?php
	include 'includes/footer.php';
?>