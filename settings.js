const settings = {
  saveKey(elID, keepField) {
    var keyField = document.getElementById(elID);
    if (keyField) {
      chrome.storage.local.set({ tornkey: keyField.value });
      let savedChangesEvent = new Event('savedChanges');
      document.dispatchEvent(savedChangesEvent);

      if (!keepField) {
        settings.removeApiField(keyField.value);
      }
    }
  },

  removeApiField(key) {
    // No need to display the key field
    document.getElementById('apisettings').remove();
    settings.apikey = key;
  },

  validateSettings(keepApiField) {
    // Load key from storage
    chrome.storage.local.get('tornkey', function(data) {
      if (data.tornkey && !keepApiField) {
        settings.removeApiField(data.tornkey);
      } else {
        let keyField = document.getElementById('apikey');
        keyField.setAttribute('value', data.tornkey ? data.tornkey : '');
        
        document.getElementById('btnSave').addEventListener('click', function(event) {
          settings.saveKey('apikey', keepApiField);
        });
      }
    });

    // Get the field numbers
    chrome.storage.local.get('settings', function(data) {
      if (data.settings) {
        settings.buyCol = data.settings.buyCol;
        settings.sellCol = data.settings.sellCol;
        settings.nameCol = data.settings.nameCol;
      }
    })
  }
}