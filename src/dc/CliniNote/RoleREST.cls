Class dc.CliniNote.RoleREST Extends %CSP.REST
{

ClassMethod ListAll() As %Status
{
    set sql = "SELECT ID, ""Name"", Description, Permissions, Active FROM ""dc_cliniNote"".""Role"""
    set stmt = ##class(%SQL.Statement).%New()
    set sc = stmt.%Prepare(sql)
    quit:$$$ISERR(sc) sc

    set rs = stmt.%Execute()
    set result = []
    while rs.%Next() {
        do result.%Push({
            "id": (rs.%Get("ID")),
            "name": (rs.%Get("Name")),
            "description": (rs.%Get("Description")),
            "permissions": (rs.%Get("Permissions")),
            "active": (rs.%Get("Active"))
        })
    }
    write result.%ToJSON()
    quit $$$OK
}

ClassMethod GetColumns() As %Status
{
    set columns = [
        { "title": "ID", "field": "id", "visible": false },
        { "title": "Name", "field": "name" },
        { "title": "Description", "field": "description" },
        { "title": "Permissions", "field": "permissions" },
        { "title": "Active", "field": "active", "formatter": "tickCross" }
    ]
    write columns.%ToJSON()
    quit $$$OK
}

// GET /role/:id - Get one role by ID

ClassMethod GetOne(pId As %Integer) As %Status
{
    set obj = ##class(dc.CliniNote.Role).%OpenId(pId)
    if '$IsObject(obj) {
        set %response.Status = 404
        write {"error":"Role not found"}.%ToJSON()
        quit $$$OK
    }
    do obj.%JSONExport()
    quit $$$OK
}

/// POST /role - Create new role
ClassMethod Create() As %Status
{
    set input = {}.%FromJSON(%request.Content)
   
    if input.%IsDefined("name")="" {
        set %response.Status = 400
        write {"error":"Rle Name is required"}.%ToJSON()
        quit $$$OK
    }

    set obj = ##class(dc.CliniNote.Role).%New()
    if input.%IsDefined("name") set obj.Name = input.name
    if input.%IsDefined("description") set obj.Description = input.description
    if input.%IsDefined("permissions") set obj.Permissions = input.permissions
    if input.%IsDefined("active") set obj.Active = input.active

    set sc = obj.%Save()
    if $$$ISERR(sc) {
        set %response.Status = 400
        write {"error": ($SYSTEM.Status.GetErrorText(sc))}.%ToJSON()        
        quit $$$OK
    }

    set %response.Status = 201
    do obj.%JSONExport()
    quit $$$OK
}

/// PUT /role/:id - Update existing role
ClassMethod Update(pId As %Integer) As %Status
{
    set obj = ##class(dc.CliniNote.Role).%OpenId(pId)
    if '$IsObject(obj) {
        set %response.Status = 404
        write {"error":"Role not found"}.%ToJSON()
        quit $$$OK
    }

    set input = {}.%FromJSON(%request.Content)

    if input.%IsDefined("name") set obj.Name = input.name
    if input.%IsDefined("description") set obj.Description = input.description
    if input.%IsDefined("permissions") set obj.Permissions = input.permissions
    if input.%IsDefined("active") set obj.Active = input.active

    set sc = obj.%Save()
    if $$$ISERR(sc) {
        set %response.Status = 400
        write {"error": ($SYSTEM.Status.GetErrorText(sc))}.%ToJSON()
        quit $$$OK
    }

    do obj.%JSONExport()
    quit $$$OK
}

/// DELETE /role/:id - Delete role
ClassMethod Delete(pId As %Integer) As %Status
{
    set sc = ##class(dc.CliniNote.Role).%DeleteId(pId)
    if $$$ISERR(sc) {
        set %response.Status = 500
        write {"error":($SYSTEM.Status.GetErrorText(sc))}.%ToJSON()
        quit $$$OK
    }

    set %response.Status = 204
    write {}
    quit $$$OK
}

}
