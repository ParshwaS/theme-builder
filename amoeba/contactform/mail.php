<?php

$name = $_POST['name'];
$email = $_POST['email'];
$subject = $_POST['subject'];
$message = $_POST['message'];
$to_email = $_POST['t-email'];

$text = "There Is An Message From Person Named ".$name."\n"."His / Her Email Is ".$email."\n"."Subject Was ".$subject."\n"."Message Was ".$message;

mail('<?= $to_email ?>', 'Someone Messaged From Website', $text, 'From: parshwa.erpnext@gmail.com');
header("Location: ../index.php");

?>