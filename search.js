/* Entry of the code */
const searchField = document.getElementById('searchWordField');
const bottomSpace = document.getElementsByClassName('bottom_blank_space')[0];
const resultView = document.getElementById('result');
const searchBox = document.getElementById('search_box');

let parsedCaption = null;
let videoCode = null;


searchField.focus();
searchField.addEventListener('keyup', (event) => {
    search();
});


searchBox.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        changeSearchBox();
});

const InputType = Object.freeze({'SEARCH_BOX': 0, 'LANGUAGE': 1});
let now = InputType.SEARCH_BOX;
function changeSearchBox() {
    const textBox = document.getElementById('searchWordField');
    const languageSelect = document.getElementById('lang');
    const image = document.getElementById('img');

    if(now == InputType.SEARCH_BOX) {
        textBox.style = "display: none;"
        image.style = "display: none;";
        languageSelect.style = "";
        now = InputType.LANGUAGE;
    } else {
        textBox.style = "";
        image.style = "";
        languageSelect.style = "display: none;";
        now = InputType.SEARCH_BOX;
        searchField.focus();
    }
}


window.onload = async () => {
    await loadDataToGlobalVariableFromAPI();
    const searchWordField = document.getElementById('searchWordField');
    searchWordField.disabled = false;
    searchField.focus();
};


async function getVideoCode() {
    const currentUrl = await getCurrentUrl();
    const params = getUrlParams(currentUrl);
    return params['v'];
}


const languages = [];
async function loadDataToGlobalVariableFromAPI() {
    videoCode = await getVideoCode();
    var vidType = await requestApi(videoCode);

    const parsedType = parseXML(vidType);
    var typeList = findCCType(parsedType);

    const languageSelect = document.getElementById('lang');

    for (var i = 0; i < typeList.length; i++) {
        let name = typeList[i].name;
        let langCode = typeList[i].langcode;
        
        let option1 = document.createElement("option");
        option1.className = "ccProperty";
        option1.innerText = `${name} | ${langCode}`;
        option1.value = JSON.stringify({
            name,
            langCode,
        });

        languageSelect.appendChild(option1);
    }

    languageSelect.addEventListener('click', async (event) => {
        if(event.target.selectedIndex === 0) return;
        const language = JSON.parse(event.target.value);
        console.log(language.name, language.langCode);
        const videoCaption = await requestApi(language.name, language.langCode);
        parsedCaption = parseXML(videoCaption);
        changeSearchBox();
        event.target.selectedIndex = 0;
    });
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

        console.log(url);
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
        let trackName = trackTag.getAttribute("name");
        let trackLang = trackTag.getAttribute("lang_code");
        tupledTypes.push({
            name: trackName,
            langcode: trackLang,
        });
    }
    
    return tupledTypes;
}


function wrapWithSpanTag(sentence, word) {
    const startIdx = sentence.indexOf(word);
    const endIdx = startIdx + word.length;

    if(startIdx === -1) {
        return;
    }

    const beforeString = sentence.substring(0, startIdx);
    const afterString = sentence.substring(endIdx, sentence.length);

    return `${beforeString}<span class='highlight'>${word}</span>${afterString}`;
}


function findTimeStamp(searchWord) {
    var timeStamps = [];
    var objCC = parsedCaption.getElementsByTagName("text");

    for (var textTag of objCC) {
        let targetSentence = textTag.childNodes[0].nodeValue;
        targetSentence = targetSentence.toLowerCase();
        targetSentence = decodeSpecialCharacter(targetSentence);

        if (targetSentence.includes(searchWord)) {
            targetSentence = wrapWithSpanTag(targetSentence, searchWord);
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


function displayLanguages() {
    resultView.innerHTML = '';
    for(const lang of languages) {
        const div1 = document.createElement("div");
        div1.className = "card";
        const p1 = document.createElement("p");
        p1.innerText = lang.langCode;
        div1.appendChild(p1);
        resultView.appendChild(div1);
    }
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
        p1.innerHTML = `${pad(hour, 2)}:${pad(min, 2)}:${pad(sec,2)} - ${res.sentence}`;

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

    var timeStampsList = findTimeStamp(searchWord);
    if (timeStampsList.length >= 1) {
        bottomSpace.style.visibility = 'visible';
        resultView.style.paddingBottom = '10px';
    }

    displayResults(timeStampsList);
}