/* Entry of the code */
const searchField = document.getElementById('searchWordField');

searchField.focus();
searchField.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        search();
    }
});


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


async function requestApi(videoCode, name = '', lang = '') {
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


function displayResults(list, resultView, videoCode) {
    const urlDict = {};

    for (var i = 0; i < list.length; i++) {
        const res = list[i];
        const timeStamp = Math.round(+res.timestamp);
        const hour = parseInt(timeStamp / 3600);
        const min = parseInt((timeStamp % 3600) / 60);
        const sec = timeStamp % 60;

        resultView.innerHTML += `
            <div class="card">
                <p id="result-${i}">
                    ${pad(hour, 2)}:${pad(min, 2)}:${pad(sec,2)} - ${res.sentence}
                </p>
            </div>
        `;

        urlDict[`result-${i}`] = `https://www.youtube.com/watch?v=${videoCode}&t=${timeStamp}s`;
    }
    return urlDict;
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
    const bottomSpace = document.getElementsByClassName('bottom_blank_space')[0];
    bottomSpace.style.visibility = 'hidden';

    const searchWordField = document.getElementById('searchWordField');
    const searchWord = searchWordField.value;

    const resultView = document.getElementById('result');
    resultView.innerHTML = '';

    const currentUrl = await getCurrentUrl();
    const params = getUrlParams(currentUrl);
    var videoCode = params['v'];

    var vidType = await requestApi(videoCode);
    const parsedType = parseXML(vidType);
    var typeList = findCCType(parsedType);
    var defaultName = typeList[0].name;
    var defaultLang = typeList[0].langcode;

    var vidCC = await requestApi(videoCode, defaultName, defaultLang);
    const parsedCC = parseXML(vidCC);
    var timeStampsList = findTimeStamp(searchWord, parsedCC);

    const isResultExist = timeStampsList.length >= 1;
    if (isResultExist) {
        bottomSpace.style.visibility = 'visible';
        resultView.style.paddingBottom = '10px';
    }

    urlDict = displayResults(timeStampsList, resultView, videoCode);

    for (let id in urlDict) {
        const resultLine = document.getElementById(id);
        resultLine.addEventListener('click', () => {
            goToUrl(urlDict[id]);
        })
    }
}