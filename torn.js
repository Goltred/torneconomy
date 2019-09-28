let tornStocks = {};
let refreshInterval = 60000;
let notificationInterval = 300000;

function queryTorn(url, callback, message) {
  $.get(url, (response) => {
    if (response.error) {
      console.error('Torn API Error: ' + response.error.code + ' ' + response.error.error)
      return;
    }

    if (callback) {
      callback(response);
    }

    if (message) {
      chrome.runtime.sendMessage({ msg: message });
    }
  });
}

function sendNotification(title, message, iconUrl) {
  chrome.notifications.create({ 
    type: 'basic',
    title,
    message,
    iconUrl,
  });
}

function sendStockNotification(title, message, iconUrl) {
  sendNotification(title, message, iconUrl);
  chrome.storage.local.set({ lastNotification: Date.now() });
}

function setBadge(text) {
  chrome.browserAction.setBadgeText({
    text
  });
}

function setBackgroundProcess() {
  console.log('SetInterval called with refresh interval ' + refreshInterval);
  setInterval(function() {
    console.log('Running interval function');
    getTornStockInfo();
    checkLimits();
  }, refreshInterval);
}

document.addEventListener('settingsLoaded', () => {
  getTornStockInfo();
  setBackgroundProcess();
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('torn.js message handler');
  console.log(request);
  if (request.msg === 'popupSavedStocks') {
    getTornStockInfo();

    sendResponse();
  } else if (request.msg === 'settingsSaved') {
    notificationInterval = request.notificationInterval;
    refreshInterval = request.checkInterval;

    clearInterval();
    settings.validateSettings(undefined, 'apiKeySaved');
    setBackgroundProcess();

    sendResponse('thanks');
  } else if (request.msg === 'stocksLoaded') {
    checkLimits();

    sendResponse();
  }
});