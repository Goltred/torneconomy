// Validate our settings
document.addEventListener('optionsSettingsLoaded', () => {
  $('#checkIntervalSelect').val(settings.checkInterval / 60000);
  $('#notificationIntervalSelect').val(settings.checkInterval / 60000);
});

document.addEventListener('apiKeyLoaded', () => {
  $('#apikey').val(settings.apikey);
});

$('#btnSaveSettings').on('click', () => {
  let checkInterval = $('#checkIntervalSelect').val() * 60000;
  let notificationInterval = $('#notificationIntervalSelect').val() * 60000;

  settings.saveIntervals(checkInterval, notificationInterval);
  settings.saveKey($('#apikey').val(), true);

  chrome.runtime.sendMessage({ msg: 'settingsSaved', notificationInterval, checkInterval, apikey: settings.apikey });
});

settings.validateSettings(true, 'optionsSettingsLoaded');