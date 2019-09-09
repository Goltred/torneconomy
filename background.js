chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.local.set({
    settings: {
      nameCol: 0,
      buyCol: 2,
      sellCol: 3,
      refreshInterval: 60000, // ms
      notificationInterval: 120000 //ms
    }
  });
});

if (settings) {
  settings.validateSettings(undefined, 'settingsLoaded');
}