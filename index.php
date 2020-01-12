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
	<body onload="showContent('Movies')">

		<div id="header">
			
		</div>

		<div id="menu">
			<ul>
			    <li onclick="showAttributes()">Attributes<li>
				<li onclick="showEntities()">Entities</li>
				<li onclick="showContent(this.innerText)" content-type="films" id="Movies-button">Movies</li>
				
			</ul>
		</div>

		<div id="content" >
			<div id="data-menu"></div>
			<table id="data-table"></table>
			<div id="data-element"></div>
		</div>
	</body>
</html>