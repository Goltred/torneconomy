let tornRevive = {
  factionInfo: {},

  getPlayerInfo: (playerId) => {
    console.log(`Querying status of ${playerId}`);

    if (settings.apikey) {
      tornBackend.apiGet(`https://api.torn.com/user/${playerId}?selections=&key=` + settings.apikey, (response) => {
        tornRevive.notify(response);
      });
    } else {
      chrome.storage.local.get('tornkey', function(data) {
        if (data.tornkey) {
          tornBackend.apiGet(`https://api.torn.com/user/${playerId}?selections=&key=` + data.tornkey, (response) => {
            tornRevive.notify(response)
          });
        }
      });
    }
  },

  notify: (response) => {
    console.log('In notifyRevive');
    if (response){
      console.log(response);
      if (response.status && response.status.includes('Hospitalized')) {
        chrome.storage.local.get('lastNotification', function(data) {
          // Send notification
          let title = `${response.name} needs a revive!`;
          let message = `It seems like ${response.name} is in Hospital. Go revive him!"`;
          sendNotification(title, message, 'images/icon16.png');
        });
      }
    }
  },

  getFactionInfo: (factionId) => {
    console.log(`Querying status of ${factionId}`);

    if (settings.apiKey) {
      tornBackend.apiGet(`https://api.torn.com/faction/${factionId}?selections=&key=` + settings.apikey, (response) => {
        const fInfo = tornRevive.processFaction(response);
        tornRevive.factionInfo[response.ID] = fInfo;
        console.log(fInfo);
        chrome.storage.local.set({ factionInfo: tornRevive.factionInfo });
        chrome.runtime.sendMessage({ msg: 'factionInfoSend', factionInfo: fInfo});
      });
    } else {
      chrome.storage.local.get('tornkey', function(data) {
        if (data.tornkey) {
          tornBackend.apiGet(`https://api.torn.com/faction/${factionId}?selections=&key=` + data.tornkey, (response) => {
            const fInfo = tornRevive.processFaction(response);
            tornRevive.factionInfo[response.ID] = fInfo;
            console.log(fInfo);
            chrome.storage.local.set({ factionInfo: tornRevive.factionInfo });
            chrome.runtime.sendMessage({ msg: 'factionInfoSend', factionInfo: fInfo});
          });
        }
      });
    }
  },

  processFaction(response) {
    const factionInfo = {
      name: response.name,
      ID: response.ID
    };

    const members = {};
    const hospedOnline = {};
    for(const id in response.members) {
      const m = {
        name: response.members[id].name,
        last_action: response.members[id].last_action,
        online: tornRevive.playerIsOnline(response.members[id].last_action),
        hospitalized: response.members[id].status.filter((val) => { return val.includes('hospital'); }).length > 0,
        status: response.members[id].status[0]
      }

      members[id] = m;
      if (m.online && m.hospitalized) {
        hospedOnline[id] = m;
      }
    }

    factionInfo.members = members;
    factionInfo.hospitalized = hospedOnline

    return factionInfo;
  },

  playerIsOnline(lastAction) {
    return lastAction.includes('minutes') && lastAction.split(' ')[0] <= 2
    || lastAction.includes('seconds');
  }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'factionWatchRemove') {
    tornBackend.removeQuery(`factionWatch${request.factionID}`);
    delete tornRevive.factionInfo[request.factionID];
  }

  if (request.msg === 'factionWatchAdd') {
    tornBackend.registerQuery(`factionWatch${request.factionID}`, () => {
      tornRevive.getFactionInfo(request.factionID);
    }, 0.2);
  }

  sendResponse();
});

// Load currently watched factions and register their queries
chrome.storage.local.get('factionInfo', (data) => {
  if (data.factionInfo) {
    for (let id in data.factionInfo) {
      tornBackend.registerQuery(`factionWatch${id}`, () => {
        tornRevive.getFactionInfo(id)
      }, 0.2);
    }
  }
});
