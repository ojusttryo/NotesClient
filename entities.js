


function showEntities()
{
	showEntitiesMenu();

    fetch(SERVER_ADDRESS + '/rest/entities')
    .then(response => response.json())
    .then(entities => {
        if (!entities)
		    return;

        var table = getEmptyElement(DATA_TABLE);
        table.appendChild(createEntitiesTableHead(entities));
        table.appendChild(createEntitiesTableBody(entities));
        
        loadMenu();
        switchToContent();
    })
}

function showEntitiesMenu()
{
	var dataMenu = getEmptyElement(DATA_MENU);

	var addEntityButton = document.createElement("input");
	addEntityButton.type = "button";
	addEntityButton.id = "add-entity-button";
	addEntityButton.value = "New entity";
    addEntityButton.onclick = function() 
    { 
        createEntityForm(null);
        switchToAddEditForm();
    };

	dataMenu.appendChild(addEntityButton);
}


// This method is the same as in attributes.js, but will differ in future.
function createEntitiesTableHead()
{
	var thead = document.createElement("thead");
	var tr = document.createElement("tr");

	appendNewTh(tr, "№");
    appendNewTh(tr, "Title");
    appendNewTh(tr, "Collection");
    appendNewTh(tr, "Visible");
	appendNewTh(tr, "");		    // Edit
	appendNewTh(tr, "");		    // Remove

	thead.appendChild(tr);

	return thead;
}

// This method is the same as in attributes.js, but will differ in future.
function createEntitiesTableBody(entities)
{
	var tbody = document.createElement("tbody");

    // Inside loop elements should be ordered as in createEntitiesTableHead()
	for (var i = 0; i < entities.length; i++)
	{
		var tr = document.createElement("tr");
		tr.className = ENTITY;
		tr.setAttribute(CONTENT_ID, entities[i].id);

		var number = document.createElement("td");
		number.innerText = i + 1;
		number.onclick = function() { showEntityInfo(entities[i].id); };
		tr.appendChild(number);

		var title = document.createElement("td");
		title.innerText = entities[i].title;
		title.onclick = function() { showEntitiesInfo(entities[i].id); };
        tr.appendChild(title);
        
        var collection = document.createElement("td");
		collection.innerText = entities[i].collection;
		collection.onclick = function() { showEntitiesInfo(entities[i].id); };
        tr.appendChild(collection);
        
        var visible = document.createElement("td");
        visible.innerText = entities[i].visible;
        visible.onclick = function() { showEntitiesInfo(entities[i].id); };
        tr.appendChild(visible);

		var editButton = document.createElement("td");
		editButton.className = EDIT_BUTTON;
        editButton.onclick = function() 
        {
            createEntityForm(this.parentNode.getAttribute(CONTENT_ID));
            switchToAddEditForm();
        };
		tr.appendChild(editButton);		

		var deleteButton = document.createElement("td");
		deleteButton.className = DELETE_BUTTON;
        deleteButton.onclick = function() 
        {
            fetch(SERVER_ADDRESS + '/rest/entities/' + this.parentNode.getAttribute(CONTENT_ID), { method: "DELETE" })
            .then(response => {
                if (response.status === 200)
                    showEntities();
            })
        };
		tr.appendChild(deleteButton);

		tbody.appendChild(tr);
	}

	return tbody;
}


function createEntityForm(entityId)
{
    var dataElement = getEmptyElement(DATA_ELEMENT);
    var form = document.createElement("form");
    form.id = "entity-form";
    if (entityId)
        form.setAttribute(CONTENT_ID, entityId);
    else if (form.hasAttribute(CONTENT_ID))
        form.removeAttribute(CONTENT_ID);

    var errorLabel = document.createElement("label");
    errorLabel.id = "error-label";
    errorLabel.style.display = "none";
    form.appendChild(errorLabel);

    addTextInputWithLabel(form, "title", "Title", "entity-title");
    addTextInputWithLabel(form, "collection", "Collection (unique)", "entity-collection");
    addBooleanInputWithLabel(form, "visible", "Visible", "entity-visible", "visible");

    var addButtonOnClickHandler = function() { saveMetaObjectInfo("entity-form", "/rest/entities", showEntities) };
    var saveButton = addButton(form, entityId ? "edit-entity" : "save-entity", entityId ? "Edit entity" : "Save entity", addButtonOnClickHandler);

    var cancelButton = document.createElement("input");
	cancelButton.type = "button";
	cancelButton.value = "Cancel";
    cancelButton.onclick = function() { showEntities(); };
    form.appendChild(cancelButton);

    fetch(SERVER_ADDRESS + "/rest/attributes")
	.then(response => response.json())
	.then(attributes => {
        var label = document.createElement("label");
        label.innerText = "Attributes";
        label.id = "attributes-label";
        form.insertBefore(label, saveButton);

        var multiselect = createMultiselectWithCheckboxes("attributes", attributes);
        label.appendChild(multiselect);

        if (entityId)
        {
            fetch(SERVER_ADDRESS + '/rest/entities/search?id=' + entityId)
            .then(response => response.json())
            .then(entity => {
                document.getElementById("entity-title").value = entity["title"];
                document.getElementById("entity-collection").value = entity["collection"];
                document.getElementById("entity-visible").checked = entity["visible"];
                var checkboxes = multiselect.getElementsByTagName("input");
                for (var i = 0; i < entity.attributes.length; i++)
                {
                    var attribute = entity.attributes[i];
                    for (var j = 0; j < checkboxes.length; j++)
                    {
                        if (checkboxes[j].getAttribute("attribute-id") == attribute)
                        {
                            checkboxes[j].checked = true;
                            break;
                        }
                    }
                }
            });
        }

        form.insertBefore(multiselect, saveButton);
        form.insertBefore(document.createElement("br"), saveButton);
    });

    dataElement.appendChild(form);
}
