import{ DataLoader } from './data_loader.js';

export class SearchEngine {
    constructor() {
        this.dataLoader = new DataLoader();

        // Default setting for the language
        this.setDropDownForLanguage();
        
        this.InputType = Object.freeze({'SEARCH_BOX': 0, 'LANGUAGE': 1});
        this.currentInputType = this.InputType.SEARCH_BOX;
        
        this.searchField = document.getElementById('searchWordField');
        this.bottomSpace = document.getElementsByClassName('bottom_blank_space')[0];
        this.resultView = document.getElementById('result');
        this.searchBox = document.getElementById('search_box');
        
        (async () => {
            this.caption = await this.dataLoader.getCaption('', 'en');
            this.addEventListeners();
            this.enableSearchBox();
        })();
    }


    addEventListeners() {
        this.searchField.addEventListener('keyup', (event) => {
            this.search();
        });

        this.searchBox.addEventListener('contextmenu', (event) => {
            //event.preventDefault();
            this.changeSearchBox();
    });
    }


    async setDropDownForLanguage() {
        const languages = await this.dataLoader.getCaptionType();
        const languageSelect = document.getElementById('lang');

        for(const language of languages) {
            const option = document.createElement("option");
            option.className = "ccProperty";
            option.innerText = `${language.name} | ${language.langcode}`;
            option.value = JSON.stringify({
                name: language.name,
                langCode: language.langcode
            });

            languageSelect.appendChild(option);
        }

        languageSelect.addEventListener('click', async (event) => {
            console.log(event.target.selectedIndex);
            if(event.target.selectedIndex === 0) return;

            const language = JSON.parse(event.target.value);
            this.caption = await this.dataLoader.getCaption(languaeg.name, language.langCode);
            
            this.changeSearchBox();
            event.target.selectedIndex = 0;
        });
    }

    enableSearchBox() {
        this.searchField.disabled = false;
        this.searchField.focus();
    }


    changeSearchBox() {
        const textBox = document.getElementById('searchWordField');
        const languageSelect = document.getElementById('lang');
        const image = document.getElementById('img');
    
        if(this.currentInputType == this.InputType.SEARCH_BOX) {
            textBox.style = "display: none;"
            image.style = "display: none;";
            languageSelect.style = "";
            this.currentInputType = this.InputType.LANGUAGE;
        } else {
            textBox.style = "";
            image.style = "";
            languageSelect.style = "display: none;";
            this.currentInputType = this.InputType.SEARCH_BOX;
            this.searchField.focus();
        }
    }


    pad(num, size) {
        num = num.toString();
        while (num.length < size) num = "0" + num;
        return num;
    }


    displayResults(results) {
        for (let i = 0; i < results.length; i++) {
            const timeStamp = Math.round(+results[i].timestamp);
            const hour = parseInt(timeStamp / 3600);
            const min = parseInt((timeStamp % 3600) / 60);
            const sec = timeStamp % 60;
    
            const div = document.createElement("div");
            div.className = "card";
            const p = document.createElement("p");
            p.id = `result-${i}`;
            p.innerHTML = `${this.pad(hour, 2)}:${this.pad(min, 2)}:${this.pad(sec,2)} - ${results[i].sentence}`;
    
            p.addEventListener('click', () => {
                goToUrl(`https://www.youtube.com/watch?v=${videoCode}&t=${timeStamp}s`);
            })
            
            div.appendChild(p);
            this.resultView.appendChild(div);
        }
    }


    search() {
        this.bottomSpace.style.visibility = 'hidden';
        const searchWord = searchWordField.value;
        this.resultView.innerHTML = '';
    
        const results = this.findTimeStamp(searchWord);
        if (result.length >= 1) {
            this.bottomSpace.style.visibility = 'visible';
            this.resultView.style.paddingBottom = '10px';
        }
    
        this.displayResults(results);
    }

    
    findTimeStamp(searchWord) {
        var timeStamps = [];
        var objCC = this.caption.getElementsByTagName("text");
    
        for (var textTag of objCC) {
            let targetSentence = textTag.childNodes[0].nodeValue;
            targetSentence = targetSentence.toLowerCase();
            targetSentence = this.decodeSpecialCharacter(targetSentence);
    
            if (targetSentence.includes(searchWord)) {
                targetSentence = this.wrapWithSpanTag(targetSentence, searchWord);
                var timeVal = textTag.getAttribute("start");
                timeStamps.push({
                    sentence: targetSentence,
                    timestamp: timeVal,
                });
            }
        }
        
        return timeStamps;
    }


    decodeSpecialCharacter(string) {
        return string.replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&#96;/g, "`");
    }


    wrapWithSpanTag(sentence, word) {
        const startIdx = sentence.indexOf(word);
        const endIdx = startIdx + word.length;
    
        if(startIdx === -1) {
            return;
        }
    
        const beforeString = sentence.substring(0, startIdx);
        const afterString = sentence.substring(endIdx, sentence.length);
    
        return `${beforeString}<span class='highlight'>${word}</span>${afterString}`;
    }
}