


/**
 * Shows all notes like 'Movies' or 'Games'
 */
async function showContentTableWithNotes(contentType, entityId, attributeName, searchRequest)
{
	var isSearch = (attributeName != null && searchRequest != null);
	// We are still at the same page. No reason to recreate this.
	if (!isSearch)
	{
		setContentType(contentType);
		setContentId(entityId);

		window.history.pushState("", "Notes", "/" + contentType);

		switchToContent();
		createUpperMenuForContent();
	}

	fetch(SERVER_ADDRESS + '/rest/attributes/search?entityId=' + entityId)
	.then(response => response.json())
	.then(attributes => {
		
		var address = isSearch ? `${SERVER_ADDRESS}/rest/notes/${contentType}/${attributeName}/search` : SERVER_ADDRESS + '/rest/notes/' + contentType;
		fetch(address, {
			method: isSearch ? "POST" : "GET",
			body: JSON.stringify(searchRequest),
			headers: { "Accept": "application/json;charset=UTF-8", "Content-Type": "application/json;charset=UTF-8" }
		})
		.then(response => response.json())
		.then(notes => {
			getEmptyElement(DATA_ELEMENT);
			var table = getEmptyElement(DATA_TABLE);
			createNotesTableHead(table, attributes);
			createNotesTableBody(table, attributes, notes);
		});
	});
}


function createUpperMenuForContent()
{
	var dataMenu = getEmptyElement(DATA_MENU);

	var searchAttributes = document.createElement("select");
	searchAttributes.id = "search-attributes";
	dataMenu.appendChild(searchAttributes);

	var searchInputWrapper = document.createElement("div");
	searchInputWrapper.id = "search-input-wrapper";
	dataMenu.appendChild(searchInputWrapper);

	fetch(SERVER_ADDRESS + '/rest/attributes/search?entityId=' + getContentId())
	.then(response => response.json())
	.then(attributes => {
		var select = document.getElementById("search-attributes");
		select.style.overflow = "visible";
		//select.style.minWidth = "100%";
		for (var i = 0; i < attributes.length; i++)
		{
			var type = attributes[i].type;
			if (hasDateFormat(type) || isFile(type) || isMultifile(type))
				continue;

			var option = document.createElement("option");
			option.innerText = attributes[i].title;
			option.value = attributes[i].name;
			option.setAttribute(ATTRIBUTE_NAME, attributes[i].name);
			option.setAttribute(ATTRIBUTE_TYPE, attributes[i].type);
			option.setAttribute(ATTRIBUTE_ID, attributes[i].id);
			select.appendChild(option);
		}
		select.onchange = function() 
		{
			var currentOption = this.children.item(this.selectedIndex);
			var inputWrapper = document.getElementById("search-input-wrapper");
			clean(inputWrapper);
			switch (currentOption.getAttribute(ATTRIBUTE_TYPE))
			{
				case "text":
				case "textarea":
				case "url":
				case "number":
				case "inc":
					var searchInput = document.createElement("input");
					searchInput.className += " search-input-text";
					searchInput.id = "search-input";
					searchInput.addEventListener("keyup", event => {
						if (event.key !== "Enter")
							return;
						document.getElementById("search-button").click();
						event.preventDefault();
					})
					inputWrapper.appendChild(searchInput);
					break;
				case "select":
				case "multiselect":
					fetch(SERVER_ADDRESS + '/rest/attributes/search?id=' + currentOption.getAttribute(ATTRIBUTE_ID))
					.then(response => response.json())
					.then(attribute => {
						var select = document.createElement("select");
						select.id = "search-input";
						addOptions(select, attribute.selectOptions);
						select.selectedIndex = 0;
						inputWrapper.appendChild(select);
					});
					break;
				case "checkbox":
					var checkbox = document.createElement("input");
					checkbox.type = "checkbox";
					checkbox.id = "search-input";
					inputWrapper.appendChild(checkbox);
					break;
				default:
					break;
			}
		}
		select.selectedIndex = 0;
		select.onchange();
	});

	var searchButton = document.createElement("a");
	searchButton.id = "search-button";
	searchButton.className += " search-image";
	searchButton.href = "#";
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

		showContentTableWithNotes(getContentType(), getContentId(), attributeName, searchRequest);
	};
	searchButton.style.marginLeft = "0.1em";
	searchButton.style.marginRight = "1em";
	dataMenu.appendChild(searchButton);

	var addNoteButton = document.createElement("a");
	addNoteButton.className += " new-note-image";
	addNoteButton.href = "#";
	addNoteButton.onclick = function() { showNoteForm(null) };
	dataMenu.appendChild(addNoteButton);
}


function createNotesTableHead(table, attributes)
{
	var count = countColumnsWithoutButtons(attributes);
	setContentColumnsCount(count);

	// Headers for attributes
	for (var i = 0; i < attributes.length; i++)
	{
		if (needToSkipAttributeInTable(attributes[i]))
			continue;

		appendNewSpanAligning(table, attributes[i]["title"], "center");

		// Plus or minus sign for inc
		if (attributes[i].type == "inc" && attributes[i].editableInTable)
			appendNewSpan(table, "");
	}

	// Edit and Delete buttons
	appendNewSpan(table, "");
	appendNewSpan(table, "");
}


function countColumnsWithoutButtons(attributes)
{
	var count = 0;
	for (var i = 0; i < attributes.length; i++)
	{
		if (!needToSkipAttributeInTable(attributes[i]))
		{
			count++;
			if (attributes[i].type == "inc" && attributes[i].editableInTable)
				count++;
		}
	}
	return count;
}


function createNotesTableBody(table, attributes, notes)
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
			cell.setAttribute(CONTENT_ID, note.id);

			switch(attribute.type)
			{
				case "url":
					if (currentValue == null)
						break;

					var a = document.createElement("a");
					a.href = currentValue;
					a.className += " link-image";
					a.style.margin = "auto";
					a.target = "_blank";
					cell.appendChild(a);
					break;
					
				case "save time":
				case "update time":
					if (currentValue == null)
						break;
					
					var time = new Date(currentValue);
					var format = attribute.dateFormat;
					var convertedTime = moment(time).format(format);
					cell.innerHTML = convertedTime;
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
						
						checkbox.onchange = function()
						{
							var objectToSave = new Object();
							objectToSave[this.parentNode.getAttribute(ATTRIBUTE_NAME)] = this.checked;

							updateNote(objectToSave, this.parentNode.getAttribute(CONTENT_ID))
							.then(response => handleUpdateNoteResponse(response));
						}

						cell.appendChild(checkbox);
					}
					else
					{
						cell.innerText = valueOrEmptyString(currentValue);
					}
					break;
					
				case "select":
					if (attributes[j].editableInTable)
					{
						var select = document.createElement("select");
						addOptions(select, attribute.selectOptions);
						select.value = valueOrEmptyString(note.attributes[attribute.name]);
						select.setAttribute(PREVIOUS_VALUE, select.value);
						select.style.overflow = "visible";
						select.style.minWidth = "100%";

						select.onchange = function()
						{
							var objectToSave = new Object();
							objectToSave[this.parentNode.getAttribute(ATTRIBUTE_NAME)] = this.value;

							updateNote(objectToSave, this.parentNode.getAttribute(CONTENT_ID))
							.then(response => handleUpdateNoteResponse(response));
						}
						cell.appendChild(select);
					}
					else
					{
						cell.innerHTML = currentValue != null ? currentValue : "";
					}
					break;

				case "multiselect":
					if (currentValue == null)
						break;
					
					for (var k = 0; k < currentValue.length; k++)
					{
						var text = currentValue[k];
						var elem = document.createElement("span");
						elem.className += " colored-select";
						elem.innerText = text;
						elem.style.borderColor = randomColor(text);

						cell.style.display = "flex";
						cell.style.flexWrap = "wrap";
						cell.appendChild(elem);
					}
					break;

				case "inc":
					var numberTd = document.createElement("td");
					numberTd.setAttribute(ATTRIBUTE_NAME, attributeName);
					numberTd.innerHTML = currentValue != null ? currentValue : attribute.defaultValue;
					numberTd.style.textAlign = attribute.alignment;
					numberTd.style.alignSelf = "center";
					table.appendChild(numberTd);

					var incButton = document.createElement("a");
					incButton.setAttribute(ATTRIBUTE_NAME, attributeName);
					incButton.className += " plus-image";
					incButton.style.justifySelf = "start";
					incButton.onclick = function()
					{
						var id = this.parentNode.getAttribute(CONTENT_ID);
						fetch(SERVER_ADDRESS + '/rest/notes/' + getContentType() + "/" + id + "/inc/" + this.getAttribute(ATTRIBUTE_NAME), {
							method: "PUT",
							headers: { "Accept": "text/plain;charset=UTF-8", "Content-Type": "application/json;charset=UTF-8" }
						})
						.then(response => {
							if (response.status != 200)
								response.text().then(error => (response.status == 500) ? showError(error.message) : showError(error));
							else
								response.text().then(text => { this.parentNode.previousSibling.innerText = parseFloat(text); })
						});
					}
					cell.appendChild(incButton);
					break;

				case "file":
				case "image":
					if (currentValue == null)
						break;

					var download = document.createElement("a");
					download.href = "#";
					download.id = note.id + "-" + attribute.id + "-label";
					download.className += " download-image";
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
					break;

				default:
					cell.innerHTML = currentValue != null ? currentValue : "";
					break;
			}
			table.appendChild(cell);
		}

		table.appendChild(createButtonToShowNoteEditForm(note.id));
		table.appendChild(createButtonToDeleteNote(note.id));
	}
}


function createButtonToShowNoteEditForm(id)
{
	var editButton = document.createElement("td");
	editButton.className += " " + EDIT_BUTTON;
	editButton.setAttribute(CONTENT_ID, id);
	editButton.onclick = function() 
	{
		window.history.pushState("", "Note", `/${getContentType()}/${id}`);
		showNoteForm(id);
	};
	return editButton;
}

function createButtonToDeleteNote(id)
{
	var deleteButton = document.createElement("td");
	deleteButton.className += " " + DELETE_BUTTON;
	deleteButton.setAttribute(CONTENT_ID, id);
	deleteButton.onclick = function() 
	{
		var result = confirm("Delete note?");
		if (result)
		{
			deleteNote(id)
			.then(updateContentTableVisibility());
		}
	};

	return deleteButton;
}


function deleteNote(id)
{
	return fetch(SERVER_ADDRESS + '/rest/notes/' + getContentType() + '/' + id, { method: "DELETE" })
	.then(response => {
		if (response.status === 200)
			showCurrentContent();
	})
}


function showNoteForm(id)
{
	switchToAddEditForm();

	fetch(SERVER_ADDRESS + '/rest/attributes/search?entityId=' + getContentId())
	.then(response => response.json())
	.then(attributes => {
		getEmptyElement(DATA_TABLE);
		var dataElement = getEmptyElement(DATA_ELEMENT);

		createErrorLabel(dataElement);

		if (id)
		{
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

		switch (attribute.type)
		{
			case "select":
				var input = createFormInput("select", attribute);
				addOptions(input, attribute.selectOptions);
				input.value = getStringValueOrDefault(note, attribute);
				input.className += " limitedInputWidth";	
				dataElement.appendChild(input);
				break;

			case "multiselect":
				var input = createMultiselectWithCheckboxes(attribute.name, attribute.selectOptions);
				input.setAttribute(ATTRIBUTE_NAME, attribute.name);
				input.setAttribute(ATTRIBUTE_ID, attribute.id);

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
				input.className += " limitedInputWidth";
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
				input.className += " limitedInputWidth";
				dataElement.appendChild(input);
				break;

			case "file":
			case "image":
				var input = createFormInput("input", attribute, "file");
				input.multiple = false;
				setFileSizeAttributes(input, attribute);
				input.id = attribute.id;
				input.style.display = "none";
				if (attribute.type == "image")
					input.setAttribute("accept", "image/*");
				
				var fileDiv = document.createElement("div");
				fileDiv.style.wordBreak = "break-all";

				var fileName = document.createElement("label");
				fileName.id = input.id + "-label";
				fileName.className += " file";
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
				fileButton.className += " " + UPLOAD_FILE_BUTTON;
				fileButton.onclick = function() 
				{
					var relatedButtonId = this.getAttribute("related-button-id");
					document.getElementById(relatedButtonId).click();
				}
				fileDiv.appendChild(fileButton);

				var deleteFileButton = createInputButton(input.id + "-delete");
				deleteFileButton.setAttribute("related-input-id", input.id);
				deleteFileButton.className += " " + DELETE_FILE_BUTTON;
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
					image.className += " twoCols";
					image.alt = attribute.title;
					setElementSizeAtPage(image, attribute);
					image.style.justifySelf = attribute.alignment;
					dataElement.appendChild(image);
				}

				if (note != null && note.attributes[attribute.name] != null)
				{
					asyncDownloadCurrentFileInfo(note.attributes[attribute.name], attribute.id, attribute.type);
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
				input.id = attribute.id;
				input.style.display = "none";
				input.setAttribute("accept", "image/*");

				var addButton = createInputButton();
				addButton.setAttribute("related-button-id", attribute.id);
				addButton.className += " " + UPLOAD_FILE_BUTTON;
				addButton.style.justifySelf = "right";
				addButton.onclick = function() 
				{
					var relatedButtonId = this.getAttribute("related-button-id");
					document.getElementById(relatedButtonId).click();
				}
				dataElement.appendChild(addButton);
				
				var gallery = createFormInput("div", attribute);
				gallery.className += " gallery twoCols";
				gallery.id = attribute.id + "-gallery";
				setElementSizeAtPage(gallery, attribute);
				gallery.style.justifySelf = attribute.alignment;
				dataElement.appendChild(gallery);

				if (note != null && note.attributes[attribute.name] != null)
				{
					note.attributes[attribute.name].forEach(function (item, index) {
						asyncDownloadImage(item, attribute.id, attribute.imagesSize);
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
									if (currentImages[k].getAttribute(CONTENT_ID) == response)
										showError("Image is already exists");
								}
	
								asyncDownloadImage(response, this.id, attribute.imagesSize)
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
				setFileSizeAttributes(input, attribute);
				input.id = attribute.id;
				input.style.display = "none";

				var addButton = createInputButton();
				addButton.setAttribute("related-button-id", attribute.id);
				addButton.className += " " + UPLOAD_FILE_BUTTON;
				addButton.style.justifySelf = "right";
				addButton.onclick = function() 
				{
					var relatedButtonId = this.getAttribute("related-button-id");
					document.getElementById(relatedButtonId).click();
				}
				dataElement.appendChild(addButton);

				var filesCollection = createFormInput("div", attribute);
				filesCollection.className += " files-collection twoCols";
				filesCollection.id = attribute.id + "-files";
				setElementSizeAtPage(filesCollection, attribute);
				filesCollection.style.justifySelf = attribute.alignment;
				filesCollection.setAttribute(FILES_COUNT, 0);
				appendNewSpanAligning(filesCollection, "№", "right");
				appendNewSpanAligning(filesCollection, "Title", "left");
				appendNewSpanAligning(filesCollection, "Type", "center");
				appendNewSpanAligning(filesCollection, "Size", "right");
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
	input.setAttribute(ATTRIBUTE_ID, attribute.id);
	return input;
}


function saveFile(file)
{
	var formData = new FormData();
	formData.append("file", file);

	return fetch(SERVER_ADDRESS + '/rest/file', {
		method: "POST",
		body: formData,
		headers: { "Accept": "application/json;charset=UTF-8" }
	})
	.then(response => { return (response.status === 200) ? response.text() : response.json(); });
}


function downloadMetadata(fileId)
{
	return fetch(SERVER_ADDRESS + "/rest/file/metadata/" + fileId, {
		method: "GET",
		headers: { "Accept": "application/json;charset=UTF-8", "Content-Type": "application/json;charset=UTF-8" }
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
		headers: { "Accept": "multipart/form-data", "Content-Type": "application/json;charset=UTF-8" }
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
			img.setAttribute(CONTENT_ID, fileId);
			img.setAttribute("src", file);
			img.style.display = "inline-flex";
			img.onclick = function()
			{
				var popup = document.createElement("div");
				popup.className += " popup";
				popup.onclick = function() { setTimeout(() => this.parentNode.removeChild(this), 0); }
				var popupImage = document.createElement("img");
				popupImage.setAttribute("related-img-id", img.id);
				popupImage.className += "poput-image";
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
			buttons.className += " icon-buttons";

			var download = document.createElement("a");
			download.id = inputId + "-" + fileId;
			download.className += " download-image ";
			download.href = "#";
			download.setAttribute(CONTENT_ID, fileId);
			download.onclick = function() 
			{
				downloadFile(this.getAttribute(CONTENT_ID))
				.then(data => {
					if (data)
						openDownloadPrompt(data, this.getAttribute("title"));
					else
						showError("Cannot download file");
				});
			}

			var remove = document.createElement("a");
			remove.className += " remove-image";
			remove.href = "#";
			remove.setAttribute("related-input-id", inputId + "-" + fileId);
			remove.onclick = function() 
			{ 
				setTimeout(() => {
					var toRemove = document.getElementById(this.getAttribute("related-input-id"));	
					toRemove.parentNode.removeChild(toRemove);
				}, 0
			)}

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
		headers: { "Accept": "application/json;charset=UTF-8", "Content-Type": "application/json;charset=UTF-8" }
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
	appendNewSpanAligning(filesCollection, number, "right");
	appendNewSpanAligning(filesCollection, metadata.title, "left");
	appendNewSpanAligning(filesCollection, metadata.contentType, "center");
	appendNewSpanAligning(filesCollection, metadata.size, "right");
	appendNewSpanAligning(filesCollection, moment(metadata.uploaded).format('LLL'), "center");

	var downloadButton = document.createElement("a");
	downloadButton.className += " download-image ";
	downloadButton.href = "#";
	downloadButton.setAttribute(CONTENT_ID, metadata.id);
	downloadButton.setAttribute("title", metadata.title);
	downloadButton.onclick = function() 
	{
		downloadFile(this.getAttribute(CONTENT_ID))
		.then(data => {
			if (data)
				openDownloadPrompt(data, this.getAttribute("title"));
			else
				showError("Cannot download file");
		});
	}
	filesCollection.appendChild(downloadButton);

	var deleteButton = document.createElement("span");
	deleteButton.className += " " + DELETE_BUTTON;
	deleteButton.setAttribute(CONTENT_ID, metadata.id);
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


function createNoteActionButtons(dataElement, id)
{
	var editHandler = function() { showCurrentContent() };
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

	addFormButtons(dataElement, id != null, saveHandler, editHandler);
}


function needToSkipAttributeInTable(attribute)
{
	return (!attribute.visible || isSkippableAttributeInNotesTable(attribute.type))
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


function updateNote(objectToSave, id)
{
	return fetch(SERVER_ADDRESS + '/rest/notes/' + getContentType() + "/" + id, {
		method: "PUT",
		body: JSON.stringify(objectToSave),
		headers:
		{
			"Accept": "text/plain;charset=UTF-8",
			"Content-Type": "application/json;charset=UTF-8"
		}
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

