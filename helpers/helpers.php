<?php

function displayError($errors)
{
	$display = '<ul class="bg-danger" type="none">';
	foreach ($errors as $error) {
		$display .= '<li class="text-danger">'.$error.'</li>';
	}
	$display .= '</ul>';
	return $display;
}

function senitize($dirty){
	return htmlentities($dirty, ENT_QUOTES, "UTF-8");
}

?>