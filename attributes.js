


function showAttributes()
{
    showAttributesMenu();
    switchToContent();

    fetch(SERVER_ADDRESS + '/rest/attributes')
    .then(response => response.json())
    .then(attributes => {
        if (!attributes)
		    return;

        window.history.pushState("", "Attributes", "/attributes");

        var table = getEmptyElement(DATA_TABLE);
        createAttributesTableHead(table);
        createAttributesTableBody(table, attributes);
    })
}

function showAttributesMenu()
{
	var dataMenu = getEmptyElement(DATA_MENU);

	var addAttributeButton = createInputButton();
	addAttributeButton.value = "New attribute";
    addAttributeButton.onclick = function() 
    { 
        createAttributeForm(null);
        switchToAddEditForm();
    };

	dataMenu.appendChild(addAttributeButton);
}


function createAttributesTableHead(table)
{
    setContentColumnsCount(4);      // 4 - without buttons

	appendNewSpan(table, "№");
    appendNewSpan(table, "Title");
    appendNewSpan(table, "Name");
    appendNewSpan(table, "Type");
	appendNewSpan(table, "");		// Edit
	appendNewSpan(table, "");		// Remove
}

function createAttributesTableBody(table, attributes)
{
	for (var i = 0; i < attributes.length; i++)
	{
        appendNewSpan(table, (i + 1).toString());
        appendNewSpan(table, attributes[i].title);
        appendNewSpan(table, attributes[i].name);
        appendNewSpan(table, attributes[i].type);

		var editButton = document.createElement("td");
        editButton.className += " " + EDIT_BUTTON;
        editButton.setAttribute(ATTRIBUTE_NAME, attributes[i].name);
        editButton.onclick = function() 
        {
            createEditAttributeForm(this.getAttribute(ATTRIBUTE_NAME));
            switchToAddEditForm();
        };
		table.appendChild(editButton);		

		var deleteButton = document.createElement("td");
        deleteButton.className += " " + DELETE_BUTTON;
        deleteButton.setAttribute(ATTRIBUTE_NAME, attributes[i].name);
        deleteButton.onclick = function() 
        {
            var result = confirm("Delete attribute?");
            if (result)
                deleteAttribute(this.getAttribute(ATTRIBUTE_NAME));
        };
		table.appendChild(deleteButton);
	}
}


function deleteAttribute(name)
{
    fetch(SERVER_ADDRESS + '/rest/attributes/' + name, { method: "DELETE" })
    .then(response => {
        if (response.status === 200)
            showAttributes();
    });
}


function createEditAttributeForm(name)
{
    fetch(SERVER_ADDRESS + '/rest/attributes/search?name=' + name)
    .then(response => response.json())
    .then(attribute => {
        createAttributeForm(name);
        fillAttributeValuesOnForm(attribute);
    });
}


function createAttributeForm(attributeName)
{
    var dataElement = getEmptyElement(DATA_ELEMENT);

    createErrorLabel(dataElement);

    if (attributeName)
    {
        setContentId(attributeName);
        window.history.pushState("", "Attribute", "/attributes/" + attributeName);
    }
    else
    {
        window.history.pushState("", "Attribute", "/attribute");
        clearContentId();
    }

    var alignments = [ "left", "right", "center" ];
    var types = [ "row number", "text", "textarea", "delimited text", "number", "select", "multiselect", "checkbox", "inc", "url", 
        "save time", "update time", "user date", "user time", "file", "image", "files", "gallery", "related notes", "nested notes", "compared notes"];
    var methods = [ "none", "folder name", "avg", "count" ];
    var imageSizes = [ "50x50", "100x100", "200x200" ];

    addInputWithLabel("text",     true,  dataElement, "title",           "Title",                       "attribute-title");
    addInputWithLabel("text",     true,  dataElement, "name",            "Name (unique)",               "attribute-name");    
    addSelectWithLabel(dataElement, "type", "Type", "attribute-type", types);   
    addInputWithLabel("text",     true,  dataElement, "selectOptions",   "Select options",              "attribute-select-options");
    addInputWithLabel("text",     false, dataElement, "dateFormat",      "Date format",                 "attribute-date-format");
    addSelectWithLabel(dataElement, "entity", "Entity", "attribute-entity", []);
    addSelectWithLabel(dataElement, "alignment", "Alignment", "attribute-alignment", alignments);
    addInputWithLabel("checkbox", false, dataElement, "visible",         "Visible in table",            "attribute-visible");
    addInputWithLabel("checkbox", false, dataElement, "required",        "Required",                    "attribute-required");
    addInputWithLabel("checkbox", false, dataElement, "editableInTable", "Editable in table",           "attribute-editable-in-table");
    addInputWithLabel("number",   false, dataElement, "linesCount",      "Lines count",                 "attribute-lines-count");
    addSelectWithLabel(dataElement, "method", "Method", "attribute-method", methods);
    addSelectWithLabel(dataElement, "imagesSize", "Images size", "attribute-images-size", imageSizes);
    addInputWithLabel("text",     false, dataElement, "maxWidth",        "Max width in table",          "attribute-max-width");
    addInputWithLabel("text",     false, dataElement, "minWidth",        "Min width in table",          "attribute-min-width");
    addInputWithLabel("text",     false, dataElement, "maxHeight",       "Max height at page",          "attribute-max-height");
    addInputWithLabel("text",     false, dataElement, "minHeight",       "Min height at page",          "attribute-min-height");
    addInputWithLabel("text",     false, dataElement, "max",             "Max value/length/size",       "attribute-max");
    addInputWithLabel("text",     false, dataElement, "min",             "Min value/length/size",       "attribute-min");
    addInputWithLabel("text",     true,  dataElement, "defaultValue",    "Default value",               "attribute-default");
    addInputWithLabel("number",   false, dataElement, "step",            "Step",                        "attribute-step");
    addInputWithLabel("text",     true,  dataElement, "regex",           "Regular expression to check", "attribute-regex");
    addInputWithLabel("text",     false, dataElement, "delimiter",       "Delimiter",                   "attribute-delimiter");

    var saveHandler = function() { saveMetaObjectInfo(DATA_ELEMENT, "/rest/attributes", showAttributes) };
    var cancelHandler = function() { showAttributes() };
    addFormButtons(dataElement, attributeName != null, saveHandler, cancelHandler, attributeName);
    
    document.getElementById("attribute-date-format").placeholder = "https://momentjs.com/";

    // Changing the type of attribute, other fields may become excess
    document.getElementById("attribute-type").onchange = function() 
    {
        var type = document.getElementById("attribute-type").value;
        showInputAndLabelIf("attribute-select-options", hasOptions(type));
        showInputAndLabelIf("attribute-lines-count", type == "textarea");
        showInputAndLabelIf("attribute-images-size", type == "gallery");
        showInputAndLabelIf("attribute-max-width", type != "file" && !isMultifile(type) && isNotesList(type));
        showInputAndLabelIf("attribute-min-width", type != "file" && !isMultifile(type) && isNotesList(type));
        showInputAndLabelIf("attribute-max-height", isSizableOnForm(type));
        showInputAndLabelIf("attribute-min-height", isSizableOnForm(type));
        showInputAndLabelIf("attribute-max", isTextual(type) || isNumeric(type) || isFile(type) || isMultifile(type));
        showInputAndLabelIf("attribute-min", isTextual(type) || isNumeric(type) || isFile(type) || isMultifile(type));
        showInputAndLabelIf("attribute-step", isNumeric(type));
        showInputAndLabelIf("attribute-regex", type == "text" || type == "textarea");
        showInputAndLabelIf("attribute-editable-in-table", (type == "select" || type == "inc" || type == "checkbox"));
        showInputAndLabelIf("attribute-date-format", hasDateFormat(type));
        showInputAndLabelIf("attribute-default", (isTextual(type) || isNumeric(type) || hasOptions(type) || type == "checkbox" || type == "url"));
        showInputAndLabelIf("attribute-required", isTextual(type) || isNumeric(type) || type == "select" || isFile(type) || type == "url" || isUserDateOrTime(type));
        showInputAndLabelIf("attribute-visible", !isSkippableAttributeInNotesTable(type));
        showInputAndLabelIf("attribute-method",  !isSkippableAttributeInNotesTable(type));
        showInputAndLabelIf("attribute-delimiter", type == "delimited text");
        showInputAndLabelIf("attribute-entity", type == "nested notes");
        showInputAndLabelIf("attribute-alignment", !isNotesList(type) && !isMultifile(type));

        document.getElementById("attribute-max-width-label").innerText = isSizableOnForm(type) ? "Max width at page" : "Max width in table";
        document.getElementById("attribute-min-width-label").innerText = isSizableOnForm(type) ? "Min width at page" : "Min width in table";
        var max = document.getElementById("attribute-max-label");
        var min = document.getElementById("attribute-min-label");
        if (isFile(type) || isMultifile(type))
        {
            max.innerText = "Max file size (Kb)";
            min.innerText = "Min file size (Kb)";
        }
        else if (isTextual(type))
        {
            max.innerText = "Max length";
            min.innerText = "Min length";
        }
        else if (isNumeric(type))
        {
            max.innerText = "Max value";
            min.innerText = "Min value";
        }
        else if (isNotesList(type))
        {
            max.innerText = "Max count";
            min.innerText = "Min count";
        }

        if (type == "nested notes" || type == "compared notes")
        {
            fetch(SERVER_ADDRESS + '/rest/entities')
            .then(response => response.json())
            .then(entities => {
                var select = getEmptyElement("attribute-entity");
                
                entities = entities.filter(entity => entity.visible);

                for (var i = 0; i < entities.length; i++)
                {
                    var option = document.createElement("option");
                    option.innerText = entities[i].name;
                    option.value = entities[i].name;
                    select.appendChild(option);
                }
            });
        }
    }
    document.getElementById("attribute-type").onchange();
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
    document.getElementById("attribute-images-size").value = getImagesSize(attribute["imagesSize"]);
    document.getElementById("attribute-max-width").value = attribute["maxWidth"];
    document.getElementById("attribute-min-width").value = attribute["minWidth"];
    document.getElementById("attribute-max-height").value = attribute["maxHeight"];
    document.getElementById("attribute-min-height").value = attribute["minHeight"];
    document.getElementById("attribute-max").value = attribute["max"];
    document.getElementById("attribute-min").value = attribute["min"];
    document.getElementById("attribute-default").value = attribute["defaultValue"];
    document.getElementById("attribute-step").value = attribute["step"];
    document.getElementById("attribute-regex").value = attribute["regex"];
    document.getElementById("attribute-lines-count").value = attribute["linesCount"];
    document.getElementById("attribute-delimiter").value = attribute["delimiter"];

    document.getElementById("attribute-type").onchange();
}


function isSkippableAttributeInNotesTable(type)
{
    return (isMultifile(type) || isNotesList(type));
}

function isSizableOnForm(type)
{
    return (type == "image" || isMultifile(type));
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
    return (type == "text" || type == "textarea" || type == "delimited text");
}

function isNumeric(type)
{
    return (type == "number" || type == "inc");
}

function isFile(type)
{
    return (type == "file" || type == "image");
}

function isMultifile(type)
{
    return (type == "files" || type == "gallery");
}

function isUserDateOrTime(type)
{
    return (type == "user date" || type == "user time");
}

function isNotesList(type)
{
    return (type == "nested notes" || type == "related notes" || type == "compared notes");
}

function getImagesSize(size)
{
    switch (size)
    {
        case 50: return "50x50";
        case 100: return "100x100";
        case 200: return "200x200";
        default: return "50x50";
    }
}


function couldBeKeyAttribute(type)
{
    return (isTextual(type) || isNumeric(type) || hasOptions(type) || type == "checkbox" || type == "url" || isUserDateOrTime(type) || isFile(type)); 
}


function couldBeCompareAttribute(type)
{
    return (couldBeKeyAttribute(type) || type == "row number");
}


function couldBeSortAttribute(type)
{
    return (isTextual(type) || isNumeric(type) || type == "checkbox" || type == "select" || isUserDateOrTime(type));
}