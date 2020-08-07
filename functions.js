

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



function showCurrentContent()
{
	var content = document.getElementById(CONTENT);
	showContentTableWithNotes(content.getAttribute(CONTENT_TYPE), content.getAttribute(CONTENT_ID));
	switchToContent();
}


/** Switch view to content (menu buttons and data table), hiding the add/edit form */
function switchToContent()
{
	hideHtmlElementById(DATA_ELEMENT);
	hideHtmlElementById(HISTORY);
	showHtmlElementById(DATA_TABLE);
	showHtmlElementById(DATA_MENU);
}


/** Switch view to add/edit form, hiding menu buttons and data table */
function switchToAddEditForm()
{
	hideHtmlElementById(DATA_TABLE);
	hideHtmlElementById(DATA_MENU);
	hideHtmlElementById(HISTORY);
	showHtmlElementById(DATA_ELEMENT);
}


function switchToMainPage()
{
	hideHtmlElementById(DATA_ELEMENT);
	showHtmlElementById(HISTORY);
	hideHtmlElementById(DATA_TABLE);
	hideHtmlElementById(DATA_MENU);
}


/** Update visibility of content elements (buttons and data table) depending on rows count */
function updateContentTableVisibility()
{
	if (document.getElementById(DATA_TABLE).childNodes[1].childNodes.length > 0)
		showHtmlElementById(DATA_TABLE);
	else
		hideHtmlElementById(DATA_TABLE);
}


/**
 * Create the element with specified name, set inner text, and append element to the parent node
 * @param {String} elementName 
 * @param {Object} parentNode 
 * @param {String} innerText 
 */
function appendNewElement(elementName, parentNode, innerText)
{
	var element = document.createElement(elementName);
	element.innerText = innerText;
	parentNode.appendChild(element);
}


/**
 * Create new <th>, set inner text, and append element to the parent <tr>
 * @param {Object} tr - HTML element <tr>
 * @param {String} innerText - inner text of element
 */
function appendNewTh(tr, innerText)
{
	appendNewElement("th", tr, innerText);
}


/**
 * Create new <td>, set inner text, and append element to the parent <tr>
 * @param {*} tr - HTML element <tr>
 * @param {*} innerText - inner text of element
 */
function appendNewTd(tr, innerText)
{
	appendNewElement("td", tr, innerText);
}


/**
 * Gets the element from the document by id and clear it's content.
 * @param {String} id - id of HTML element 
 */
function getEmptyElement(id)
{
	var element = document.getElementById(id);
	while (element.lastChild)
		element.removeChild(element.lastChild);
	return element;
}


/**
 * Get meta object from the add/edit form
 * @param {Object} form - <form>, that contains requested data
 */
function getMetaObjectFromForm(form)
{
	var result = new Object();

	var allNodes = form.getElementsByTagName('*');
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
			if (currentNode.type && currentNode.type === 'checkbox')
			{
				result[attributeName] = currentNode.checked;
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
				result[attributeName] = array;
			}
			else if (currentNode.id == "attribute-select-options")
			{
				result[attributeName] = currentNode.value.split(";");
			}
			else if (currentNode.id != null && currentNode.id.toString().startsWith("checkboxes-"))
			{
				var checkboxes = currentNode.getElementsByTagName("input");
				result[attributeName] = new Array();
				for (var j = 0; j < checkboxes.length; j++)
				{
					if (checkboxes[j].getAttribute("attribute-id") != null && checkboxes[j].checked == true)
						result[attributeName].push(checkboxes[j].getAttribute("attribute-id"));
					else if (checkboxes[j].getAttribute("title") != null && checkboxes[j].checked == true)
						result[attributeName].push(checkboxes[j].getAttribute("title"));
				}
			}
			else if (attributeType && attributeType == "save time" || attributeType == "update time")
			{
				result[attributeName] = attributeValue ? parseInt(attributeValue) : Date.now();
			}
			// Probably this one might be replaced by default (the last one)
			else if (attributeType && attributeType == "user date")
			{
				result[attributeName] = currentNode.value;
			}
			else if (attributeType && attributeType == "file")
			{
				result[attributeName] = attributeValue;
			}
			else if (currentNode.value != null && currentNode.value.length > 0)
			{
				result[attributeName] = currentNode.value;
			}
		}
	}

	return result;
}



/**
 * Show HTML element by setting it's display property to "block"
 * @param {String} id - id of HTML element 
 */
function showHtmlElementById(id)
{
	document.getElementById(id).style.display = "block";
}


/**
 * Hide HTML element by setting it's display property to "none"
 * @param {String} id - id of HTML element
 */
function hideHtmlElementById(id)
{
	document.getElementById(id).style.display = "none";
}


function getSvgWithText(innerText, height, width)
{
	var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute("width", width);
	svg.setAttribute("height", height);

	var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
	text.setAttribute("fill", "black");
	text.setAttribute("text-anchor", "middle");
	text.setAttribute("dominant-baseline", "middle");
	text.textContent = innerText;
	text.setAttribute("x", "50%");
	text.setAttribute("y", "50%");

	svg.appendChild(text);

	return svg;
}


function addLeadingZeroIfLessThan10(number)
{
	return (number < 10) ? "0" + number.toString() : number.toString();
}


function createMultiselectWithCheckboxes(attrName, options)
{
	var multiselect = document.createElement("div");
	multiselect.className = "multiselect";

	var selectBox = document.createElement("div");
	selectBox.className = "selectBox";
	selectBox.setAttribute("attribute", attrName);	// not ATTRIBUTE_NAME, but "attribute", to extract this element from search when the object is being created from form
	selectBox.onclick = function() { showCheckboxes(this); };

	var select = document.createElement("select");
    select.onfocus = function() 
	{
		var children = this.parentNode.parentNode.childNodes;
		for (var i = 0; i < children.length; i++)
		{
			if (children[i].id.startsWith("checkboxes-"))
				children[i].style.display = "block";
		}
	}

	var option = document.createElement("option");
	option.innerText = "Select options...";
	select.appendChild(option);

	var overSelect = document.createElement("div");
	overSelect.className = "overSelect";

	selectBox.appendChild(select);
	selectBox.appendChild(overSelect);

	var checkboxes = document.createElement("div");
	checkboxes.setAttribute(ATTRIBUTE_NAME, attrName);
	checkboxes.id = "checkboxes-" + attrName;
	checkboxes.class = "checkboxes";
	checkboxes.style.display = "none";

	for (var i = 0; i < options.length; i++)
	{
		var optionId = attrName + i.toString()
		
		var label = document.createElement("label");
		label.setAttribute("for", optionId);
		
		var text = options[i].title != null ? options[i].title : options[i]
		var textNode = document.createTextNode(text);

		var input = document.createElement("input");
		input.type = "checkbox";
		input.setAttribute("title", text);
		input.id = optionId;
		if (options[i].id != null)
			input.setAttribute("attribute-id", options[i].id);
		
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
	checkboxes.style.display = checkboxes.style.display == "block" ? "none" : "block";
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


function saveMetaObjectInfo(formId, restUrl, afterSaveHandler)
{
    var form = document.getElementById(formId);
    var objectToSave = getMetaObjectFromForm(form);
    var id = form.getAttribute(CONTENT_ID);
    if (id)
        objectToSave.id = id;

	var errorLabel = document.getElementById("error-label");
    fetch(SERVER_ADDRESS + restUrl, {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(objectToSave),
        headers:
        {
            "Accept": "application/json;charset=UTF-8",
            "Content-Type": "application/json;charset=UTF-8"
        }
    })
    .then(response => {
		
		if (response.status === 200)
		{
			errorLabel.style.display = "none";
			afterSaveHandler();
		}
		else if (response.status == 500)
		{
			return response.json();

		}
	})
	.then(error => {
		if (error)
		{
			errorLabel.style.display = "block";
			errorLabel.innerText = error.message;
			errorLabel.focus();
		}
	});
}


/**
 * Adds to parent following HTML:
 * <label>[labelText]<input type="checkbox" attribute-name=[attrName] id=[inputId] value=[value]></label>
 */
function addBooleanInputWithLabel(parent, attrName, labelText, inputId, value)
{
    var label = document.createElement("label");
    label.innerText = labelText;

    var input = document.createElement("input");
    input.type = "checkbox";
    input.id = inputId;
    input.value = value;
    input.setAttribute(ATTRIBUTE_NAME, attrName);

    label.appendChild(input);
    parent.appendChild(label);
}


function addTextInputWithLabel(parent, attrName, labelText, inputId)
{
    var label = document.createElement("label");
    label.innerText = labelText;

    var input = document.createElement("input");
    input.type = "text";
    input.id = inputId;
	input.setAttribute(ATTRIBUTE_NAME, attrName);

    label.appendChild(input);
    parent.appendChild(label);
}


function addNumberInputWithLabel(parent, attrName, labelText, inputId)
{
    var label = document.createElement("label");
    label.innerText = labelText;

    var input = document.createElement("input");
    input.type = "number";
    input.id = inputId;
    input.setAttribute(ATTRIBUTE_NAME, attrName);

    label.appendChild(input);
    parent.appendChild(label);
}


function addSelectWithLabel(parent, attrName, labelText, inputId, options)
{
    var label = document.createElement("label");
    label.innerText = labelText;

    var select = document.createElement("select");
    select.id = inputId;
	select.setAttribute(ATTRIBUTE_NAME, attrName);

    var values = options.values();
    for (value of values)
    {
        var option = document.createElement("option");
        option.innerText = value;
        option.value = value;
        select.appendChild(option);
    }

    label.appendChild(select);
    parent.appendChild(label);
}


function addButton(parent, buttonId, buttonValue, onclick)
{
    var input = document.createElement("input");
    input.type = "button";
    input.id = buttonId;
    input.value = buttonValue;
    input.onclick = onclick;

    parent.appendChild(input);

    return input;
}


function createTdWithIcon(iconClassName)
{
	var icon = document.createElement("td");
	icon.className = iconClassName;
	return icon;
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

function showInputAndLabelIf(inputId, needToShow)
{
	//document.getElementById(inputId).parentNode.style.visibility = needToHide ? 'visible' : 'hidden';
	document.getElementById(inputId).parentNode.style.display = needToShow ? 'block' : 'none';
}

function valueOrEmptyString(value)
{
	return value ? value : "";
}

function isBoolean(value)
{
	return (value == "true" || value == "false");
}

