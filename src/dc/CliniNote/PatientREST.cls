Class dc.CliniNote.PatientREST Extends %CSP.REST
{

/// GET /patients - List all patients
ClassMethod ListAll() As %Status
{
    set tArray = []
    set rs = ##class(%SQL.Statement).%ExecDirect(,"SELECT %ID, Name, DOB, Gender, Street, City, Country FROM dc_CliniNote.Patient")
    while rs.%Next() {
        do tArray.%Push({
            "id": (rs.%Get("ID")),
            "name": (rs.%Get("Name")),
            "dob": ($ZDATE(rs.%Get("DOB"),3)),
            "gender": (rs.%Get("Gender")),
            "street": (rs.%Get("Street")),
            "city": (rs.%Get("City")),
            "country": (rs.%Get("Country"))
        })
    }
    write tArray.%ToJSON()
    quit $$$OK
}

/// GET /patient/:id - Get one patient by ID
ClassMethod GetOne(pId As %Integer) As %Status
{
    set obj = ##class(dc.CliniNote.Patient).%OpenId(pId)
    if '$IsObject(obj) {
        set %response.Status = 404
        write {"error":"Patient not found"}.%ToJSON()
        quit $$$OK
    }
    do obj.%JSONExport()
    quit $$$OK
}

/// POST /patient - Create new patient
ClassMethod Create() As %Status
{
    set input = {}.%FromJSON(%request.Content)
    if input.%IsDefined("name")="" {
        set %response.Status = 400
        write {"error":"Name is required"}.%ToJSON()
        quit $$$OK
    }

    set obj = ##class(dc.CliniNote.Patient).%New()
    set obj.Name = input.name
    if input.%IsDefined("dob") set obj.DOB = $ZDATEH(input.dob, 3)
    if input.%IsDefined("gender") set obj.Gender = input.gender
    if input.%IsDefined("street") set obj.Street = input.street
    if input.%IsDefined("city") set obj.City = input.city
    if input.%IsDefined("country") set obj.Country = input.country

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

/// PUT /patient/:id - Update existing patient
ClassMethod Update(pId As %Integer) As %Status
{
    set obj = ##class(dc.CliniNote.Patient).%OpenId(pId)
    if '$IsObject(obj) {
        set %response.Status = 404
        write {"error":"Patient not found"}.%ToJSON()
        quit $$$OK
    }

    set input = {}.%FromJSON(%request.Content)

    if input.%IsDefined("name") set obj.Name = input.name
    if input.%IsDefined("dob") set obj.DOB = $ZDATEH(input.dob, 3)
    if input.%IsDefined("gender") set obj.Gender = input.gender
    if input.%IsDefined("street") set obj.Street = input.street
    if input.%IsDefined("city") set obj.City = input.city
    if input.%IsDefined("country") set obj.Country = input.country

    set sc = obj.%Save()
    if $$$ISERR(sc) {
        set %response.Status = 400
        write {"error": ($SYSTEM.Status.GetErrorText(sc))}.%ToJSON()
        quit $$$OK
    }

    do obj.%JSONExport()
    quit $$$OK
}

/// DELETE /patient/:id - Delete patient
ClassMethod Delete(pId As %Integer) As %Status
{
    set sc = ##class(dc.CliniNote.Patient).%DeleteId(pId)
    if $$$ISERR(sc) {
        set %response.Status = 500
        write {"error":($SYSTEM.Status.GetErrorText(sc))}.%ToJSON()
        quit $$$OK
    }

    set %response.Status = 204
    write {}
    quit $$$OK
}

/// GET /patients/columns - Return Tabulator-compatible column definitions
ClassMethod GetColumns() As %Status
{
    set tColumns = []

    // === Manually define the exact order and settings you want ===

    // 1. ID (always first)
    set tCol = {}
    do tCol.%Set("title", "ID")
    do tCol.%Set("field", "id")
    do tCol.%Set("width", 80)
    do tCol.%Set("editable", 0)
    do tColumns.%Push(tCol)

    // 2. Your actual properties – in the order YOU want them displayed
    do ..AddColumn(tColumns, "Name",     "name",     "input")
    do ..AddColumn(tColumns, "DOB",   "dob",  "date")
    do ..AddColumn(tColumns, "Gender",        "gender",         "input")   // or "select" later
    do ..AddColumn(tColumns, "Street",       "street",        "input")
    do ..AddColumn(tColumns, "City",          "City",           "input")
    do ..AddColumn(tColumns, "Country",       "country",       "input")

    write tColumns.%ToJSON()
    quit $$$OK
}

/// Helper method to make it cleaner and easier to maintain
ClassMethod AddColumn(pArray As %DynamicArray, pProperty As %String, pTitle As %String, pEditor As %String = "input", pWidth As %Integer = "", pExtra As %DynamicObject = "") As %Status
{
    set tCol = {}
    do tCol.%Set("title", pTitle)
    do tCol.%Set("field", $ZCONVERT(pProperty,"L"))

    if pWidth '="" {
        do tCol.%Set("width", pWidth)
    }

    // Basic editor + sensible defaults
    if pEditor = "date" {
        do tCol.%Set("editor", "date")
    } elseif pEditor = "number" {
        do tCol.%Set("editor", "number")
        do tCol.%Set("editorParams", {"min":0})
    } elseif pEditor = "textarea" {
        do tCol.%Set("editor", "textarea")
    } else {
        do tCol.%Set("editor", "input")
    }

    // Merge any extra settings (align, formatter, etc.)
    if $IsObject(pExtra) {
        set key = ""
        for {
            set key = pExtra.%GetNext(.key,.value)
            quit:key=""
            do tCol.%Set(key, value)
        }
    }

    do pArray.%Push(tCol)
    quit $$$OK
}

}
