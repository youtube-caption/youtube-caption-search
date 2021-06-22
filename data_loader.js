import { URLParser } from "./url_parser.js";

export class DataLoader {
    constructor() {
        this.urlParser = new URLParser();
    }


    async getCaption(name, langCode) {
        const videoCode = await this.urlParser.getVideoCode();
        const url = `http://video.google.com/timedtext?name=${name}&lang=${langCode}&v=${videoCode}`;
        const rawCaption = await this.fetchAPI(url);
        return this.parseXML(rawCaption);
    }


    async getCaptionType() {
        const videoCode = await this.urlParser.getVideoCode();
        const url = `http://video.google.com/timedtext?type=list&v=${videoCode}`;
        const response = await this.fetchAPI(url);
        const parsedCaptionType = this.parseXML(response);
        console.log(parsedCaptionType)
        return this.findCCType(parsedCaptionType);
    }


    async fetchAPI(url) {
        return new Promise((resolve, reject) => {
            const request = new XMLHttpRequest();
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


    parseXML(rawXML) {
        var parser = new DOMParser();
        return parser.parseFromString(rawXML, "text/xml");
    }


    findCCType(parsedType) {
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
}