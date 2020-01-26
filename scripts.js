
// Object to store my cache.
// Fucking javascript...
CACHE = {};
SERVER_ADDRESS = "http://localhost:8765";

function loadMenu()
{
	var url = SERVER_ADDRESS + '/rest/entities';
	const init = { method: 'GET' };

    makeHttpRequest(url, init, fillMenu);
}

function fillMenu(entities)
{
	var menuList = getEmptyElement("menu-list");

	for (var i = 0; i < entities.length; i++)
	{
		var title = entities[i].title;
		var collection = entities[i].collection;
		var li = document.createElement("li");
		li.onclick = function() { showContent(this); };
		li.id = collection + "-button";
		li.innerText = title;
		li.setAttribute(CONTENT, collection);
		menuList.appendChild(li);
	}

	if (entities.length > 0)
	{
		var emptyLi = document.createElement("li");
		menuList.appendChild(emptyLi);
	}

	var attributesLi = document.createElement("li");
	attributesLi.innerText = "Attributes";
	attributesLi.onclick = function() { showAttributes(); };
	menuList.appendChild(attributesLi);

	var entitiesLi = document.createElement("li");
	entitiesLi.innerText = "Entities";
	entitiesLi.onclick = function() { showEntities(); };
	menuList.appendChild(entitiesLi);
}

function showContent(name)
{
	var attributes = getAttributes(name);
	var data = getData(name);
	CACHE[DATA] = data;

	setContentType(name);
	drawHeader(name);	
	switchToContent();
	showData(data, attributes);
	showMenu();
	updateContentTableVisibility();

	//readNotes();
}


// function readNotes()
// {
// 	var notesUrl = 'http://192.168.0.101:8765/rest/notes/films';
// 	var attributesUrl = 'http://192.168.0.101:8765/rest/attributes';
// 	const init = { method: 'GET' };

// 	var attributes = makeHttpRequest(attributesUrl, init, 'GET');
// 	var notes = makeHttpRequest(notesUrl, init, 'GET');

// 	var attrObjects = JSON.parse(attributes);
// 	var attrMap = [];
// 	for (var i = 0; i < attrObjects.length; i++)
// 	{
// 		var attr = attrObjects[i];
// 		attrMap[attr.id] = attr;

// 		var textItem = document.createElement("div");
// 		textItem.innerHTML = JSON.stringify(attrMap[attr.id]);
// 		document.getElementById(DATA_MENU).appendChild(textItem);
// 	}
// }

async function makeHttpRequest(url, init, handler)
{
	let response;
	let json;

	try
	{
		response = await fetch(url, init);
		if (init.method == "GET")
			json = await response.json();
		else
			json = await response.text();
	}
	catch(e)
	{
		alert(e);
	}

	if (response.ok && handler)
		handler(init.method == "GET" ? json : null);

	return;
}


function showMenu()
{
	var dataMenu = getEmptyElement(DATA_MENU);

	var addNoteButton = document.createElement("input");
	addNoteButton.type = "button";
	addNoteButton.id = "add-note-button";
	addNoteButton.value = "New note";
	addNoteButton.onclick = function() { showAddEditForm(null, null, NOTE) };

	var addFolderButton = document.createElement("input");
	addFolderButton.type = "button";
	addFolderButton.id = "add-folder-button";
	addFolderButton.value = "New folder";
	addFolderButton.onclick = function() { showAddEditForm(null, null, FOLDER) };

	dataMenu.appendChild(addNoteButton);
	dataMenu.appendChild(addFolderButton);
}


/** Switch view to content (menu buttons and data table), hiding the add/edit form */
function switchToContent()
{
	hideHtmlElementById(DATA_ELEMENT);
	showHtmlElementById(DATA_TABLE);
	showHtmlElementById(DATA_MENU);	
}

/** Switch view to add/edit form, hiding menu buttons and data table */
function switchToAddEditForm()
{
	hideHtmlElementById(DATA_TABLE);
	hideHtmlElementById(DATA_MENU);	
	showHtmlElementById(DATA_ELEMENT);
}

/** Update visibility of content elements (buttons and data table) depending on rows count */
function updateContentTableVisibility()
{
	if (document.getElementById(DATA_TABLE).childNodes[1].childNodes.length > 0)
		showHtmlElementById(DATA_TABLE);
	else
		hideHtmlElementById(DATA_TABLE);
}


function showData(data, attributes)
{
	var table = getEmptyElement(DATA_TABLE);
	table.appendChild(createTableHead(attributes));
	table.appendChild(createTableBody(attributes, data));

	setNotesCount(data[NOTES_COUNT]);
}


function createTableHead(attributes)
{
	// Table head should look like this
	// |       Name      | Edit | Delete |    --- Names
	// |  |  |  |  |  |  |      |        |    --- Columns (i.e. combining 6 columns for name)

	var thead = document.createElement("thead");
	var tr = document.createElement("tr");

	// Attributes
	for (var i = 0; i < attributes.length; i++)
	{
		var th = document.createElement("th");
		th.innerText = attributes[i][NAME];
		if (i === 0)
		{
			th.colSpan = 6;
			th.setAttribute("align", "center");
		}
		tr.appendChild(th);
	}

	// Edit and Delete buttons
	tr.appendChild(document.createElement("th"));
	tr.appendChild(document.createElement("th"));

	thead.appendChild(tr);

	return thead;
}


function createTableBody(attributes, data)
{
	// Table body should look like this
	// | - | F | Folder level 1 name                 | Attribute 1 | Attribute 2 | ...    --- Top level folder
	// |   | - |  F  | Folder level 2 name           | Attribute 1 | Attribute 2 | ...    --- First level nesting folder
	// |   |   |  -  |  F  | Folder level 3 name     | Attribute 1 | Attribute 2 | ...    --- Second level nesting folder (maximum)
	// |   |   |     |     |  N  | Note level 4 name | Attribute 1 | Attribute 2 | ...    --- Third level nestring note (maximum)
	// |   |   |     |  N  | Note level 3 name       | Attribute 1 | Attribute 2 | ...    --- Second level nesting note
	// |   |   |  N  | Note level 2 name             | Attribute 1 | Attribute 2 | ...    --- First level nesting note
	// |   | N | Note level 1 name                   | Attribute 1 | Attribute 2 | ...    --- Top level note
	// |   |   |     |     |     |                   | Attribute 1 | Attribute 2 | ...
	// So there are 6 columns for name and sings/icons.
	// To the left of the sings and icons there are empty td elements without colSpan.
	// To the right of the name there could be empty space. Name column combine it using colSpan.

	var tbody = document.createElement("tbody");

	if (data.Folders != null)
	{
		for (var i = 0; i < data.Folders.length; i++)
			printFolder(tbody, attributes, data.Folders[i]);
	}
	printNotes(tbody, attributes, data);

	return tbody;
}

function setNotesCount(count)
{
	var contentType = getContentType();
	var li = document.getElementById(contentType + "-button");
	li.innerHTML = contentType + " (" + count + ")";
	li.setAttribute(COUNT, count);
}

function printFolder(tbody, attributes, folder)
{
	var tr = document.createElement("tr");
	tr.className = FOLDER;
	tr.setAttribute(CONTENT_ID, folder[ID]);
	tr.setAttribute(CONTENT_LEVEL, folder[LEVEL]);

	for (var i = 0; i < folder[LEVEL] - 1; i++)
		tr.appendChild(document.createElement("td"));
	
	var dashButton = (folder.Notes.length > 0 || folder.Folders.length > 0) ? createTdWithIcon(COLLAPSE_ICON) : createTdWithIcon(EMPTY_ICON);
	dashButton.onclick = function() 
	{
		switch (dashButton.className)
		{			
			case COLLAPSE_ICON: collapseFolder(this.parentNode); break;
			case EXPAND_ICON: expandFolder(this.parentNode); break;
			default: break;
		}
	}

	tr.appendChild(dashButton);
	tr.appendChild(createTdWithIcon(FOLDER_ICON));

	var folderName = document.createElement("td");
	folderName.innerHTML = folder[NAME];
	folderName.colSpan = 4 - folder[LEVEL] + 1;
	folderName.setAttribute("align", "left");
	folderName.setAttribute(ATTRIBUTE_NAME, NAME);
	tr.appendChild(folderName);

	for (var i = 1; i < attributes.length; i++)
	{
		var attributeName = attributes[i][NAME];
		var td = document.createElement("td");
		td.setAttribute(ATTRIBUTE_NAME, attributeName);
		td.innerHTML = folder[attributeName] == null ? "" : folder[attributeName];
		tr.appendChild(td);
	}

	tr.appendChild(createEditButton(FOLDER, folder[ID]));
	tr.appendChild(createDeleteButton(FOLDER, folder[ID]));

	tbody.appendChild(tr);
	
	if (folder.Folders != null)
	{
		for (var i = 0; i < folder.Folders.length; i++)
			printFolder(tbody, attributes, folder.Folders[i]);
	}

	printNotes(tbody, attributes, folder);
}


function collapseFolder(folderRow)
{
	folderRow.setAttribute(DASHED, "true");					
	for (var i = 0; i < folderRow.childNodes.length; i++)
	{
		var td = folderRow.childNodes[i];
		if (td.className == COLLAPSE_ICON)
		{
			td.className = EXPAND_ICON;
			break;
		}
	}

	var tbody = folderRow.parentNode;
	var level = folderRow.getAttribute(CONTENT_LEVEL);
	for (var i = folderRow.rowIndex; i < tbody.childNodes.length; i++)
	{
		var innerItem = tbody.childNodes[i];
		if (innerItem.getAttribute(CONTENT_LEVEL) <= level)
			break;

		innerItem.style.display = "none";

		if (innerItem.getAttribute(DASHED) == "true")
		{
			var innerLevel = innerItem.getAttribute(CONTENT_LEVEL);
			i++;
			while (i < tbody.childNodes.length && tbody.childNodes[i].getAttribute(CONTENT_LEVEL) > innerLevel)
				i++;
			i--;
		}
	}
}


function expandFolder(foldeRow)
{
	foldeRow.setAttribute(DASHED, "false");						
	for (var i = 0; i < foldeRow.childNodes.length; i++)
	{
		var td = foldeRow.childNodes[i];
		if (td.className == EXPAND_ICON)
		{
			td.className = COLLAPSE_ICON;
			break;
		}
	}

	var tbody = foldeRow.parentNode;
	var level = foldeRow.getAttribute(CONTENT_LEVEL);
	for (var i = foldeRow.rowIndex; i < tbody.childNodes.length; i++)
	{
		var innerItem = tbody.childNodes[i];
		if (innerItem.getAttribute(CONTENT_LEVEL) <= level)
			break;

		innerItem.style.display = "table-row";

		if (innerItem.getAttribute(DASHED) == "true")
		{
			var innerLevel = innerItem.getAttribute(CONTENT_LEVEL);
			i++;
			while (i < tbody.childNodes.length && tbody.childNodes[i].getAttribute(CONTENT_LEVEL) > innerLevel)
				i++;
			i--;
		}
	}
}


function printNotes(tbody, attributes, folder)
{
	if (folder.Notes != null)
	{
		for (var i = 0; i < folder.Notes.length; i++)
		{
			var tr = document.createElement("tr");
			tr.className = NOTE;
			tr.setAttribute(CONTENT_ID, folder.Notes[i][ID]);
			tr.setAttribute(CONTENT_LEVEL, folder[LEVEL] + 1);

			for (var k = 0; k < folder[LEVEL] + 1; k++)
			{
				var td = document.createElement("td");
				tr.appendChild(td);
			}

			tr.appendChild(createTdWithIcon(NOTE_ICON));

			for (var j = 0; j < attributes.length; j++)
			{
				var attr = attributes[j];
				var td = document.createElement("td");
				var attributeName = attr[NAME];
				td.setAttribute(ATTRIBUTE_NAME, attributeName);
				if (j == 0)
				{
					td.setAttribute("colSpan", 4 - folder[LEVEL]);
				}
				td.innerHTML = folder.Notes[i][attributeName];
				tr.appendChild(td);
			}

			tr.appendChild(createEditButton(NOTE, folder.Notes[i][ID]));
			tr.appendChild(createDeleteButton(NOTE, folder.Notes[i][ID]));

			tbody.appendChild(tr);
		}
	}
}

function createTdWithIcon(iconClassName)
{
	var icon = document.createElement("td");
	icon.className = iconClassName;
	return icon;
}


function createEditButton(itemType, id)
{
	var editButton = document.createElement("td");
	editButton.className = EDIT_BUTTON;
	editButton.setAttribute(ITEM_TYPE, itemType);
	editButton.setAttribute(CONTENT_ID, id);
	editButton.onclick = function() 
	{		
		showAddEditForm(this.parentNode, id, itemType); 
	};

	return editButton;
}

function createDeleteButton(itemType, id)
{
	var deleteButton = document.createElement("td");
	deleteButton.className = DELETE_BUTTON;
	deleteButton.setAttribute(ITEM_TYPE, itemType);
	deleteButton.setAttribute(CONTENT_ID, id);
	deleteButton.onclick = function() 
	{
		switch (this.getAttribute(ITEM_TYPE))
		{
			case FOLDER: deleteFolder(id); break;
			case NOTE: deleteNote(id); break;
		}
		updateContentTableVisibility();
	};

	return deleteButton;
}


function deleteFolder(id)
{
	var db = new Database();
	if (db.deleteFolder(id))
	{
		var dataTable = document.getElementById(DATA_TABLE);
		var tbody = dataTable.childNodes[1];
		var toRemove = new Array();
		for (var i = 0; i < tbody.childNodes.length; i++)
		{
			var tr = tbody.childNodes[i];
			if (tr.className == FOLDER && tr.getAttribute(CONTENT_ID) == id)
			{
				toRemove.push(tr);
				i++;
				var level = tr.getAttribute(CONTENT_LEVEL);

				while (i < tbody.childNodes.length && tbody.childNodes[i].getAttribute(CONTENT_LEVEL) > level)
				{
					toRemove.push(tbody.childNodes[i]);
					i++;
				}

				break;
			}
		}

		for (var i = 0; i < toRemove.length; i++)
		{
			tbody.removeChild(toRemove[i]);
		}
	}
}


function deleteNote(id)
{
	var db = new Database();
	if (db.deleteObject(id))	// TODO ADD FIRST PARAM - COLLECTIOn
	{
		var dataTable = document.getElementById(DATA_TABLE);
		var tbody = dataTable.childNodes[1];
		for (var i = 0; i < tbody.childNodes.length; i++)
		{
			var tr = tbody.childNodes[i];
			if (tr.className == NOTE && tr.getAttribute(CONTENT_ID) == id)
			{
				tbody.removeChild(tr);
				return;
			}
		}
	}
}


function showAddEditForm(tr, id, itemType)
{
	switchToAddEditForm();

	var attributes = getAttributes(getContentType());
	var formContainer = getEmptyElement(DATA_ELEMENT);
	var form = document.createElement("form");
	form.id = ADD_FORM;
	form.setAttribute(CONTENT_ID, id);

	for (var i = 0; i < attributes.length; i++)
	{
		var attribute = attributes[i];
		var label = document.createElement("label");
		label.innerText = attribute[NAME];
		var input = document.createElement("input");
		input.type = attribute[TYPE];
		input.setAttribute(ATTRIBUTE_NAME, attribute[NAME]);
		if (tr != null)
			input.value = getAttributeValueFromRow(tr, attribute[NAME]);
		if (itemType == FOLDER && attribute[NAME] != NAME)
			input.readOnly = true;
		
		form.appendChild(label);
		form.appendChild(input);
	}

	var hidden = document.createElement("input");
	hidden.type = "hidden";
	hidden.id = CONTENT_ID;
	hidden.value = id;
	
	var saveButton = document.createElement("input");
	saveButton.type = "button";
	saveButton.value = "Save";
	saveButton.onclick = function() 
	{
		var db = new Database();
		var note = getObjectFromForm(this.parentNode);
		if (db.saveObject(itemType, note, id))
		{
			if (hidden.value != null)
			{
				editDataInTable(this.parentNode, itemType);
				switchToContent();
			}
			else
			{
				// TODO pass folder (tr or id) to addDataToTable
				addDataToTable(this.parentNode, itemType);
				switchToContent();
			}

			// TODO sort notes in folder
		}
		else
		{
			// TODO: show error
		}
	};

	var cancelButton = document.createElement("input");
	cancelButton.type = "button";
	cancelButton.value = "Cancel";
	cancelButton.onclick = function() 
	{ 
		switchToContent();
	};

	form.appendChild(hidden);
	form.appendChild(saveButton);
	form.appendChild(cancelButton);

	formContainer.appendChild(form);
}


function editDataInTable(form, type)
{
	var table = document.getElementById(DATA_TABLE);
	var tbody = table.childNodes[1];
	for (var i = 0; i < tbody.childNodes.length; i++)
	{
		var tr = tbody.childNodes[i];
		var isNote = tr.className == type;
		var idEqual = tr.getAttribute(CONTENT_ID) == form.getAttribute(CONTENT_ID);
		if (isNote && idEqual)
		{
			var note = getObjectFromForm(form);
			for (var j = 0; j < tr.childNodes.length; j++)
			{
				var td = tr.childNodes[j];
				var attributeName = td.getAttribute(ATTRIBUTE_NAME);
				if (attributeName == null)
					continue;

				td.innerHTML = note[attributeName];			
			}

			return;
		}
	}
}



function getAttributeValueFromRow(tr, attributeForSearch)
{
	for (var i = 0; i < tr.childNodes.length; i++)
	{
		var attributeName = tr.childNodes[i].getAttribute(ATTRIBUTE_NAME);
		if (attributeName != null && attributeName == attributeForSearch)
		{
			return tr.childNodes[i].innerText;
		}
	}
}


























function drawHeader(name)
{
	var header = document.getElementById("header");
	header.innerHTML = "";

	var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute("width", header.clientWidth);
	svg.setAttribute("height", header.clientHeight);

	var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
	text.setAttribute("fill", "red");
	text.setAttribute("text-anchor", "middle");
	text.setAttribute("dominant-baseline", "middle");
	text.textContent = name;
	text.setAttribute("x", "50%");
	text.setAttribute("y", "50%");

	svg.appendChild(text);	
	header.appendChild(svg);
}


