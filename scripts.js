

/**
 * Load the left side menu of entities on onload event action.
 */
function loadMenu()
{
	fetch(SERVER_ADDRESS + '/rest/entities')
	.then(response => response.json())
	.then(entities => {
		var menuList = getEmptyElement(MENU_LIST);
		entities = entities.filter(entity => entity.visible);

		for (var i = 0; i < entities.length; i++)
		{
			var title = entities[i].title;
			var collection = entities[i].collection;
			var li = document.createElement("li");
			li.onclick = function() { showContentTableWithNotes(this.getAttribute(CONTENT), this.getAttribute(CONTENT_ID)); };
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


/**
 * Shows all notes like 'Movies' or 'Games'
 */
async function showContentTableWithNotes(contentType, contentId)
{
	document.getElementById(CONTENT).setAttribute(CONTENT_TYPE, contentType);
	document.getElementById(CONTENT).setAttribute(CONTENT_ID, contentId);
	//drawHeader(name);
	switchToContent();
	createUpperButtonsForContent();

	fetch(SERVER_ADDRESS + '/rest/attributes/search?entityId=' + contentId)
	.then(response => response.json())
	.then(attributes => {
		fetch(SERVER_ADDRESS + '/rest/notes/' + contentType)
		.then(response => response.json())
		.then(notes => {
			var table = getEmptyElement(DATA_TABLE);
			table.appendChild(createTableHead(attributes));
			table.appendChild(createTableBody(attributes, notes));		
		});
	});
}


/**
 * Create buttons like 'New note' and 'New folder'
 */
function createUpperButtonsForContent()
{
	var dataMenu = getEmptyElement(DATA_MENU);

	var addNoteButton = document.createElement("input");
	addNoteButton.type = "button";
	addNoteButton.id = "add-note-button";
	addNoteButton.value = "New note";
	addNoteButton.onclick = function() { showNoteForm(null, NOTE) };

	var addFolderButton = document.createElement("input");
	addFolderButton.type = "button";
	addFolderButton.id = "add-folder-button";
	addFolderButton.value = "New folder";
	addFolderButton.onclick = function() { showNoteForm(null, FOLDER) };

	dataMenu.appendChild(addNoteButton);
	dataMenu.appendChild(addFolderButton);
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

		tr.appendChild(createButtonToShowNoteEditForm(NOTE, note[ID]));
		tr.appendChild(createButtonToDeleteNote(NOTE, note[ID]));

		tbody.appendChild(tr);
	}

	return tbody;
}


function createButtonToShowNoteEditForm(itemType, id)
{
	var editButton = document.createElement("td");
	editButton.className = EDIT_BUTTON;
	editButton.setAttribute(ITEM_TYPE, itemType);
	editButton.setAttribute(CONTENT_ID, id);
	editButton.onclick = function() 
	{		
		showNoteForm(id); 
	};

	return editButton;
}

function createButtonToDeleteNote(itemType, id)
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
	fetch(SERVER_ADDRESS + '/rest/notes/' + contentType + '/' + id, { method: "DELETE" })
	.then(response => {
		if (response.status === 200)
			showCurrentContent();
	})
}


function showNoteForm(id)
{
	switchToAddEditForm();

	fetch(SERVER_ADDRESS + '/rest/attributes/search?entityId=' + document.getElementById(CONTENT).getAttribute(CONTENT_ID))
	.then(response => response.json())
	.then(attributes => {
		var formContainer = getEmptyElement(DATA_ELEMENT);
		var form = document.createElement("form");
		form.id = ADD_FORM;

		if (id)
		{
			fetch(SERVER_ADDRESS + "/rest/notes/" + document.getElementById(CONTENT).getAttribute(CONTENT_TYPE) + "/" + id)
			.then(response => response.json())
			.then(note => {
				note.attributes = convertArrayToObject(note.attributes);
				prepareNoteAttributes(form, note, attributes);
				createNoteActionButtons(form, id);
			})
		}
		else
		{
			prepareNoteAttributes(form, null, attributes);
			createNoteActionButtons(form, id);
		}
	
		formContainer.appendChild(form);
	});
}


/**
 * Sets up all attributes settings and fills in current values of note (if not null)
 */
function prepareNoteAttributes(form, note, attributes)
{
	for (var i = 0; i < attributes.length; i++)
	{
		var attribute = attributes[i];
		var label = document.createElement("label");
		label.innerText = attribute[TITLE];

		var input;
		switch (attribute.type)
		{
			case "select":
				input = document.createElement("select");
				if (attribute.selectOptions != null)
				{
					for (value of attribute.selectOptions)
					{
						var option = document.createElement("option");
						option.innerText = value;
						option.value = value;
						input.appendChild(option);
					}
				}

				if (note != null)
				{
					input.value = note.attributes[attribute.name];
				}
				else if (attribute.defaultValue != null)
					input.value = attribute.defaultValue;

				break;
			case "multiselect":
				input = document.createElement("select");

				break;
			case "textarea":
				input = document.createElement(attribute.type);
				input.type = attribute[TYPE];
				if (attribute.linesCount != null)
					input.setAttribute("rows", attribute.linesCount);

				if (note != null)
					input.value = note.attributes[attribute.name];
				else if (attribute.defaultValue != null)
					input.value = attribute.defaultValue;

				break;
			case "number":
				input = document.createElement("input");
				input.type = attribute.type;
				if (attribute.min != null)
					input.min = attribute.min;
				if (attribute.max != null)
					input.max = attribute.max;
				if (attribute.step != null)
					input.step = attribute.step;

				if (note != null)
					input.value = note.attributes[attribute.name];
				else if (attribute.defaultValue != null)
					input.value = attribute.defaultValue;

				break;
			default:
				input = document.createElement("input");
				input.type = attribute[TYPE];
				if (note != null)
					input.value = note.attributes[attribute.name];
				break;				
		}

		// Limiting length of text attributes
		if (attribute.type == "textarea" || attribute.type == "text")
		{
			if (attribute.max != null)
				input.maxLength = attribute.max;
		}

		input.setAttribute(ATTRIBUTE_NAME, attribute[NAME]);
		input.setAttribute(ATTRIBUTE_ID, attribute[ID]);
		
		form.appendChild(label);
		form.appendChild(input);
	}
}


function createNoteActionButtons(form, id)
{
	var saveButton = document.createElement("input");
	saveButton.type = "button";
	saveButton.value = "Save";
	saveButton.onclick = function() 
	{
		var addForm = document.getElementById("add-form");
		var objectToSave = new Object();
		objectToSave.attributes = getNoteAttributesFromForm(addForm);
		objectToSave.id = id;

		fetch(saveNoteUrl = SERVER_ADDRESS + '/rest/notes/' + document.getElementById(CONTENT).getAttribute(CONTENT_TYPE), {
			method: objectToSave.id == null ? "POST" : "PUT",
			body: JSON.stringify(objectToSave),
			headers:
			{
				"Accept": "text/plain;charset=UTF-8",
				"Content-Type": "application/json;charset=UTF-8"
			}
		})
		.then(response => {
			if (response.status === 200)
				showCurrentContent();
		});
	};

	var hidden = document.createElement("input");
	hidden.type = "hidden";
	hidden.id = CONTENT_ID;
	hidden.value = id;

	var cancelButton = document.createElement("input");
	cancelButton.type = "button";
	cancelButton.value = "Cancel";
	cancelButton.onclick = function() { showCurrentContent(); };

	form.appendChild(document.createElement("br"));
	form.appendChild(hidden);
	form.appendChild(saveButton);
	form.appendChild(cancelButton);
}


/**
 * Get note from the add/edit form
 * @param {Object} form - <form>, that contains requested data
 */
function getNoteAttributesFromForm(form)
{
	var result = [];

	var allNodes = form.getElementsByTagName('*');
	for (var i = 0; i < allNodes.length; i++)
	{
		var currentNode = allNodes[i];
		var attributeName = currentNode.getAttribute(ATTRIBUTE_NAME);
		if (attributeName != null)
		{
			var attribute = new Object();

			if (currentNode.type && currentNode.type === 'checkbox')
			{
				attribute[attributeName] = currentNode.checked;
			}
			else if (currentNode.type && (currentNode.type === 'select' || currentNode.type === 'select-multiple'))
			{
				var array = [];
				var length = currentNode.options.length;
				for (var j = 0; j < length; j++)
				{
					var option = currentNode.options[j];
					if (currentNode.options[j].selected === true)
						array.push(option.id);
				}
				attribute[attributeName] = array;
			}
			else if (currentNode.value.length > 0)
			{
				attribute[attributeName] = currentNode.value;
			}
			else 
			{
				attribute[attributeName] = null;
			}

			result.push(attribute);
		}
	}

	return result;
}


/**
 * Get log from database and put them at the main page
 */
function showLog()
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
