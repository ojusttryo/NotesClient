


function showAttributes()
{
	showAttributesMenu();
	readAttributes(showAttributesHandler);    
    switchToContent();
}

function showAttributesMenu()
{
	var dataMenu = getEmptyElement(DATA_MENU);

	var addAttributeButton = document.createElement("input");
	addAttributeButton.type = "button";
	addAttributeButton.id = "add-attribute-button";
	addAttributeButton.value = "New attribute";
    addAttributeButton.onclick = function() 
    { 
        createAttributeForm(null);
        switchToAddEditForm();
    };

	dataMenu.appendChild(addAttributeButton);
}

function readAttributes(afterReadHandler)
{
    var url = SERVER_ADDRESS + '/rest/attributes';
	const init = { method: 'GET' };

    makeHttpRequest(url, init, afterReadHandler);
}

function showAttributesHandler(attributes)
{
	if (!attributes)
		return;

	var table = getEmptyElement(DATA_TABLE);
	table.appendChild(createAttributesTableHead());
	table.appendChild(createAttributesTableBody(attributes));
}

function createAttributesTableHead()
{
	var thead = document.createElement("thead");
	var tr = document.createElement("tr");

	appendNewTh(tr, "№");
    appendNewTh(tr, "Name");
    appendNewTh(tr, "Title");
	appendNewTh(tr, "");		// Edit
	appendNewTh(tr, "");		// Remove

	thead.appendChild(tr);

	return thead;
}

function createAttributesTableBody(attributes)
{
	var tbody = document.createElement("tbody");

	for (var i = 0; i < attributes.length; i++)
	{
		var tr = document.createElement("tr");
		tr.className = ATTRIBUTE;
		tr.setAttribute(CONTENT_ID, attributes[i].id);

		var number = document.createElement("td");
		number.innerText = i + 1;
		number.onclick = function() { showAttributeInfo(attributes[i].id); };
		tr.appendChild(number);

		var name = document.createElement("td");
		name.innerText = attributes[i].name;
		name.onclick = function() { showAttributeInfo(attributes[i].id); };
        tr.appendChild(name);
        
        var title = document.createElement("td");
        title.innerText = attributes[i].title;
        title.onclick = function() { showAttributeInfo(attributes[i].id); };
        tr.appendChild(title);

		var editButton = document.createElement("td");
		editButton.className = EDIT_BUTTON;
        editButton.onclick = function() 
        {
            createEditAttributeForm(this.parentNode.getAttribute(CONTENT_ID));
            switchToAddEditForm();
        };
		tr.appendChild(editButton);		

		var deleteButton = document.createElement("td");
		deleteButton.className = DELETE_BUTTON;
        deleteButton.onclick = function() 
        { 
            deleteAttribute(this.parentNode.getAttribute(CONTENT_ID), showAttributes);
        };
		tr.appendChild(deleteButton);

		tbody.appendChild(tr);
	}

	return tbody;
}


function deleteAttribute(id, deleteHandler)
{
    fetch(SERVER_ADDRESS + '/rest/attributes/' + id, { method: "DELETE" })
    .then(showAttributes());
}


function createEditAttributeForm(id)
{
    fetch(SERVER_ADDRESS + '/rest/attributes/search?id=' + id)
    .then(response => response.json())
    .then(attribute => {
        createAttributeForm(id, attribute);
        fillAttributeValuesOnForm(attribute);
    });
}


function createAttributeForm(attributeId)
{
    var dataElement = getEmptyElement(DATA_ELEMENT);
    var form = document.createElement("form");
    form.id = "attribute-form";
    if (attributeId)
        form.setAttribute(CONTENT_ID, attributeId);
    else if (form.hasAttribute(CONTENT_ID))
        form.removeAttribute(CONTENT_ID);

    addTextInputWithlabel(form, "name", "Name", "attribute-name");
    addTextInputWithlabel(form, "title", "Title", "attribute-title");
    addSelectWithLabel(form, "alignment", "Alignment", "attribute-alignment", [ "left", "right", "center" ]);
    addSelectWithLabel(form, "type", "Type", "attribute-type", [ "text", "textarea", "year", "int", "float", "select", "multiselect", "checkbox", "inc", "url"]);
    addTextInputWithlabel(form, "selectOptions", "Select options", "attribute-select-options");
    addBooleanInputWithLabel(form, "visible", "Visible in table", "attribute-visible", "visible");
    addBooleanInputWithLabel(form, "required", "Required", "attribute-required", "required");
    addNumberInputWithLabel(form, "linesCount", "Lines count", "attribute-lines-count", 1, 5);
    addSelectWithLabel(form, "method", "Method", "attribute-method", [ "none", "folder name", "avg", "count" ]);
    addTextInputWithlabel(form, "maxWidth", "Max width in table", "attribute-max-width");
    addTextInputWithlabel(form, "minWidth", "Min width in table", "attribute-min-width");
    addTextInputWithlabel(form, "max", "Max value/length", "attribute-max");
    addTextInputWithlabel(form, "min", "Min value/length", "attribute-min");
    addTextInputWithlabel(form, "defaultValue", "Default value", "attribute-default");
    addTextInputWithlabel(form, "regex", "Regular expression to check", "attribute-regex");

    addButton(form, attributeId ? "edit-attribute" : "save-attribute", attributeId ? "Edit attribute" : "Save attribute", function() { saveAttributeInfo(showAttributes) });

    dataElement.appendChild(form);
}


function fillAttributeValuesOnForm(attribute)
{
    document.getElementById("attribute-name").value = attribute["name"];
    document.getElementById("attribute-title").value = attribute["title"];
    document.getElementById("attribute-type").value = attribute["type"];
    document.getElementById("attribute-select-options").value = attribute["selectOptions"] != null ? attribute["selectOptions"].join("; ") : "";
    document.getElementById("attribute-visible").checked = attribute["visible"];
    document.getElementById("attribute-required").checked = attribute["required"];
    document.getElementById("attribute-alignment").value = attribute["alignment"];
    document.getElementById("attribute-method").value = attribute["method"];
    document.getElementById("attribute-max-width").value = attribute["maxWidth"];
    document.getElementById("attribute-min-width").value = attribute["minWidth"];
    document.getElementById("attribute-max").value = attribute["max"];
    document.getElementById("attribute-min").value = attribute["min"];
    document.getElementById("attribute-default").value = attribute["defaultValue"];
    document.getElementById("attribute-regex").value = attribute["regex"];
    document.getElementById("attribute-lines-count").value = attribute["linesCount"];    
    
    switch (attribute["type"])
    {
        case "text": 
            break;
        case "textarea": 
            document.getElementById("attribute-lines-count").visible = (attribute["type"] == "textarea"); 
            break;
        case "year":
            break;
        case "int":
            break;
        case "float":
            break;
        case "select":
            break;
        case "multiselect":
            break;
        case "checkbox":
            break;
        case "inc":
            break;
        case "url":
            break;
    }
}

function addTextInputWithlabel(parent, attrName, labelText, inputId)
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
    input.min = min;
    input.max = max;
    input.defaultValue = min;
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

function addButton(parent, buttonId, buttonValue, onclick)
{
    var input = document.createElement("input");
    input.type = "button";
    input.id = buttonId;
    input.value = buttonValue;
    input.onclick = onclick;

    parent.appendChild(input);
}


// TODO optimize later to not to reload all attributes. 
// But maybe it's necessary because there could be some edit request from another page.
// TODO maybe try to optimize by sending only changed fields.
function saveAttributeInfo(handler)
{
    var attributesUrl = SERVER_ADDRESS + '/rest/attributes';
    var form = document.getElementById("attribute-form");
    var id = form.getAttribute(CONTENT_ID);
    var objectToSave = getMetaObjectFromForm(form);
    if (id)
        objectToSave.id = id;
    
    const init = 
    {
        method: id ? "PUT" : "POST",                            // If there is id for attribute, it's already exist. So just PUT (update)
        body: JSON.stringify(objectToSave),
        headers:
        {
            "Accept": "text/plain;charset=UTF-8",               // Expect an id of the attribute
            "Content-Type": "application/json;charset=UTF-8"
        }
    };

    makeHttpRequest(attributesUrl, init, handler);
}
