


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
    appendNewSpan(table, "Name");
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
        appendNewSpan(table, entities[i].name);
        appendNewSpan(table, entities[i].visible);

		var editButton = document.createElement("td");
        editButton.classList.add(EDIT_BUTTON);
        editButton.setAttribute(CONTENT_ID, entities[i].id);
        editButton.onclick = function() 
        {
            createEntityForm(this.getAttribute(CONTENT_ID));
            switchToAddEditForm();
        };
		table.appendChild(editButton);		

		var deleteButton = document.createElement("td");
        deleteButton.classList.add(DELETE_BUTTON);
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

    addInputWithLabel("text",     true,  dataElement, "title",   "Title",         "entity-title");
    addInputWithLabel("text",     true,  dataElement, "name",    "Name (unique)", "entity-name");
    addInputWithLabel("checkbox", false, dataElement, "visible", "Visible",       "entity-visible");

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
        attributesSelect.classList.add(TWO_COLS);
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
            document.getElementById("entity-name").value = entity["name"];
            document.getElementById("entity-visible").checked = entity["visible"];

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

            var keyAttr = document.getElementById(entity.keyAttribute + "-key-button");
            changeClassName(keyAttr, KEY_ATTRIBUTE_IMAGE, SELECTED_KEY_ATTRIBUTE_IMAGE);

            var sortAttr = document.getElementById(entity.sortAttribute + "-sort-button");
            changeClassName(sortAttr, SORT_ATTRIBUTE_IMAGE, (entity.sortDirection == "ascending") ? ASC_SORT_ATTRIBUTE_IMAGE : DESC_SORT_ATTRIBUTE_IMAGE);

            for (var i = 0; i < entity.comparedAttributes.length; i++)
            {
                var comparedAttr = document.getElementById(entity.comparedAttributes[i] + "-compared-button");
                changeClassName(comparedAttr, COMPARED_ATTRIBUTE_IMAGE, SELECTED_COMPARED_ATTRIBUTE_IMAGE);
            }
        });
    });
}


let shadow;

function createAttributesTable(attributes, side)
{
    var table = document.createElement("table");
    table.classList.add(ATTRIBUTES_SELECT_TABLE);
    if (side == "right")
        table.setAttribute(ATTRIBUTE_NAME, "attributes");

    if (side == "left")
        table.style.marginRight = "10px";

    var thead = document.createElement("thead");
    var theadRow = document.createElement("tr");
    appendNewElement("th", theadRow, "Name");
    appendNewElement("th", theadRow, "Title");
    appendNewElement("th", theadRow, "");              // sign
    if (side == "right")
    {
        appendNewElement("th", theadRow, "");          // key attribute button
        appendNewElement("th", theadRow, "");          // Order attribute button
        appendNewElement("th", theadRow, "");          // Compare attribute button
    }
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
        signTd.style.width = "0";
        var sign = document.createElement("a");
        sign.classList.add(signClass);
        sign.id = attribute.id + "-" + side + "-button";
        sign.onclick = function() 
        {
            var thisRow = this.parentNode.parentNode;
            var relatedRow = document.getElementById(thisRow.getAttribute("related-row"));
            relatedRow.style.display = "table-row";
            thisRow.style.display = "none";

            changeClassForHiddenElements(SELECTED_KEY_ATTRIBUTE_IMAGE, KEY_ATTRIBUTE_IMAGE);
            changeClassForHiddenElements(ASC_SORT_ATTRIBUTE_IMAGE, SORT_ATTRIBUTE_IMAGE);
            changeClassForHiddenElements(DESC_SORT_ATTRIBUTE_IMAGE, SORT_ATTRIBUTE_IMAGE);
        }
        signTd.appendChild(sign);
        tr.appendChild(signTd);

        if (side == "right")
        {
            if (attribute.required && couldBeKeyAttribute(attribute.type))
            {
                var keyAttributeTd = document.createElement("td");
                keyAttributeTd.style.textAlign = "center";
                keyAttributeTd.style.width = "0";
                var keyAttribute = document.createElement("a");
                keyAttribute.classList.add(KEY_ATTRIBUTE_IMAGE);
                keyAttribute.id = attribute.id + "-key-button";
                keyAttribute.onclick = function() 
                {
                    var allKeys = document.getElementsByClassName(SELECTED_KEY_ATTRIBUTE_IMAGE);
                    for (var k = 0; k < allKeys.length; k++)
                        changeClassName(allKeys[k], SELECTED_KEY_ATTRIBUTE_IMAGE, KEY_ATTRIBUTE_IMAGE);
                    
                    changeClassToOpposite(this, KEY_ATTRIBUTE_IMAGE, SELECTED_KEY_ATTRIBUTE_IMAGE);
                }
                keyAttributeTd.appendChild(keyAttribute);
                tr.appendChild(keyAttributeTd);
            }
            else
            {
                tr.appendChild(document.createElement("td"));
            }

            if (attribute.required && couldBeSortAttribute(attribute.type))
            {
                var sortAttributeTd = document.createElement("td");
                sortAttributeTd.style.textAlign = "center";
                sortAttributeTd.style.width = "0";
                var sortAttribute = document.createElement("a");
                sortAttribute.classList.add(SORT_ATTRIBUTE_IMAGE);
                sortAttribute.id = attribute.id + "-sort-button";
                sortAttribute.onclick = function() 
                {
                    var currentClass;
                    if (this.classList.contains(ASC_SORT_ATTRIBUTE_IMAGE))
                        currentClass = ASC_SORT_ATTRIBUTE_IMAGE;
                    else if (this.classList.contains(DESC_SORT_ATTRIBUTE_IMAGE))
                        currentClass = DESC_SORT_ATTRIBUTE_IMAGE;
                    else
                        currentClass = SORT_ATTRIBUTE_IMAGE;

                    var allKeys = document.querySelectorAll(".asc-sort-attribute-image,.desc-sort-attribute-image");
                    for (var k = 0; k < allKeys.length; k++)
                    {
                        changeClassName(allKeys[k], ASC_SORT_ATTRIBUTE_IMAGE, SORT_ATTRIBUTE_IMAGE);
                        changeClassName(allKeys[k], DESC_SORT_ATTRIBUTE_IMAGE, SORT_ATTRIBUTE_IMAGE);
                    }

                    this.classList.remove(currentClass);
                    
                    if (currentClass == ASC_SORT_ATTRIBUTE_IMAGE)
                        this.classList.add(DESC_SORT_ATTRIBUTE_IMAGE);
                    else if (currentClass == SORT_ATTRIBUTE_IMAGE)
                        this.classList.add(ASC_SORT_ATTRIBUTE_IMAGE);
                    else
                        this.classList.add(SORT_ATTRIBUTE_IMAGE);
                }
                sortAttributeTd.appendChild(sortAttribute);
                tr.appendChild(sortAttributeTd);
            }
            else
            {
                tr.appendChild(document.createElement("td"));
            }

            if (attribute.required && couldBeKeyAttribute(attribute.type))
            {
                var comparedAttrId = document.createElement("td");
                comparedAttrId.style.textAlign = "center";
                comparedAttrId.style.width = "0";
                var comparedAttr = document.createElement("a");
                comparedAttr.classList.add(COMPARED_ATTRIBUTE_IMAGE);
                comparedAttr.id = attribute.id + "-compared-button";
                comparedAttr.onclick = function() { changeClassToOpposite(this, SELECTED_COMPARED_ATTRIBUTE_IMAGE, COMPARED_ATTRIBUTE_IMAGE); }
                comparedAttrId.appendChild(comparedAttr);
                tr.appendChild(comparedAttrId);
            }
            else
            {
                tr.appendChild(document.createElement("td"));
            }
        }

        tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    return table;
}