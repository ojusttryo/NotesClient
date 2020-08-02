


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
    var form = document.createElement("form");
    form.id = "attribute-form";
    if (attributeId)
        form.setAttribute(CONTENT_ID, attributeId);
    else if (form.hasAttribute(CONTENT_ID))
        form.removeAttribute(CONTENT_ID);

    addTextInputWithLabel(form, "name", "Name", "attribute-name");
    addTextInputWithLabel(form, "title", "Title", "attribute-title");
    addSelectWithLabel(form, "alignment", "Alignment", "attribute-alignment", [ "left", "right", "center" ]);
    addSelectWithLabel(form, "type", "Type", "attribute-type", [ "text", "textarea", "number", "select", "multiselect", "checkbox", "inc", "url"]);   
    addTextInputWithLabel(form, "selectOptions", "Select options", "attribute-select-options");
    addBooleanInputWithLabel(form, "visible", "Visible in table", "attribute-visible", "visible");
    addBooleanInputWithLabel(form, "required", "Required", "attribute-required", "required");
    addNumberInputWithLabel(form, "linesCount", "Lines count", "attribute-lines-count", 1, 5);
    addSelectWithLabel(form, "method", "Method", "attribute-method", [ "none", "folder name", "avg", "count" ]);
    addTextInputWithLabel(form, "maxWidth", "Max width in table", "attribute-max-width");
    addTextInputWithLabel(form, "minWidth", "Min width in table", "attribute-min-width");
    addTextInputWithLabel(form, "max", "Max value/length", "attribute-max");
    addTextInputWithLabel(form, "min", "Min value/length", "attribute-min");
    addTextInputWithLabel(form, "defaultValue", "Default value", "attribute-default");
    addNumberInputWithLabel(form, "step", "Step", "attribute-step", 0, 1);
    addTextInputWithLabel(form, "regex", "Regular expression to check", "attribute-regex");

    var addButtonOnClickHandler = function() { saveMetaObjectInfo("attribute-form", "/rest/attributes", showAttributes) };
    addButton(form, attributeId ? "edit-attribute" : "save-attribute", attributeId ? "Edit attribute" : "Save attribute", addButtonOnClickHandler);

    var cancelButton = document.createElement("input");
	cancelButton.type = "button";
	cancelButton.value = "Cancel";
    cancelButton.onclick = function() { showAttributes(); };
    form.appendChild(cancelButton);

    dataElement.appendChild(form);

    // When changing the type other fields may become excess
    document.getElementById("attribute-type").onchange = function() 
    {
        var type = document.getElementById("attribute-type").value;
        showInputAndLabelIf("attribute-select-options", (type == "select" || type == "multiselect"));
        showInputAndLabelIf("attribute-lines-count", (type == "textarea"));
        showInputAndLabelIf("attribute-max", (type == "text" || type == "textarea" || type == "number" || type == "inc" || type == "url"));
        showInputAndLabelIf("attribute-min", (type == "text" || type == "textarea" || type == "number" || type == "inc" || type == "url"));
        showInputAndLabelIf("attribute-step", (type == "number" || type == "inc"));
        showInputAndLabelIf("attribute-regex", (type == "text" || type == "textarea" || type == "number" || type == "inc" || type == "url"));
    }
    document.getElementById("attribute-type").onchange();
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
    document.getElementById("attribute-step").value = attribute["step"];
    document.getElementById("attribute-regex").value = attribute["regex"];
    document.getElementById("attribute-lines-count").value = attribute["linesCount"];    

    document.getElementById("attribute-type").onchange();
    
    switch (attribute["type"])
    {
        case "text": 
            break;
        case "textarea":             
            break;
        case "number":
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

