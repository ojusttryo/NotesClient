<!DOCTYPE html>
<html>
	<head>
		<title>Notes</title>
		<meta charset="utf-8" />
		<link rel="stylesheet" type="text/css" href="styles.css" />
		<script type="text/javascript" src="scripts.js"></script>
		<script type="text/javascript" src="testdata.js"></script>
		<script type="text/javascript" src="constants.js"></script>
		<script type="text/javascript" src="functions.js"></script>
		<script type="text/javascript" src="database.js"></script>
		<script type="text/javascript" src="attributes.js"></script>
		<script type="text/javascript" src="entities.js"></script>
	</head>
	<body onload="loadMenu(); showLog();">		
		<div id="header" onclick="showLog(); switchToMainPage();"></div>
		<div id="main">
			<div id="menu">
				<ul id="menu-list"></ul>
			</div>
			<div id="content">
				<div id="history"></div>
				<div id="data-menu"></div>
				<table id="data-table"></table>
				<div id="data-element"></div>
			</div>
		</div>
	</body>
</html>