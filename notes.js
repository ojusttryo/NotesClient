


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
			table.appendChild(createNotesTableHead(attributes));
			table.appendChild(createNotesTableBody(attributes, notes));		
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


function createNotesTableHead(attributes)
{
	var thead = document.createElement("thead");
	var tr = document.createElement("tr");

	// Attributes
	for (var i = 0; i < attributes.length; i++)
	{
		if (needToSkipAttributeInTable(attributes[i]))
			continue;

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


function createNotesTableBody(attributes, notes)
{
	var tbody = document.createElement("tbody");

	if (notes == null)
		return tbody;

	for (var i = 0; i < notes.length; i++)
	{
		var note = notes[i];
		//var noteAttributes = convertArrayToObject(note.attributes);
		var noteAttributes = note.attributes;

		var tr = document.createElement("tr");
		tr.className += " " + NOTE;
		tr.setAttribute(CONTENT_ID, note[ID]);

		//tr.appendChild(createTdWithIcon(NOTE_ICON));

		for (var j = 0; j < attributes.length; j++)
		{
			if (needToSkipAttributeInTable(attributes[j]))
				continue;

			var attr = attributes[j];
			var td = document.createElement("td");
			td.style.textAlign = attr.alignment;
			var attributeName = attr[NAME];
			var attributeId = attr[ID];
			td.setAttribute(ATTRIBUTE_NAME, attributeName);
			switch(attr.type)
			{
				case "url":
					var a = document.createElement("a");
					a.href = noteAttributes[attributeName] != null ? noteAttributes[attributeName] : "";
					a.text = noteAttributes[attributeName] != null ? noteAttributes[attributeName] : "";
					a.target = "_blank";
					td.appendChild(a);
					break;
				case "save time":
				case "update time":
					var time = new Date(noteAttributes[attributeName]);
					var format = attr.dateFormat;
					var convertedTime = moment(time).format(format);
					td.innerHTML = convertedTime;
					break;
				case "select":
					if (attributes[j].editableInTable)
					{
						var select = document.createElement("select");
						addOptions(select, attr.selectOptions);
		
						if (note != null)
							select.value = valueOrEmptyString(note.attributes[attr.name]);
						else if (attr.defaultValue != null)
							select.value = attr.defaultValue;

						select.setAttribute(PREVIOUS_VALUE, select.value);

						select.onchange = function()
						{
							var objectToSave = new Object();
							objectToSave[this.parentNode.getAttribute(ATTRIBUTE_NAME)] = this.value;
							var id = this.parentNode.parentNode.getAttribute(CONTENT_ID);

							fetch(SERVER_ADDRESS + '/rest/notes/' + document.getElementById(CONTENT).getAttribute(CONTENT_TYPE) + "/" + id, {
								method: "PUT",
								body: JSON.stringify(objectToSave),
								headers:
								{
									"Accept": "text/plain;charset=UTF-8",
									"Content-Type": "application/json;charset=UTF-8"
								}
							})
							.then(response => {
								if (response.status != 200)
								{
									this.value = select.getAttribute(PREVIOUS_VALUE);
									this.style.backgroundColor = "red";
								}
								else
								{
									this.setAttribute(PREVIOUS_VALUE, this.value);
									this.style.backgroundColor = "green";
								}
							});
						}
						td.appendChild(select);
					}
					else
					{
						td.innerHTML = noteAttributes[attributeName] != null ? noteAttributes[attributeName] : "";
					}
					break;
				case "inc":
					var numberTd = document.createElement("td");
					numberTd.setAttribute(ATTRIBUTE_NAME, attributeName);
					numberTd.innerHTML = noteAttributes[attributeName] != null ? noteAttributes[attributeName] : "";
					numberTd.style.textAlign = attr.alignment;
					tr.appendChild(numberTd);

					var incButton = document.createElement("input");
					incButton.setAttribute(ATTRIBUTE_NAME, attributeName);
					incButton.type = "button";
					incButton.value = attr.step > 0 ? "+" : "-";
					incButton.style.height = "20px";
					incButton.style.width = "20px";
					incButton.onclick = function()
					{
						var id = this.parentNode.parentNode.getAttribute(CONTENT_ID);
						var contentType = document.getElementById(CONTENT).getAttribute(CONTENT_TYPE);

						fetch(SERVER_ADDRESS + '/rest/notes/' + contentType + "/" + id + "/inc/" + this.getAttribute(ATTRIBUTE_NAME), {
							method: "PUT",
							headers:
							{
								"Accept": "text/plain;charset=UTF-8",
								"Content-Type": "application/json;charset=UTF-8"
							}
						})
						.then(response => {
							if (response.status != 200)
							{
								this.parentNode.previousSibling.style.backgroundColor = "red";
							}
							else
							{
								response.text()
								.then(text => {
									this.parentNode.previousSibling.innerText = parseFloat(text);
									this.parentNode.previousSibling.style.backgroundColor = "green";
								})
							}
						});
					}
					td.appendChild(incButton);
					
					break;
				default:
					td.innerHTML = noteAttributes[attributeName] != null ? noteAttributes[attributeName] : "";
					break;
			}			
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
	editButton.className += " " + EDIT_BUTTON;
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
	deleteButton.className += " " + DELETE_BUTTON;
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

	var u = SERVER_ADDRESS + '/rest/attributes/search?entityId=' + getContentId();
	fetch(SERVER_ADDRESS + '/rest/attributes/search?entityId=' + getContentId())
	.then(response => response.json())
	.then(attributes => {
		var dataElement = getEmptyElement(DATA_ELEMENT);

		createErrorLabel(dataElement);

		if (id)
		{
			var url = SERVER_ADDRESS + "/rest/notes/" + getContentType() + "/" + id;
			fetch(SERVER_ADDRESS + "/rest/notes/" + getContentType() + "/" + id)
			.then(response => response.json())
			.then(note => {
				prepareNoteAttributes(dataElement, note, attributes);
				createNoteActionButtons(dataElement, id);
			})
		}
		else
		{
			prepareNoteAttributes(dataElement, null, attributes);
			createNoteActionButtons(dataElement, id);
		}
	});
}


/**
 * Sets up all attributes settings and fills in current values of note (if not null)
 */
function prepareNoteAttributes(dataElement, note, attributes)
{
	for (var i = 0; i < attributes.length; i++)
	{
		var attribute = attributes[i];
		var label = document.createElement("label");
		label.innerText = attribute[TITLE];
		dataElement.appendChild(label);

		var input;
		switch (attribute.type)
		{
			case "select":
				input = document.createElement("select");
				input.required = attribute.required;
				addOptions(input, attribute.selectOptions);

				if (note != null)
					input.value = valueOrEmptyString(note.attributes[attribute.name]);
				else if (attribute.defaultValue != null)
					input.value = attribute.defaultValue;

				break;
			case "multiselect":
				input = createMultiselectWithCheckboxes(attribute.name, attribute.selectOptions);

				if (note == null)
					break;

				var checkboxes = input.getElementsByTagName("input");
				var noteOptions = note.attributes[attribute.name];
				if (noteOptions == null || noteOptions.length == 0)
					break;

				for (var k = 0; k < noteOptions.length; k++)
				{
					var option = noteOptions[k];
					for (var j = 0; j < checkboxes.length; j++)
					{
						if (checkboxes[j].getAttribute("title") == option)
						{
							checkboxes[j].checked = true;
							break;
						}
					}
				}
				break;
			case "textarea":
				input = document.createElement(attribute.type);
				input.required = attribute.required;
				input.type = attribute[TYPE];
				if (attribute.linesCount != null)
					input.setAttribute("rows", attribute.linesCount);

				if (note != null)
					input.value = valueOrEmptyString(note.attributes[attribute.name]);
				else if (attribute.defaultValue != null)
					input.value = attribute.defaultValue;

				break;
			case "number":
			case "inc":
				input = document.createElement("input");
				input.required = attribute.required;
				input.type = "number";
				if (attribute.min != null)
					input.min = attribute.min;
				if (attribute.max != null)
					input.max = attribute.max;
				if (attribute.step != null)
					input.step = attribute.step;

				if (note != null)
					input.value = valueOrEmptyString(note.attributes[attribute.name]);
				else if (attribute.defaultValue != null)
					input.value = attribute.defaultValue;

				break;
			case "checkbox":
				input = document.createElement("input");
				input.type = attribute.type;
				if (note != null && isBoolean(note.attributes[attribute.name]))
					input.checked = note.attributes[attribute.name] == "true";
				else if (attribute.defaultValue != null && isBoolean(attribute.defaultValue))
					input.checked = attribute.defaultValue == "true";
				break;
			case "save time":
			case "update time":
				input = document.createElement("span");
				input.required = attribute.required;
				input.setAttribute(ATTRIBUTE_TYPE, attribute.type);
				
				// New note
				if (note == null)
				{
					label.style.display = "none";
					input.style.display = "none";
				}
				// Old note but no value
				else if (note.attributes[attribute.name] == null)
				{
					input.innerText = "Required data isn't found";
				}
				// Old note and we have time value
				else
				{
					var time = new Date(note.attributes[attribute.name]);
					var format = attribute.dateFormat;
					var convertedTime = moment(time).format(format);
					input.innerText = convertedTime;
					if (attribute.type == "save time")
						input.setAttribute(ATTRIBUTE_VALUE, note.attributes[attribute.name]);
				}

				break;
			case "user date":
				input = document.createElement("input");
				input.required = attribute.required;
				input.type = "date";
				input.setAttribute(ATTRIBUTE_TYPE, attribute.type);

				if (note != null && note.attributes[attribute.name] != null)
					input.value = note.attributes[attribute.name];

				break;
			case "user time":
				input = document.createElement("input");
				input.required = attribute.required;
				input.type = "time";
				input.setAttribute(ATTRIBUTE_TYPE, attribute.type);

				if (note != null && note.attributes[attribute.name] != null)
					input.value = note.attributes[attribute.name];

				break;
			case "file":
				input = document.createElement("input");
				input.required = attribute.required;
				input.type = attribute.type;
				input.multiple = false;
				input.setAttribute(ATTRIBUTE_TYPE, attribute.type);
				input.id = attribute.id;
				input.style.display = "none";
				
				var fileDiv = document.createElement("div");

				var fileName = document.createElement("label");
				fileName.id = input.id + "-label";
				fileName.className += " file";
				fileDiv.appendChild(fileName);
				//fileName.setAttribute("for", input.id);
				fileName.onclick = function()
				{
					var fileId = this.getAttribute("file-id");
					if (fileId)
					{
						fetch(SERVER_ADDRESS + "/rest/file/" + fileId + "/content")
						.then(response => {
							if (response.status === 200)
							{
								return response.blob();
							}
						})
						.then(data => {
							if (data)
							{
								var a = document.createElement("a");
								var file = window.URL.createObjectURL(data);
								a.setAttribute("href", file);
								a.setAttribute("download", this.innerText);
								a.style.display = "none";
								document.body.appendChild(a);
								a.click();
								setTimeout(() => document.body.removeChild(a), 0);
    							//window.location.assign(file);
							}
							var d = null;
						});
					}
				};

				var fileButton = document.createElement("input");
				fileButton.type = "button";
				fileButton.id = input.id + "-button";
				fileButton.setAttribute("related-button-id", input.id);
				fileButton.className += " fileButton";
				fileButton.value = "Upload file";
				fileButton.onclick = function() 
				{
					var relatedButtonId = this.getAttribute("related-button-id");
					document.getElementById(relatedButtonId).click();
				}
				fileDiv.appendChild(fileButton);

				dataElement.appendChild(fileDiv);

				if (note != null && note.attributes[attribute.name] != null)
				{
					fetch(SERVER_ADDRESS + "/rest/file/" + note.attributes[attribute.name] + "/metadata", {
						method: "GET",
						headers:
						{
							"Accept": "application/json;charset=UTF-8",
							"Content-Type": "application/json;charset=UTF-8"
						}
					})
					.then(response => response.json())
					.then(json => {
						input.setAttribute(ATTRIBUTE_VALUE, note.attributes[attribute.name]);
						fileName.setAttribute("file-id", note.attributes[attribute.name]);
						fileName.innerText = json.title;
						fileButton.value = "Upload new file";
					})
				}

				input.onchange = function(event)
				{
					var formData = new FormData();
					formData.append("file", event.target.files[0]);

					fetch(SERVER_ADDRESS + '/rest/file', {
						method: "POST",
						body: formData,
						headers:
						{
							"Accept": "application/json;charset=UTF-8",
						}
					})
					.then(response => {
						if (response.status === 200)
							return response.text()
						if (response === 500)
							return response.json();
					})
					.then(response => {
						if (!response.message)
						{
							this.setAttribute(ATTRIBUTE_VALUE, response);
							document.getElementById(this.id + "-label").setAttribute("file-id", response);
							document.getElementById(this.id + "-label").innerText = event.target.files[0].name;
							document.getElementById(this.id + "-button").value = "Upload new file";
						}
					});
				};

				break;
			// text, url, ...
			default:
				input = document.createElement("input");
				input.required = attribute.required;
				input.type = attribute[TYPE];
				if (note != null)
					input.value = valueOrEmptyString(note.attributes[attribute.name]);
				else if (attribute.defaultValue != null)
					input.value = attribute.defaultValue;
				break;				
		}

		if (isTextual(attribute.type))
		{
			if (attribute.max != null)
				input.maxLength = attribute.max;
			if (attribute.min != null)
				input.minLength = attribute.min;
		}

		input.setAttribute(ATTRIBUTE_NAME, attribute[NAME]);
		input.setAttribute(ATTRIBUTE_ID, attribute[ID]);
		
		dataElement.appendChild(input);
	}
}


function createNoteActionButtons(dataElement, id)
{
	var saveHandler = function() 
	{
		var objectToSave = new Object();
		objectToSave.id = id;
		objectToSave.attributes = getMetaObjectFromForm(dataElement);

		fetch(SERVER_ADDRESS + '/rest/notes/' + getContentType(), {
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
	var editHandler = function() { showCurrentContent() };

	addFormButtons(dataElement, id != null, saveHandler, editHandler);
}


function needToSkipAttributeInTable(attribute)
{
	return (!attribute.visible || isSkippableAttributeInNotesTable(attribute.type))
}