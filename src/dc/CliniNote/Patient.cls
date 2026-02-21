Class dc.CliniNote.Patient Extends (%Persistent, %JSON.Adaptor)
{

Property Name As %String(MAXLEN = 100) [ SqlColumnNumber = 2 ];

Property DOB As %Date [ SqlColumnNumber = 3 ];

Property Gender As %String(VALUELIST = ",Male,Female,Other") [ SqlColumnNumber = 4 ];

Property Street As %String(MAXLEN = 150) [ SqlColumnNumber = 5 ];

Property City As %String(MAXLEN = 50) [ SqlColumnNumber = 6 ];

Property Country As %String(MAXLEN = 50) [ InitialExpression = "USA", SqlColumnNumber = 7 ];

Index NameIdx On Name [ Unique ];

// 

Storage Default
{
<Data name="PatientDefaultData">
<Value name="1">
<Value>%%CLASSNAME</Value>
</Value>
<Value name="2">
<Value>Name</Value>
</Value>
<Value name="3">
<Value>DOB</Value>
</Value>
<Value name="4">
<Value>Gender</Value>
</Value>
<Value name="5">
<Value>Street</Value>
</Value>
<Value name="6">
<Value>City</Value>
</Value>
<Value name="7">
<Value>Country</Value>
</Value>
</Data>
<DataLocation>^dc.CliniNote.PatientD</DataLocation>
<DefaultData>PatientDefaultData</DefaultData>
<IdLocation>^dc.CliniNote.PatientD</IdLocation>
<IndexLocation>^dc.CliniNote.PatientI</IndexLocation>
<StreamLocation>^dc.CliniNote.PatientS</StreamLocation>
<Type>%Storage.Persistent</Type>
}

}
