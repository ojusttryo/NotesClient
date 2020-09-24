


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
    document.getElementById(DATA_TABLE).style.gridTemplateColumns = "repeat(var(--tableColumnsCount), auto) min-content min-content";

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
        editButton.setAttribute(CONTENT_NAME, entities[i].name);
        editButton.onclick = function() 
        {
            createEntityForm(this.getAttribute(CONTENT_NAME));
            switchToAddEditForm();
        };
		table.appendChild(editButton);		

		var deleteButton = document.createElement("td");
        deleteButton.classList.add(DELETE_BUTTON);
        deleteButton.setAttribute(CONTENT_NAME, entities[i].name);
        deleteButton.onclick = function() 
        {
            var result = confirm("Delete entity?");
            if (result)
            {
                fetch(SERVER_ADDRESS + '/rest/entities/' + this.getAttribute(CONTENT_NAME), { method: "DELETE" })
                .then(response => {
                    if (response.status === 200)
                        showEntities();
                })
            }
        };
		table.appendChild(deleteButton);
	}
}


function createEntityForm(entityName)
{
    var dataElement = getEmptyElement(DATA_ELEMENT);

    recreateErrorLabel(DATA_ELEMENT);

    if (entityName)
    {
        setContentId(entityName);
        window.history.pushState("", "Entity", "/entities/" + entityName);
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
    var buttons = addFormButtons(dataElement, entityName != null, saveHandler, cancelHandler);

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

        if (!entityName)
            return;

        fetch(SERVER_ADDRESS + '/rest/entities/search?name=' + getContentId())
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
            changeImageClass(keyAttr, KEY_ATTRIBUTE_IMAGE, SELECTED_KEY_ATTRIBUTE_IMAGE);

            if (entity.sortAttribute)
            {
                var sortAttr = document.getElementById(entity.sortAttribute + "-sort-button");
                changeImageClass(sortAttr, SORT_ATTRIBUTE_IMAGE, (entity.sortDirection == "ascending") ? ASC_SORT_ATTRIBUTE_IMAGE : DESC_SORT_ATTRIBUTE_IMAGE);
            }

            for (var i = 0; i < entity.comparedAttributes.length; i++)
            {
                var comparedAttr = document.getElementById(entity.comparedAttributes[i] + "-compared-button");
                changeImageClass(comparedAttr, COMPARED_ATTRIBUTE_IMAGE, SELECTED_COMPARED_ATTRIBUTE_IMAGE);
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
        tr.id = attribute.name + "-" + side;
        tr.setAttribute("related-row", (attribute.name + ((side == "left") ? "-right" : "-left")));
        tr.setAttribute(ATTRIBUTE_NAME, attribute.name);
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

        var name = appendNewTd(tr, attribute.name);
        name.style.cursor = "pointer";
        var title = appendNewTd(tr, attribute.title);
        title.style.cursor = "pointer";
        
        var signTd = document.createElement("td");
        signTd.style.width = "0";
        var sign = document.createElement("a");
        setImageClass(sign, signClass, true);
        sign.id = attribute.name + "-" + side + "-button";
        sign.onclick = function() 
        {
            var thisRow = this.parentNode.parentNode;
            var relatedRow = document.getElementById(thisRow.getAttribute("related-row"));
            relatedRow.style.display = "table-row";
            thisRow.style.display = "none";

            changeImageClassForHiddenElements(SELECTED_KEY_ATTRIBUTE_IMAGE, KEY_ATTRIBUTE_IMAGE);
            changeImageClassForHiddenElements(ASC_SORT_ATTRIBUTE_IMAGE, SORT_ATTRIBUTE_IMAGE);
            changeImageClassForHiddenElements(DESC_SORT_ATTRIBUTE_IMAGE, SORT_ATTRIBUTE_IMAGE);
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
                setImageClass(keyAttribute, KEY_ATTRIBUTE_IMAGE, true);
                keyAttribute.id = attribute.name + "-key-button";
                keyAttribute.onclick = function() 
                {
                    var allKeys = document.getElementsByClassName(SELECTED_KEY_ATTRIBUTE_IMAGE);
                    for (var k = 0; k < allKeys.length; k++)
                        changeImageClass(allKeys[k], SELECTED_KEY_ATTRIBUTE_IMAGE, KEY_ATTRIBUTE_IMAGE);
                    
                    changeImageClassToOpposite(this, KEY_ATTRIBUTE_IMAGE, SELECTED_KEY_ATTRIBUTE_IMAGE);
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
                setImageClass(sortAttribute, SORT_ATTRIBUTE_IMAGE, true);
                sortAttribute.id = attribute.name + "-sort-button";
                sortAttribute.onclick = function() 
                {
                    var currentClass;
                    if (this.classList.contains(ASC_SORT_ATTRIBUTE_IMAGE))
                        currentClass = ASC_SORT_ATTRIBUTE_IMAGE;
                    else if (this.classList.contains(DESC_SORT_ATTRIBUTE_IMAGE))
                        currentClass = DESC_SORT_ATTRIBUTE_IMAGE;
                    else
                        currentClass = SORT_ATTRIBUTE_IMAGE;

                    var allKeys = document.querySelectorAll(`.${ASC_SORT_ATTRIBUTE_IMAGE},.${DESC_SORT_ATTRIBUTE_IMAGE}`);
                    for (var k = 0; k < allKeys.length; k++)
                    {
                        changeImageClass(allKeys[k], ASC_SORT_ATTRIBUTE_IMAGE, SORT_ATTRIBUTE_IMAGE);
                        changeImageClass(allKeys[k], DESC_SORT_ATTRIBUTE_IMAGE, SORT_ATTRIBUTE_IMAGE);
                    }

                    this.classList.remove(currentClass);
                    
                    if (currentClass == ASC_SORT_ATTRIBUTE_IMAGE)
                        setImageClass(this, DESC_SORT_ATTRIBUTE_IMAGE, true);
                    else if (currentClass == SORT_ATTRIBUTE_IMAGE)
                        setImageClass(this, ASC_SORT_ATTRIBUTE_IMAGE, true);
                    else
                        setImageClass(this, SORT_ATTRIBUTE_IMAGE, true);
                }
                sortAttributeTd.appendChild(sortAttribute);
                tr.appendChild(sortAttributeTd);
            }
            else
            {
                tr.appendChild(document.createElement("td"));
            }

            if (couldBeCompareAttribute(attribute.type))
            {
                var comparedAttrId = document.createElement("td");
                comparedAttrId.style.textAlign = "center";
                comparedAttrId.style.width = "0";
                var comparedAttr = document.createElement("a");
                setImageClass(comparedAttr, COMPARED_ATTRIBUTE_IMAGE, true);
                comparedAttr.id = attribute.name + "-compared-button";
                comparedAttr.onclick = function() { changeImageClassToOpposite(this, SELECTED_COMPARED_ATTRIBUTE_IMAGE, COMPARED_ATTRIBUTE_IMAGE); }
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