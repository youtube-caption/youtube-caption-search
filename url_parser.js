export class URLParser {
    getCurrentUrl() {
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


    getUrlParams(url) {
        var params = {};
    
        url.replace(/[?&]+([^=&]+)=([^&]*)/gi,
            function (str, key, value) {
                params[key] = value;
            }
        );
    
        return params;
    }


    async getVideoCode() {
        const currentUrl = await this.getCurrentUrl();
        const params = this.getUrlParams(currentUrl);
        return params['v'];
    }
}