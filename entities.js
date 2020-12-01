


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
        
        switchToContent();

        setPageTitle("Entities");
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
        pushEntityState(null);
        switchToAddEditForm();
    };

	dataMenu.appendChild(addEntityButton);
}


function createEntitiesTableHead(table)
{
    setContentColumnsCount(4);          // 3 - without buttons and row number
    table.style.gridTemplateColumns = "min-content repeat(var(--tableColumnsCount), auto) min-content min-content";

	appendNewSpanAligning(table, "№", "center", true);
    appendNewSpan(table, "Title", true);
    appendNewSpan(table, "Name", true);
    appendNewSpan(table, "Visible", true);
    appendNewSpan(table, "Attributes", true);
	appendNewSpan(table, "");		     // Edit
	appendNewSpan(table, "");		     // Remove
}


function createEntitiesTableBody(table, entities)
{
    // Inside loop elements should be ordered as in createEntitiesTableHead()
	for (var i = 0; i < entities.length; i++)
	{
        appendNewSpanAligning(table, (i + 1).toString(), "right");
        appendNewSpan(table, entities[i].title);
        appendNewSpan(table, entities[i].name);
        appendNewSpan(table, entities[i].visible);

        var attributes = appendNewSpan(table, "");
        attributes.classList.add("usage-list");
        attributes.style.display = "flex";
        entities[i].attributes.forEach(function (item, index) {
            var attribute = document.createElement("a");
            attribute.href = window.location.href.replace(window.location.pathname, `/attribute/${item}`);
            attribute.style.textDecoration = "none";
            attribute.style.color = "black";
            attribute.style.paddingRight = "5px";
            attribute.innerText = item;
            attributes.appendChild(attribute);
        })

		var editButton = document.createElement("td");
        editButton.classList.add(EDIT_BUTTON);
        editButton.setAttribute(CONTENT_NAME, entities[i].name);
        editButton.onclick = function() 
        {
            pushEntityState(this.getAttribute(CONTENT_NAME));
            createEntityForm(this.getAttribute(CONTENT_NAME));
            switchToAddEditForm();
        };
		table.appendChild(editButton);		

		var deleteButton = document.createElement("td");
        deleteButton.classList.add(DELETE_BUTTON);
        deleteButton.setAttribute(CONTENT_NAME, entities[i].name);
        deleteButton.onclick = function() 
        {
            var result = confirm(`Delete entity ${this.getAttribute(CONTENT_NAME)}?`);
            if (result)
            {
                fetch(SERVER_ADDRESS + '/rest/entities/' + this.getAttribute(CONTENT_NAME), { method: "DELETE" })
                .then(response => {
                    if (response.status === 200)
                    {
                        pushEntityTableState();
                        showEntities();
                    }
                })
            }
        };
		table.appendChild(deleteButton);
	}
}


function createEntityForm(entityName)
{
    var dataElement = getEmptyElement(DATA_ELEMENT);

    if (entityName)
        dataElement.setAttribute(CONTENT_ID, entityName);
    else
        dataElement.removeAttribute(CONTENT_ID);

    addInputWithLabel("text",     true,  dataElement, "title",   "Title",         "entity-title");
    addInputWithLabel("text",     true,  dataElement, "name",    "Name (unique)", "entity-name");
    addInputWithLabel("checkbox", false, dataElement, "visible", "Visible",       "entity-visible");

    var saveHandler = function() 
    {
        saveMetaObjectInfo("/rest/entities", getBack);
    };
    var cancelHandler = function() 
    {
        getBack();
    };
    var buttons = addFormButtons(dataElement, entityName != null, saveHandler, cancelHandler);

    var label = document.createElement("label");
    label.innerText = "Attributes";
    label.id = "attributes-label";
    dataElement.insertBefore(label, buttons);
    
    var empty = document.createElement("div");
    dataElement.insertBefore(empty, buttons);

    var url = SERVER_ADDRESS + "/rest/attributes/search?shared=true";
    if (entityName)
        url += "&entityName=" + entityName;
     
    fetch(url)
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
        {
            setPageTitle("New entity");
            return;
        }

        fetch(SERVER_ADDRESS + '/rest/entities/search?name=' + dataElement.getAttribute(CONTENT_ID))
        .then(response => response.json())
        .then(entity => {
            setPageTitle("Entity " + entity.title);

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

            for (var i = 0; i < entity.visibleAttributes.length; i++)
            {
                var visibleAttr = document.getElementById(entity.visibleAttributes[i] + "-visible-button");
                changeImageClass(visibleAttr, VISIBLE_ATTRIBUTE_IMAGE, SELECTED_VISIBLE_ATTRIBUTE_IMAGE);
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
        appendNewElement("th", theadRow, "");          // Visible attribute button
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
            changeImageClassForHiddenElements(SELECTED_VISIBLE_ATTRIBUTE_IMAGE, VISIBLE_ATTRIBUTE_IMAGE);
            changeImageClassForHiddenElements(SELECTED_COMPARED_ATTRIBUTE_IMAGE, COMPARED_ATTRIBUTE_IMAGE);
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

            if (couldBeSortAttribute(attribute.type))
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
                        allKeys[k].classList.remove(SORT_ATTRIBUTE_IMAGE);
                        changeImageClass(allKeys[k], ASC_SORT_ATTRIBUTE_IMAGE, SORT_ATTRIBUTE_IMAGE);
                        changeImageClass(allKeys[k], DESC_SORT_ATTRIBUTE_IMAGE, SORT_ATTRIBUTE_IMAGE);
                    }

                    this.classList.remove(currentClass);
                    
                    if (currentClass == ASC_SORT_ATTRIBUTE_IMAGE)
                        setImageClass(this, DESC_SORT_ATTRIBUTE_IMAGE, true);
                    else if (currentClass == SORT_ATTRIBUTE_IMAGE)
                        setImageClass(this, ASC_SORT_ATTRIBUTE_IMAGE, true);
                    else if (currentClass == DESC_SORT_ATTRIBUTE_IMAGE)
                        setImageClass(this, SORT_ATTRIBUTE_IMAGE, true);
                }
                sortAttributeTd.appendChild(sortAttribute);
                tr.appendChild(sortAttributeTd);
            }
            else
            {
                tr.appendChild(document.createElement("td"));
            }

            if (!isSkippableAttributeInNotesTable(attribute.type))
            {
                var visibleAttrId = document.createElement("td");
                visibleAttrId.style.textAlign = "center";
                visibleAttrId.style.width = "0";
                var visibleAttr = document.createElement("a");
                setImageClass(visibleAttr, VISIBLE_ATTRIBUTE_IMAGE, true);
                visibleAttr.id = attribute.name + "-visible-button";
                visibleAttr.onclick = function() { changeImageClassToOpposite(this, SELECTED_VISIBLE_ATTRIBUTE_IMAGE, VISIBLE_ATTRIBUTE_IMAGE); }
                visibleAttrId.appendChild(visibleAttr);
                tr.appendChild(visibleAttrId);
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