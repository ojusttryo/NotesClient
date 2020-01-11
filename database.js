
class Database
{
    constructor()
    {

    }

    saveObject(collection, object, id)
    {
        return id ? id : 999;   // RETURN NEW ID
    }

    saveFolder(folder, id)
    {
        return true;
    }

    deleteObject(collection, id)
    {
        return true;
    }

    deleteFolder(id)
    {
        return true;
    }
}
