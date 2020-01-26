


function showEntities()
{
	showEntitiesMenu();

	var url = SERVER_ADDRESS + '/rest/entities';
	const init = { method: 'GET' };

    makeHttpRequest(url, init, showEntitiesHandler);
    
    switchToContent();
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

function showEntitiesHandler(entities)
{
	if (!entities)
		return;

	var table = getEmptyElement(DATA_TABLE);
	table.appendChild(createEntitiesTableHead(entities));
    table.appendChild(createEntitiesTableBody(entities));
    
    loadMenu();
}

// This method is the same as in attributes.js, but will differ in future.
function createEntitiesTableHead()
{
	var thead = document.createElement("thead");
	var tr = document.createElement("tr");

	appendNewTh(tr, "№");
    appendNewTh(tr, "Title");
    appendNewTh(tr, "Collection");
	appendNewTh(tr, "");		    // Edit
	appendNewTh(tr, "");		    // Remove

	thead.appendChild(tr);

	return thead;
}

// This method is the same as in attributes.js, but will differ in future.
function createEntitiesTableBody(entities)
{
	var tbody = document.createElement("tbody");

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
            deleteEntity(this.parentNode.getAttribute(CONTENT_ID), showEntities);
        };
		tr.appendChild(deleteButton);

		tbody.appendChild(tr);
	}

	return tbody;
}

function deleteEntity(id, deleteHandler)
{
	var attributesUrl = SERVER_ADDRESS + '/rest/entities/' + id;
	const init = { method: 'DELETE' };

	makeHttpRequest(attributesUrl, init, deleteHandler);
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

    addTextInputWithlabel(form, "title", "Title", "entity-title");
    addTextInputWithlabel(form, "collection", "Collection", "entity-collection");
    addMultiSelectWithLabel(form, "attributes", "Attributes", "entity-attributes", []);

    var entityFormButtonHandler = function() 
    {
        saveEntityInfo(showEntities);
    }
    addButton(form, entityId ? "edit-entity" : "save-entity", entityId ? "Edit entity" : "Save entity", entityFormButtonHandler);

    dataElement.appendChild(form);

    readAttributes(createOptionsWithExistentAttributes);
}

function createOptionsWithExistentAttributes(attributes)
{
    var form = document.getElementById("entity-form");
    var id = form.getAttribute(CONTENT_ID);

    var select = document.getElementById("entity-attributes");
    for (var i = 0; i < attributes.length; i++)
    {
        var option = document.createElement("option");
        option.innerText = attributes[i].name;
        option.value = attributes[i].id;
        option.id = attributes[i].id;
        select.appendChild(option);
    }

    if (id)
        readEntity(id, fillEntityValuesOnForm);
}

function readEntity(id, afterReadHandler)
{
    var url = SERVER_ADDRESS + '/rest/entities/' + id;
	const init = { method: 'GET' };

    makeHttpRequest(url, init, afterReadHandler);
}

function fillEntityValuesOnForm(entity)
{
    document.getElementById("entity-title").value = entity["title"];
    document.getElementById("entity-collection").value = entity["collection"];
    for (var i = 0; i < entity.attributes.length; i++)
    {
        var attribute = entity.attributes[i];
        var option = document.getElementById(attribute);
        option.selected = "selected";
    }
}

function addMultiSelectWithLabel(parent, attrName, labelText, inputId, options)
{
    var label = document.createElement("label");
    label.innerText = labelText;

    var select = document.createElement("select");
    select.id = inputId;
    select.setAttribute("multiple", "multiple");
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


// TODO optimize later to not to reload all entitites. 
// But maybe it's necessary because there could be some edit request from another page.
// TODO maybe try to optimize by sending only changed fields.
function saveEntityInfo(handler)
{
    var url = SERVER_ADDRESS + '/rest/entities';
    var form = document.getElementById("entity-form");
    var id = form.getAttribute(CONTENT_ID);
    var objectToSave = getObjectFromForm(form);
    if (id)
        objectToSave.id = id;
    
    const init = 
    {
        method: id ? "PUT" : "POST",                            // If there is id for entity, it's already exist. So just PUT (update)
        body: JSON.stringify(objectToSave),
        headers:
        {
            "Accept": "text/plain;charset=UTF-8",               // Expect an id of the entity
            "Content-Type": "application/json;charset=UTF-8"
        }
    };

    makeHttpRequest(url, init, handler);
}
