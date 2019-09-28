let tornStocks = {
  refreshInterval: 1,
  notificationInterval: 5,

  stocks: {},
  
  getInfo() {
    if (settings.apikey) {
      tornBackend.apiGet('https://api.torn.com/torn/?selections=stocks&key=' + settings.apikey, (response) => {
        tornStocks.save(response.stocks);
      }, 'stocksLoaded');
    } else {
      chrome.storage.local.get('tornkey', function(data) {
        if (data.tornkey) {
          tornBackend.apiGet('https://api.torn.com/torn/?selections=stocks&key=' + data.tornkey, (response) => {
            tornStocks.save(response.stocks);
          }, 'stocksLoaded')
        }
      });
    }
  },

  save(stocks) {
    for(const k in stocks) {
      const { acronym } = stocks[k];
      tornStocks[acronym] = stocks[k];
    }
  
    chrome.storage.local.set({ tornStocks });
  },

  checkLimits() {
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
            if (stock.buy && tornStock.current_price <= stock.buy && tornStock.available_shares > 0) {
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
            if (data.lastNotification && Date.now() >= data.lastNotification + (tornStocks.notificationInterval * 60000)  || !data.lastNotification) {
              // Send notification
              sendStockNotification(title, message, 'images/icon16.png');
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
}

document.addEventListener('settingsLoaded', () => {
  tornStocks.getInfo();
  tornBackend.registerQuery('stocks', () => {
    tornStocks.getInfo();
    tornStocks.checkLimits();
  }, tornStocks.refreshInterval);
});