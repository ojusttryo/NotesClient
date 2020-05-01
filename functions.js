

async function makeHttpRequest(url, init, handlers)
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

	// Processing chain of handlers
	if (response.ok && handlers)
	{
		if (typeof handlers === 'function')
		{
			handlers(init.method == "GET" ? json : null);
		}
		else
		{
			var handler = handlers.shift();
			handler(init.method == "GET" ? json : null, handlers);
		}
	}

	return (response.ok) ? json : null;
}


function showCurrentContent()
{
	var content = document.getElementById(CONTENT);
	showContent(content.getAttribute(CONTENT_TYPE), content.getAttribute(CONTENT_ID));
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
 * Set the attribute content-type to the content div.
 * @param {String} name - name of the content 
 */
//function setContentType(name)
//{
//	document.getElementById(CONTENT).setAttribute(CONTENT_TYPE, name);
//}

//function setContentId(contentId)
//{
//	document.getElementById(CONTENT).setAttribute(CONTENT_ID, contentId);
//}


/**
 * Get the type of content currently displayer on the screen
 */
function getContentType()
{
	return document.getElementById(CONTENT).getAttribute(CONTENT_TYPE);
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
			else if (currentNode.value.length > 0)
			{
				result[attributeName] = currentNode.value;
			}
		}
	}

	return result;
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

			result.push(attribute);
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