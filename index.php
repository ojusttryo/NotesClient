<!DOCTYPE html>
<html>
	<head>
		<title>Notes</title>
		<meta charset="utf-8" />
		<link rel="stylesheet" type="text/css" href="styles.css?<?php echo date('l jS \of F Y h:i:s A'); ?>" />
		<script type="text/javascript" src="notes.js"></script>
		<script type="text/javascript" src="testdata.js"></script>
		<script type="text/javascript" src="constants.js"></script>
		<script type="text/javascript" src="functions.js"></script>
		<script type="text/javascript" src="database.js"></script>
		<script type="text/javascript" src="attributes.js"></script>
		<script type="text/javascript" src="entities.js"></script>
		<script type="text/javascript" src="moment.js"></script>
		<script type="text/javascript" src="colors.js"></script>
	</head>
	<body onload="loadMenu(); showLog(); switchToMainPage();">
		<div id="main">
			<div id="menu">
				<ul id="menu-list"></ul>
			</div>
			<div id="content">
				<div id="history"></div>
				<div id="data-menu"></div>
				<div id="data-table"></div>
				<div id="data-element"></div>
			</div>
		</div>
	</body>
</html>