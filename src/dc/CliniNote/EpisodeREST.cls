Class dc.CliniNote.EpisodeREST Extends %CSP.REST
{

/// GET /episodes - List all episodes
ClassMethod ListAll() As %Status
{
    set tArray = []
    set rs = ##class(%SQL.Statement).%ExecDirect(,"SELECT %ID, Patient, StartDate, EndDate, Type, Reason FROM dc_CliniNote.Episode")
   
    
    while rs.%Next() {
        do tArray.%Push({
            "id": (rs.%Get("ID")),
            "patient": (rs.%Get("Patient")),
            "startdate": ($ZDATE(rs.%Get("StartDate"),3)),
            "enddate": ($ZDATE(rs.%Get("EndDate"),3)),
            "type": (rs.%Get("Type")),
            "reason": (rs.%Get("Reason"))
        })
    }
    write tArray.%ToJSON()
    quit $$$OK
}

/// GET /episode/:id - Get one episode
ClassMethod GetOne(pId As %Integer) As %Status
{
    set obj = ##class(dc.CliniNote.Episode).%OpenId(pId)
    if '$IsObject(obj) {
        set %response.Status = 404
        write {"error":"Episode not found"}.%ToJSON()
        quit $$$OK
    }
    do obj.%JSONExport()
    quit $$$OK
}

/// POST /episode - Create new episode
ClassMethod Create() As %Status
{
    set input = {}.%FromJSON(%request.Content)
    if input.%IsDefined("patient")="" || input.%IsDefined("startDate")="" {
        set %response.Status = 400
        write {"error":"Patient and StartDate are required"}.%ToJSON()
        quit $$$OK
    }

    set obj = ##class(dc.CliniNote.Episode).%New()
    set obj.Patient = ##class(dc.CliniNote.Patient).%OpenId(input.patient)
    set obj.StartDate = input.startDate
    if input.%IsDefined("endDate") set obj.EndDate = input.endDate
    if input.%IsDefined("type") set obj.Type = input.type
    if input.%IsDefined("reason") set obj.Reason = input.reason

    set sc = obj.%Save()
    if $$$ISERR(sc) {
        set %response.Status = 400
        write {"error":($SYSTEM.Status.GetErrorText(sc))}.%ToJSON()
        quit $$$OK
    }

    set %response.Status = 201
    do obj.%JSONExport()
    quit $$$OK
}

/// PUT /episode/:id - Update episode
ClassMethod Update(pId As %Integer) As %Status
{
    set obj = ##class(dc.CliniNote.Episode).%OpenId(pId)
    if '$IsObject(obj) {
        set %response.Status = 404
        write {"error":"Episode not found"}.%ToJSON()
        quit $$$OK
    }

    set input = {}.%FromJSON(%request.Content)

    if input.%IsDefined("patient") set obj.Patient = ##class(dc.CliniNote.Patient).%OpenId(input.patient)
    if input.%IsDefined("startDate") set obj.StartDate = input.startDate
    if input.%IsDefined("endDate") set obj.EndDate = input.endDate
    if input.%IsDefined("type") set obj.Type = input.type
    if input.%IsDefined("reason") set obj.Reason = input.reason

    set sc = obj.%Save()
    if $$$ISERR(sc) {
        set %response.Status = 400
        write {"error":($SYSTEM.Status.GetErrorText(sc))}.%ToJSON()
        quit $$$OK
    }

    do obj.%JSONExport()
    quit $$$OK
}

/// DELETE /episode/:id - Delete episode
ClassMethod Delete(pId As %Integer) As %Status
{
    set sc = ##class(dc.CliniNote.Episode).%DeleteId(pId)
    if $$$ISERR(sc) {
        set %response.Status = 500
        write {"error":($SYSTEM.Status.GetErrorText(sc))}.%ToJSON()
        quit $$$OK
    }

    set %response.Status = 204
    write {}
    quit $$$OK
}

/// GET /episodes/columns - Dynamic columns for Tabulator
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
    do ..AddColumn(tColumns, "patient",    "Patient",    "input")
    do ..AddColumn(tColumns, "startdate",  "startDate",  "date")
    do ..AddColumn(tColumns, "enddate",    "endDate",    "date")   // or "select" later
    do ..AddColumn(tColumns, "type",       "Type",       "input")
    do ..AddColumn(tColumns, "reason",     "Reason",     "input")


    write tColumns.%ToJSON()
    quit $$$OK
}

/// Helper method to make it cleaner and easier to maintain
ClassMethod AddColumn(pArray As %DynamicArray, pProperty As %String, pTitle As %String, pEditor As %String = "input", pWidth As %Integer = "", pExtra As %DynamicObject = "") As %Status
{
    set tCol = {}
    do tCol.%Set("title", pTitle)
    do tCol.%Set("field", $ZCONVERT(pProperty,"L"))

    //do tCol.%Set("field", pProperty)

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
