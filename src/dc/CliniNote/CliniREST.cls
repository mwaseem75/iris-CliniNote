Class dc.CliniNote.CliniREST Extends %CSP.REST
{

/// Allow CORS for browser frontend
Parameter HandleCorsRequest = 1;

/// Default response type is JSON
Parameter CONTENTTYPE = "application/json";

/// URL routes for all patient operations
XData UrlMap [ XMLNamespace = "http://www.intersystems.com/urlmap" ]
{
<Routes>
     <!-- Patient routes -->
    <Route Url="/patients" Method="GET" Call="ListPatients" />
    <Route Url="/patient/:id" Method="GET" Call="GetPatient" />
    <Route Url="/patient" Method="POST" Call="CreatePatient" />
    <Route Url="/patient/:id" Method="PUT" Call="UpdatePatient" />
    <Route Url="/patient/:id" Method="DELETE" Call="DeletePatient" />
    <Route Url="/patients/columns" Method="GET" Call="GetPatientColumns" />

    <!-- Episode routes -->
    <Route Url="/episodes" Method="GET" Call="ListEpisodes" />
    <Route Url="/episode/:id" Method="GET" Call="GetEpisode" />
    <Route Url="/episode" Method="POST" Call="CreateEpisode" />
    <Route Url="/episode/:id" Method="PUT" Call="UpdateEpisode" />
    <Route Url="/episode/:id" Method="DELETE" Call="DeleteEpisode" />
    <Route Url="/episodes/columns" Method="GET" Call="GetEpisodeColumns" />

    <!-- Note routes -->
    <Route Url="/notes" Method="GET" Call="ListNotes" />
    <Route Url="/note/:id" Method="GET" Call="GetNote" />
    <Route Url="/note" Method="POST" Call="CreateNote" />
    <Route Url="/note/:id" Method="PUT" Call="UpdateNote" />
    <Route Url="/note/:id" Method="DELETE" Call="DeleteNote" />
    <Route Url="/notes/columns" Method="GET" Call="GetNoteColumns" />

    <Route Url="/login" Method="POST" Call="Login" />
</Routes>
}

ClassMethod Login() As %Status
{
    set input = {}.%FromJSON(%request.Content)
    if input.%IsDefined("username")="" || input.%IsDefined("password")="" {
        set %response.Status = 400
        write {"error":"Username and password required"}.%ToJSON()
        quit $$$OK
    }

    set username = input.username
    set providedPass = input.password

    #; set username = "admin1"
    #; set providedPass = "test"

    set user = ""
    &sql(SELECT %ID INTO :userId FROM "dc_CliniNote"."User" WHERE Username = :username)
    if SQLCODE = 0, userId '= "" {
        set user = ##class(dc.CliniNote.User).%OpenId(userId)
    }
    if '$IsObject(user) {
        set %response.Status = 401
        write {"error":"Invalid User"}.%ToJSON()
        quit $$$OK
    }

    set hashedPass = ..HashPassword(providedPass)  // Use the same hash function as dc.CliniNote.User
    if user.PasswordHash '= hashedPass {
        set %response.Status = 401
        write {"error":"Invalid credentials"}.%ToJSON()
        quit $$$OK
    }

    if user.Active '= 1 {
        set %response.Status = 403
        write {"error":"User inactive"}.%ToJSON()
        quit $$$OK
    }

    #; // Update last login
    #; set user.LastLogin = $HOROLOG
    #; do user.%Save()

    // Return basic user info (no token for now)
    write {
        "userId": (user.%Id()),
        "username": (user.Username),
        "fullName": (user.FullName),
        "role": (user.Role)
    }.%ToJSON()

    quit $$$OK
}

ClassMethod HashPassword(password As %String) As %String
{
    quit $SYSTEM.Encryption.SHAHash(256, password)
}

/// PATIENTS
ClassMethod ListPatients() As %Status
{
    quit ##class(dc.CliniNote.PatientREST).ListAll()
}

ClassMethod GetPatient(pId As %Integer) As %Status
{
    quit ##class(dc.CliniNote.PatientREST).GetOne(pId)
}

/// GET /patients - List all patients
ClassMethod CreatePatient() As %Status
{
    quit ##class(dc.CliniNote.PatientREST).Create()
}

/// POST /patient - Create new patient
ClassMethod UpdatePatient(pId As %Integer) As %Status
{
    quit ##class(dc.CliniNote.PatientREST).Update(pId)
}

/// PUT /patient/:id - Update existing patient
ClassMethod DeletePatient(pId As %Integer) As %Status
{
    quit ##class(dc.CliniNote.PatientREST).Delete(pId)
}

/// Description
ClassMethod GetPatientColumns() As %Status
{
    quit ##class(dc.CliniNote.PatientREST).GetColumns()
}

// EPISODES

ClassMethod ListEpisodes() As %Status
{
    quit ##class(dc.CliniNote.EpisodeREST).ListAll()
}

ClassMethod GetEpisode(pId As %Integer) As %Status
{
    quit ##class(dc.CliniNote.EpisodeREST).GetOne(pId)
}

/// GET /patients - List all patients
ClassMethod CreateEpisode() As %Status
{
    quit ##class(dc.CliniNote.EpisodeREST).Create()
}

/// POST /patient - Create new patient
ClassMethod UpdateEpisode(pId As %Integer) As %Status
{
    quit ##class(dc.CliniNote.EpisodeREST).Update(pId)
}

/// PUT /patient/:id - Update existing patient
ClassMethod DeleteEpisode(pId As %Integer) As %Status
{
    quit ##class(dc.CliniNote.EpisodeREST).Delete(pId)
}

/// Description
ClassMethod GetEpisodeColumns() As %Status
{
    quit ##class(dc.CliniNote.EpisodeREST).GetColumns()
}

// NOTES

ClassMethod ListNotes() As %Status
{
    quit ##class(dc.CliniNote.NoteREST).ListAll()
}

ClassMethod GetNote(pId As %Integer) As %Status
{
    quit ##class(dc.CliniNote.NoteREST).GetOne(pId)
}

/// GET /patients - List all patients
ClassMethod CreateNote() As %Status
{
    quit ##class(dc.CliniNote.NoteREST).Create()
}

/// POST /patient - Create new patient
ClassMethod UpdateNote(pId As %Integer) As %Status
{
    quit ##class(dc.CliniNote.NoteREST).Update(pId)
}

/// PUT /patient/:id - Update existing patient
ClassMethod DeleteNote(pId As %Integer) As %Status
{
    quit ##class(dc.CliniNote.NoteREST).Delete(pId)
}

/// Description
ClassMethod GetNoteColumns() As %Status
{
    quit ##class(dc.CliniNote.NoteREST).GetColumns()
}

}
