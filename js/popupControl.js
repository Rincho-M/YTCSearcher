import { InitiateSearch } from "./search.js";
import { Preparer } from "./preparation.js";
import { QuotaUpdate, QuotaDailyResetIfNeeded } from "./quota.js";
import { SendJson } from "./apicalls.js";

const Target = new EventTarget();
const WindowChangeFinished = new Event('windowChangeFinished');

// Comments currently displayed.
let _oldResultsBlock;
// Comments to display.
let _newResultsBlock;

let _preparer;
let _loadSpinner;
let _searchButton;

// State of the window.
let _isResultWindow = false;
// State of the search.
let _isResultsReady = false;

window.addEventListener("load", Init);

async function Init() {
    _preparer = new Preparer();
    _preparer.ActiveTabData = await _preparer.GetActiveTabData();
    
    // Add required listeners only if popup opened on youtube page.
    if(_preparer.ValidateUrl()) {
        _loadSpinner = document.getElementById("loadSpinner");

        let searchBox = document.getElementById("requestText");
        searchBox.addEventListener("keyup", ButtonPressByEnterKey);

        _searchButton = document.getElementById("searchButton");
        _searchButton.addEventListener("click", SearchButtonPressedHandler);

        document.body.addEventListener("transitionend", DispatchIfWindowChangeFinished)
        Target.addEventListener("windowChangeFinished", DisplayResults);
        Target.addEventListener("windowChangeFinished", ShowResultWindowUI);
    }
}

// Logic of search button. 
// Change window to the big one. Search and display comments. Send some data to the server. Update quota.
async function SearchButtonPressedHandler() {
    _searchButton.disabled = true;

    if(_preparer.ValidateSearchData()) {
        QuotaDailyResetIfNeeded();

        ChangeToResultWindow();

        let searchData = await _preparer.PrepareSearchData();
        let searchResults = await InitiateSearch(searchData);
        ConstructResultsBlock(searchResults);
        if(_isResultWindow) {
            DisplayResults();
        }

        SendRequestData();
        QuotaUpdate(searchData.limit);
    }

    _searchButton.disabled = false;
}

// Send request data to a server.
function SendRequestData() {
    let dataToSend = _preparer.PrepareDataToSend();
    SendJson(dataToSend);
}

// Put raw search results to the html elements.
function ConstructResultsBlock(searchResults) {
    _newResultsBlock = document.createElement("div");
    _newResultsBlock.classList.add("results-block");
    _newResultsBlock.id = "resultsBlock";
    _newResultsBlock.style.display = "none";

    if(searchResults.length == 0) {
        let noMatchesText = document.createElement("p");
        noMatchesText.classList.add("comment-nomatch-text");
        let textNode = document.createTextNode("No comments match your search.");
        noMatchesText.appendChild(textNode);

        _newResultsBlock.appendChild(noMatchesText);
    } else {
        for(let i = 0; i < searchResults.length; i++) {
            let comment = ConstructComment(searchResults[i]);
            _newResultsBlock.appendChild(comment);
        }
    }

    let commentsSectionUi = document.getElementById("commentsUiWrapper");
    commentsSectionUi.appendChild(_newResultsBlock);

    _isResultsReady = true;
}

// Show comments or load spinner depending on current execution state.
function DisplayResults() {
    if(_oldResultsBlock != undefined) _oldResultsBlock.remove();

    if(_isResultsReady) {
        HideLoadSpinner();

        _newResultsBlock.style.display = "";

        _oldResultsBlock = _newResultsBlock;
        _isResultsReady = false;
    } else {
        ShowLoadSpinner();
    }
}

// Change the start window to the big one with results.
function ChangeToResultWindow() {
    if(_isResultWindow) {
        DisplayResults();
    } else {
        HideStartWindowUI();
        IncreasePageSize(_preparer.ActiveTabData);
    }
}

function HideStartWindowUI() {
    let startUiBlock = document.getElementById("uiWrapper");
    startUiBlock.style.opacity = "0%";
    let searchBlock = document.getElementById("searchBlock");
    searchBlock.style.opacity = "0%";

    // Handler removes block from the flow after its opacity reaches 0;
    startUiBlock.addEventListener("transitionend", HideStartUIFromTheFlow);
}

function HideStartUIFromTheFlow(event) {
    if(event.target.id == "uiWrapper") {
        event.target.style.display = "none";
    }
}

// Calculate and change size of the window depending on current chrome window size.
function IncreasePageSize(pageData) {
    // The max size of the popup window without scrollbar.
    const MAX_WIDTH = 780;
    const MAX_HEIGHT = 580;
    // The popup after increasing will be the size of these persentanges of the current page.
    let widthPercent = 70;
    let heightPercent = 90;

    let newSize = { 
        width: CalculateSide(pageData.width, widthPercent, MAX_WIDTH),
        height: CalculateSide(pageData.height, heightPercent, MAX_HEIGHT)
    };

    document.body.style.width = newSize.width;
    document.body.style.height = newSize.height;
}

function CalculateSide(originalSize, percent, maxSize) {
    return (originalSize / 100 * percent) > maxSize ? maxSize : (originalSize / 100 * percent);
}

function ShowResultWindowUI() {
    let searchBlock = document.getElementById("searchBlock");
    searchBlock.style.opacity = "100%";
    searchBlock.style.margin = "0px 0px 12px 0px";

    let commentsSectionUi = document.getElementById("commentsUiWrapper");
    commentsSectionUi.style.display = "flex";
    commentsSectionUi.style.opacity = "100%";

    let uiWrapper = document.getElementById("uiWrapper");
    uiWrapper.classList.remove("small-ui-wrapper");
    uiWrapper.classList.add("big-ui-wrapper");
    uiWrapper.style.display = "flex";
    uiWrapper.style.opacity = "100%";

    let radioCommentsGroup = document.getElementsByClassName("radio-comments-wrap");
    for(let i = radioCommentsGroup.length - 1; i >= 0; i--) {
        radioCommentsGroup[i].classList.add("radio-comments-wrap-big");
        radioCommentsGroup[i].classList.remove("radio-comments-wrap");
    }

    ChangeCssClass("pointBlock", "point-block", "point-block-big");
    ChangeCssClass("pointTextWrapper", "point-text-wrapper", "point-text-wrapper-big");
    ChangeCssClass("optionBlock", "option-block", "option-block-big");
    ChangeCssClass("optionText", "option-text", "option-text-big");
    ChangeCssClass("groupRadioCommentsWrap", "group-radio-comments-wrap", "group-radio-comments-wrap-big");

    _isResultWindow = true;
}

function ChangeCssClass(elementId, oldClass, newClass) {
    let element = document.getElementById(elementId);
    element.classList.remove(oldClass);
    element.classList.add(newClass);
}

function ShowLoadSpinner() {
    _loadSpinner.style.display = "flex";
}

function HideLoadSpinner() {
    _loadSpinner.style.display = "none";
}

// Create a group of html elements that represent a comment.
function ConstructComment(commentData) {
    let commentWrapper = document.createElement("div");
    let avatar = document.createElement("img");
    let textWrapper = document.createElement("div");
    let textName = document.createElement("p");
    let text = document.createElement("p");
    let textNodeName = document.createTextNode(commentData.autor);
    let textNodeText = document.createTextNode(commentData.text);

    commentWrapper.classList.add("comment-wrapper");
    avatar.classList.add("comment-avatar");
    avatar.setAttribute("src", "content/icon48.png");
    textWrapper.classList.add("comment-text-wrapper");
    textName.classList.add("comment-name");
    text.classList.add("comment-text");

    textName.appendChild(textNodeName);
    text.appendChild(textNodeText);
    textWrapper.appendChild(textName);
    textWrapper.appendChild(text);
    commentWrapper.appendChild(avatar);
    commentWrapper.appendChild(textWrapper);

    return commentWrapper;
}

// Dispatch custom event if current 'transitionend' event belongs to the body.
function DispatchIfWindowChangeFinished(event) {
    if(event.target.id == "body" && event.propertyName == "width") {
        Target.dispatchEvent(WindowChangeFinished);
    }
}

function ButtonPressByEnterKey(event) {
    if(event.code == "Enter") _searchButton.click();
}