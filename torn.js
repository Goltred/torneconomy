let tornStocks = {};
let refreshInterval = 60000;
let notificationInterval = 300000;

function getTornStockInfo() {
  if (settings.apikey) {
    queryTornStocksApi('https://api.torn.com/torn/?selections=stocks&key=' + settings.apikey);
  } else {
    chrome.storage.local.get('tornkey', function(data) {
      if (data.tornkey) {
        queryTornStocksApi('https://api.torn.com/torn/?selections=stocks&key=' + data.tornkey);
      }
    });
  }
}

function saveTornStocks(stocks) {
  for(const k in stocks) {
    const { acronym } = stocks[k];
    tornStocks[acronym] = stocks[k];
  }

  chrome.storage.local.set({ tornStocks });
}

function queryTornStocksApi(url) {
  $.get(url, (response) => {
    if (response.error) {
      console.error('Torn API Error: ' + response.error.code + ' ' + response.error.error)
      return;
    }

    saveTornStocks(response.stocks);

    chrome.runtime.sendMessage({ msg: 'stocksLoaded' });
  });
}

function checkLimits() {
  chrome.storage.local.get('stocks', function(data) {
    // Check limits only if stocks have been saved
    if (data.stocks && Object.keys(data.stocks).length > 0) {
      let buy = [];
      let sell = [];
      for(const k in data.stocks) {
        const stock = data.stocks[k];
        const tornStock = tornStocks[k];
        if (tornStock) {
          // Check prices
          if (stock.buy && tornStock.current_price <= stock.buy) {
            buy.push(k);
          } else if (stock.sell && tornStock.current_price >= stock.sell) {
            sell.push(k);
          }
        }
      }

      // Summarize notifications
      let title;
      let message;
      if (buy.length === 0 && sell.length > 0) {
        title = `Time to sell: ${sell.join(', ')}`;
        message = `You should go and sell the following stocks:\n${sell.join('\n')}`;
        setBadge('Sell');
      } else if (sell.length === 0 && buy.length > 0) {
        title = `Time to buy: ${buy.join(', ')}`;
        message = `You should go and buy the following stocks:\n${buy.join('\n')}`;
        setBadge('Buy');
      } else if (sell.length > 0 && buy.length > 0) {
        title = 'You have stocks to buy and sell!';
        message = `You have stocks to sell (${sell.join(', ')}) and stocks to buy (${buy.join(', ')})`;
        setBadge('See');
      }

      if (title && message) {
        chrome.storage.local.get('lastNotification', function(data) {
          if (data.lastNotification && Date.now() >= data.lastNotification + notificationInterval || !data.lastNotification) {
            // Send notification
            sendNotification(title, message, 'images/icon16.png');
          }
        });

        return;
      }

      // Update the badge
      chrome.browserAction.setBadgeText({
        text: ''
      });
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