


/**
 * Shows all notes like 'Movies' or 'Games'
 */
async function showContentTableWithNotes(contentType, contentId)
{
	setContentType(contentType);
	setContentId(contentId);
	//drawHeader(name);
	switchToContent();
	createUpperButtonsForContent();

	fetch(SERVER_ADDRESS + '/rest/attributes/search?entityId=' + contentId)
	.then(response => response.json())
	.then(attributes => {
		fetch(SERVER_ADDRESS + '/rest/notes/' + contentType)
		.then(response => response.json())
		.then(notes => {
			getEmptyElement(DATA_ELEMENT);
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

	var addNoteButton = createInputButton("add-note-button");
	addNoteButton.value = "New note";
	addNoteButton.onclick = function() { showNoteForm(null, NOTE) };

	var addFolderButton = createInputButton("add-folder-button");
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
		var noteAttributes = note.attributes;

		var tr = document.createElement("tr");
		tr.className += " " + NOTE;
		tr.setAttribute(CONTENT_ID, note[ID]);

		//tr.appendChild(createTdWithIcon(NOTE_ICON));

		for (var j = 0; j < attributes.length; j++)
		{
			if (needToSkipAttributeInTable(attributes[j]))
				continue;

			var attribute = attributes[j];

			var td = document.createElement("td");
			td.style.textAlign = attribute.alignment;
			var attributeName = attribute.name;
			td.setAttribute(ATTRIBUTE_NAME, attributeName);

			switch(attribute.type)
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
					var format = attribute.dateFormat;
					var convertedTime = moment(time).format(format);
					td.innerHTML = convertedTime;
					break;
				case "checkbox":
					if (attribute.editableInTable)
					{
						var checkbox = document.createElement("input");
						checkbox.type = "checkbox";
						if (noteAttributes[attributeName] != null)
							checkbox.checked = isTrue(noteAttributes[attributeName]);
						checkbox.setAttribute(PREVIOUS_VALUE, checkbox.checked);
						
						checkbox.onchange = function()
						{
							var objectToSave = new Object();
							objectToSave[this.parentNode.getAttribute(ATTRIBUTE_NAME)] = this.checked;

							updateNote(objectToSave, this.parentNode.parentNode.getAttribute(CONTENT_ID))
							.then(response => {
								if (response.status != 200)
								{
									this.value = this.getAttribute(PREVIOUS_VALUE);
									this.style.backgroundColor = "red";
								}
								else
								{
									this.setAttribute(PREVIOUS_VALUE, this.value);
									this.style.backgroundColor = "green";
								}
							});
						}

						td.appendChild(checkbox);
					}
					else
					{
						td.innerText = valueOrEmptyString(noteAttributes[attributeName]);
					}
					break;
				case "select":
					if (attributes[j].editableInTable)
					{
						var select = document.createElement("select");
						addOptions(select, attribute.selectOptions);
						select.value = valueOrEmptyString(note.attributes[attribute.name]);
						select.setAttribute(PREVIOUS_VALUE, select.value);

						select.onchange = function()
						{
							var objectToSave = new Object();
							objectToSave[this.parentNode.getAttribute(ATTRIBUTE_NAME)] = this.value;

							updateNote(objectToSave, this.parentNode.parentNode.getAttribute(CONTENT_ID))
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
					numberTd.style.textAlign = attribute.alignment;
					tr.appendChild(numberTd);

					var incButton = createInputButton();
					incButton.setAttribute(ATTRIBUTE_NAME, attributeName);
					incButton.value = attribute.step > 0 ? "+" : "-";
					incButton.style.height = "20px";
					incButton.style.width = "20px";
					incButton.onclick = function()
					{
						var id = this.parentNode.parentNode.getAttribute(CONTENT_ID);
						var contentType = getContentType();

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

				case "file":
				case "image":
					if (noteAttributes[attributeName] == null)
						break;

					var download = document.createElement("a");
					download.href = "#";
					download.id = attribute.id + "-label";
					download.className += " download-image";
					download.setAttribute(FILE_ID, noteAttributes[attributeName]);
					download.style.margin = "auto";
					download.onclick = function()
					{
						var fileId = this.getAttribute(FILE_ID);
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
									a.setAttribute("download", this.getAttribute("title"));
									a.style.display = "none";
									document.body.appendChild(a);
									a.click();
									setTimeout(() => document.body.removeChild(a), 0);
								}
							});
						}
					};

					asyncSetTitleFromMetadata(noteAttributes[attributeName], download.id);

					td.appendChild(download);
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
	fetch(SERVER_ADDRESS + '/rest/notes/' + getContentType() + '/' + id, { method: "DELETE" })
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
		getEmptyElement(DATA_TABLE);
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

		switch (attribute.type)
		{
			case "select":
				var input = createFormInput("select", attribute);
				addOptions(input, attribute.selectOptions);
				input.value = getStringValueOrDefault(note, attribute);				
				dataElement.appendChild(input);
				break;

			case "multiselect":
				var input = createMultiselectWithCheckboxes(attribute.name, attribute.selectOptions);
				input.setAttribute(ATTRIBUTE_NAME, attribute.name);
				input.setAttribute(ATTRIBUTE_ID, attribute.id);

				if (note != null)
				{
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
				if (note != null)
					input.checked = isTrue(note.attributes[attribute.name]);
				else if (attribute.defaultValue != null)
					input.checked = isTrue(attribute.defaultValue);
				dataElement.appendChild(input);
				break;

			case "save time":
			case "update time":
				var input = createFormInput("span", attribute);
				
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

				dataElement.appendChild(input);
				break;
				
			case "user date":
				var input = createFormInput("input", attribute, "date");
				input.value = getStringValueOrDefault(note, attribute);
				dataElement.appendChild(input);
				break;

			case "user time":
				var input = createFormInput("input", attribute, "time");
				input.value = getStringValueOrDefault(note, attribute);
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
							}
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
								fetch(SERVER_ADDRESS + "/rest/file/" + newFileId + "/content")
								.then(response => {
									if (response.status === 200)
										return response.blob();
								})
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
	.then(response => {
		if (response.status === 200)
			return response.text()
		if (response === 500)
			return response.json();
	})
}


function downloadMetadata(fileId)
{
	return fetch(SERVER_ADDRESS + "/rest/file/" + fileId + "/metadata", {
		method: "GET",
		headers: { "Accept": "application/json;charset=UTF-8", "Content-Type": "application/json;charset=UTF-8" }
	})
	.then(response => response.json());
}


function asyncSetTitleFromMetadata(fileId, elementId)
{
	return downloadMetadata(fileId)
	.then(metadata => { document.getElementById(elementId).setAttribute("title", metadata.title); })
}


function asyncSetDownloadFromMetadata(fileId, elementId)
{
	return downloadMetadata(fileId)
	.then(metadata => { 
		document.getElementById(elementId).setAttribute("title", metadata.title);
	})
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
			//imageDiv.id = inputId + "-" + fileId; // duplicate id

			var file = window.URL.createObjectURL(downloadedImage);
			var img = document.createElement("img");
			img.setAttribute(CONTENT_ID, fileId);
			img.setAttribute("src", file);
			img.style.display = "inline-flex";
			img.onclick = function()
			{
				var popup = document.createElement("div");
				popup.className += " popup";
				popup.onclick = function() { setTimeout(() => this.parentNode.removeChild(this), 0); }
				var popupImage = document.createElement("img");
				popupImage.className += "poput-image";
				popupImage.onclick = function() { setTimeout(() => this.parentNode.parentNode.removeChild(this.parentNode), 0); }
				popup.appendChild(popupImage);

				fetch(SERVER_ADDRESS + "/rest/file/" + fileId + "/content")
				.then(response => {
					if (response.status === 200)
					{
						return response.blob();
					}
				})
				.then(originalImage => {
					if (originalImage)
					{
						var file = window.URL.createObjectURL(originalImage);
						popupImage.setAttribute("src", file);
						popupImage.style.display = "flex";
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
				fetch(SERVER_ADDRESS + "/rest/file/" + this.getAttribute(CONTENT_ID) + "/content")
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
						a.setAttribute("download", this.getAttribute("title"));
						a.style.display = "none";
						document.body.appendChild(a);
						a.click();
						setTimeout(() => document.body.removeChild(a), 0);
					}
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
			
			asyncSetDownloadFromMetadata(fileId, download.id);
		}
	});
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