Class dc.CliniNote.Note Extends (%Persistent, %JSON.Adaptor)
{

/// Reference to the episode this note belongs to
Property Episode As dc.CliniNote.Episode [ Required ];

/// Date and time when the note was written
Property NoteDate As %DateTime [ InitialExpression = {$HOROLOG}, Required ];

/// Doctor who wrote the note (name or ID)
Property Doctor As %String(MAXLEN = 100) [ Required ];

/// The actual CliniNote note content (free text)
Property Content As %Text(MAXLEN = 4000) [ Required ];

Storage Default
{
<Data name="NoteDefaultData">
<Value name="1">
<Value>%%CLASSNAME</Value>
</Value>
<Value name="2">
<Value>Episode</Value>
</Value>
<Value name="3">
<Value>NoteDate</Value>
</Value>
<Value name="4">
<Value>Doctor</Value>
</Value>
<Value name="5">
<Value>Content</Value>
</Value>
</Data>
<DataLocation>^dc.CliniNote.NoteD</DataLocation>
<DefaultData>NoteDefaultData</DefaultData>
<IdLocation>^dc.CliniNote.NoteD</IdLocation>
<IndexLocation>^dc.CliniNote.NoteI</IndexLocation>
<StreamLocation>^dc.CliniNote.NoteS</StreamLocation>
<Type>%Storage.Persistent</Type>
}

}
