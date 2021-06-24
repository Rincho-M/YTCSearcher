import { GetQuota } from "./quota.js";
export { Preparer };

// Could be implemented as module like others, but I wanted to try classes in js.
class Preparer {
    RequestField;
    RadioButtonsGroup;
    ActiveTabData;

    constructor() {
        this.RequestField = document.getElementById("requestText");
        this.ActiveTabData = {
            url: "",
            height: "",
            width: ""
        }
        this.RadioButtonsGroup = document.getElementsByName("groupOne");
    }

    // Get and prepare search data from UI and current tab.
    async PrepareSearchData() {
        let videoIdRegex = /(?<=www\.youtube\.com\/watch\?v=).[^\?\&]+/;
        let videoId = this.ActiveTabData.url.match(videoIdRegex)[0];
        let requestData = {
            part: [
                "snippet, replies"
            ],
            maxResults: 100,
            textFormat: "plainText",
            videoId: videoId
        };

        return { 
            request: this.RequestField.value,
            requestData: requestData,
            limit: this.GetSearchLimit()
        };
    }

    PrepareDataToSend(searchLimit) {
        return {
            text: this.RequestField.value,
            commentsNum: searchLimit
        }
    }

    // Get data from radio buttons about maximum number of comments for a search.
    GetSearchLimit() {
        for(let i = 0; i < this.RadioButtonsGroup.length; i++) {
            if(this.RadioButtonsGroup[i].checked) {
                return Number(this.RadioButtonsGroup[i].value);
            }
        }
    }

    // Wrap async method that gets current tab data in a Promise to can use await with it. 
    GetActiveTabData() {
        return new Promise(Resolve => {
            chrome.tabs.query(
                { active: true, currentWindow: true }, 
                (tabs) => { 
                    Resolve({ 
                        url: tabs[0].url,
                        height: tabs[0].height,
                        width: tabs[0].width
                    }); 
                }
            );
        });
    }

    ValidateSearchData() {
        if(this.ValidateRequest() && this.ValidateQuotaCost())
            return true;
        return false;
    }

    // Check if current site is youtube.
    ValidateUrl() {
        let isYtRegex = /www\.youtube\.com\/watch\?v=/;

        if(isYtRegex.test(this.ActiveTabData.url)) {
            console.log("Url validation - success");
            return true;
        }

        console.log("Url validation - fail");
        return false;
    }

    ValidateRequest() {
        if(this.RequestField.value != "") {
            console.log("Request valdation - success");
            return true;
        }

        console.log("Request valdation - fail");
        return false;
    }

    ValidateQuotaCost() {
        let quota = GetQuota();
        if(this.GetSearchLimit() <= quota) {
            console.log("Quota cost valdation - success");
            return true;
        }

        console.log("Quota cost  valdation - fail");
        return false;
    }
}
