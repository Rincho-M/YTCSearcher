export { QuotaUpdate, QuotaDailyResetIfNeeded, GetQuota };

// Daily quota value per user. 1 comment = 1 quota.
const DAILYQUOTA = 100000;
// Counter of Youtube DataAPI quota. 
let _quota;
// Quota DOM element.
let _quotaField;
// Date of the last daily quota reset.
let _lastResetDate;

window.addEventListener("load", Init);

async function Init() {
    _quotaField = document.getElementById("pointNum");
    _lastResetDate = (await GetLastResetDate()).lastResetDate;
    if(!QuotaDailyResetIfNeeded())
        SetQuotaInitialValue();
}

function GetQuota() {
    return _quota;
}

function SetQuota(data) {
    _quota = data.quota;
}

async function SetQuotaInitialValue() {
    let quotaFromStorage = await GetQuotaFromStorage();
    SetQuota(quotaFromStorage);
    QuotaFieldUpdate();
}

function GetQuotaFromStorage() {
    return new Promise(Resolve => {
        chrome.storage.sync.get("quota", Resolve);
    });
}

// Update quota field on page and quota value here.
function QuotaUpdate(cost) {
    _quota -= cost;
    chrome.storage.sync.set({ quota: _quota });
    QuotaFieldUpdate();
}

function QuotaFieldUpdate() {
    _quotaField.innerHTML = _quota;
}

// Check if a day has passed since the last quota reset.
function QuotaDailyResetIfNeeded() {
    let lastDate = new Date(_lastResetDate).setHours(0, 0, 0, 0);
    let currentDate = new Date(Date.now()).setHours(0, 0, 0, 0);

    if(lastDate < currentDate) {
        chrome.storage.sync.set({ lastResetDate: Date.now() });
        _quota = DAILYQUOTA;
        chrome.storage.sync.set({ quota: _quota });
        QuotaFieldUpdate();
    }
}

// Get last quota reset date from storage.
function GetLastResetDate() {
    return new Promise(Resolve => {
        chrome.storage.sync.get("lastResetDate", Resolve);
    });
}