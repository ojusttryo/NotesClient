


function showAttributes()
{
    showAttributesMenu();
    switchToContent();

    fetch(SERVER_ADDRESS + '/rest/attributes')
    .then(response => response.json())
    .then(attributes => {
        if (!attributes)
		    return;

        var table = getEmptyElement(DATA_TABLE);
        table.appendChild(createAttributesTableHead());
        table.appendChild(createAttributesTableBody(attributes));
    })
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


function createAttributesTableHead()
{
	var thead = document.createElement("thead");
	var tr = document.createElement("tr");

	appendNewTh(tr, "№");
    appendNewTh(tr, "Name");
    appendNewTh(tr, "Title");
    appendNewTh(tr, "Type");
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
		tr.className += " " + ATTRIBUTE;
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

        var type = document.createElement("td");
        type.innerText = attributes[i].type;
        type.onclick = function() { showAttributeInfo(attributes[i].id); };
        tr.appendChild(type);

		var editButton = document.createElement("td");
		editButton.className += " " + EDIT_BUTTON;
        editButton.onclick = function() 
        {
            createEditAttributeForm(this.parentNode.getAttribute(CONTENT_ID));
            switchToAddEditForm();
        };
		tr.appendChild(editButton);		

		var deleteButton = document.createElement("td");
		deleteButton.className += " " + DELETE_BUTTON;
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
    .then(response => {
        if (response.status === 200)
            showAttributes();
    });
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

    createErrorLabel(dataElement);

    if (attributeId)
        setContentId(attributeId);
    else
        clearContentId();

    var alignments = [ "left", "right", "center" ];
    var types = [ "text", "textarea", "number", "select", "multiselect", "checkbox", "inc", "url", "save time", "update time", "user date", "user time", "file" ];
    var methods = [ "none", "folder name", "avg", "count" ];

    addInputWithLabel("text",     true,  dataElement, "title",           "Title",                       "attribute-title");
    addInputWithLabel("text",     true,  dataElement, "name",            "Name (unique)",               "attribute-name");    
    addSelectWithLabel(dataElement, "alignment", "Alignment", "attribute-alignment", alignments);
    addSelectWithLabel(dataElement, "type", "Type", "attribute-type", types);   
    addInputWithLabel("text",     true,  dataElement, "selectOptions",   "Select options",              "attribute-select-options");
    addInputWithLabel("text",     false, dataElement, "dateFormat",      "Date format",                 "attribute-date-format");
    addInputWithLabel("checkbox", false, dataElement, "visible",         "Visible in table",            "attribute-visible");
    addInputWithLabel("checkbox", false, dataElement, "required",        "Required",                    "attribute-required");
    addInputWithLabel("checkbox", false, dataElement, "editableInTable", "Editable in table",           "attribute-editable-in-table");
    addInputWithLabel("number",   false, dataElement, "linesCount",      "Lines count",                 "attribute-lines-count");
    addSelectWithLabel(dataElement, "method", "Method", "attribute-method", methods);
    addInputWithLabel("text",     false, dataElement, "maxWidth",        "Max width in table",          "attribute-max-width");
    addInputWithLabel("text",     false, dataElement, "minWidth",        "Min width in table",          "attribute-min-width");
    addInputWithLabel("text",     false, dataElement, "max",             "Max value/length",            "attribute-max");
    addInputWithLabel("text",     false, dataElement, "min",             "Min value/length",            "attribute-min");
    addInputWithLabel("text",     true,  dataElement, "defaultValue",    "Default value",               "attribute-default");
    addInputWithLabel("number",   false, dataElement, "step",            "Step",                        "attribute-step");
    addInputWithLabel("text",     true,  dataElement, "regex",           "Regular expression to check", "attribute-regex");

    var saveHandler = function() { saveMetaObjectInfo(DATA_ELEMENT, "/rest/attributes", showAttributes) };
    var cancelHandler = function() { showAttributes() };
    addFormButtons(dataElement, attributeId != null, saveHandler, cancelHandler);

    // When changing the type other fields may become excess
    document.getElementById("attribute-type").onchange = function() 
    {
        var type = document.getElementById("attribute-type").value;
        showInputAndLabelIf("attribute-select-options", hasOptions(type));
        showInputAndLabelIf("attribute-lines-count", (type == "textarea"));
        showInputAndLabelIf("attribute-max", isTextual(type) || isNumeric(type));
        showInputAndLabelIf("attribute-min", isTextual(type) || isNumeric(type));
        showInputAndLabelIf("attribute-step", isNumeric(type));
        showInputAndLabelIf("attribute-regex", isTextual(type) || isNumeric(type));
        showInputAndLabelIf("attribute-editable-in-table", (type == "select" || type == "inc"));
        showInputAndLabelIf("attribute-date-format", hasDateFormat(type));
        showInputAndLabelIf("attribute-default", (isTextual(type) || isNumeric(type) || hasOptions(type) || type == "checkbox" || type == "url"));
        showInputAndLabelIf("attribute-required", !hasDateFormat(type) || type == "multiselect" || type == "checkbox");
        showInputAndLabelIf("attribute-visible", !isSkippableAttributeInNotesTable(type));
    }
    document.getElementById("attribute-type").onchange();
    /*
    var dateFormat = document.getElementById("attribute-date-format").parentNode;
    var formatHref = document.createElement("a");
    formatHref.href = "https://momentjs.com/";
    formatHref.text = " examples ";
    formatHref.target = "_blank";
    dateFormat.insertBefore(formatHref, dateFormat.firstChild.nextSibling);
    */
}


function fillAttributeValuesOnForm(attribute)
{
    document.getElementById("attribute-name").value = attribute["name"];
    document.getElementById("attribute-title").value = attribute["title"];
    document.getElementById("attribute-type").value = attribute["type"];
    document.getElementById("attribute-select-options").value = attribute["selectOptions"] != null ? attribute["selectOptions"].join("; ") : "";
    if (attribute["dateFormat"] != null)
        document.getElementById("attribute-date-format").value = attribute["dateFormat"];
    document.getElementById("attribute-visible").checked = attribute["visible"];
    document.getElementById("attribute-required").checked = attribute["required"];
    document.getElementById("attribute-editable-in-table").checked = attribute["editableInTable"];
    document.getElementById("attribute-alignment").value = attribute["alignment"];
    document.getElementById("attribute-method").value = attribute["method"];
    document.getElementById("attribute-max-width").value = attribute["maxWidth"];
    document.getElementById("attribute-min-width").value = attribute["minWidth"];
    document.getElementById("attribute-max").value = attribute["max"];
    document.getElementById("attribute-min").value = attribute["min"];
    document.getElementById("attribute-default").value = attribute["defaultValue"];
    document.getElementById("attribute-step").value = attribute["step"];
    document.getElementById("attribute-regex").value = attribute["regex"];
    document.getElementById("attribute-lines-count").value = attribute["linesCount"];

    document.getElementById("attribute-type").onchange();
}


function isSkippableAttributeInNotesTable(type)
{
    return (type == "textarea" || type == "multiselect" || type == "url" || type == "file");
}

function hasDateFormat(type)
{
    return (type == "save time" || type == "update time");
}

function hasOptions(type)
{
    return (type == "select" || type == "multiselect");
}

function isTextual(type)
{
    return (type == "text" || type == "textarea");
}

function isNumeric(type)
{
    return (type == "number" || type == "inc");
}