const settings = {
  checkInterval: 60000,
  notificationInterval: 30000,
  apikey: undefined,
  buyCol: 2,
  sellCol: 3,
  nameCol: 0,

  saveKey(key) {
    settings.apikey = key;
    chrome.storage.local.set({ tornkey: key }, function() {
      chrome.runtime.sendMessage({ msg: 'apiKeySaved' });
    });
  },

  saveIntervals(check, notification) {
    if (check && notification) {
      settings.checkInterval = check;
      settings.notificationInterval = notification;
      chrome.storage.local.set({ 
        checkInterval: check,
        notificationInterval: notification
      });
    }
  },

  removeApiField(key) {
    // No need to display the key field
    document.getElementById('apisettings').remove();
    settings.apikey = key;
  },

  validateSettings(keepApiField, message) {
    // Load keys from storage
    chrome.storage.local.get([
      'tornkey', 
      'settings', 
      'checkInterval', 
      'notificationInterval'
    ], function(data) {
      let keyLoaded = false;
      if (data.tornkey) {
        settings.apikey = data.tornkey;
        keyLoaded = true;

        var msg = new Event('apiKeyLoaded');
        document.dispatchEvent(msg);
      }

      if (data.settings) {
        settings.buyCol = data.settings.buyCol;
        settings.sellCol = data.settings.sellCol;
        settings.nameCol = data.settings.nameCol;
      }

      if (data.checkInterval) {
        settings.checkInterval = data.checkInterval;
        settings.notificationInterval = data.notificationInterval;
      }

      if (keyLoaded) {
        var msg = new Event(message);
        document.dispatchEvent(msg);
      }
    })
  }
}