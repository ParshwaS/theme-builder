<?php

$db = mysqli_connect('localhost', 'root', '', 'theme');
$name = $_POST['name'];
$value = $_POST['value'];
$id = $_POST['pk'];
$sql = "UPDATE basic SET $name = '$value' WHERE id = '$id'";
$db->query($sql);
?>