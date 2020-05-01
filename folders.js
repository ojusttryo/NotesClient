

function deleteFolder(id)
{
	var db = new Database();
	if (db.deleteFolder(id))
	{
		var dataTable = document.getElementById(DATA_TABLE);
		var tbody = dataTable.childNodes[1];
		var toRemove = new Array();
		for (var i = 0; i < tbody.childNodes.length; i++)
		{
			var tr = tbody.childNodes[i];
			if (tr.className == FOLDER && tr.getAttribute(CONTENT_ID) == id)
			{
				toRemove.push(tr);
				i++;
				var level = tr.getAttribute(CONTENT_LEVEL);

				while (i < tbody.childNodes.length && tbody.childNodes[i].getAttribute(CONTENT_LEVEL) > level)
				{
					toRemove.push(tbody.childNodes[i]);
					i++;
				}

				break;
			}
		}

		for (var i = 0; i < toRemove.length; i++)
		{
			tbody.removeChild(toRemove[i]);
		}
	}
}



function expandFolder(foldeRow)
{
	foldeRow.setAttribute(DASHED, "false");						
	for (var i = 0; i < foldeRow.childNodes.length; i++)
	{
		var td = foldeRow.childNodes[i];
		if (td.className == EXPAND_ICON)
		{
			td.className = COLLAPSE_ICON;
			break;
		}
	}

	var tbody = foldeRow.parentNode;
	var level = foldeRow.getAttribute(CONTENT_LEVEL);
	for (var i = foldeRow.rowIndex; i < tbody.childNodes.length; i++)
	{
		var innerItem = tbody.childNodes[i];
		if (innerItem.getAttribute(CONTENT_LEVEL) <= level)
			break;

		innerItem.style.display = "table-row";

		if (innerItem.getAttribute(DASHED) == "true")
		{
			var innerLevel = innerItem.getAttribute(CONTENT_LEVEL);
			i++;
			while (i < tbody.childNodes.length && tbody.childNodes[i].getAttribute(CONTENT_LEVEL) > innerLevel)
				i++;
			i--;
		}
	}
}


function collapseFolder(folderRow)
{
	folderRow.setAttribute(DASHED, "true");					
	for (var i = 0; i < folderRow.childNodes.length; i++)
	{
		var td = folderRow.childNodes[i];
		if (td.className == COLLAPSE_ICON)
		{
			td.className = EXPAND_ICON;
			break;
		}
	}

	var tbody = folderRow.parentNode;
	var level = folderRow.getAttribute(CONTENT_LEVEL);
	for (var i = folderRow.rowIndex; i < tbody.childNodes.length; i++)
	{
		var innerItem = tbody.childNodes[i];
		if (innerItem.getAttribute(CONTENT_LEVEL) <= level)
			break;

		innerItem.style.display = "none";

		if (innerItem.getAttribute(DASHED) == "true")
		{
			var innerLevel = innerItem.getAttribute(CONTENT_LEVEL);
			i++;
			while (i < tbody.childNodes.length && tbody.childNodes[i].getAttribute(CONTENT_LEVEL) > innerLevel)
				i++;
			i--;
		}
	}
}



function printFolder(tbody, attributes, folder)
{
	var tr = document.createElement("tr");
	tr.className = FOLDER;
	tr.setAttribute(CONTENT_ID, folder[ID]);
	tr.setAttribute(CONTENT_LEVEL, folder[LEVEL]);

	for (var i = 0; i < folder[LEVEL] - 1; i++)
		tr.appendChild(document.createElement("td"));
	
	var dashButton = (folder.Notes.length > 0 || folder.Folders.length > 0) ? createTdWithIcon(COLLAPSE_ICON) : createTdWithIcon(EMPTY_ICON);
	dashButton.onclick = function() 
	{
		switch (dashButton.className)
		{			
			case COLLAPSE_ICON: collapseFolder(this.parentNode); break;
			case EXPAND_ICON: expandFolder(this.parentNode); break;
			default: break;
		}
	}

	tr.appendChild(dashButton);
	tr.appendChild(createTdWithIcon(FOLDER_ICON));

	var folderName = document.createElement("td");
	folderName.innerHTML = folder[NAME];
	folderName.colSpan = 4 - folder[LEVEL] + 1;
	folderName.setAttribute("align", "left");
	folderName.setAttribute(ATTRIBUTE_NAME, NAME);
	tr.appendChild(folderName);

	for (var i = 1; i < attributes.length; i++)
	{
		var attributeName = attributes[i][NAME];
		var td = document.createElement("td");
		td.setAttribute(ATTRIBUTE_NAME, attributeName);
		td.innerHTML = folder[attributeName] == null ? "" : folder[attributeName];
		tr.appendChild(td);
	}

	tr.appendChild(createEditButton(FOLDER, folder[ID]));
	tr.appendChild(createDeleteButton(FOLDER, folder[ID]));

	tbody.appendChild(tr);
	
	if (folder.Folders != null)
	{
		for (var i = 0; i < folder.Folders.length; i++)
			printFolder(tbody, attributes, folder.Folders[i]);
	}

	printNotes(tbody, attributes, folder);
}


	// Table body should look like this
	// | - | F | Folder level 1 name                 | Attribute 1 | Attribute 2 | ...    --- Top level folder
	// |   | - |  F  | Folder level 2 name           | Attribute 1 | Attribute 2 | ...    --- First level nesting folder
	// |   |   |  -  |  F  | Folder level 3 name     | Attribute 1 | Attribute 2 | ...    --- Second level nesting folder (maximum)
	// |   |   |     |     |  N  | Note level 4 name | Attribute 1 | Attribute 2 | ...    --- Third level nestring note (maximum)
	// |   |   |     |  N  | Note level 3 name       | Attribute 1 | Attribute 2 | ...    --- Second level nesting note
	// |   |   |  N  | Note level 2 name             | Attribute 1 | Attribute 2 | ...    --- First level nesting note
	// |   | N | Note level 1 name                   | Attribute 1 | Attribute 2 | ...    --- Top level note
	// |   |   |     |     |     |                   | Attribute 1 | Attribute 2 | ...
	// So there are 6 columns for name and sings/icons.
	// To the left of the sings and icons there are empty td elements without colSpan.
	// To the right of the name there could be empty space. Name column combine it using colSpan.

		/*
	if (data.Folders != null)
	{
		for (var i = 0; i < data.Folders.length; i++)
			printFolder(tbody, attributes, data.Folders[i]);
	}
	*/