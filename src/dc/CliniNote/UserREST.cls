Class dc.CliniNote.UserREST Extends %CSP.REST
{

ClassMethod ListAll() As %Status
{
 
    set sql = "SELECT ID, Username, FullName, ""Role"", Email, Active FROM dc_CliniNote.""User""" 
    set stmt = ##class(%SQL.Statement).%New()
    set sc = stmt.%Prepare(sql)
    quit:$$$ISERR(sc) sc

    set rs = stmt.%Execute()
    set result = []
    while rs.%Next() {
        do result.%Push({
            "id": (rs.%Get("ID")),
            "username": (rs.%Get("Username")),
            "fullname": (rs.%Get("FullName")),
            "role": (rs.%Get("Role")),
            "email": (rs.%Get("Email")),
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
        { "title": "Username", "field": "username" },
        { "title": "Full Name", "field": "fullname" },
        { "title": "Email", "field": "email" },
        { "title": "Role", "field": "role" },
        { "title": "Active", "field": "active", "formatter": "tickCross" }
    ]
    write columns.%ToJSON()
    quit $$$OK
}

/// GET /user/:id - Get one user by ID
ClassMethod GetOne(pId As %Integer) As %Status
{
    set obj = ##class(dc.CliniNote.User).%OpenId(pId)
    if '$IsObject(obj) {
        set %response.Status = 404
        write {"error":"User not found"}.%ToJSON()
        quit $$$OK
    }
    do obj.%JSONExport()
    quit $$$OK
}

/// POST /user - Create new user
ClassMethod Create() As %Status
{
    set input = {}.%FromJSON(%request.Content)
    
    if input.%IsDefined("username")="" || input.%IsDefined("password")="" {
        set %response.Status = 400
        write {"error":"Username and password required"}.%ToJSON()
        quit $$$OK
    }
    set obj = ##class(dc.CliniNote.User).%New()
    if input.%IsDefined("username") set obj.Username = input.username
    if input.%IsDefined("fullname") set obj.FullName = input.fullname
    if input.%IsDefined("email") set obj.Email = input.email
    if input.%IsDefined("role") set obj.Role = input.role
    if input.%IsDefined("password") set obj.PasswordHash = ..HashPassword(input.password)
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

/// PUT /user/:id - Update existing user
ClassMethod Update(pId As %Integer) As %Status
{
    set obj = ##class(dc.CliniNote.User).%OpenId(pId)
    if '$IsObject(obj) {
        set %response.Status = 404
        write {"error":"User not found"}.%ToJSON()
        quit $$$OK
    }

    set input = {}.%FromJSON(%request.Content)

    if input.%IsDefined("username") set obj.Username = input.username
    if input.%IsDefined("fullname") set obj.FullName = input.fullname
    if input.%IsDefined("email") set obj.Email = input.email
    if input.%IsDefined("active") set obj.Active = input.active
    if input.%IsDefined("role") set obj.Role = input.role
    if input.%IsDefined("password") && (input.password '= "") {
        set obj.PasswordHash = $SYSTEM.Encryption.SHAHash(256, input.password)
    }
    set sc = obj.%Save()
    if $$$ISERR(sc) {
        set %response.Status = 400
        write {"error": ($SYSTEM.Status.GetErrorText(sc))}.%ToJSON()
        quit $$$OK
    }

    do obj.%JSONExport()
    quit $$$OK
}

/// DELETE /user/:id - Delete user
ClassMethod Delete(pId As %Integer) As %Status
{
    set sc = ##class(dc.CliniNote.User).%DeleteId(pId)
    if $$$ISERR(sc) {
        set %response.Status = 500
        write {"error":($SYSTEM.Status.GetErrorText(sc))}.%ToJSON()
        quit $$$OK
    }

    set %response.Status = 204
    write {}
    quit $$$OK
}

ClassMethod HashPassword(password As %String) As %String
{
    quit $SYSTEM.Encryption.SHAHash(256, password)
}

}
