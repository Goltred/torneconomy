let tornStocks = {};
function getTornStockInfo() {
  chrome.storage.local.get('tornkey', function(data) {
    if (data.tornkey) {
      let xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function() {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
          let response = JSON.parse(this.responseText);

          if (response.error) {
            showErrorModal('Torn API Error: ' + response.error.code, response.error.error);
            return;
          }

          for(const k in response.stocks) {
            const { acronym } = response.stocks[k];
            tornStocks[acronym] = response.stocks[k];
          }

          let stocksLoadedEvent = new Event('stocksLoaded');
          document.dispatchEvent(stocksLoadedEvent);
        }
      }

      xhttp.open('GET', 'https://api.torn.com/torn/?selections=stocks&key=' + data.tornkey);
      xhttp.send();
    }
  });
}

let refreshInterval = 60000;
let notificationInterval = 300000;

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
        chrome.browserAction.setBadgeText({
          text: 'Sell'
        });
      } else if (sell.length === 0 && buy.length > 0) {
        title = `Time to buy: ${buy.join(', ')}`;
        message = `You should go and buy the following stocks:\n${buy.join('\n')}`;
        chrome.browserAction.setBadgeText({
          text: 'Buy'
        });
      } else if (sell.length > 0 && buy.length > 0) {
        title = 'You have stocks to buy and sell!';
        message = `You have stocks to sell (${sell.join(', ')}) and stocks to buy (${buy.join(', ')})`;
        chrome.browserAction.setBadgeText({
          text: 'See'
        });
      }

      if (title && message) {
        chrome.storage.sync.get('lastNotification', function(data) {
          if (data.lastNotification && Date.now() >= data.lastNotification + notificationInterval || !data.lastNotification) {
            // Send notification
            sendNotification(title, message, 'images/icon16.png');
          } else {
            let delta = (data.lastNotification + notificationInterval) - Date.now();
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

  chrome.storage.sync.set({ lastNotification: Date.now() });
}

// Main script execution
getTornStockInfo();
checkLimits();

chrome.storage.local.get('settings', function(data) {
  if (data.settings) {
    refreshInterval = data.settings.refreshInterval;
    notificationInterval = data.settings.notificationInterval;
  }

  setInterval(function() {
    getTornStockInfo();
    checkLimits();
  }, refreshInterval);
});