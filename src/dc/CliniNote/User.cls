Class dc.CliniNote.User Extends (%Persistent, %JSON.Adaptor)
{

Property Username As %String(MAXLEN = 50) [ Required ];

Property PasswordHash As %String(MAXLEN = 255) [ Required ];

// store hashed password only

Property FullName As %String(MAXLEN = 100);

Property Email As %String(MAXLEN = 100);

Property Role As %String(VALUELIST = ",Admin,Doctor,Nurse,Viewer") [ Required ];

Property Active As %Boolean [ InitialExpression = 1 ];

ClassMethod HashPassword(password As %String) As %String
{
    quit $SYSTEM.Encryption.SHAHash(256, password)
}

ClassMethod CreateUser(username As %String, password As %String, fullName As %String = "", role As %String = "Viewer", email As %String = "") As %Status
{
    // Check if username already exists
    //if ##class(dc.CliniNote.User).UsernameIndexExists(username) {
    //    return $$$ERROR($$$GeneralError, "Username already exists")
    //}

    set user = ##class(dc.CliniNote.User).%New()
    set user.Username     = username
    set user.PasswordHash = ..HashPassword(password)
    set user.FullName     = fullName
    set user.Role         = role
    set user.Email        = email
    set user.Active       = 1

    set sc = user.%Save()
    if $$$ISOK(sc) {
        write !, "User created successfully: ", username
    } else {
        write !, "Error creating user: ", $System.Status.GetErrorText(sc)
    }

    quit sc
}

ClassMethod CreateTestUsers() As %Status
{
    set users = $LISTBUILD(
        $LISTBUILD("admin",    "admin",   "Admin Superuser",     "Admin"),
        $LISTBUILD("doctor",   "doctor",  "Dr. Alice Brown",     "Doctor"),
        $LISTBUILD("nurse",    "nurse",   "Nurse Sarah Patel",   "Nurse"),
        $LISTBUILD("viewer",   "viewer",  "Guest Viewer",        "Viewer")
    )

    set sc = $$$OK
    set created = 0

    for i = 1:1:$LISTLENGTH(users) {
        set data = $LISTGET(users, i)
        set username  = $LISTGET(data, 1)
        set password  = $LISTGET(data, 2)
        set fullName  = $LISTGET(data, 3)
        set role      = $LISTGET(data, 4)

        // Skip if already exists
        //apply logic later -- continue

        set user = ##class(dc.CliniNote.User).%New()
        set user.Username     = username
        set user.PasswordHash = ..HashPassword(password)
        set user.FullName     = fullName
        set user.Role         = role
        set user.Active       = 1

        set sc = user.%Save()
        if $$$ISERR(sc) {
            write !, "Failed to create ", username, ": ", $SYSTEM.Status.GetErrorText(sc)
            quit
        }
        set created = created + 1
    }

    if $$$ISOK(sc) {
        write !, "Test users creation complete. Created ", created, " new users."
    }

    quit sc
}

Storage Default
{
<Data name="UserDefaultData">
<Value name="1">
<Value>%%CLASSNAME</Value>
</Value>
<Value name="2">
<Value>Username</Value>
</Value>
<Value name="3">
<Value>PasswordHash</Value>
</Value>
<Value name="4">
<Value>FullName</Value>
</Value>
<Value name="5">
<Value>Email</Value>
</Value>
<Value name="6">
<Value>Role</Value>
</Value>
<Value name="7">
<Value>Active</Value>
</Value>
</Data>
<DataLocation>^dc.CliniNote.UserD</DataLocation>
<DefaultData>UserDefaultData</DefaultData>
<IdLocation>^dc.CliniNote.UserD</IdLocation>
<IndexLocation>^dc.CliniNote.UserI</IndexLocation>
<StreamLocation>^dc.CliniNote.UserS</StreamLocation>
<Type>%Storage.Persistent</Type>
}

}
