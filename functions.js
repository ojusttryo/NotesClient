

window.addEventListener('popstate', (event) => 
{
	console.log("location: " + document.location + ", state: " + JSON.stringify(event.state));
	handleRequest();
});



function handleRequest()
{
	console.log("redirect " + window.location.pathname);

	var pathname = window.location.pathname.startsWith('/') ? window.location.pathname.substring(1) : window.location.pathname;
	if (pathname == "")
	{
		loadMenu();
		showLog();
		switchToMainPage();
	}
	else
	{
		var path = pathname.split('/');
		switch (path[0])
		{
			case "log":
				loadMenu();
				showLog();
				switchToMainPage();
				break;

			case "entity":
				loadMenu();
				if (path[1] == null)
					showError("Wrong url");
				createEntityForm(path[1] == "new" ? null : path[1]);
				switchToAddEditForm();
				break;

			case "entities":
				loadMenu();
				switchToContent();
				showEntities();
				break;

			case "attribute":
				loadMenu();
				if (path[1] == null)
					showError("Wrong url");

				if (path[1] == "new")
					showAttributeForm(null);
				else
					createEditAttributeForm(path[1]);
				switchToAddEditForm();
				break;

			case "attributes":
				loadMenu();
				showAttributes();
				switchToContent();
				break;
				
			default:
				loadMenu()
				.then(() => {
					var entities = document.getElementById(MENU_LIST).getElementsByTagName("li");
					var contentType = path[0];
					var params = getParametersFromUrl();
					// All notes
					if (path[1] == null)
					{
						for (var e = 0; e < entities.length; e++)
						{
							if (entities[e].getAttribute(CONTENT_TYPE) == contentType)
							{
								var searchAttribute = params["searchAttribute"];
								var searchRequest = params["searchRequest"];
								if (searchAttribute != null && searchRequest != null)
									showSearchResult(searchAttribute, searchRequest, contentType);
								else
									showContentTableWithNotes(contentType); 
								return;
							}
						}
	
						showError("No such entity");
					}
					// One note (new or already existent)
					else
					{
						for (var e = 0; e < entities.length; e++)
						{
							if (entities[e].getAttribute(CONTENT_TYPE) == path[0])
							{
								var id = (path[1] == "new") ? null : path[1];
								showNoteForm(id, path[0], params["parentId"]);
								return;
							}
						}
	
						showError("No such entity or note");
					}
				});
				break;
		}
	}
}


/**
 * Load the left side menu of entities on onload event action.
 */
function loadMenu()
{
	return fetch(SERVER_ADDRESS + '/rest/entities')
	.then(response => response.json())
	.then(entities => {
		var menuList = getEmptyElement(MENU_LIST);

		for (var i = 0; i < entities.length; i++)
		{
			var title = entities[i].title;
			var name = entities[i].name;
			var li = document.createElement("li");
			li.setAttribute(CONTENT_TYPE, name);
			li.onclick = function() 
			{
				window.history.pushState("showContentTableWithNotes", "Notes", `/${this.getAttribute(CONTENT_TYPE)}`);
				showContentTableWithNotes(this.getAttribute(CONTENT_TYPE)); 
			};
			li.id = name + "-button";
			li.innerText = title;
			menuList.appendChild(li);

			if (!entities[i].visible)
				li.style.display = "none";
		}
	
		if (entities.length > 0)
		{
			menuList.appendChild(document.createElement("br"));
		}
	
		var attributesLi = document.createElement("li");
		attributesLi.innerText = "Attributes";
		attributesLi.onclick = function() 
		{
			pushAttributeTableState();
			showAttributes(); 
		};
		menuList.appendChild(attributesLi);
	
		var entitiesLi = document.createElement("li");
		entitiesLi.innerText = "Entities";
		entitiesLi.onclick = function() 
		{ 
			pushEntityTableState();
			showEntities(); 
		};
		menuList.appendChild(entitiesLi);

		var logLi = document.createElement("li");
		logLi.innerText = "Log";
		logLi.onclick = function() 
		{
			window.history.pushState("", "Log", "/log");
			showLog();
			switchToMainPage();
		};
		menuList.appendChild(logLi);
	});
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



function showCurrentContent(contentType)
{
	showContentTableWithNotes(contentType);
	switchToContent();
}


/** Switch view to content (menu buttons and data table), hiding the add/edit form */
function switchToContent()
{
	hideError();
	hideHtmlElementById(DATA_ELEMENT);
	hideHtmlElementById(HISTORY);
	showHtmlGridElementById(DATA_TABLE);
	showHtmlElement(DATA_MENU, "flex");
}


/** Switch view to add/edit form, hiding menu buttons and data table */
function switchToAddEditForm()
{
	hideError();
	hideHtmlElementById(DATA_TABLE);
	hideHtmlElementById(DATA_MENU);
	hideHtmlElementById(HISTORY);
	showHtmlGridElementById(DATA_ELEMENT);
}


function switchToMainPage()
{
	hideError();
	hideHtmlElementById(DATA_ELEMENT);
	showHtmlGridElementById(HISTORY);
	hideHtmlElementById(DATA_TABLE);
	hideHtmlElementById(DATA_MENU);
}


/** Update visibility of content elements (buttons and data table) depending on rows count */
function updateContentTableVisibility()
{
	if (document.getElementById(DATA_TABLE).childNodes[1].childNodes.length > 0)
		showHtmlGridElementById(DATA_TABLE);
	else
		hideHtmlElementById(DATA_TABLE);
}


function appendNewSpan(parent, innerText)
{
	return appendNewElement("span", parent, innerText);
}


function appendNewTd(parent, innerText)
{
	return appendNewElement("td", parent, innerText);
}


function appendNewElement(type, parent, innerText)
{
	var element = document.createElement(type);
	element.innerText = innerText;
	parent.appendChild(element);
	return element;
}


function appendNewSpanAligning(parent, innerText, alignment)
{
	var element = appendNewSpan(parent, innerText);
	element.style.justifySelf = alignment;
	element.style.textAlign = alignment;
	return element;
}


/**
 * Gets the element from the document by id and clear it's content.
 */
function getEmptyElement(id)
{
	var element = document.getElementById(id);
	clean(element);
	return element;
}


function clean(element)
{
	while (element.lastChild)
		element.removeChild(element.lastChild);
}


/**
 * Get meta object from the add/edit form
 */
function getMetaObjectFromForm(parent)
{
	var result = new Object();

	var keyAttribute = document.getElementsByClassName(SELECTED_KEY_ATTRIBUTE_IMAGE);
	if (keyAttribute != null && keyAttribute.length > 0)
		result["keyAttribute"] = getAttrNameForButtonInAttrList(keyAttribute[0]);
	
	var sortAttribute = document.querySelectorAll(`.${ASC_SORT_ATTRIBUTE_IMAGE},.${DESC_SORT_ATTRIBUTE_IMAGE}`);
	if (sortAttribute != null && sortAttribute.length > 0)
	{
		result["sortAttribute"] = getAttrNameForButtonInAttrList(sortAttribute[0]);
		result["sortDirection"] = (sortAttribute[0].classList.contains(ASC_SORT_ATTRIBUTE_IMAGE)) ? "ascending" : "descending";
	}

	var visibleAttributes = document.getElementsByClassName("selected-visible-attribute-image");
	if (visibleAttributes != null && visibleAttributes.length > 0)
	{
		result["visibleAttributes"] = [];
		for (var i = 0; i < visibleAttributes.length; i++)
			result["visibleAttributes"].push(getAttrNameForButtonInAttrList(visibleAttributes[i]));
	}

	var comparedAttributes = document.getElementsByClassName("selected-compared-attribute-image");
	if (comparedAttributes != null && comparedAttributes.length > 0)
	{
		result["comparedAttributes"] = [];
		for (var i = 0; i < comparedAttributes.length; i++)
			result["comparedAttributes"].push(getAttrNameForButtonInAttrList(comparedAttributes[i]));
	}

	var allNodes = parent.getElementsByTagName('*');
	for (var i = 0; i < allNodes.length; i++)
	{
		var currentNode = allNodes[i];
		if (currentNode.parentNode.style.display == "none")
			continue;

		var attributeName = currentNode.getAttribute(ATTRIBUTE_NAME);
		if (attributeName != null)
		{
			if (currentNode.tagName.toLowerCase() == 'table' && attributeName == "attributes")
			{
				result[attributeName] = [...currentNode.getElementsByTagName("tr")]
					.filter(x => x.style.display != "none")
					.map(x => x.getAttribute(ATTRIBUTE_NAME))
					.filter(x => x != null);
			}
			else if (currentNode.type == 'checkbox')
				result[attributeName] = currentNode.checked;
			else if (currentNode.id == "attribute-select-options")
				result[attributeName] = currentNode.value.split(";");
			else if (currentNode.id == "attribute-images-size")
				result[attributeName] = currentNode.value.substr(0, currentNode.value.indexOf("x"));
			else if (currentNode.value != null && currentNode.value.length > 0)
				result[attributeName] = currentNode.value;
			else if (currentNode.required)
				showError("Required value is not set (" + attributeName + ")");
		}
	}

	return result;
}



function getNoteFromForm(parent)
{
	var result = new Object();

	var allNodes = parent.getElementsByTagName('*');
	for (var i = 0; i < allNodes.length; i++)
	{
		var currentNode = allNodes[i];
		if (currentNode.parentNode.style.display == "none")
			continue;

		var attributeName = currentNode.getAttribute(ATTRIBUTE_NAME);
		var attributeType = currentNode.getAttribute(ATTRIBUTE_TYPE);
		var attributeValue = currentNode.getAttribute(ATTRIBUTE_VALUE);
		if (attributeName != null)
		{
			if (currentNode.type == 'checkbox')
				result[attributeName] = currentNode.checked;
			else if (currentNode.id != null && currentNode.id.toString().startsWith("checkboxes-"))
			{
				var checkboxes = currentNode.getElementsByTagName("input");
				result[attributeName] = new Array();
				for (var j = 0; j < checkboxes.length; j++)
				{
					if (checkboxes[j].getAttribute(ATTRIBUTE_NAME) != null && checkboxes[j].checked == true)
						result[attributeName].push(checkboxes[j].getAttribute(ATTRIBUTE_NAME));
					else if (checkboxes[j].getAttribute("title") != null && checkboxes[j].checked == true)
						result[attributeName].push(checkboxes[j].getAttribute("title"));
				}
			}
			else if (attributeType && isFile(attributeType) && attributeValue && attributeValue.length > 0)
				result[attributeName] = attributeValue;
			else if (attributeType && attributeType == "gallery")
			{
				var images = currentNode.getElementsByTagName("img");
				result[attributeName] = new Array();
				for (var j = 0; j < images.length; j++)
					result[attributeName].push(images[j].getAttribute(FILE_ID));
			}
			else if (attributeType && attributeType == "files")
			{
				var buttons = currentNode.getElementsByClassName(DELETE_BUTTON);
				var identifiers = [...buttons].map(x => x.getAttribute(FILE_ID));
				result[attributeName] = identifiers;
			}
			else if (attributeType && (attributeType == "inc" || attributeType == "number"))
			{
				var value = currentNode.value.trim();
				var number = value.length > 0 ? parseFloat(value) : null;
				result[attributeName] = number;
			}
			else if (currentNode.value != null && currentNode.value.length > 0)
				result[attributeName] = currentNode.value;
			else if (currentNode.required)
				showError("Required value is not set (" + attributeName + ")");
		}
	}

	return result;
}



/**
 * Show HTML element by setting it's display property to "block"
 */
function showHtmlElementById(id)
{
	document.getElementById(id).style.display = "block";
}

function showHtmlElement(id, displayType)
{
	document.getElementById(id).style.display = displayType;
}


function showHtmlGridElementById(id)
{
	document.getElementById(id).style.display = "grid";
}


/**
 * Hide HTML element by setting it's display property to "none"
 */
function hideHtmlElementById(id)
{
	document.getElementById(id).style.display = "none";
}


function addLeadingZeroIfLessThan10(number)
{
	return (number < 10) ? "0" + number.toString() : number.toString();
}


function createMultiselectWithCheckboxes(attrName, options)
{
	var multiselect = document.createElement("div");
	multiselect.classList.add("multiselect");
	multiselect.classList.add(DO_NOT_STRETCH);

	var selectBox = document.createElement("div");
	selectBox.classList.add("selectBox");
	selectBox.classList.add(DO_NOT_STRETCH);
	selectBox.setAttribute("attribute", attrName);
	selectBox.onclick = function() { showCheckboxes(this); };

	var select = document.createElement("select");
    select.onfocus = function() 
	{
		var children = this.parentNode.parentNode.childNodes;
		for (var i = 0; i < children.length; i++)
		{
			if (children[i].id.startsWith("checkboxes-"))
				children[i].style.display = "grid";
		}
	}

	var option = document.createElement("option");
	option.innerText = "Select options...";
	select.appendChild(option);

	var overSelect = document.createElement("div");
	overSelect.classList.add("overSelect");

	selectBox.appendChild(select);
	selectBox.appendChild(overSelect);

	var checkboxes = document.createElement("div");
	checkboxes.setAttribute(ATTRIBUTE_NAME, attrName);
	checkboxes.id = "checkboxes-" + attrName;
	checkboxes.class = "checkboxes";
	checkboxes.style.display = "none";

	for (var i = 0; i < options.length; i++)
	{
		var optionId = attrName + i.toString();
		
		var label = document.createElement("label");
		label.setAttribute("for", optionId);
		
		var text = options[i].title != null ? options[i].title : options[i]
		var textNode = document.createTextNode(text);

		var input = document.createElement("input");
		input.type = "checkbox";
		input.setAttribute("title", text);
		input.id = optionId;
		if (options[i].id != null)
			input.setAttribute(ATTRIBUTE_NAME, options[i].name);
		
		label.appendChild(input);
		label.appendChild(textNode);

		checkboxes.appendChild(label);
	}

	multiselect.appendChild(selectBox);
	multiselect.appendChild(checkboxes);

	return multiselect;
}


function showCheckboxes(selectBox)
{
	var attrName = selectBox.getAttribute("attribute");
	var checkboxes = document.getElementById("checkboxes-" + attrName);
	checkboxes.style.display = checkboxes.style.display == "grid" ? "none" : "grid";
}


function saveMetaObjectInfo(restUrl, afterSaveHandler)
{
    var dataElement = document.getElementById(DATA_ELEMENT);
	var objectToSave = getMetaObjectFromForm(dataElement);
	var name = dataElement.getAttribute(CONTENT_ID);
    if (name)
        objectToSave.name = name;

    fetch(SERVER_ADDRESS + restUrl, {
        method: name ? "PUT" : "POST",
        body: JSON.stringify(objectToSave),
        headers: { "Accept": APPLICATION_JSON, "Content-Type": APPLICATION_JSON }
    })
    .then(response => {
		
		if (response.status === 200)
		{
			hideError();
			afterSaveHandler();
		}
		else if (response.status == 500)
		{
			return response.json();
		}
	})
	.then(error => {
		if (error)
			showError(error.message);
	});
}


function addInputWithLabel(type, stretch, parent, attrName, labelText, inputId)
{
    var input = document.createElement("input");
    input.type = type;
    input.id = inputId;
	input.setAttribute(ATTRIBUTE_NAME, attrName);
	if (!stretch)
		input.classList.add(DO_NOT_STRETCH);

	var label = document.createElement("label");
	label.innerText = labelText;
	label.id = inputId + "-label";
	label.setAttribute("for", input.id);

	parent.appendChild(label);
    parent.appendChild(input);    
}


function addSelectWithLabel(parent, attrName, labelText, inputId, options)
{
    var select = document.createElement("select");
    select.id = inputId;
	select.setAttribute(ATTRIBUTE_NAME, attrName);
	select.classList.add(DO_NOT_STRETCH);

	addOptions(select, options);

    var label = document.createElement("label");
	label.innerText = labelText;
	label.setAttribute("for", inputId);

	parent.appendChild(label);
    parent.appendChild(select);
}


function addButton(parent, buttonId, buttonValue, onclick)
{
    var input = createInputButton(buttonId);
	input.value = buttonValue;
	input.style.display = "grid";
	input.classList.add(DO_NOT_STRETCH);
    input.onclick = onclick;

    parent.appendChild(input);

    return input;
}


function showInputAndLabelIf(inputId, needToShow)
{
	document.getElementById(inputId).previousSibling.style.display = needToShow ? 'grid' : 'none';
	document.getElementById(inputId).style.display = needToShow ? 'grid' : 'none';
}

function valueOrEmptyString(value)
{
	return value ? value : "";
}


function isTrue(value)
{
	return (value != null && value === "true") || (typeof value === 'boolean' && value == true);
}


/**
 * Converts array like [ { "a": 5 }, { "b": "c" } ] to object { "a": 5, "b": "c" }
 */
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


function convertObjectToArray(attributes)
{
	var array = [];
	for (var property in attributes)
	{
		array[property] = attributes[property];
	}
	return array;
}


function addOptions(select, options)
{
	for (var value of options)
	{
		var splittedValue = value.split("=");
		var option = document.createElement("option");
		option.innerText = splittedValue[0];
		option.value = splittedValue[0];
		select.appendChild(option);
	}
}

function showError(message)
{
	if (message)
	{
		var errorLabel = document.getElementById("error-label");
		errorLabel.style.display = "inline-grid";
		errorLabel.innerText = message;
		errorLabel.focus();

		throw message;
	}
}

function hideError()
{
	var errorLabel = document.getElementById("error-label");
	if (errorLabel)
		errorLabel.style.display = "none";
}


function addFormButtons(parent, isNewObject, saveHandler, cancelHandler)
{
	var buttons = document.createElement("div");
	buttons.classList.add("objectButtons");
	buttons.classList.add(TWO_COLS);
	var saveButton = addButton(buttons, "save-button", isNewObject ? "Edit" : "Save", saveHandler);
    addButton(buttons, "cancel-button", "Cancel", cancelHandler);
	parent.appendChild(buttons);
	
	return buttons;
}

function createInputButton(id)
{
	var button = document.createElement("input");
	button.type = "button";
	if (id)
		button.id = id;
	return button;
}

function setContentColumnsCount(count)
{
	document.documentElement.style.setProperty("--tableColumnsCount", count);
}


function changeImageClass(element, from, to)
{
	if (element.classList.contains(from))
	{
		element.classList.remove(from);
		element.style.backgroundImage = "";
	}

	if (!element.classList.contains(to))
	{
		setImageClass(element, to);
	}
}


function changeImageClassToOpposite(element, class1, class2)
{
	if (!element.classList.contains(class1) && !element.classList.contains(class2))
		return;

	var currentClass = element.classList.contains(class1) ? class1 : class2;
	changeImageClass(element, currentClass, (currentClass == class1) ? class2 : class1);
}


function changeImageClassForHiddenElements(from, to)
{
	var elements = document.getElementsByClassName(from);
	if (elements != null)
	{
		for (var i = 0; i < elements.length; i++)
		{
			if (elements[i].offsetParent === null)
				changeImageClass(elements[i], from, to);
		}
	}
}


function getAttrNameForButtonInAttrList(button)
{
	return button.parentNode.parentNode.getAttribute(ATTRIBUTE_NAME);
}


function setImageClass(element, newClass, hasMargin)
{
	if (!element.classList.contains(IMAGE_ICON))
		element.classList.add(IMAGE_ICON);

	if (element.classList.contains(newClass))
		return;	

	element.classList.add(newClass);

	var url = `url(img/${newClass.replace("-image", "")}.svg)`;
	element.style.backgroundImage = url.replaceAll("-", "");

	if (hasMargin)
	{
		element.style.marginLeft = "5px";
		element.style.marginRight = "5px";
	}
}

function pushNoteState(id, contentType, parentId)
{
	var url = id ? `/${contentType}/${id}` : `/${contentType}/new`;
	if (!parentId || parentId == "undefined")
		window.history.pushState("showNoteForm", "Note", url);
	else
		window.history.pushState("showNoteForm", "Note", url + "?parentId=" + parentId);
}

function pushNoteTableState(contentType)
{
	window.history.pushState("showNotesTable", "Notes", `/${contentType}`);
}

function pushEntityTableState()
{
	window.history.pushState("", "Entities", "/entities");
}

function pushEntityState(entityName)
{
	var entity = entityName ? entityName : "new";
	window.history.pushState("entity", "Entity", "/entity/" + entity);
}

function pushAttributeTableState()
{
	window.history.pushState("", "Attributes", "/attributes");
}

function pushAttributeState(attributeName)
{
	var attr = attributeName ? attributeName : "new";
	window.history.pushState("attribute", "Attribute", "/attribute/" + attr);
}

function getParametersFromUrl() 
{
    var result = new Object();
    var tmp = [];
    var items = location.search.substr(1).split("&");
	for (var i = 0; i < items.length; i++)
	{
		tmp = items[i].split("=");
		result[tmp[0]] = decodeURIComponent(tmp[1]);
    }
    return result;
}