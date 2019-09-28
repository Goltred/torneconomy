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