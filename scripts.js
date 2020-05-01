

/**
 * Load the left side menu of entities on onload event action.
 */
function loadMenu()
{
	fetch(SERVER_ADDRESS + '/rest/entities')
	.then(response => response.json())
	.then(entities => {

		var menuList = getEmptyElement(MENU_LIST);

		for (var i = 0; i < entities.length; i++)
		{
			var title = entities[i].title;
			var collection = entities[i].collection;
			var li = document.createElement("li");
			li.onclick = function() { showContent(this.getAttribute(CONTENT), this.getAttribute(CONTENT_ID)); };
			li.id = collection + "-button";
			li.innerText = title;
			li.setAttribute(CONTENT, collection);
			li.setAttribute(CONTENT_ID, entities[i].id);
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
	});
}


function loadLogs()
{
	fetch(SERVER_ADDRESS + "/rest/log/50")
	.then(response => response.json())
	.then(logs => {
		var history = getEmptyElement("history");
		for (var i = 0; i < logs.length; i++)
		{
			var date = new Date(logs[i].time);
			var day = addLeadingZeroIfLessThan10(date.getDay());
			var month = addLeadingZeroIfLessThan10(date.getMonth() + 1);
			var year = date.getFullYear();
			var hours = addLeadingZeroIfLessThan10(date.getHours());
			var minutes = addLeadingZeroIfLessThan10(date.getMinutes());
			var seconds = addLeadingZeroIfLessThan10(date.getSeconds());
			var operation = logs[i].operation;
			var collection = logs[i].collection;
			var id = logs[i].id;
			var before = logs[i].before;
			var after = logs[i].after;
			var message = `[${day}.${month}.${year} ${hours}:${minutes}:${seconds}] ${collection} ${operation}: `;
			switch (logs[i].operation)
			{
				case "CREATE": message += `${id} ${logs[i].after}`; break;
				case "UPDATE": message += `${id} before=${before}; after=${after}`; break;
				case "DELETE": message += (id != null) ? `${id} ${before}` : `count = ${before}`; break;
				default: message += "Unknown operation"; break;
			}
			var p = document.createElement("p");
			p.innerText = message;
			history.appendChild(p);
		}
	});	
}


async function showContent(name, contentId)
{
	document.getElementById(CONTENT).setAttribute(CONTENT_TYPE, name);
	document.getElementById(CONTENT).setAttribute(CONTENT_ID, contentId);
	//drawHeader(name);
	switchToContent();
	createActionsMenu();

	fetch(SERVER_ADDRESS + '/rest/attributes/search?entityId=' + contentId)
	.then(response => response.json())
	.then(attributes => {
		fetch(SERVER_ADDRESS + '/rest/notes/' + name)
		.then(response => response.json())
		.then(notes => {
			showNotes(notes, attributes);
		});
	});
}


/**
 * Create buttons to create new note, etc.
 */
function createActionsMenu()
{
	var dataMenu = getEmptyElement(DATA_MENU);

	var addNoteButton = document.createElement("input");
	addNoteButton.type = "button";
	addNoteButton.id = "add-note-button";
	addNoteButton.value = "New note";
	addNoteButton.onclick = function() { showNoteForm(null, null, NOTE) };

	var addFolderButton = document.createElement("input");
	addFolderButton.type = "button";
	addFolderButton.id = "add-folder-button";
	addFolderButton.value = "New folder";
	addFolderButton.onclick = function() { showNoteForm(null, null, FOLDER) };

	dataMenu.appendChild(addNoteButton);
	dataMenu.appendChild(addFolderButton);
}


function showNotes(notes, attributes)
{
	var table = getEmptyElement(DATA_TABLE);
	table.appendChild(createTableHead(attributes));
	table.appendChild(createTableBody(attributes, notes));

	setNotesCount(notes.length);
}


function createTableHead(attributes)
{
	var thead = document.createElement("thead");
	var tr = document.createElement("tr");

	// Attributes
	for (var i = 0; i < attributes.length; i++)
	{
		var th = document.createElement("th");
		th.innerText = attributes[i]["title"];
		tr.appendChild(th);
	}

	// Edit and Delete buttons
	tr.appendChild(document.createElement("th"));
	tr.appendChild(document.createElement("th"));

	thead.appendChild(tr);

	return thead;
}


function createTableBody(attributes, notes)
{
	var tbody = document.createElement("tbody");

	if (notes == null)
		return tbody;

	for (var i = 0; i < notes.length; i++)
	{
		var note = notes[i];
		var noteAttributes = convertArrayToObject(note.attributes);

		var tr = document.createElement("tr");
		tr.className = NOTE;
		tr.setAttribute(CONTENT_ID, note[ID]);

		//tr.appendChild(createTdWithIcon(NOTE_ICON));

		for (var j = 0; j < attributes.length; j++)
		{
			var attr = attributes[j];
			var td = document.createElement("td");
			var attributeName = attr[NAME];
			var attributeId = attr[ID];
			td.setAttribute(ATTRIBUTE_NAME, attributeName);
			td.innerHTML = noteAttributes[attributeName] != null ? noteAttributes[attributeName] : "";
			tr.appendChild(td);
		}

		tr.appendChild(createEditButton(NOTE, note[ID]));
		tr.appendChild(createDeleteButton(NOTE, note[ID]));

		tbody.appendChild(tr);
	}

	return tbody;
}


function convertArrayToObject(attributes)
{
	var object = {};
	for (var i = 0; i < attributes.length; i++)
	{
		var keys = Object.keys(attributes[i]);
		for (var j = 0; j < keys.length; j++)
		{
			var key = keys[j];
			object[key] = attributes[i][key];
		}
	}
	return object;
}


function showContentWithAttributes(attributes)
{
	document.getElementById(DATA_TABLE).appendChild(createTableHead(attributes));

	var url = SERVER_ADDRESS + '/rest/' + getContentType() + '/';
	const init = { method: 'GET' };

	var fillNotes = function(notes, attrs) { fillNotesTable(notes, attributes = attrs); };

    makeHttpRequestSync(url, init, fillNotesTable());
}


function fillNotesTable(notes, attributes)
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


function setNotesCount(count)
{
	if (count == null || count == undefined)
		return;
	
	var contentType = getContentType();
	var li = document.getElementById(contentType + "-button");
	li.innerHTML = contentType + " (" + count + ")";
	li.setAttribute(COUNT, count);
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
		showNoteForm(this.parentNode, id, itemType); 
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


function deleteNote(id)
{
	var contentType = document.getElementById(CONTENT).getAttribute(CONTENT_TYPE);
	fetch(SERVER_ADDRESS + '/rest/notes/' + contentType + '/' + id, {
		method: "DELETE"
	})
	.then(response => {
		if (response.status === 200)
		{
			showCurrentContent();
			//var dataTable = document.getElementById(DATA_TABLE);
			//var tbody = dataTable.childNodes[1];
			//for (var i = 0; i < tbody.childNodes.length; i++)
			//{
			//	var tr = tbody.childNodes[i];
			//	if (tr.className == NOTE && tr.getAttribute(CONTENT_ID) == id)
			//	{
			//		tbody.removeChild(tr);
			//		return;
			//	}
			//}
		}
	})
}


function showNoteForm(tr, id, itemType)
{
	switchToAddEditForm();

	fetch(SERVER_ADDRESS + '/rest/attributes/search?entityId=' + document.getElementById(CONTENT).getAttribute(CONTENT_ID))
	.then(response => response.json())
	.then(attributes => {
		var formContainer = getEmptyElement(DATA_ELEMENT);
		var form = document.createElement("form");
		form.id = ADD_FORM;
		if (id)
			form.setAttribute(CONTENT_ID, id);
	
		for (var i = 0; i < attributes.length; i++)
		{
			var attribute = attributes[i];
			var label = document.createElement("label");
			label.innerText = attribute[TITLE];
			var input = document.createElement("input");
			input.type = attribute[TYPE];
			input.setAttribute(ATTRIBUTE_NAME, attribute[NAME]);
			input.setAttribute(ATTRIBUTE_ID, attribute[ID]);
			
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
			var addForm = document.getElementById("add-form");
			var objectToSave = new Object();
			objectToSave.attributes = getNoteAttributesFromForm(addForm);
			objectToSave.id = form.getAttribute(CONTENT_ID);
			//var id = form.getAttribute(CONTENT_ID);
			//if (id)
			//	objectToSave.id = id;

			//var json = JSON.stringify(objectToSave);

			fetch(saveNoteUrl = SERVER_ADDRESS + '/rest/notes/' + document.getElementById(CONTENT).getAttribute(CONTENT_TYPE), {
				method: objectToSave.id == null ? "POST" : "PUT",       // If there is id for attribute, it's already exist. So just PUT (update),
				body: JSON.stringify(objectToSave),
				headers:
				{
					"Accept": "text/plain;charset=UTF-8",               // Expect an id of the attribute
					"Content-Type": "application/json;charset=UTF-8"
				}
			})
			.then(response => {
				if (hidden.value != null)
				{
					
				}
				else
				{
					// TODO pass folder (tr or id) to addDataToTable
					//addDataToTable(this.parentNode, itemType);
				}

				showCurrentContent();
			});
		};
	
		var cancelButton = document.createElement("input");
		cancelButton.type = "button";
		cancelButton.value = "Cancel";
		cancelButton.onclick = function() { showCurrentContent(); };
	
		form.appendChild(hidden);
		form.appendChild(saveButton);
		form.appendChild(cancelButton);
	
		formContainer.appendChild(form);
	});
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
			var note = getMetaObjectFromForm(form);
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
