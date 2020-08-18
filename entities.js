


function showEntities()
{
	showEntitiesMenu();

    fetch(SERVER_ADDRESS + '/rest/entities')
    .then(response => response.json())
    .then(entities => {
        if (!entities)
		    return;

        var table = getEmptyElement(DATA_TABLE);
        createEntitiesTableHead(table, entities);
        createEntitiesTableBody(table, entities);
        
        loadMenu();
        switchToContent();
    })
}

function showEntitiesMenu()
{
	var dataMenu = getEmptyElement(DATA_MENU);

	var addEntityButton = createInputButton("add-entity-button");
	addEntityButton.value = "New entity";
    addEntityButton.onclick = function() 
    { 
        createEntityForm(null);
        switchToAddEditForm();
    };

	dataMenu.appendChild(addEntityButton);
}


function createEntitiesTableHead(table)
{
    setContentColumnsCount(4);          // 4 - without buttons

	appendNewSpan(table, "№");
    appendNewSpan(table, "Title");
    appendNewSpan(table, "Collection");
    appendNewSpan(table, "Visible");
	appendNewSpan(table, "");		     // Edit
	appendNewSpan(table, "");		     // Remove
}


function createEntitiesTableBody(table, entities)
{
    // Inside loop elements should be ordered as in createEntitiesTableHead()
	for (var i = 0; i < entities.length; i++)
	{
        appendNewSpan(table, (i + 1).toString());
        appendNewSpan(table, entities[i].title);
        appendNewSpan(table, entities[i].collection);
        appendNewSpan(table, entities[i].visible);

		var editButton = document.createElement("td");
        editButton.className += " " + EDIT_BUTTON;
        editButton.setAttribute(CONTENT_ID, entities[i].id);
        editButton.onclick = function() 
        {
            createEntityForm(this.getAttribute(CONTENT_ID));
            switchToAddEditForm();
        };
		table.appendChild(editButton);		

		var deleteButton = document.createElement("td");
        deleteButton.className += " " + DELETE_BUTTON;
        deleteButton.setAttribute(CONTENT_ID, entities[i].id);
        deleteButton.onclick = function() 
        {
            fetch(SERVER_ADDRESS + '/rest/entities/' + this.getAttribute(CONTENT_ID), { method: "DELETE" })
            .then(response => {
                if (response.status === 200)
                    showEntities();
            })
        };
		table.appendChild(deleteButton);
	}
}


function createEntityForm(entityId)
{
    var dataElement = getEmptyElement(DATA_ELEMENT);

    createErrorLabel(dataElement);

    if (entityId)
        setContentId(entityId);
    else
        clearContentId();

    addInputWithLabel("text",     true,  dataElement, "title",      "Title",               "entity-title");
    addInputWithLabel("text",     true,  dataElement, "collection", "Collection (unique)", "entity-collection");
    addInputWithLabel("checkbox", false, dataElement, "visible",    "Visible",             "entity-visible");

    var saveHandler = function() { saveMetaObjectInfo(DATA_ELEMENT, "/rest/entities", showEntities) };
    var cancelHandler = function() { showEntities() };
    var buttons = addFormButtons(dataElement, entityId != null, saveHandler, cancelHandler);

    var label = document.createElement("label");
    label.innerText = "Attributes";
    label.id = "attributes-label";
    dataElement.insertBefore(label, buttons);

    fetch(SERVER_ADDRESS + "/rest/attributes")
	.then(response => response.json())
	.then(attributes => {
        var multiselect = createMultiselectWithCheckboxes("attributes", attributes);
        dataElement.insertBefore(multiselect, buttons);

        if (!entityId)
            return;

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
    });
}
