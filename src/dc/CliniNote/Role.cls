Class dc.CliniNote.Role Extends (%Persistent, %JSON.Adaptor)
{

// 

Property Name As %String(MAXLEN = 50) [ Required ];

// e.g. "Admin", "Doctor", "Nurse"

Property Description As %String(MAXLEN = 200);

Property Permissions As %String(MAXLEN = 1000);

// comma-separated, e.g. "Patient:RW,Episode:R,Note:RW"

Property Active As %Boolean [ InitialExpression = 1 ];

ClassMethod CreateTestRoles() As %Status
{
    set roles = $LISTBUILD(
        $LISTBUILD("Admin", "Full access to all data", "Patient:RW,Episode:RW,Note:RW"),
        $LISTBUILD("Doctor", "Doctor access", "Patient:RW,Episode:RW,Note:RW"),
        $LISTBUILD("Nurse", "Nurse access", "Patient:R,Episode:R,Note:RW"),
        $LISTBUILD("Viewer", "Read-only", "Patient:R,Episode:R,Note:R")
    )

    set sc = $$$OK
    for i=1:1:$LISTLENGTH(roles) {
        set roleData = $LISTGET(roles, i)
        set role = ##class(dc.CliniNote.Role).%New()
        set role.Name = $LISTGET(roleData, 1)
        set role.Description = $LISTGET(roleData, 2)
        set role.Permissions = $LISTGET(roleData, 3)
        set role.Active = 1
        set sc = role.%Save()
        if $$$ISERR(sc) quit
    }
    quit sc
}

Storage Default
{
<Data name="RoleDefaultData">
<Value name="1">
<Value>%%CLASSNAME</Value>
</Value>
<Value name="2">
<Value>Name</Value>
</Value>
<Value name="3">
<Value>Description</Value>
</Value>
<Value name="4">
<Value>Permissions</Value>
</Value>
<Value name="5">
<Value>Active</Value>
</Value>
</Data>
<DataLocation>^dc.CliniNote.RoleD</DataLocation>
<DefaultData>RoleDefaultData</DefaultData>
<IdLocation>^dc.CliniNote.RoleD</IdLocation>
<IndexLocation>^dc.CliniNote.RoleI</IndexLocation>
<StreamLocation>^dc.CliniNote.RoleS</StreamLocation>
<Type>%Storage.Persistent</Type>
}

}
