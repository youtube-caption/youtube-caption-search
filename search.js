/* Entry of the code */
const searchField = document.getElementById('searchWordField');
const bottomSpace = document.getElementsByClassName('bottom_blank_space')[0];
const resultView = document.getElementById('result');
let parsedCaption = null;
let videoCode = null;

searchField.focus();
searchField.addEventListener('keyup', (event) => {
        search();
});

window.onload = async () => {
    await loadDataToGlobalVariableFromAPI();
    const searchWordField = document.getElementById('searchWordField');
    searchWordField.disabled = false;
};


async function getVideoCode() {
    const currentUrl = await getCurrentUrl();
    const params = getUrlParams(currentUrl);
    return params['v'];
}


async function loadDataToGlobalVariableFromAPI() {
    videoCode = await getVideoCode();
    var vidType = await requestApi(videoCode);

    const parsedType = parseXML(vidType);
    var typeList = findCCType(parsedType);

    var defaultName = typeList[0].name;
    var defaultLang = typeList[0].langcode;

    videoCaption = await requestApi(defaultName, defaultLang);
    parsedCaption = parseXML(videoCaption);
}


function getUrlParams(url) {
    var params = {};

    url.replace(/[?&]+([^=&]+)=([^&]*)/gi,
        function (str, key, value) {
            params[key] = value;
        }
    );

    return params;
}


function getCurrentUrl() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
            if (tabs[0].url.length > 0) {
                resolve(tabs[0].url);
            } else {
                reject('Failed to get the current URL');
            }
        });
    });
}


function decodeSpecialCharacter(string) {
    return string.replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#96;/g, "`");
}


async function requestApi(name = '', lang = '') {
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        var url = `http://video.google.com/timedtext?type=list&v=${videoCode}`;
        if (lang != '') {
            url = `http://video.google.com/timedtext?name=${name}&lang=${lang}&v=${videoCode}`;
        }
        request.open('GET', url);

        request.onload = function () {
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


function parseXML(vidCC) {
    var parser = new DOMParser();
    return parser.parseFromString(vidCC, "text/xml");
}


function findCCType(parsedType) {
    var tupledTypes = [];
    var objType = parsedType.getElementsByTagName("track");
    for (var trackTag of objType) {
        console.log(trackTag);
        let trackName = trackTag.getAttribute("name");
        console.log(trackName);
        let trackLang = trackTag.getAttribute("lang_code");
        console.log(trackLang);
        tupledTypes.push({
            name: trackName,
            langcode: trackLang,
        });
    }
    return tupledTypes;
}


function findTimeStamp(searchWord, parsedCC) {
    var timeStamps = [];
    var objCC = parsedCC.getElementsByTagName("text");

    for (var textTag of objCC) {
        let targetSentence = textTag.childNodes[0].nodeValue;
        targetSentence = targetSentence.toLowerCase();
        targetSentence = decodeSpecialCharacter(targetSentence);

        if (targetSentence.includes(searchWord)) {
            var timeVal = textTag.getAttribute("start");
            timeStamps.push({
                sentence: targetSentence,
                timestamp: timeVal,
            });
        }
    }
    
    return timeStamps;
}


function pad(num, size) {
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
}


function displayResults(list) {
    for (var i = 0; i < list.length; i++) {
        const res = list[i];
        const timeStamp = Math.round(+res.timestamp);
        const hour = parseInt(timeStamp / 3600);
        const min = parseInt((timeStamp % 3600) / 60);
        const sec = timeStamp % 60;

        const div1 = document.createElement("div");
        div1.className = "card";
        const p1 = document.createElement("p");
        p1.id = `result-${i}`;
        p1.innerText = `${pad(hour, 2)}:${pad(min, 2)}:${pad(sec,2)} - ${res.sentence}`;

        p1.addEventListener('click', () => {
            goToUrl(`https://www.youtube.com/watch?v=${videoCode}&t=${timeStamp}s`);
        })
        
        div1.appendChild(p1);
        resultView.appendChild(div1);
    }
}


function goToUrl(url) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const currTab = tabs[0];
        if (currTab) {
            chrome.tabs.update(currTab.id, { url: url });
        }
    });
}




async function search() {
    bottomSpace.style.visibility = 'hidden';
    const searchWord = searchWordField.value;
    resultView.innerHTML = '';

    var timeStampsList = findTimeStamp(searchWord, parsedCaption);
    console.log(searchWord, " : ", timeStampsList.length)
    if (timeStampsList.length >= 1) {
        bottomSpace.style.visibility = 'visible';
        resultView.style.paddingBottom = '10px';
    }

    displayResults(timeStampsList);
}
