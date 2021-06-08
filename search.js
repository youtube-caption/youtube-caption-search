/* Entry of the code */
const searchBtn = document.getElementById('search_btn');
searchBtn.addEventListener('click', search);


function getUrlParams(url) {     
    var params = {};  
    
    url.replace(/[?&]+([^=&]+)=([^&]*)/gi, 
    	function(str, key, value) { 
        	params[key] = value; 
        }
    );     
    
    return params; 
}


function getCurrentUrl() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
            if(tabs[0].url.length > 0) {
                resolve(tabs[0].url);
            } else {
                reject('Failed to get the current URL');
            }
        });
    });
}


// Deserialize XML file 
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
            timeStamps.push({
                sentence: targetSentence,
                timestamp: timeVal,
            });
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


function requestApi(lang, videoCode) {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        const url = `http://video.google.com/timedtext?lang=${lang}&v=${videoCode}`;
        request.open('GET', url);
    
        request.onload = function() {
            if (this.status >= 200 && this.status < 300) {
                resolve(request.response);
            } else {
                reject({
                    status: this.status,
                    statusText: request.statusText
                });
            }
        }

        request.send();
    })
}


function goToUrl(url) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currTab = tabs[0];
        if (currTab) {
            chrome.tabs.update(currTab.id, {url: url});
        }
    });
}


async function search() {
    const searchWordField = document.getElementById('searchWordField');
    const searchWord = searchWordField.value;

    const resultView = document.getElementById('result');
    resultView.innerHTML = '';

    const currentUrl = await getCurrentUrl();
    const params = getUrlParams(currentUrl);
    const videoCode = params['v'];

    var vidCC = await requestApi('en', videoCode);
    parsedCC = parseXML(vidCC);

    var timeStampsList = findTimeStamp(searchWord, parsedCC);

    const urlDict = {};

    for (var i = 0; i < timeStampsList.length; i++) {
        const res = timeStampsList[i];
        const timeStamp = Math.round(+res.timestamp);
        resultView.innerHTML += `
            <div>
                <button id="result-${i}">
                    ${timeStamp} : [i${res.sentence}
                </button>
                <br>
            </div>
        `;

        urlDict[`result-${i}`] = `https://www.youtube.com/watch?v=${videoCode}&t=${timeStamp}s`;
    }

    for(let id in urlDict) {
        const resultLine = document.getElementById(id);
        resultLine.addEventListener('click', () => {
            goToUrl(urlDict[id]);
        })
    }
}