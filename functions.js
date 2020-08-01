


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
		var attributeName = currentNode.getAttribute(ATTRIBUTE_NAME);
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
			else if (currentNode.value != null && currentNode.value.length > 0)
			{
				result[attributeName] = currentNode.value;
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


function saveMetaObjectInfo(formId, restUrl, afterSaveHandler)
{
    var form = document.getElementById(formId);
    var objectToSave = getMetaObjectFromForm(form);
    var id = form.getAttribute(CONTENT_ID);
    if (id)
        objectToSave.id = id;

    fetch(SERVER_ADDRESS + restUrl, {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(objectToSave),
        headers:
        {
            "Accept": "text/plain;charset=UTF-8",
            "Content-Type": "application/json;charset=UTF-8"
        }
    })
    .then(response => {
        if (response.status === 200)
			afterSaveHandler();
    })
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


function addNumberInputWithLabel(parent, attrName, labelText, inputId, min, max)
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