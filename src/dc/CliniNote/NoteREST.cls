Class dc.CliniNote.NoteREST Extends %CSP.REST
{

/// GET /notes - List all notes (with joined episode and patient info)
ClassMethod ListAll() As %Status
{
    set tArray = []
    set rs = ##class(%SQL.Statement).%ExecDirect(,"SELECT n.%ID, n.NoteDate, n.Doctor, n.Content, e.ID As EpisodeID,  e.Type As EpisodeType, p.Name As PatientName FROM dc_CliniNote.Note n LEFT JOIN dc_CliniNote.Episode e ON n.Episode = e.ID LEFT JOIN dc_CliniNote.Patient p ON e.Patient = p.ID")
    while rs.%Next() {
        // Build friendly episode label (same as in dropdown)
        set label = "#" _ rs.%Get("EpisodeID")
        if rs.%Get("EpisodeType") '= "" set label = label _ "(" _ rs.%Get("EpisodeType") _ ")"
        if rs.%Get("PatientName") '= "" set label = label _ ":" _ rs.%Get("PatientName")
        do tArray.%Push({
            "id": (rs.%Get("ID")),
            "notedate": (rs.%Get("NoteDate")),
            "doctor": (rs.%Get("Doctor")),
            "content": (rs.%Get("Content")),
            "episode": (rs.%Get("EpisodeID")),
            "episodeLabel": (label),
            "patientName": (rs.%Get("PatientName"))
        })
    }
    write tArray.%ToJSON()
    quit $$$OK
}

/// GET /note/:id - Get single note by ID
ClassMethod GetOne(pId As %Integer) As %Status
{
    set obj = ##class(dc.CliniNote.Note).%OpenId(pId)
    if '$IsObject(obj) {
        set %response.Status = 404
        write {"error":"Note not found"}.%ToJSON()
        quit $$$OK
    }
    do obj.%JSONExport()
    quit $$$OK
}

/// POST /note - Create new CliniNote note
ClassMethod Create() As %Status
{
    set input = {}.%FromJSON(%request.Content)
    if input.%IsDefined("episode")="" || input.%IsDefined("doctor")="" || input.%IsDefined("content")="" {
        set %response.Status = 400
        write {"error":"Episode ID, Doctor, and Content are required"}.%ToJSON()
        quit $$$OK
    }

    set obj = ##class(dc.CliniNote.Note).%New()
    set obj.Episode = ##class(dc.CliniNote.Episode).%OpenId(input.episode)
    if '$IsObject(obj.Episode) {
        set %response.Status = 400
        write {"error":"Invalid Episode ID"}.%ToJSON()
        quit $$$OK
    }
    set obj.Doctor = input.doctor
    set obj.Content = input.content
    //set obj.NoteDate =$ZDATEH(input.notedate, 3)
    // NoteDate is auto-set by InitialExpression

    set sc = obj.%Save()
    if $$$ISERR(sc) {
        set %response.Status = 400
        write {"error":($SYSTEM.Status.GetErrorText(sc))}.%ToJSON()
        quit $$$OK
    }
    set newId = obj.%Id()
    set EmbVal = ..Embedd(input.content)
    &sql(UPDATE dc_CliniNote.Note
        SET ContentEmbedding = TO_VECTOR(:EmbVal)
        WHERE ID = :newId)

    if SQLCODE = 100 {
            write !, "No row found with ID ", id
         }
    if SQLCODE < 0 {
            write !, "SQL error: ", SQLCODE, " ", %msg
        }
    set %response.Status = 201
    do obj.%JSONExport()
    quit $$$OK
}

/// PUT /note/:id - Update existing note
ClassMethod Update(pId As %Integer) As %Status
{
    set obj = ##class(dc.CliniNote.Note).%OpenId(pId)
    if '$IsObject(obj) {
        set %response.Status = 404
        write {"error":"Note not found"}.%ToJSON()
        quit $$$OK
    }

    set input = {}.%FromJSON(%request.Content)

    if input.%IsDefined("episode") {
        set obj.Episode = ##class(dc.CliniNote.Episode).%OpenId(input.episode)
        if '$IsObject(obj.Episode) {
            set %response.Status = 400
            write {"error":"Invalid Episode ID"}.%ToJSON()
            quit $$$OK
        }
    }
    if input.%IsDefined("doctor") set obj.Doctor = input.doctor
    if input.%IsDefined("content") set obj.Content = input.content
    // NoteDate is not updated (kept as original)

    set sc = obj.%Save()
    if $$$ISERR(sc) {
        set %response.Status = 400
        write {"error":($SYSTEM.Status.GetErrorText(sc))}.%ToJSON()
        quit $$$OK
    }
    set EmbVal = ..Embedd(input.content)
    &sql(UPDATE dc_CliniNote.Note
        SET ContentEmbedding = TO_VECTOR(:EmbVal)
        WHERE ID = :pId)

    do obj.%JSONExport()
    quit $$$OK
}

/// DELETE /note/:id - Delete note
ClassMethod Delete(pId As %Integer) As %Status
{
    set sc = ##class(dc.CliniNote.Note).%DeleteId(pId)
    if $$$ISERR(sc) {
        set %response.Status = 500
        write {"error":($SYSTEM.Status.GetErrorText(sc))}.%ToJSON()
        quit $$$OK
    }

    set %response.Status = 204
    write {}
    quit $$$OK
}

/// GET /notes/columns - Dynamic columns for Tabulator grid
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
    do ..AddColumn(tColumns, "Episode",    "Episode",    "input")
    do ..AddColumn(tColumns, "NoteDate",  "NoteDate",  "date")
    do ..AddColumn(tColumns, "Doctor",    "Doctor",    "input")   // or "select" later
    do ..AddColumn(tColumns, "Content",       "Content",       "textarea")



    write tColumns.%ToJSON()
    quit $$$OK
}

ClassMethod Embedd(sentences) As %String [ Language = python ]
{
	from sentence_transformers import SentenceTransformer

	model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
	embeddings = model.encode(sentences, normalize_embeddings = True)

	# convert the embeddings to a string
	embeddings_list = [str(embedding.tolist()) for embedding in embeddings]
	s1 = str(embeddings_list)

	# remove apostrophes
	return s1.replace('\'','')
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
