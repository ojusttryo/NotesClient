


/**
 * Shows all notes like 'Movies' or 'Games'
 */
async function showContentTableWithNotes(contentType)
{
	createUpperMenuForContent(contentType);

	fetch(`${SERVER_ADDRESS}/rest/attributes/search?entityName=${contentType}&visible=true`)
	.then(response => response.json())
	.then(attributes => {
		
		var address = SERVER_ADDRESS + '/rest/notes/' + contentType;
		fetch(address, {
			method: "GET",
			headers: { "Accept": APPLICATION_JSON, "Content-Type": APPLICATION_JSON }
		})
		.then(response => response.json())
		.then(notes => {
			getEmptyElement(DATA_ELEMENT);
			var table = getEmptyElement(DATA_TABLE);
			createNotesTableHead(table, attributes, null);
			createNotesTableBody(table, attributes, notes, contentType);
			setPageTitleFromEntityTitle(contentType);
			switchToContent();
		});
	});
}


function createUpperMenuForContent(contentType, attributeName, searchRequest)
{
	var dataMenu = getEmptyElement(DATA_MENU);

	var searchAttributes = document.createElement("select");
	searchAttributes.id = "search-attributes";
	dataMenu.appendChild(searchAttributes);

	var searchInputWrapper = document.createElement("div");
	searchInputWrapper.id = "search-input-wrapper";
	dataMenu.appendChild(searchInputWrapper);

	fetch(SERVER_ADDRESS + '/rest/attributes/search?entityName=' + contentType)
	.then(response => response.json())
	.then(attributes => {
		var select = document.getElementById("search-attributes");
		select.style.overflow = "visible";

		for (var i = 0; i < attributes.length; i++)
		{
			var type = attributes[i].type;
			if (hasDateFormat(type) || isFile(type) || isMultifile(type) || type == "row number")
				continue;

			var option = document.createElement("option");
			option.innerText = attributes[i].title;
			option.value = attributes[i].name;
			option.setAttribute(ATTRIBUTE_NAME, attributes[i].name);
			option.setAttribute(ATTRIBUTE_TYPE, attributes[i].type);
			if (attributeName && attributes[i].name == attributeName)
				option.selected = "selected";
			select.appendChild(option);
		}

		select.onchange = function(value)
		{
			var currentOption = this.children.item(this.selectedIndex);
			var inputWrapper = document.getElementById("search-input-wrapper");
			clean(inputWrapper);
			switch (currentOption.getAttribute(ATTRIBUTE_TYPE))
			{
				case "text":
				case "textarea":
				case "delimited text":
				case "url":
				case "number":
				case "inc":
					var searchInput = document.createElement("input");
					searchInput.classList.add("search-input-text");
					searchInput.id = "search-input";
					searchInput.addEventListener("keyup", event => {
						if (event.key !== "Enter")
							return;
						document.getElementById("search-button").click();
						event.preventDefault();
					})
					if (value && typeof value == "string")
						searchInput.value = value;
					inputWrapper.appendChild(searchInput);
					break;
				case "select":
				case "multiselect":
					fetch(SERVER_ADDRESS + '/rest/attributes/search?name=' + currentOption.getAttribute(ATTRIBUTE_NAME))
					.then(response => response.json())
					.then(attribute => {
						var select = document.createElement("select");
						select.id = "search-input";
						addOptions(select, attribute.selectOptions);
						if (value && typeof value == "string")
							select.value = value;
						else
							select.selectedIndex = 0;
						inputWrapper.appendChild(select);
					});
					break;
				case "checkbox":
					var checkbox = document.createElement("input");
					checkbox.type = "checkbox";
					checkbox.id = "search-input";
					checkbox.checked = (value && typeof value == "boolean" && value == true);
					inputWrapper.appendChild(checkbox);
					break;
				default:
					break;
			}
		}

		if (!attributeName && !searchRequest)
		{
			select.selectedIndex = 0;
			select.onchange();
		}
		else
		{
			select.onchange(searchRequest);
		}
	});

	var searchButton = document.createElement("a");
	searchButton.id = "search-button";
	setImageClass(searchButton, "search-image", true);
	searchButton.setAttribute(CONTENT_TYPE, contentType);
	searchButton.onclick = function() 
	{
		var searchAttributes = document.getElementById("search-attributes");
		var currentOption = searchAttributes.children.item(searchAttributes.selectedIndex);
		var attributeName = currentOption.getAttribute(ATTRIBUTE_NAME);
		var attributeType = currentOption.getAttribute(ATTRIBUTE_TYPE);
		var searchInput = document.getElementById("search-input");
		var searchRequest = null;

		switch (attributeType)
		{
			case "checkbox": searchRequest = searchInput.checked; break;
			default: searchRequest = searchInput.value; break;
		}

		window.history.pushState("showSearchResult", "Notes", `/${this.getAttribute(CONTENT_TYPE)}?searchAttribute=${attributeName}&searchRequest=${searchRequest}`);
		showSearchResult(attributeName, searchRequest, this.getAttribute(CONTENT_TYPE));
	};
	dataMenu.appendChild(searchButton);

	var hiddenNotesButton = document.createElement("a");
	setImageClass(hiddenNotesButton, HIDDEN_IMAGE, true);
	hiddenNotesButton.setAttribute(CONTENT_TYPE, contentType);
	hiddenNotesButton.onclick = function() 
	{
		var hidden = (this.classList.contains(HIDDEN_IMAGE));
		changeImageClass(this, hidden ? HIDDEN_IMAGE : VISIBLE_IMAGE, hidden ? VISIBLE_IMAGE : HIDDEN_IMAGE);
		window.history.pushState("showSearchResultForHidden", "Notes", `/${this.getAttribute(CONTENT_TYPE)}?hidden=${hidden}`);
		showSearchResultForHidden(hidden, this.getAttribute(CONTENT_TYPE));
	}
	dataMenu.appendChild(hiddenNotesButton);

	var addNoteButton = document.createElement("a");
	setImageClass(addNoteButton, NEW_NOTE_IMAGE);
	addNoteButton.setAttribute(CONTENT_TYPE, contentType);
	addNoteButton.onclick = function() 
	{
		pushNoteState(null, this.getAttribute(CONTENT_TYPE));
		showNoteForm(null, this.getAttribute(CONTENT_TYPE)) 
	};
	dataMenu.appendChild(addNoteButton);
}


async function showSearchResult(attributeName, searchRequest, contentType)
{
	createUpperMenuForContent(contentType, attributeName, searchRequest);

	fetch(`${SERVER_ADDRESS}/rest/attributes/search?entityName=${contentType}&visible=true`)
	.then(response => response.json())
	.then(attributes => {
		
		var address = `${SERVER_ADDRESS}/rest/notes/${contentType}/${attributeName}/search`;
		fetch(address, {
			method: "POST",
			body: JSON.stringify(searchRequest),
			headers: { "Accept": APPLICATION_JSON, "Content-Type": APPLICATION_JSON }
		})
		.then(response => response.json())
		.then(notes => {
			getEmptyElement(DATA_ELEMENT);
			var table = getEmptyElement(DATA_TABLE);
			createNotesTableHead(table, attributes, null);
			createNotesTableBody(table, attributes, notes, contentType);
			setPageTitleFromEntityTitle(contentType);
			switchToContent();
		});
	});
}


async function showNestedNotes(contentType, parentNoteAttribute, parentNoteId, tableId)
{
	fetch(`${SERVER_ADDRESS}/rest/attributes/search?entityName=${contentType}&visible=true`)
	.then(response => response.json())
	.then(attributes => {
		fetch(`${SERVER_ADDRESS}/rest/notes/nested/${contentType}/${parentNoteAttribute}/${parentNoteId}`, {
			method: "GET",
			headers: { "Accept": APPLICATION_JSON, "Content-Type": APPLICATION_JSON }
		})
		.then(response => response.json())
		.then(notes => {
			var table = document.getElementById(tableId);
			createNotesTableHead(table, attributes, parentNoteId);
			createNotesTableBody(table, attributes, notes, contentType, parentNoteId, parentNoteAttribute);
		});
	});
}


async function showComparedNotes(contentType, parentNoteAttribute, parentNoteId, tableId, side)
{
	fetch(SERVER_ADDRESS + '/rest/attributes/compared/' + contentType)
	.then(response => response.json())
	.then(attributes => {
		fetch(`${SERVER_ADDRESS}/rest/notes/nested/${contentType}/${parentNoteAttribute}/${parentNoteId}?side=${side}`, {
			method: "GET",
			headers: { "Accept": APPLICATION_JSON, "Content-Type": APPLICATION_JSON }
		})
		.then(response => response.json())
		.then(notes => {
			var table = document.getElementById(tableId);
			createNotesTableHead(table, attributes, parentNoteId);
			createNotesTableBody(table, attributes, notes, contentType, parentNoteId, parentNoteAttribute);
		});
	});
}


async function showSearchResultForHidden(hidden, contentType)
{
	fetch(`${SERVER_ADDRESS}/rest/attributes/search?entityName=${contentType}&visible=true`)
	.then(response => response.json())
	.then(attributes => {
		var subrequest = hidden ? "hidden" : "visible";
		var address = `${SERVER_ADDRESS}/rest/notes/${contentType}/${subrequest}`;
		fetch(address, {
			method: "GET",
			headers: { "Accept": APPLICATION_JSON, "Content-Type": APPLICATION_JSON }
		})
		.then(response => response.json())
		.then(notes => {
			getEmptyElement(DATA_ELEMENT);
			var table = getEmptyElement(DATA_TABLE);
			createNotesTableHead(table, attributes, null);
			createNotesTableBody(table, attributes, notes, contentType);
			setPageTitleFromEntityTitle(contentType);
		});
	});
}


function createNotesTableHead(table, attributes, parentNoteId)
{
	var count = countColumnsWithoutButtons(attributes);
	var gridTemplateColumns = "";

	// Headers for attributes
	for (var i = 0; i < attributes.length; i++)
	{
		if (needToSkipAttributeInTable(attributes[i]))
			continue;

		if (attributes[i].type == "row number")
			gridTemplateColumns += " min-content";
		else
			gridTemplateColumns += " auto";

		var wrapper = document.createElement("div");
		wrapper.style.display = "grid";


		appendNewSpanAligning(wrapper, attributes[i]["title"], "center");
		setWidthRangeInTable(wrapper, attributes[i]);
		table.appendChild(wrapper);

		// Plus or minus sign for inc
		if (attributes[i].type == "inc" && attributes[i].editableInTable)
		{
			wrapper.style.verticalAlign = "top";
			wrapper.style.gridTemplateColumns = "auto min-content";

			// for alignment only
			var incButton = document.createElement("td");
			setImageClass(incButton, "plus-image", true);
			incButton.style.justifySelf = "end";
			incButton.style.marginRight = "0px";
			incButton.style.visibility = "hidden";
			wrapper.appendChild(incButton);
		}
	}

	// Hide, Edit and Delete buttons
	if (!parentNoteId)
	{
		gridTemplateColumns += " min-content";
		appendNewSpan(table, "");
	}
	appendNewSpan(table, "");
	appendNewSpan(table, "");

	gridTemplateColumns += " min-content min-content";
	table.style.gridTemplateColumns = gridTemplateColumns;
}


function countColumnsWithoutButtons(attributes)
{
	var count = 0;
	for (var i = 0; i < attributes.length; i++)
	{
		if (!needToSkipAttributeInTable(attributes[i]))
			count++;
	}
	return count;
}


function createNotesTableBody(table, attributes, notes, contentType, parentNoteId, parentNoteAttribute)
{
	if (notes == null)
		return;

	for (var i = 0; i < notes.length; i++)
	{
		var note = notes[i];
		for (var j = 0; j < attributes.length; j++)
		{
			if (needToSkipAttributeInTable(attributes[j]))
				continue;

			var attribute = attributes[j];
			var attributeName = attribute.name;
			var currentValue = note.attributes[attributeName];
			
			var cell = document.createElement("div");
			cell.style.textAlign = attribute.alignment;
			cell.setAttribute(ATTRIBUTE_NAME, attributeName);
			cell.setAttribute(NOTE_ID, note.id);
			setWidthRangeInTable(cell, attribute);

			switch(attribute.type)
			{
				case "row number":
					var rowNumber = document.createElement("td");
					rowNumber.setAttribute(ATTRIBUTE_NAME, attributeName);
					rowNumber.innerText = (i + 1).toString();
					rowNumber.style.textAlign = attribute.alignment;
					rowNumber.style.alignSelf = "left";
					rowNumber.style.minWidth = "0px";
					rowNumber.style.verticalAlign = "top";
					cell.appendChild(rowNumber);
					table.appendChild(cell);
					break;
				case "url":
					if (currentValue == null || currentValue.length == 0 || !currentValue.startsWith("http"))
					{
						table.appendChild(cell);
						break;
					}

					var a = document.createElement("a");
					a.href = currentValue;
					setImageClass(a, "link-image");
					a.style.margin = "auto";
					a.target = "_blank";
					cell.appendChild(a);
					table.appendChild(cell);
					break;
					
				case "save time":
				case "update time":
					if (currentValue == null)
					{
						table.appendChild(cell);
						break;
					}
					
					var time = new Date(currentValue);
					var format = attribute.dateFormat;
					var convertedTime = moment(time).format(format);
					cell.innerHTML = convertedTime;
					table.appendChild(cell);
					break;

				case "checkbox":
					if (attribute.editableInTable)
					{
						var checkbox = document.createElement("input");
						checkbox.type = "checkbox";
						if (currentValue != null)
							checkbox.checked = isTrue(currentValue);
						else
							checkbox.checked = isTrue(attribute.defaultValue);
						checkbox.setAttribute(PREVIOUS_VALUE, checkbox.checked);
						checkbox.setAttribute(CONTENT_TYPE, contentType);
						
						checkbox.onchange = function()
						{
							var objectToSave = new Object();
							objectToSave[this.parentNode.getAttribute(ATTRIBUTE_NAME)] = this.checked;

							updateNote(objectToSave, this.parentNode.getAttribute(NOTE_ID), this.getAttribute(CONTENT_TYPE))
							.then(response => handleUpdateNoteResponse(response));
						}

						cell.appendChild(checkbox);
					}
					else
					{
						cell.innerText = valueOrEmptyString(currentValue);
					}
					table.appendChild(cell);
					break;
					
				case "select":
					if (attributes[j].editableInTable)
					{
						var select = document.createElement("select");
						addOptions(select, attribute.selectOptions);
						select.value = valueOrEmptyString(note.attributes[attribute.name]);
						select.setAttribute(PREVIOUS_VALUE, select.value);
						select.setAttribute(CONTENT_TYPE, contentType);
						select.style.overflow = "visible";
						select.style.minWidth = "100%";

						select.onchange = function()
						{
							var objectToSave = new Object();
							objectToSave[this.parentNode.getAttribute(ATTRIBUTE_NAME)] = this.value;

							updateNote(objectToSave, this.parentNode.getAttribute(NOTE_ID), this.getAttribute(CONTENT_TYPE))
							.then(response => handleUpdateNoteResponse(response));
						}
						cell.appendChild(select);
					}
					else
					{
						if (currentValue != null)
						{
							var option = attribute.selectOptions.filter(x => x.split("=")[0] == currentValue);
							if (option != null && option.length > 0)
							{
								var splittedValue = option[0].split("=");
								var color = splittedValue[1] ? splittedValue[1] : randomColor(splittedValue[0]);

								var elem = document.createElement("span");
								elem.innerText = splittedValue[0];
								elem.style.backgroundColor = color;
								elem.style.color = "white";
								elem.style.borderRadius = "2px";
								elem.style.paddingLeft = "2px";
								elem.style.paddingRight = "2px";
								enableSearchByClick(elem, attributeName, contentType, parentNoteId);

								cell.style.display = "flex";
								cell.style.flexWrap = "wrap";
								cell.style.justifyContent = attribute.alignment;
								
								cell.appendChild(elem);
							}
							else
							{
								cell.innerHTML = currentValue;
							}

						}
					}
					table.appendChild(cell);
					break;

				case "multiselect":
				case "delimited text":
					if (currentValue == null)
					{
						table.appendChild(cell);
						break;
					}

					cell.style.display = "flex";
					cell.style.flexWrap = "wrap";
					cell.style.alignItems = "center";
					cell.style.justifyContent = attribute.alignment;
					
					var values = (attribute.type == "delimited text") ? currentValue.split(attribute.delimiter).map(function (x) { return x.trim() }) : currentValue;
					for (var k = 0; k < values.length; k++)
					{
						var text = values[k];
						var elem = document.createElement("span");
						elem.classList.add(COLORED_SELECT);
						elem.innerText = text;
						if (attribute.type == "multiselect")
							elem.style.borderColor = randomColor(text);
						enableSearchByClick(elem, attributeName, contentType, parentNoteId);

						cell.style.display = "flex";
						cell.style.flexWrap = "wrap";
						cell.appendChild(elem);
					}
					table.appendChild(cell);
					break;

				case "inc":
					
					cell.style.display = "grid";
					cell.style.gridTemplateColumns = "auto min-content";
					
					var numberTd = document.createElement("td");
					numberTd.setAttribute(ATTRIBUTE_NAME, attributeName);
					numberTd.innerHTML = currentValue != null ? currentValue : attribute.defaultValue;
					numberTd.style.textAlign = attribute.alignment;
					numberTd.style.alignSelf = "left";
					numberTd.style.minWidth = "0px";
					numberTd.style.verticalAlign = "top";
					cell.appendChild(numberTd);

					var incButton = document.createElement("td");
					incButton.setAttribute(ATTRIBUTE_NAME, attributeName);
					incButton.setAttribute(CONTENT_TYPE, contentType);
					setImageClass(incButton, "plus-image", true);
					incButton.classList.add("plus-image-table");
					incButton.onclick = function()
					{
						var id = this.parentNode.getAttribute(NOTE_ID);
						fetch(SERVER_ADDRESS + '/rest/notes/' + this.getAttribute(CONTENT_TYPE) + "/" + id + "/inc/" + this.getAttribute(ATTRIBUTE_NAME), {
							method: "PUT",
							headers: { "Accept": TEXT_PLAIN, "Content-Type": APPLICATION_JSON }
						})
						.then(response => {
							if (response.status != 200)
								response.text().then(error => (response.status == 500) ? showError(error.message) : showError(error));
							else
								response.text().then(text => { this.previousSibling.innerText = parseFloat(text); })
						});
					}
					cell.appendChild(incButton);
					table.appendChild(cell);
					break;

				case "file":
				case "image":
					if (currentValue == null)
					{
						table.appendChild(cell);
						break;
					}

					var download = document.createElement("a");
					download.id = note.id + "-" + attribute.name + "-label";
					setImageClass(download, "download-image");
					download.setAttribute(FILE_ID, currentValue);
					download.style.margin = "auto";
					download.onclick = function()
					{
						var fileId = this.getAttribute(FILE_ID);
						if (fileId)
						{
							downloadFile(fileId)
							.then(data => {
								if (data)
									openDownloadPrompt(data, this.getAttribute("title"));
								else
									showError("Cannot download file");
							});
						}
					};

					asyncSetTitleFromMetadata(currentValue, download.id);
					cell.appendChild(download);
					table.appendChild(cell);
					break;

				case "textarea":
					if (currentValue != null)
					{
						var wrapper = document.createElement("div");
						wrapper.style.display = "inline-block";
						wrapper.style.maxWidth = "100%";
						var strings = currentValue.split('\n');
						for (var s = 0; s < strings.length; s++)
						{
							wrapper.appendChild(document.createTextNode(strings[s]));
							wrapper.appendChild(document.createElement("br"));
						}

						cell.appendChild(wrapper);
					}

					cell.style.maxWidth = "100%";
					table.appendChild(cell);

					break;

				default:
					cell.innerHTML = currentValue != null ? currentValue : "";
					table.appendChild(cell);
					break;
			}
		}

		if (!parentNoteId)
			table.appendChild(createButtonToHideNote(note.id, contentType, note.hidden));
		table.appendChild(createButtonToShowNoteEditForm(note.id, contentType, parentNoteId, parentNoteAttribute));
		table.appendChild(createButtonToDeleteNote(note.id, contentType));
	}
}


function createButtonToHideNote(id, contentType, isHidden)
{
	var hideButton = document.createElement("td");
	setImageClass(hideButton, isHidden ? VISIBLE_IMAGE : HIDDEN_IMAGE, false);
	hideButton.setAttribute(NOTE_ID, id);
	hideButton.setAttribute(CONTENT_TYPE, contentType);
	hideButton.onclick = changeNoteVisibilityButtonClickHandler;
	return hideButton;
}


function createButtonToShowNoteEditForm(id, contentType, parentNoteId, parentNoteAttribute)
{
	var editButton = document.createElement("td");
	editButton.classList.add(EDIT_BUTTON);
	editButton.setAttribute(NOTE_ID, id);
	editButton.setAttribute(CONTENT_TYPE, contentType);
	if (parentNoteAttribute)
		editButton.setAttribute(PARENT_NOTE_ATTRIBUTE, parentNoteAttribute);
	if (parentNoteId)
		editButton.setAttribute(PARENT_NOTE_ID, parentNoteId);
	editButton.onclick = function() 
	{
		pushNoteState(this.getAttribute(NOTE_ID), this.getAttribute(CONTENT_TYPE), this.getAttribute(PARENT_NOTE_ID));
		showNoteForm(this.getAttribute(NOTE_ID), this.getAttribute(CONTENT_TYPE), this.getAttribute(PARENT_NOTE_ID), this.getAttribute(PARENT_NOTE_ATTRIBUTE)); 
	};
	return editButton;
}

function createButtonToDeleteNote(id, contentType)
{
	var deleteButton = document.createElement("td");
	deleteButton.classList.add(DELETE_BUTTON);
	deleteButton.setAttribute(NOTE_ID, id);
	deleteButton.setAttribute(CONTENT_TYPE, contentType);
	deleteButton.onclick = function() 
	{
		var contentType = this.getAttribute(CONTENT_TYPE);
		var noteId = this.getAttribute(NOTE_ID);
		fetch(`${SERVER_ADDRESS}/rest/notes/${contentType}/${noteId}/key`)
		.then(keyAttrResponse => keyAttrResponse.text())
		.then(keyAttr => {
			if (keyAttr == null || typeof keyAttr == "undefined")
				keyAttr = "note";
			if (typeof keyAttr == "string")
				keyAttr = keyAttr.split("\n")[0];
				
			var result = confirm(`Delete ${keyAttr}?`);
			if (result)
			{
				deleteNote(noteId, contentType)
				.then(response => {
					if (response.status === 500)
						showError(response.message);
					else if (response.status === 200)
						window.location.reload();
				});
			}
		})

	};

	return deleteButton;
}


function deleteNote(id, contentType)
{
	return fetch(SERVER_ADDRESS + '/rest/notes/' + contentType + '/' + id, { method: "DELETE" })
	.then(response => {
		if (response.status === 500)
			showError(response.message);
		else if (response.status === 200)
			return response;
	})
}


function showNoteForm(id, contentType, parentNoteId, parentNoteAttribute, side)
{
	switchToAddEditForm();

	fetch(SERVER_ADDRESS + '/rest/attributes/search?entityName=' + contentType)
	.then(response => response.json())
	.then(attributes => {
		getEmptyElement(DATA_TABLE);
		var dataElement = getEmptyElement(DATA_ELEMENT);

		dataElement.appendChild(document.createElement("div"));

		var menu = document.createElement("div");
		menu.style.justifySelf = "right";

		var deleteNoteButton = document.createElement("a");
		// Cannot delete a new note.
		if (!id)
			deleteNoteButton.style.display = "none";
		deleteNoteButton.id = "delete-note-button";
		setImageClass(deleteNoteButton, "delete-note-image", true);
		deleteNoteButton.setAttribute(NOTE_ID, id);
		deleteNoteButton.setAttribute(CONTENT_TYPE, contentType);
		deleteNoteButton.onclick = function() 
		{
			var result = confirm("Delete note?");
			if (result)
			{
				deleteNote(this.getAttribute(NOTE_ID), this.getAttribute(CONTENT_TYPE))
				.then(() => {
					window.history.back();
				});
			}
		}
		menu.appendChild(deleteNoteButton);

		var hideNoteButton = document.createElement("a");
		// Cannot hide a nested note and a new note.
		if (parentNoteId || !id)
			hideNoteButton.style.display = "none";
		hideNoteButton.id = "hide-note-button";
		setImageClass(hideNoteButton, HIDDEN_IMAGE, true);
		hideNoteButton.setAttribute(NOTE_ID, id);
		hideNoteButton.setAttribute(CONTENT_TYPE, contentType);
		hideNoteButton.onclick = changeNoteVisibilityButtonClickHandler;
		menu.appendChild(hideNoteButton);

		var cloneButton = document.createElement("a");
		// Cannot clone a new note.
		if (!id)
			cloneButton.style.display = "none";
		cloneButton.id = "copy-note-button";
		setImageClass(cloneButton, "copy-note-image", true);
		cloneButton.onclick = function() 
		{
			var saveButton = document.getElementById("save-button");
			saveButton.removeAttribute(CONTENT_ID);
			saveButton.value = "Save";
			var deleteButton = document.getElementById("delete-note-button");
			deleteButton.style.display = "none";
		}
		menu.appendChild(cloneButton);

		dataElement.appendChild(menu);

		if (id)
		{
			fetch(SERVER_ADDRESS + "/rest/notes/" + contentType + "/" + id)
			.then(response => response.json())
			.then(note => {
				if (note.hidden)
				{
					var hideButton = document.getElementById("hide-note-button");
					changeImageClass(hideButton, HIDDEN_IMAGE, VISIBLE_IMAGE);
				}
				prepareNoteAttributes(dataElement, note, attributes);
				createNoteActionButtons(dataElement, id, parentNoteId, parentNoteAttribute, side, contentType);

				setPageTitleFromNoteKeyAttribute(contentType, note);
			})
		}
		else
		{
			prepareNoteAttributes(dataElement, null, attributes);
			createNoteActionButtons(dataElement, id, parentNoteId, parentNoteAttribute, side, contentType);
			setPageTitle("New note");
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
		if (attribute.type == "row number" || (note == null && isSkippableOnCreate(attribute.type)))
			continue;

		var label = document.createElement("label");
		label.innerText = attribute[TITLE];
		label.style.fontWeight = "bold";
		dataElement.appendChild(label);

		switch (attribute.type)
		{
			case "select":
				var input = createFormInput("select", attribute);
				addOptions(input, attribute.selectOptions);
				var val = getStringValueOrDefault(note, attribute);
				input.value = val.split("=")[0];
				input.classList.add("limitedInputWidth");
				dataElement.appendChild(input);
				break;

			case "multiselect":
				var input = createMultiselectWithCheckboxes(attribute.name, attribute.selectOptions);
				input.setAttribute(ATTRIBUTE_NAME, attribute.name);

				var defaultOptions = (attribute.defaultValue != null) ? attribute.defaultValue.split(";").map(function (x) { return x.trim() }) : null;
				var checkboxes = input.getElementsByTagName("input");
				var noteOptions = (note != null) ? note.attributes[attribute.name] : defaultOptions;
				if (noteOptions != null && noteOptions.length > 0)
				{
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
				}

				dataElement.appendChild(input);
				break;

			case "textarea":
				var input = createFormInput(attribute.type, attribute)
				input.value = getStringValueOrDefault(note, attribute);
				if (attribute.linesCount != null)
					input.setAttribute("rows", attribute.linesCount);
				if (attribute.regex != null)
					input.placeholder = attribute.regex;
				dataElement.appendChild(input);
				break;

			case "number":
			case "inc":
				var input = createFormInput("input", attribute, "number");
				input.value = getStringValueOrDefault(note, attribute);
				input.classList.add("limitedInputWidth");
				if (attribute.min != null)
					input.min = attribute.min;
				if (attribute.max != null)
					input.max = attribute.max;
				if (attribute.step != null)
					input.step = attribute.step;
				dataElement.appendChild(input);
				break;

			case "checkbox":
				var input = createFormInput("input", attribute, attribute.type);
				if (note != null && note.attributes[attribute.name] != null)
					input.checked = isTrue(note.attributes[attribute.name]);
				else
					input.checked = isTrue(attribute.defaultValue);
				dataElement.appendChild(input);
				break;

			case "save time":
			case "update time":
				var input = createFormInput("span", attribute);
				
				// For new note we have no values
				if (note == null)
				{
					label.style.display = "none";
					input.style.display = "none";
				}
				// Old note but no value (e.g. new attribute is added to old entity)
				else if (note.attributes[attribute.name] == null)
				{
					input.innerText = "Required data isn't found";
				}
				else
				{
					var time = new Date(note.attributes[attribute.name]);
					var format = attribute.dateFormat;
					var convertedTime = moment(time).format(format);
					input.innerText = convertedTime;
					if (attribute.type == "save time")
						input.setAttribute(ATTRIBUTE_VALUE, note.attributes[attribute.name]);
				}

				dataElement.appendChild(input);
				break;
				
			case "user date":
			case "user time":
				var input = createFormInput("input", attribute, (attribute.type == "user date") ? "date" : "time");
				input.value = getStringValueOrDefault(note, attribute);
				input.classList.add("limitedInputWidth");
				dataElement.appendChild(input);
				break;

			case "file":
			case "image":
				var input = createFormInput("input", attribute, "file");
				input.multiple = false;
				setFileSizeAttributes(input, attribute);
				input.id = attribute.name;
				input.style.display = "none";
				if (attribute.type == "image")
					input.setAttribute("accept", "image/*");
				
				var fileDiv = document.createElement("div");
				fileDiv.style.wordBreak = "break-all";

				var fileName = document.createElement("label");
				fileName.id = input.id + "-label";
				fileName.classList.add("file");
				fileDiv.appendChild(fileName);
				fileName.onclick = function()
				{
					var fileId = this.getAttribute(FILE_ID);
					if (fileId)
					{
						downloadFile(fileId)
						.then(data => {
							if (data)
								openDownloadPrompt(data, this.innerText);
							else
								showError("Cannot download file");
						});
					}
				};

				var fileButton = createInputButton();
				fileButton.setAttribute("related-button-id", input.id);
				fileButton.classList.add(UPLOAD_FILE_BUTTON);
				fileButton.onclick = function() 
				{
					var relatedButtonId = this.getAttribute("related-button-id");
					document.getElementById(relatedButtonId).click();
				}
				fileDiv.appendChild(fileButton);

				var deleteFileButton = createInputButton(input.id + "-delete");
				deleteFileButton.setAttribute("related-input-id", input.id);
				deleteFileButton.classList.add(DELETE_FILE_BUTTON);
				deleteFileButton.onclick = function() 
				{
					var relatedInputId = this.getAttribute("related-input-id");
					var relatedInput = document.getElementById(relatedInputId);
					relatedInput.removeAttribute(ATTRIBUTE_VALUE);
					if (relatedInput.getAttribute(ATTRIBUTE_TYPE) == "image")
					{
						var relatedImage = document.getElementById(relatedInputId + "-image");
						relatedImage.removeAttribute("src");
						relatedImage.style.display = "none";
					}

					var relatedLabel = document.getElementById(relatedInputId + "-label");
					relatedLabel.removeAttribute(FILE_ID);
					relatedLabel.innerText = "";

					this.style.display = "none";
				}
				deleteFileButton.style.display = "none";
				fileDiv.appendChild(deleteFileButton);

				dataElement.appendChild(fileDiv);

				if (attribute.type == "image")
				{
					var image = document.createElement("img");
					image.id = input.id + "-image";
					image.style.display = "none";
					image.classList.add(TWO_COLS);
					image.alt = attribute.title;
					setElementSizeAtPage(image, attribute);
					image.style.justifySelf = attribute.alignment;
					dataElement.appendChild(image);
				}

				if (note != null && note.attributes[attribute.name] != null)
				{
					asyncDownloadCurrentFileInfo(note.attributes[attribute.name], input.id, attribute.type);
				}

				input.onchange = function(event)
				{
					var file = event.target.files[0];
					checkFileSize(this.getAttribute(MIN_SIZE), this.getAttribute(MAX_SIZE), file.size / 1024);

					saveFile(file)
					.then(response => {
						if (!response.message)
						{
							var newFileId = response;
							this.setAttribute(ATTRIBUTE_VALUE, newFileId);
							document.getElementById(this.id + "-label").setAttribute(FILE_ID, newFileId);
							document.getElementById(this.id + "-label").innerText = event.target.files[0].name;
							document.getElementById(this.id + "-delete").style.display = "inline-grid";
							if (this.getAttribute(ATTRIBUTE_TYPE) == "image")
							{
								downloadFile(newFileId)
								.then(data => {
									if (data)
									{
										var file = window.URL.createObjectURL(data);
										var img = document.getElementById(this.id + "-image");
										img.setAttribute("download", event.target.files[0].name);
										img.setAttribute("src", file);
										img.style.display = "grid";
									}
								});
							}
						}
					});
				};

				dataElement.appendChild(input);
				break;

			case "gallery":
				var input = document.createElement("input");
				input.type = "file";
				input.multiple = true;
				setFileSizeAttributes(input, attribute);
				input.setAttribute("image-size", attribute.imagesSize);
				input.id = attribute.name;
				input.style.display = "none";
				input.setAttribute("accept", "image/*");

				var addButton = createInputButton();
				addButton.setAttribute("related-button-id", attribute.name);
				addButton.classList.add(UPLOAD_FILE_BUTTON);
				addButton.style.justifySelf = "right";
				addButton.onclick = function() 
				{
					var relatedButtonId = this.getAttribute("related-button-id");
					document.getElementById(relatedButtonId).click();
				}
				dataElement.appendChild(addButton);
				
				var gallery = createFormInput("div", attribute);
				gallery.classList.add(TWO_COLS);
				gallery.classList.add("gallery");
				gallery.id = attribute.name + "-gallery";
				setElementSizeAtPage(gallery, attribute);
				gallery.style.minWidth = "100%";
				gallery.style.justifySelf = attribute.alignment;
				dataElement.appendChild(gallery);

				if (note != null && note.attributes[attribute.name] != null)
				{
					note.attributes[attribute.name].forEach(function (item, index) {
						asyncDownloadImage(item, attribute.name, attribute.imagesSize);
					})
				}

				input.onchange = function(event)
				{
					for (var j = 0; j < event.target.files.length; j++)
						checkFileSize(this.getAttribute(MIN_SIZE), this.getAttribute(MAX_SIZE), event.target.files[j].size / 1024);

					for (var j = 0; j < event.target.files.length; j++)
					{
						saveFile(event.target.files[j])
						.then(response => {
							if (!response.message)
							{
								var currentImages = document.getElementById(this.id + "-gallery").getElementsByTagName("img");
								for (var k = 0; k < currentImages.length; k++)
								{
									if (currentImages[k].getAttribute(NOTE_ID) == response)
										showError("Image is already exists");
								}
	
								asyncDownloadImage(response, this.id, parseInt(this.getAttribute("image-size")))
							}
						});
					}
				};
				
				dataElement.appendChild(input);
				break;

			case "files":

				var input = document.createElement("input");
				input.type = "file";
				input.multiple = true;
				input.id = (attribute.name + "-input");
				setFileSizeAttributes(input, attribute);
				input.style.display = "none";

				var addButton = createInputButton();
				addButton.setAttribute("related-button-id", attribute.name + "-input");
				addButton.classList.add(UPLOAD_FILE_BUTTON);
				addButton.style.justifySelf = "right";
				addButton.onclick = function() 
				{
					var relatedButtonId = this.getAttribute("related-button-id");
					document.getElementById(relatedButtonId).click();
				}
				dataElement.appendChild(addButton);

				var filesCollection = createFormInput("div", attribute);
				filesCollection.classList.add(TWO_COLS);
				filesCollection.classList.add("files-collection")
				filesCollection.id = attribute.name + "-input-files";
				setElementSizeAtPage(filesCollection, attribute);
				filesCollection.style.minWidth = "100%";
				filesCollection.setAttribute(FILES_COUNT, 0);
				appendNewSpanAligning(filesCollection, "№", "right");
				appendNewSpanAligning(filesCollection, "Title", "center");
				appendNewSpanAligning(filesCollection, "Type", "center");
				appendNewSpanAligning(filesCollection, "Size, Kb", "center");
				appendNewSpanAligning(filesCollection, "Uploaded", "center");
				appendNewSpan(filesCollection, "");			 // Download
				appendNewSpan(filesCollection, "");		     // Remove
				dataElement.appendChild(filesCollection);

				if (note != null && note.attributes[attribute.name] != null)
				{
					var identifiers = new Object();
					identifiers["identifiers"] = note.attributes[attribute.name];

					asyncDownloadFiles(note.attributes[attribute.name], filesCollection);
				}

				input.onchange = function(event)
				{
					for (var j = 0; j < event.target.files.length; j++)
						checkFileSize(this.getAttribute(MIN_SIZE), this.getAttribute(MAX_SIZE), event.target.files[j].size / 1024);

					var promise = function(value, index) 
					{ 
						return new Promise((resolve, reject) => {
							saveFile(value)
							.then(response => { 
								return (response.message) ? reject(response.message) : resolve(response);
							})
						})
					};

					Promise.all([...event.target.files].map(promise))
					.then(identifiers => { asyncDownloadFiles(identifiers, document.getElementById(this.id + "-files")); })
				};

				dataElement.appendChild(input);
				break;

			case "nested notes":

				// Menu
				var dataMenu = document.createElement("div");
				dataMenu.classList.add(DATA_MENU);
				dataMenu.style.padding = "0";
			
				var addNoteButton = document.createElement("a");
				addNoteButton.setAttribute(PARENT_NOTE_ID, note.id);
				addNoteButton.setAttribute(PARENT_NOTE_ATTRIBUTE, attribute.name);
				addNoteButton.setAttribute("entity-name", attribute.entity);
				setImageClass(addNoteButton, NEW_NOTE_IMAGE);
				addNoteButton.onclick = function() 
				{
					pushNoteState(null, this.getAttribute("entity-name"), this.getAttribute(PARENT_NOTE_ID));
					showNoteForm(null, 
						this.getAttribute("entity-name"), 
						this.getAttribute(PARENT_NOTE_ID), 
						this.getAttribute(PARENT_NOTE_ATTRIBUTE)); 
				};
				dataMenu.appendChild(addNoteButton);

				dataElement.appendChild(dataMenu);

				// Notes
				var nestedNotes = document.createElement("div");
				nestedNotes.classList.add(TWO_COLS);
				nestedNotes.classList.add(DATA_TABLE);
				nestedNotes.classList.add(HAS_VERTICAL_PADDINGS);
				nestedNotes.id = attribute.name + "-input-nested-notes";
				setElementSizeAtPage(nestedNotes, attribute);
				nestedNotes.style.minWidth = "100%";
				nestedNotes.style.overflowY = "scroll";
				nestedNotes.style.paddingLeft = "0";
				nestedNotes.style.paddingRight = "var(--padding)";
				dataElement.appendChild(nestedNotes);

				showNestedNotes(attribute.entity, attribute.name, note.id, nestedNotes.id);
				
				break;

			case "compared notes":

				var titles = attribute.title.split(";");
				var hasSeparateTitles = (titles.length == 2);
				if (hasSeparateTitles)
					dataElement.removeChild(label);

				var comparedNotes = document.createElement("div");
				comparedNotes.classList.add(TWO_COLS);
				comparedNotes.classList.add(DATA_TABLE);
				comparedNotes.classList.add(HAS_VERTICAL_PADDINGS);
				comparedNotes.style.gridTemplateColumns = "1fr 1fr";
				comparedNotes.style.minWidth = "100%";
				
				addComparedNotesMenu(comparedNotes, "left", note, attribute, hasSeparateTitles ? titles[0] : null);
				addComparedNotesMenu(comparedNotes, "right", note, attribute, hasSeparateTitles ? titles[1] : null);

				var leftTable = addComparedNotesTable(comparedNotes, "left", attribute);
				var rightTable = addComparedNotesTable(comparedNotes, "right", attribute);

				leftTable.style.paddingRight = "var(--padding)";
				rightTable.style.paddingRight = "var(--padding)";

				dataElement.appendChild(comparedNotes);

				showComparedNotes(attribute.entity, attribute.name, note.id, leftTable.id, "left");
				showComparedNotes(attribute.entity, attribute.name, note.id, rightTable.id, "right");

				break;

			// text, url, etc.
			default:
				var input = createFormInput("input", attribute, attribute.type);
				input.value = getStringValueOrDefault(note, attribute);
				if (attribute.regex)
					input.placeholder = attribute.regex;
				dataElement.appendChild(input);
				break;				
		}

		if (isTextual(attribute.type))
		{
			if (attribute.max != null)
				input.maxLength = attribute.max;
			if (attribute.min != null)
				input.minLength = attribute.min;
		}
	}
}


function createFormInput(elementType, attribute, type)
{
	var input = document.createElement(elementType);
	if (type)
		input.type = type;
	if (attribute.required != null)
		input.required = attribute.required;
	input.setAttribute(ATTRIBUTE_TYPE, attribute.type);
	input.setAttribute(ATTRIBUTE_NAME, attribute.name);
	return input;
}


function saveFile(file)
{
	var formData = new FormData();
	formData.append("file", file);

	return fetch(SERVER_ADDRESS + '/rest/file', {
		method: "POST",
		body: formData,
		headers: { "Accept": APPLICATION_JSON }
	})
	.then(response => { return (response.status === 200) ? response.text() : response.json(); });
}


function downloadMetadata(fileId)
{
	return fetch(SERVER_ADDRESS + "/rest/file/metadata/" + fileId, {
		method: "GET",
		headers: { "Accept": APPLICATION_JSON, "Content-Type": APPLICATION_JSON }
	})
	.then(response => response.json());
}


function asyncSetTitleFromMetadata(fileId, elementId)
{
	downloadMetadata(fileId)
	.then(metadata => { document.getElementById(elementId).setAttribute("title", metadata.title); })
}


function asyncDownloadCurrentFileInfo(fileId, inputId, attributeType)
{
	downloadMetadata(fileId)
	.then(json => {
		document.getElementById(inputId).setAttribute(ATTRIBUTE_VALUE, fileId);
		document.getElementById(inputId + "-label").setAttribute(FILE_ID, fileId);
		document.getElementById(inputId + "-label").innerText = json.title;
		document.getElementById(inputId + "-delete").style.display = "inline-grid";

		if (attributeType == "image")
		{
			downloadFile(fileId)
			.then(data => {
				if (data)
				{
					var file = window.URL.createObjectURL(data);
					var img = document.getElementById(inputId + "-image");
					img.setAttribute("download", json.title);
					img.setAttribute("src", file);
					img.style.display = "grid";
				}
			});
		}
	})
}


function asyncDownloadImage(fileId, inputId, size)
{
	fetch(SERVER_ADDRESS + "/rest/file/image/" + fileId + "/" + size, {
		method: "POST",
		headers: { "Accept": MULTIPART_FORM_DATA, "Content-Type": APPLICATION_JSON }
	})
	.then(getImagesResponse => {
		if (getImagesResponse.status === 200)
			return getImagesResponse.blob();
	})
	.then(downloadedImage => {
		if (downloadedImage)
		{
			var imageDiv = document.createElement("div");

			var file = window.URL.createObjectURL(downloadedImage);
			var img = document.createElement("img");
			img.id = inputId + "-" + fileId + "-img";
			img.setAttribute(FILE_ID, fileId);
			img.setAttribute("src", file);
			img.style.display = "inline-flex";
			img.onclick = function()
			{
				var popup = document.createElement("div");
				popup.classList.add("popup");
				popup.onclick = function() { setTimeout(() => this.parentNode.removeChild(this), 0); }
				var popupImage = document.createElement("img");
				popupImage.setAttribute("related-img-id", img.id);
				popupImage.classList.add("popup-img");
				popupImage.onclick = function() { setTimeout(() => this.parentNode.parentNode.removeChild(this.parentNode), 0); }
				popup.appendChild(popupImage);

				downloadFile(fileId)
				.then(originalImage => {
					if (originalImage)
					{
						var file = window.URL.createObjectURL(originalImage);
						popupImage.setAttribute("src", file);
						popupImage.style.display = "flex";
						popupImage.onclick = function()
						{
							var relatedImgId = this.getAttribute("related-img-id");
							var relatedImg = document.getElementById(relatedImgId);
							var imgDiv = relatedImg.parentNode;
							var nextImgDiv = imgDiv.nextSibling;
							if (nextImgDiv)
							{
								var nextImg = nextImgDiv.getElementsByTagName("img")[0];
								nextImg.onclick();
							}
						}
						popup.style.display = "flex";

						document.body.appendChild(popup);
					}
				});
			}

			var buttons = document.createElement("span");
			buttons.classList.add("icon-buttons");

			var download = document.createElement("a");
			download.id = inputId + "-" + fileId;
			setImageClass(download, "download-image");
			download.setAttribute(FILE_ID, fileId);
			download.onclick = function() 
			{
				downloadFile(this.getAttribute(FILE_ID))
				.then(data => {
					if (data)
						openDownloadPrompt(data, this.getAttribute("title"));
					else
						showError("Cannot download file");
				});
			}

			var remove = document.createElement("a");
			setImageClass(remove, "remove-image");
			remove.setAttribute("related-input-id", img.id);
			remove.onclick = function() 
			{ 
				var toRemove = this.parentNode.parentNode;	
				setTimeout(() => { toRemove.parentNode.removeChild(toRemove); }, 0 )
			}

			buttons.appendChild(download);
			buttons.appendChild(remove);
			imageDiv.appendChild(img);
			imageDiv.appendChild(buttons);
			document.getElementById(inputId + "-gallery").appendChild(imageDiv);
			
			asyncSetTitleFromMetadata(fileId, download.id);
		}
	});
}


function asyncDownloadFiles(identifiers, filesCollection)
{
	fetch(SERVER_ADDRESS + "/rest/file/metadata", {
		method: "POST",
		body: JSON.stringify(identifiers),
		headers: { "Accept": APPLICATION_JSON, "Content-Type": APPLICATION_JSON }
	})
	.then(response => response.json())
	.then(metadata => {
		for (var i = 0; i < metadata.length; i++)
			addFileCollectionRow(metadata[i], filesCollection);
	});
}


function addFileCollectionRow(metadata, filesCollection)
{
	var number = parseInt(filesCollection.getAttribute(FILES_COUNT)) + 1;
	var numberSpan = appendNewSpanAligning(filesCollection, number, "right");
	numberSpan.style.minWidth = "23px";
	appendNewSpanAligning(filesCollection, metadata.title, "left");
	appendNewSpanAligning(filesCollection, metadata.contentType, "center");
	appendNewSpanAligning(filesCollection, Math.round(metadata.size / 1024), "right");
	appendNewSpanAligning(filesCollection, moment(metadata.uploaded * 1000).format('DD.MM.YYYY HH:mm'), "center");

	var downloadButton = document.createElement("a");
	setImageClass(downloadButton, "download-image");
	downloadButton.setAttribute(FILE_ID, metadata.id);
	downloadButton.setAttribute("title", metadata.title);
	downloadButton.onclick = function() 
	{
		downloadFile(this.getAttribute(FILE_ID))
		.then(data => {
			if (data)
				openDownloadPrompt(data, this.getAttribute("title"));
			else
				showError("Cannot download file");
		});
	}
	filesCollection.appendChild(downloadButton);

	var deleteButton = document.createElement("span");
	deleteButton.classList.add(DELETE_BUTTON);
	deleteButton.setAttribute(FILE_ID, metadata.id);
	deleteButton.onclick = function() 
	{
		var elementsOnRow = 7;
		for (var i = 0; i < (elementsOnRow - 1); i++)
			this.parentNode.removeChild(deleteButton.previousSibling);

		setTimeout(() => this.parentNode.removeChild(this), 0);
	};
	filesCollection.appendChild(deleteButton);

	filesCollection.setAttribute(FILES_COUNT, number);
}


function checkFileSize(min, max, fileSize)
{
	if (max != null && fileSize > max)
		showError("File size is greater than " + max.toString());
	if (min != null && fileSize < min)
		showError("File size is less than " + min.toString());
}


function getStringValueOrDefault(note, attribute)
{
	return (note != null) ? valueOrEmptyString(note.attributes[attribute.name]) : valueOrEmptyString(attribute.defaultValue);
}


function setFileSizeAttributes(input, attribute)
{
	if (attribute.max != null)
		input.setAttribute(MAX_SIZE, attribute.max);
	if (attribute.min != null)
		input.setAttribute(MIN_SIZE, attribute.min);
}


function setElementSizeAtPage(element, attribute)
{
	if (attribute.maxWidth)
		element.style.maxWidth = attribute.maxWidth;
	if (attribute.minWidth)
		element.style.minWidth = attribute.minWidth;

	if (attribute.maxHeight)
		element.style.maxHeight = attribute.maxHeight;
	if (attribute.minHeight)
		element.style.minHeight;
}


function createNoteActionButtons(dataElement, id, parentNoteId, parentNoteAttribute, side, contentType)
{
	var cancelHandler = function() 
	{
		window.history.back();
		if (!this.hasAttribute(PARENT_NOTE_ID))
			showCurrentContent(this.getAttribute(CONTENT_TYPE)) 
	};
	var saveHandler = function() 
	{
		var objectToSave = new Object();

		var contentId = this.getAttribute(CONTENT_ID);
		if (contentId != null)
			objectToSave.id = contentId;

		var contentType = this.getAttribute(CONTENT_TYPE);
		var parentId = this.getAttribute(PARENT_NOTE_ID);
		var parentAttr = this.getAttribute(PARENT_NOTE_ATTRIBUTE);
		var side = this.getAttribute("side");
		if (side && parentId && parentAttr)
			objectToSave.nested = `${parentAttr}/${side}/${parentId}`;
		else if (parentId && parentAttr)
			objectToSave.nested = `${parentAttr}/${parentId}`;

		objectToSave.attributes = getNoteFromForm(dataElement);

		fetch(SERVER_ADDRESS + '/rest/notes/' + contentType, {
			method: objectToSave.id == null ? "POST" : "PUT",
			body: JSON.stringify(objectToSave),
			headers: { "Accept": TEXT_PLAIN, "Content-Type": APPLICATION_JSON }
		})
		.then(response => {
			if (response.status === 200)
			{
				window.history.back();
				if (!this.hasAttribute(PARENT_NOTE_ID))
					showCurrentContent(contentType);
			}
		});
	};

	addFormButtons(dataElement, id != null, saveHandler, cancelHandler);

	var cancelButton = document.getElementById("cancel-button");
	cancelButton.setAttribute(CONTENT_TYPE, contentType);
	if (parentNoteId)
		cancelButton.setAttribute(PARENT_NOTE_ID, parentNoteId);

	var saveButton = document.getElementById("save-button");
	saveButton.setAttribute(CONTENT_TYPE, contentType);
	if (parentNoteId)
		saveButton.setAttribute(PARENT_NOTE_ID, parentNoteId);
	if (parentNoteAttribute)
		saveButton.setAttribute(PARENT_NOTE_ATTRIBUTE, parentNoteAttribute);
	if (side)
		saveButton.setAttribute("side", side);
	if (id)
		saveButton.setAttribute(CONTENT_ID, id);
}


function needToSkipAttributeInTable(attribute)
{
	return (isSkippableAttributeInNotesTable(attribute.type))
}


function downloadFile(fileId)
{
	return fetch(SERVER_ADDRESS + "/rest/file/" + fileId + "/content")
	.then(response => {
		if (response.status === 200)
		{
			return response.blob();
		}
	})
}


function openDownloadPrompt(fileData, title)
{
	var a = document.createElement("a");
	var file = window.URL.createObjectURL(fileData);
	a.setAttribute("href", file);
	a.setAttribute("download", title);
	a.style.display = "none";
	document.body.appendChild(a);
	a.click();
	setTimeout(() => document.body.removeChild(a), 0);
}


function updateNote(objectToSave, id, contentType)
{
	return fetch(SERVER_ADDRESS + '/rest/notes/' + contentType + "/" + id, {
		method: "PUT",
		body: JSON.stringify(objectToSave),
		headers: { "Accept": TEXT_PLAIN, "Content-Type": APPLICATION_JSON }
	})
}


function handleUpdateNoteResponse(response)
{
	if (response.status != 200)
	{
		this.value = this.getAttribute(PREVIOUS_VALUE);
		response.text().then(error => (response.status == 500) ? showError(error.message) : showError(error));
	}
	else
	{
		response.text().then(text => { this.setAttribute(PREVIOUS_VALUE, this.value); })
	}
}


function setWidthRangeInTable(element, attribute)
{
	if (attribute.maxWidth != null)
		element.style.maxWidth = attribute.maxWidth;
	if (attribute.minWidth != null)
		element.style.minWidth = attribute.minWidth;
}

function addComparedNotesMenu(parent, side, note, attribute, title)
{
	var envelope = document.createElement("div");

	if (title)
	{
		envelope.style.display = "grid";
		envelope.style.gridTemplateColumns = "auto auto";

		var label = document.createElement("label");
		label.innerText = title;
		label.style.fontWeight = "bold";
		envelope.appendChild(label);
	}

	var menu = document.createElement("div");
	menu.classList.add(DATA_MENU);
	menu.style.padding = "0";

	var addNoteButton = document.createElement("a");
	addNoteButton.setAttribute("entity-name", attribute.entity);
	addNoteButton.setAttribute(PARENT_NOTE_ID, note.id);
	addNoteButton.setAttribute(PARENT_NOTE_ATTRIBUTE, attribute.name);
	addNoteButton.setAttribute("side", side);
	setImageClass(addNoteButton, NEW_NOTE_IMAGE);
	addNoteButton.onclick = function() 
	{
		pushNoteState(null, this.getAttribute("entity-name"), this.getAttribute(PARENT_NOTE_ID));
		showNoteForm(null, 
			this.getAttribute("entity-name"), 
			this.getAttribute(PARENT_NOTE_ID), 
			this.getAttribute(PARENT_NOTE_ATTRIBUTE), 
			this.getAttribute("side")); 
	};

	menu.appendChild(addNoteButton);

	envelope.appendChild(menu);
	parent.appendChild(envelope);
}

function addComparedNotesTable(parent, side, attribute)
{
	var table = document.createElement("div");
	table.classList.add(DATA_TABLE);
	table.style.padding = "0";
	table.id = attribute.name + "-input-compared-notes-" + side;
	table.style.minWidth = "100%";
	table.style.overflowY = "scroll";
	setElementSizeAtPage(table, attribute);
	parent.appendChild(table);

	return table;
}


function enableSearchByClick(elem, attributeName, contentType, parentNoteId)
{
	if (!parentNoteId)
	{
		elem.setAttribute(ATTRIBUTE_NAME, attributeName);
		elem.setAttribute(CONTENT_TYPE, contentType);
		elem.onclick = function() 
		{
			var attr = this.getAttribute(ATTRIBUTE_NAME);
			var content = this.getAttribute(CONTENT_TYPE);
			window.history.pushState("showSearchResult", "Notes", `/${content}?searchAttribute=${attr}&searchRequest=${this.innerText}`);
			showSearchResult(attr, this.innerText, content);
		}
	}
}


function setPageTitleFromNoteKeyAttribute(contentType, note)
{
	// Set page title from key attribute
	fetch(SERVER_ADDRESS + "/rest/entities/search?name=" + contentType)
	.then(response => response.json())
	.then(entity => {
		var title = note.attributes[entity.keyAttribute].toString();
		if (title.includes("\n"))
			title = title.substring(0, title.indexOf("\n") + 1);
		if (title.length > 52)
			title = title.substring(0, 50) + "...";
		setPageTitle(title);
	});
}

function setPageTitleFromEntityTitle(contentType)
{
	fetch(SERVER_ADDRESS + "/rest/entities/search?name=" + contentType)
	.then(response => response.json())
	.then(entity => setPageTitle(entity.title));
}

function changeNoteVisibilityButtonClickHandler()
{
	if (this.classList.contains(HIDDEN_IMAGE))
	{
		fetch(SERVER_ADDRESS + "/rest/notes/" + this.getAttribute(CONTENT_TYPE) + "/" + this.getAttribute(NOTE_ID) + "/hide", {
			method: "PUT",
			headers: { "Accept": TEXT_PLAIN, "Content-Type": APPLICATION_JSON }
		})
		.then(response => {
			if (response.status == 200)
			{
				changeImageClass(this, HIDDEN_IMAGE, VISIBLE_IMAGE);
			}
		});
	}
	else
	{
		fetch(SERVER_ADDRESS + "/rest/notes/" + this.getAttribute(CONTENT_TYPE) + "/" + this.getAttribute(NOTE_ID) + "/reveal", {
			method: "PUT",
			headers: { "Accept": TEXT_PLAIN, "Content-Type": APPLICATION_JSON }
		})
		.then(response => {
			if (response.status == 200)
			{
				changeImageClass(this, VISIBLE_IMAGE, HIDDEN_IMAGE);
			}
		});
	}
}