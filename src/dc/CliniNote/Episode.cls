Class dc.CliniNote.Episode Extends (%Persistent, %JSON.Adaptor)
{

/// Reference to the patient this episode belongs to
Property Patient As dc.CliniNote.Patient [ Required ];

/// Start date of the episode
Property StartDate As %Date [ Required ];

/// End date of the episode (can be empty if ongoing)
Property EndDate As %Date;

/// Type of episode (e.g. Outpatient, Inpatient, Emergency)
Property Type As %String(VALUELIST = ",Outpatient,Inpatient,Emergency,Consultation,Surgery,Follow-up");

/// Brief reason or diagnosis for this episode
Property Reason As %String(MAXLEN = 250);

Storage Default
{
<Data name="EpisodeDefaultData">
<Value name="1">
<Value>%%CLASSNAME</Value>
</Value>
<Value name="2">
<Value>Patient</Value>
</Value>
<Value name="3">
<Value>StartDate</Value>
</Value>
<Value name="4">
<Value>EndDate</Value>
</Value>
<Value name="5">
<Value>Type</Value>
</Value>
<Value name="6">
<Value>Reason</Value>
</Value>
</Data>
<DataLocation>^dc.CliniNote.EpisodeD</DataLocation>
<DefaultData>EpisodeDefaultData</DefaultData>
<IdLocation>^dc.CliniNote.EpisodeD</IdLocation>
<IndexLocation>^dc.CliniNote.EpisodeI</IndexLocation>
<StreamLocation>^dc.CliniNote.EpisodeS</StreamLocation>
<Type>%Storage.Persistent</Type>
}

}
