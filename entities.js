


function showEntities()
{
	showEntitiesMenu();

    fetch(SERVER_ADDRESS + '/rest/entities')
    .then(response => response.json())
    .then(entities => {
        if (!entities)
            return;
            
        window.history.pushState("", "Entities", "/entities");

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
            var result = confirm("Delete entity?");
            if (result)
            {
                fetch(SERVER_ADDRESS + '/rest/entities/' + this.getAttribute(CONTENT_ID), { method: "DELETE" })
                .then(response => {
                    if (response.status === 200)
                        showEntities();
                })
            }
        };
		table.appendChild(deleteButton);
	}
}


function createEntityForm(entityId)
{
    var dataElement = getEmptyElement(DATA_ELEMENT);

    createErrorLabel(dataElement);

    if (entityId)
    {
        setContentId(entityId);
        window.history.pushState("", "Entity", "/entities/" + entityId);
    }
    else
    {
        clearContentId();
        window.history.pushState("", "Entity", "/entity");
    }

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
    
    var empty = document.createElement("div");
    dataElement.insertBefore(empty, buttons);

    fetch(SERVER_ADDRESS + "/rest/attributes")
	.then(response => response.json())
	.then(attributes => {

        var attributesSelect = document.createElement("div");
        attributesSelect.className += " twoCols";
        attributesSelect.id = ATTRIBUTES_SELECT;

        var leftTable = createAttributesTable(attributes, "left");
        var rightTable = createAttributesTable(attributes, "right");
        attributesSelect.appendChild(leftTable);
        attributesSelect.appendChild(rightTable);
        dataElement.insertBefore(attributesSelect, buttons);

        if (!entityId)
            return;

        fetch(SERVER_ADDRESS + '/rest/entities/search?id=' + entityId)
        .then(response => response.json())
        .then(entity => {
            document.getElementById("entity-title").value = entity["title"];
            document.getElementById("entity-collection").value = entity["collection"];
            document.getElementById("entity-visible").checked = entity["visible"];

            var keyAttr = document.getElementById(entity.keyAttribute + "-right");
            keyAttr.setAttribute(ATTRIBUTE_NAME, "keyAttribute");
            keyAttr.classList.add("key-attribute");

            for (var i = entity.attributes.length - 1; i >= 0; i--)
            {
                var row = document.getElementById(entity.attributes[i] + "-right");
                var body = row.parentNode;
                body.removeChild(row);
                body.prepend(row);
            }

            for (var i = 0; i < entity.attributes.length; i++)
            {
                document.getElementById(entity.attributes[i] + "-left-button").click();
            }
        });
    });
}


let shadow;

function createAttributesTable(attributes, side)
{
    var table = document.createElement("table");
    table.className += " attributes-select-table";
    if (side == "right")
        table.setAttribute(ATTRIBUTE_NAME, "attributes");

    var thead = document.createElement("thead");
    var theadRow = document.createElement("tr");
    appendNewElement("th", theadRow, "Name");
    appendNewElement("th", theadRow, "Title");
    appendNewElement("th", theadRow, "");          // sign
    thead.appendChild(theadRow);
    table.appendChild(thead);

    var tbody = document.createElement("tbody");    
    var signClass = (side == "left") ? "plus-image" : "minus-image";

    for (var i = 0; i < attributes.length; i++)
    {
        var attribute = attributes[i];
        var tr = document.createElement("tr");
        tr.id = attribute.id + "-" + side;
        tr.setAttribute("related-row", (attribute.id + ((side == "left") ? "-right" : "-left")));
        tr.setAttribute(CONTENT_ID, attribute.id);
        tr.style.display = (side == "left") ? "table-row" : "none";
        tr.setAttribute("draggable", "true");
        // From https://codepen.io/nabildroid/pen/ZPwYvp
        tr.ondragstart = function (event)
        {
            shadow = event.target;
        }
        tr.ondragover = function (e)
        {
            var children = Array.from(e.target.parentNode.parentNode.children);
            if (children.indexOf(e.target.parentNode) > children.indexOf(shadow))
                e.target.parentNode.after(shadow);
            else 
                e.target.parentNode.before(shadow);
        }
        if (side == "right")
        {
            tr.ondblclick = function()
            {
                var rows = this.parentNode.getElementsByTagName("tr");
                for (var r = 0; r < rows.length; r++)
                {
                    rows[r].removeAttribute(ATTRIBUTE_NAME);
                    rows[r].classList.remove("key-attribute");
                }

                this.setAttribute(ATTRIBUTE_NAME, "keyAttribute");
                this.classList.add("key-attribute");
            }
        }

        var name = appendNewTd(tr, attribute.name);
        name.style.cursor = "pointer";
        var title = appendNewTd(tr, attribute.title);
        title.style.cursor = "pointer";
        
        var signTd = document.createElement("td");
        var sign = document.createElement("a");
        sign.className += " " + signClass;
        sign.id = attribute.id + "-" + side + "-button";
        sign.onclick = function() 
        {
            var thisRow = this.parentNode.parentNode;
            var relatedRow = document.getElementById(thisRow.getAttribute("related-row"));
            relatedRow.style.display = "table-row";
            thisRow.style.display = "none";
        }
        signTd.appendChild(sign);
        tr.appendChild(signTd);

        tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    return table;
}