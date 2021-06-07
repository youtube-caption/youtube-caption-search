
// Serialize XML file 
function parseXML(vidCC) {
    var parser = new DOMParser();
    return parser.parseFromString(vidCC, "text/xml");
}

function findTimeStamp(searchWord, parsedCC) {
    var timeStamps = [];
    var objCC = parsedCC.getElementsByTagName("text");
    for (var i = 0; i < objCC.length; i++) {
        let targetSentence = objCC[i].childNodes[0].nodeValue;
        targetSentence = targetSentence.toLowerCase();
        targetSentence = decodeSpecialCharacter(targetSentence);

        if (targetSentence.includes(searchWord)) {
            var timeVal = objCC[i].getAttribute("start");
            timeStamps.push(timeVal);
        }
    }
    return timeStamps;
}

function decodeSpecialCharacter(string) {
    const decodedString =  string.replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#96;/g, "`");
    
    return decodedString;
}


function search() {
    const searchWordField = document.getElementById('searchWordField');
    const searchWord = searchWordField.value;

    document.getElementById("exists").innerHTML = '';
    document.getElementById("test").innerHTML = '';

    var request = new XMLHttpRequest();
    request.open("GET", "http://video.google.com/timedtext?lang=en&v=jGwO_UgTS7I", false);
    request.send();
    var vidCC = request.responseText;
    parsedCC = parseXML(vidCC);

    var timeStampsList = findTimeStamp(searchWord, parsedCC);
    if (timeStampsList.length > 0) {
        document.getElementById("exists").innerHTML += "The time stamps are as follows:  \n";
    }
    for (var i = 0; i < timeStampsList.length; i++) {
        document.getElementById("test").innerHTML += timeStampsList[i] + "\n";
    }

}

