Class dc.CliniNote.SampleDataGenerator Extends %RegisteredObject
{

/// Main method – call this to generate everything
ClassMethod GenerateSampleData() As %Status
{
    set tSC = $$$OK
    try {
        write !,"Creating sample patients...",!
        set tSC = ..CreatePatients()
        if $$$ISERR(tSC) $$$ThrowStatus(tSC)

        write !,"Creating sample episodes...",!
        set tSC = ..CreateEpisodes()
        if $$$ISERR(tSC) $$$ThrowStatus(tSC)

        write !,"Creating sample CliniNote notes...",!
        set tSC = ..CreateNotes()
        if $$$ISERR(tSC) $$$ThrowStatus(tSC)

        write !,"Creating sample Users...",!
        do ##class(dc.CliniNote.User).CreateTestUsers()

        write !,"Creating sample Roles...",!
        do ##class(dc.CliniNote.Role).CreateTestRoles()

        write !,"Sample data generation completed successfully.",!
        write "Summary:",!

        &sql(SELECT COUNT(*) INTO :cntP FROM dc_CliniNote.Patient)
        &sql(SELECT COUNT(*) INTO :cntE FROM dc_CliniNote.Episode)
        &sql(SELECT COUNT(*) INTO :cntN FROM dc_CliniNote.Note)
        &sql(SELECT COUNT(*) INTO :cntU FROM dc_CliniNote."User")
        &sql(SELECT COUNT(*) INTO :cntR FROM dc_CliniNote."Role")

        write "  Patients : ", cntP, !
        write "  Episodes : ", cntE, !
        write "  Notes    : ", cntN, !
        write "  Users    : ", cntU, !
        write "  Roles    : ", cntR, !
    }
    catch ex {
        set tSC = ex.AsStatus()
        write !,"Error during generation:",!
        do $SYSTEM.Status.DisplayError(tSC)
    }
    quit tSC
}

/// Create 15 sample patients (idempotent version – skips if name already exists)
ClassMethod CreatePatients() As %Status [ Private ]
{
    set tSC = $$$OK
    try {
        set patients = $LISTBUILD(
            $LISTBUILD("John Michael Doe",      "1980-05-15", "Male",   "742 Evergreen Terrace",     "Springfield"),
            $LISTBUILD("Jane Elizabeth Smith",   "1992-03-22", "Female", "1600 Pennsylvania Ave NW",  "Washington"),
            $LISTBUILD("Alex Taylor Johnson",    "1975-11-10", "Other",  "221B Baker Street",         "Boston"),
            $LISTBUILD("Emily Rose Davis",       "1988-07-30", "Female", "7421 West Beverly Blvd",    "Los Angeles"),
            $LISTBUILD("Michael James Brown",    "1965-09-05", "Male",   "350 5th Avenue",            "New York"),
            $LISTBUILD("Sarah Marie Wilson",     "1995-01-18", "Female", "400 Broad Street",          "Philadelphia"),
            $LISTBUILD("David Anthony Martinez", "1982-04-25", "Male",   "1 Infinite Loop",           "Cupertino"),
            $LISTBUILD("Laura Anne Garcia",      "1978-06-12", "Female", "4059 Mount Lee Drive",      "Hollywood"),
            $LISTBUILD("James Robert Rodriguez", "1990-08-08", "Male",   "6000 Universal Blvd",       "Orlando"),
            $LISTBUILD("Olivia Grace Hernandez", "1984-10-14", "Female", "1 Rocket Road",             "Hawthorne"),
            $LISTBUILD("Robert Charles Lopez",   "1972-12-20", "Male",   "1000 E University Avenue",  "Austin"),
            $LISTBUILD("Sophia Isabella Gonzalez","1998-02-28","Female", "1600 Amphitheatre Parkway", "Mountain View"),
            $LISTBUILD("William Thomas Perez",   "1968-11-03", "Male",   "1 Microsoft Way",           "Redmond"),
            $LISTBUILD("Isabella Sophia Torres", "1986-09-09", "Female", "7600 Keystone Crossing",    "Columbus"),
            $LISTBUILD("Daniel Joseph Ramirez",  "1993-07-16", "Male",   "100 N Tryon Street",        "Charlotte")
        )

        for i = 1:1:$LISTLENGTH(patients) {
            set data   = $LISTGET(patients, i)
            set name   = $LISTGET(data, 1)

            // Skip if patient with this name already exists (avoids unique index error)
            &sql(SELECT 1 INTO :exists FROM dc_CliniNote.Patient WHERE Name = :name)
            if (SQLCODE = 0) && (exists = 1) continue

            set patient = ##class(dc.CliniNote.Patient).%New()
            set patient.Name    = name
            set patient.DOB     = $ZDATEH($LISTGET(data, 2), 3)
            set patient.Gender  = $LISTGET(data, 3)
            set patient.Street  = $LISTGET(data, 4)
            set patient.City    = $LISTGET(data, 5)
            set patient.Country = "USA"

            set tSC = patient.%Save()
            if $$$ISERR(tSC) {
                write !,"Failed to save patient ", name, !
                quit
            }
        }
    }
    catch ex {
        set tSC = ex.AsStatus()
    }
    quit tSC
}

/// Create 25 sample episodes linked to patients
ClassMethod CreateEpisodes() As %Status [ Private ]
{
    set tSC = $$$OK
    try {
        // ── Collect all patient IDs using cursor ────────────────────────────────
        &sql(DECLARE PatCursor CURSOR FOR
             SELECT ID FROM dc_CliniNote.Patient ORDER BY ID)

        &sql(OPEN PatCursor)
        if (SQLCODE < 0) {
            set tSC = $$$ERROR($$$SQLError, "Failed to open patient cursor: "_SQLCODE_" "_%msg)
            quit
        }

        set patList = ""
        for {
            &sql(FETCH PatCursor INTO :patId)
            quit:(SQLCODE '= 0)

            if (patList '= "") set patList = patList _ $CHAR(31)
            set patList = patList _ patId
        }

        &sql(CLOSE PatCursor)

        if (patList = "") {
            set tSC = $$$ERROR($$$GeneralError, "No patients found – create patients first")
            quit
        }

        // ── Episode data ────────────────────────────────────────────────────────
        set episodes = $LISTBUILD(
            $LISTBUILD(1,  "2023-01-10","2023-01-15","Outpatient",   "Hypertension follow-up"),
            $LISTBUILD(2,  "2023-02-20","",          "Inpatient",    "Community-acquired pneumonia"),
            $LISTBUILD(3,  "2023-03-05","2023-03-07","Emergency",    "Atypical chest pain – ruled out ACS"),
            $LISTBUILD(4,  "2023-04-12","2023-04-18","Consultation", "Refractory atopic dermatitis"),
            $LISTBUILD(5,  "2023-05-25","",          "Surgery",      "Laparoscopic appendectomy – acute appendicitis"),
            $LISTBUILD(1,  "2023-07-01","2023-07-05","Follow-up",    "Post-appendectomy wound check"),
            $LISTBUILD(7,  "2023-07-15","",          "Outpatient",   "Type 2 diabetes – poor glycemic control"),
            $LISTBUILD(8,  "2023-08-10","2023-08-14","Inpatient",    "Closed reduction & casting – distal radius fracture"),
            $LISTBUILD(9,  "2023-09-22","2023-09-23","Emergency",    "Anaphylaxis – food allergy"),
            $LISTBUILD(10, "2023-10-05","2023-10-12","Consultation", "Chronic daily migraine – prophylaxis initiated"),
            $LISTBUILD(11, "2023-11-18","",          "Surgery",      "Total knee arthroplasty – severe osteoarthritis"),
            $LISTBUILD(12, "2023-12-01","2023-12-03","Follow-up",    "Surgical wound assessment"),
            $LISTBUILD(13, "2024-01-14","",          "Outpatient",   "Wellness visit + lipid panel review"),
            $LISTBUILD(14, "2024-02-28","2024-03-02","Inpatient",    "Acute viral gastroenteritis + dehydration"),
            $LISTBUILD(15, "2024-03-10","",          "Emergency",    "Grade 2 ankle sprain"),
            $LISTBUILD(1,  "2024-04-20","2024-04-25","Consultation", "Paroxysmal atrial fibrillation"),
            $LISTBUILD(2,  "2024-05-05","",          "Surgery",      "Inguinal hernia repair"),
            $LISTBUILD(3,  "2024-06-15","2024-06-18","Follow-up",    "Antihypertensive regimen adjustment"),
            $LISTBUILD(4,  "2024-07-22","",          "Outpatient",   "Allergen-specific immunotherapy evaluation"),
            $LISTBUILD(5,  "2024-08-10","2024-08-12","Inpatient",    "Severe dehydration – heat-related illness"),
            $LISTBUILD(6,  "2024-09-01","",          "Emergency",    "Partial thickness burn – left forearm"),
            $LISTBUILD(7,  "2024-10-14","",          "Consultation", "Thyroid nodule evaluation"),
            $LISTBUILD(8,  "2024-11-20","2024-11-22","Follow-up",    "Fracture healing check"),
            $LISTBUILD(9,  "2025-01-05","",          "Outpatient",   "Seasonal allergic rhinitis"),
            $LISTBUILD(10,"2025-02-10","",          "Inpatient",    "Acute exacerbation of COPD")
        )

        for i = 1:1:$LISTLENGTH(episodes) {
            set data   = $LISTGET(episodes, i)
            set patIdx = $LISTGET(data, 1)
            set patId  = $PIECE(patList, $CHAR(31), patIdx)

            set patient = ##class(dc.CliniNote.Patient).%OpenId(patId)
            if '$ISOBJECT(patient) continue

            set episode = ##class(dc.CliniNote.Episode).%New()
            set episode.Patient   = patient
            set episode.StartDate = $ZDATEH($LISTGET(data, 2), 3)
            set endDate = $LISTGET(data, 3)
            if (endDate '= "") set episode.EndDate = $ZDATEH(endDate, 3)
            set episode.Type      = $LISTGET(data, 4)
            set episode.Reason    = $LISTGET(data, 5)

            set tSC = episode.%Save()
            if $$$ISERR(tSC) quit
        }
    }
    catch ex {
        set tSC = ex.AsStatus()
    }
    quit tSC
}

/// Create 25 CliniNote notes (one per episode)
ClassMethod CreateNotes() As %Status [ Private ]
{
    set tSC = $$$OK
    try {
        // ── Collect all episode IDs using cursor ───────────────────────────────
        &sql(DECLARE EpCursor CURSOR FOR
             SELECT ID FROM dc_CliniNote.Episode ORDER BY ID)

        &sql(OPEN EpCursor)
        if (SQLCODE < 0) {
            set tSC = $$$ERROR($$$SQLError, "Failed to open episode cursor: "_SQLCODE_" "_%msg)
            quit
        }

        set epList = ""
        for {
            &sql(FETCH EpCursor INTO :epId)
            quit:(SQLCODE '= 0)

            if (epList '= "") set epList = epList _ $CHAR(31)
            set epList = epList _ epId
        }

        &sql(CLOSE EpCursor)

        if (epList = "") {
            set tSC = $$$ERROR($$$GeneralError, "No episodes found")
            quit
        }

        set doctors = $LISTBUILD(
            "Dr. Alice Harper MD",
            "Dr. Benjamin Cole MD",
            "Dr. Carla Ruiz MD",
            "Dr. Daniel Foster MD",
            "Dr. Elena Vasquez MD"
        )

        set notes = $LISTBUILD(
            "BP 148/92 today. Tolerating lisinopril 20 mg. Added HCTZ 12.5 mg daily. Lifestyle modifications reinforced.",
            "Admitted with fever, productive cough, SOB. CXR shows RLL consolidation. Started ceftriaxone 1g IV q24h + azithromycin.",
            "ED evaluation for sharp left chest pain ×48h. Serial troponins negative ×3. EKG normal sinus rhythm. Discharged with ibuprofen PRN.",
            "Persistent eczematous rash arms/neck. Biopsy consistent with atopic dermatitis. Prescribed triamcinolone 0.1% ointment BID + thick emollient.",
            "Uncomplicated laparoscopic appendectomy. EBL minimal. Tolerating PO clears. Anticipate discharge tomorrow if afebrile.",
            "Wound clean, dry, intact. Staples out today. No erythema or drainage. Cleared for light duty.",
            "HbA1c improved to 7.8% from 8.9%. Initiated semaglutide 0.5 mg weekly. Continue metformin 1000 mg BID. Nutrition consult placed.",
            "FOOSH injury. Closed distal radius fracture. Closed reduction under hematoma block. Sugar-tong splint applied. Ortho follow-up 1 week.",
            "Anaphylaxis after shrimp ingestion. Epinephrine 0.3 mg IM ×1 administered. Observed 6 hours – stable. Prescribed EpiPen ×2.",
            "Frequent migraines 12–15 days/month. Initiated topiramate 50 mg BID. Sumatriptan 100 mg PRN for acute attacks. Headache diary recommended.",
            "Uncomplicated right total knee arthroplasty. PT started POD#1. Multimodal pain control. Enoxaparin for VTE prophylaxis.",
            "Incision healing well, no signs of infection. Dressing removed. Dry gauze PRN. Follow-up in 2 weeks.",
            "BP 118/76 on current regimen. Lipids improved on atorvastatin 40 mg. Continue annual surveillance labs.",
            "Nausea, vomiting, diarrhea ×3 days. Received 2 L NS + ondansetron IV. Admitted for observation and rehydration.",
            "Basketball-related ankle inversion injury. Moderate edema, positive anterior drawer. RICE protocol, CAM walker ×3 weeks.",
            "Known paroxysmal AFib. Rate controlled at 68 bpm on metoprolol succinate 50 mg. Started apixaban 5 mg BID. Cardiology f/u arranged.",
            "Elective Lichtenstein inguinal hernia repair with mesh. Minimal blood loss. Discharged home same day.",
            "BP now 128/82. No orthostasis. Continue lisinopril/HCTZ combination. Next visit 3 months.",
            "Skin prick testing positive for dust mites and timothy grass. Discussed SCIT vs SLIT – patient prefers sublingual.",
            "Heat-related illness after prolonged outdoor exposure. Initial tachycardia and hypotension resolved with 3 L IV fluids.",
            "2nd degree burn 4×6 cm left forearm from cooking oil. Wound cleaned, silver sulfadiazine applied, dressed. Tetanus booster given.",
            "Thyroid US shows 1.8 cm nodule. FNA performed – results pending. TSH normal.",
            "Fracture callus formation noted on X-ray. Progressing well. Advance activity as tolerated.",
            "Seasonal allergic rhinitis flare. Nasal fluticasone + cetirizine 10 mg daily. Avoidance measures discussed.",
            "Admitted with increased dyspnea and productive cough. ABG shows respiratory acidosis. Started NIPPV + bronchodilators + steroids."
        )

        for i = 1:1:$LISTLENGTH(notes) {
            set epId = $PIECE(epList, $CHAR(31), i)
            set episode = ##class(dc.CliniNote.Episode).%OpenId(epId)
            if '$ISOBJECT(episode) continue

            set note = ##class(dc.CliniNote.Note).%New()
            set note.Episode  = episode
            set note.NoteDate = $ZDATETIME($HOROLOG, 3, 1)
            set note.Doctor   = $LISTGET(doctors, ((i-1) # 5) + 1)
            set note.Content  = $LISTGET(notes, i)
            set EmbVal = ..Embedd(note.Content)
            
            set tSC = note.%Save()
            set newId = note.%Id()
            if $$$ISERR(tSC) quit
            &sql(UPDATE dc_CliniNote.Note
            SET ContentEmbedding = TO_VECTOR(:EmbVal)
            WHERE ID = :newId)

            if SQLCODE = 100 {
                write !, "No row found "            }
            if SQLCODE < 0 {
                write !, "SQL error: ", SQLCODE, " ", %msg
            }
         
        }
    }
    catch ex {
        set tSC = ex.AsStatus()
    }
    quit tSC
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

/// Optional: clear all sample data (patients, episodes, notes)
ClassMethod ClearSampleData() As %Status
{
    &sql(DELETE FROM dc_CliniNote.Note)
    &sql(DELETE FROM dc_CliniNote.Episode)
    &sql(DELETE FROM dc_CliniNote.Patient)
    &sql(DELETE FROM dc_CliniNote.User)
    &sql(DELETE FROM dc_CliniNote.Role)
    quit $$$OK
}

}
