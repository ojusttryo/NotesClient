



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
function setContentType(name)
{
	document.getElementById(CONTENT).setAttribute(CONTENT_TYPE, name);
}


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
 * Get note or folder from the add/edit form
 * @param {Object} form - <form>, that contains inputs with note/folder attributes
 */
function getObjectFromForm(form)
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