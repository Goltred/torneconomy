
let factionInfo = {};

function loadFactionInfo() {
  chrome.storage.local.get('factionInfo', function(data) {
    if (data) {
      factionInfo = data.factionInfo;

      var msg = new Event('popupLoadedFactionInfo');
      document.dispatchEvent(msg);
    }
  });
}

function removeFaction(factionID) {
  // Remove the query from the backend
  chrome.runtime.sendMessage({ msg: 'factionWatchRemove', factionID });

  // Remove from factionInfo
  delete factionInfo[factionID];

  // Save the factionInfo object
  chrome.storage.local.set({ factionInfo });

  // Remove the html element
  $(`#fi-${factionID}`).remove();

  loadFactionInfo();
}

function watchFaction(factionID) {
  // Add a new query to the backend
  chrome.runtime.sendMessage({ 
    msg: 'factionWatchAdd', 
    factionID
  });
}

function processFactionTable(faction) {
  let divId = `div.${faction.ID}`;
  let tableId = `fi-table-${faction.ID}`
  // Look for the table for the factionId
  let factionTable = $(`#${tableId}`);

  if (factionTable.length > 0) {
    // Update the current table and finish
    return;
  }

  // Create a new table for the faction
  let fDivId = `fi-${faction.ID}`;
  $('#faction-info').append(`<div id="${fDivId}"></div>`);
  $(`#${fDivId}`).append(`<div class="row"><h3>${faction.name} <button class="btn btn-danger" id="remove-${faction.ID}"><i class="fa fa-times"></i></button></h3></div>`);
  $(`#${fDivId}`).append(`<div class="row"><table class="table table-striped" id="${tableId}"></table></div>`);

  // Append the click event to the new button
  $(`#remove-${faction.ID}`).on('click', () => { removeFaction(faction.ID); });
  
  // Append the header
  $(`#${tableId}`).append(`<thead class="thead-dark"></thead>`).append('<tr></tr>');
  let headRowSel = `#${tableId} > thead`;
  $(headRowSel).append('<th scope="col">Name</th>');
  $(headRowSel).append('<th scope="col">Last Action</th>');
  $(headRowSel).append('<th scope="col">Status</th>');

  // Create the body
  $(`#${tableId}`).append('<tbody></tbody>');
  let bodySel = `#${tableId} > tbody`;

  for(let id in faction.hospitalized) {
    let m = faction.hospitalized[id];
    $(bodySel).append(`<tr><td><a href="www.torn.com/profiles.php?XID=${id}#">${m.name}</a></td><td>${m.last_action}</td><td>${m.status}</td></tr>`);
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'factionInfoSend') {
    processFactionTable(request.factionInfo);
  }

  sendResponse();
});

document.addEventListener('popupLoadedFactionInfo', () => {
  for(let f in factionInfo) {
    processFactionTable(factionInfo[f]);
  }
});

$('#factionWatchAdd').on('click', () => {
  let factionId = $('#factionWatchId').val();

  if (factionId) {
    watchFaction(factionId);
  }
})

loadFactionInfo();
