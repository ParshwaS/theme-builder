<?php

require_once 'database.php';
$name = $_POST['name'];
$value = senitize($_POST['value']);
$id = $_POST['pk'];
$sql = "UPDATE amoeba SET $name = '$value' WHERE id = '$id'";
$db->query($sql);
?>