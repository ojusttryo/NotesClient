<!DOCTYPE html>
<html>
	<head>
		<title>Notes</title>
		<meta charset="utf-8" />
		<link rel="stylesheet" type="text/css" href="styles.css?<?php echo date('l jS \of F Y h:i:s A'); ?>" />
		<link rel="icon" href="img/notes.svg" id="title-icon">
		<script type="text/javascript" src="notes.js"></script>
		<script type="text/javascript" src="constants.js"></script>
		<script type="text/javascript" src="functions.js"></script>
		<script type="text/javascript" src="attributes.js"></script>
		<script type="text/javascript" src="entities.js"></script>
		<script type="text/javascript" src="moment.js"></script>
		<script type="text/javascript" src="colors.js"></script>
	</head>
	<body onload="handleRequest();">
		<div id="main">
			<div id="switch">
				<a id="notes-button" onclick="switchToNotes();"></a>
				<a id="settings-button" onclick="switchToEntities();"></a>
				<a id="log-button" onclick="switchToLog();"></a>
			</div>
			<div id="menu">
				<div id="menu-list"></div>
			</div>
			<div id="content">
				<div id="error-label"></div>
				<div id="history"></div>
				<div id="data-menu" class="data-menu"></div>
				<div id="data-table" class="data-table has-vertical-padding"></div>
				<div id="data-element"></div>
			</div>
		</div>
	</body>
</html>