<?php

	session_start();

	require_once 'database.php';
	include 'includes/head.php';

	if(isset($_SESSION['uid'])){
		header("Location: index.php");
	}

	$errors = array();
	$display = "";

	if(isset($_POST['register'])){
		$email = senitize($_POST['email']);
		$name = senitize($_POST['name']);
		$confpassword = senitize($_POST['confpassword']);
		$password = senitize($_POST['password']);

		if ($email == "") {
			$errors[] .= "Email Can Not Be Empty";
		}
		
		if($password == ""){
			$errors[] .= "Password Can Not Be Empty";
		}

		if ($name == "") {
			$errors[] .= "Your Name Can Not Be Empty";
		}
		
		if($confpassword == ""){
			$errors[] .= "Confirm Password Can Not Be Empty";
		}

		if ($password !== $confpassword) {
			$errors[] .= "Confirm Password And Password Are Not Matching";
		}

		$sql = "SELECT * FROM users WHERE email = '$email'";
		$query = $db->query($sql);

		$count = mysqli_num_rows($query);

		if ($count > 0) {
			$errors[] .= "Sorry A User Is Already Been Registered With This Email";	
		}

		$sql2 = "SELECT * FROM users WHERE uname = '$name'";
		$query2 = $db->query($sql);

		$count2 = mysqli_num_rows($query);

		if ($count2 > 0) {
			$errors[] .= "Sorry A User Is Already Been Registered With This Name. Please Select Another";	
		}


		if(!empty($errors)){
			$display = displayError($errors);
		} else {

			$password = md5($password);
			$sql = "INSERT INTO users (email, uname, password) VALUES ('$email','$name','$password')";
			$db->query($sql);

			header("Location: login.php");

		}

	}

?>
<div class="container">
	<div class="wrapper">
		<form class="form-signin" method="POST" action="register.php">
	      <h2 class="form-signin-heading text-center">Register</h2>
	      <p class="text-center">or <a href="login.php">login</a></p>
	      <div><?= $display; ?></div>
	      <input type="email" class="form-control" name="email" placeholder="Email Address" autofocus="" /> <br/>
	      <input type="text" class="form-control" name="name" placeholder="Your Name"/> <br/>
	      <input type="password" class="form-control" name="password" placeholder="Password"/><br />
	      <input type="password" class="form-control" name="confpassword" placeholder="Confirm Password"/><br />
	      <button class="btn btn-lg btn-primary btn-block" type="submit" name="register">Register</button>
	    </form><br /> <br />
	</div>
</div>

<?php
	include 'includes/footer.php';
?>