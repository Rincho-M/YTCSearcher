chrome.runtime.onInstalled.addListener(OnInstallInit);

// Put base values in storage on install.
function OnInstallInit(details) {
    if(details.reason == chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.storage.sync.set({ 
            quota: 100000,
            lastResetDate: Date.now() 
        });
    }
}