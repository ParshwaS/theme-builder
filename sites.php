<?php

require_once 'database.php';

$uid = $_GET['id'];

$sql = $db->query("SELECT * FROM templates");

while($row = mysqli_fetch_assoc($sql)){
	$template = $row['name'];
	$tem_sql = "SELECT * FROM $template WHERE uid = '$uid'";
	$tem_query = $db->query($tem_sql);
	while ($row2 = mysqli_fetch_assoc($tem_query)) {
		$url = $row2['url'];
		$name = str_replace('/', '', $url);
		$tid = $row2['id'];
		echo "<tr>";
		echo "<td>$name</td>";
		echo "<td>$url</td>";
		echo '<td><button class="btn btn-xs btn-danger" onclick="delete_site('.$template.', '.$tid.', '.$url.');"><span class="glyphicon glyphicon-trash"></span></button></td>';
		echo "</tr>";
	}
}

?>