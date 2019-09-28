let tornBackend = {
  queries: {},
  processingQueries: false,
  requestsPerformed: 0,

  registerQuery: (name, callback, interval) => {
    tornBackend.queries[name] = {
      callback,
      interval, //minute of the hour
      lastRun: -1
    };
  },

  removeQuery: (name) => {
    console.log(tornBackend.queries);
    if (Object.keys(tornBackend.queries).includes(name) || name === 'removeAll') {
      while (!tornBackend.processingQueries) {
        delete tornBackend.queries[name];
        break;
      }
    }
  },

  getQueriesCount: () => {
    return Object.keys(tornBackend.queries).length;
  },

  execute: () => {
    processingQueries = true;

    let d = new Date();
    let minute = d.getMinutes();

    for(let name in tornBackend.queries) {
      let query = tornBackend.queries[name];

      if (tornBackend.shouldRunQuery(query, minute)) {
        query.lastRun = minute;
        // Execute callback
        query.callback();
      }
    }

    processingQueries = false;
  },

  shouldRunQuery: (query, minute) => {
    let calc = Math.round(minute % query.interval);

    if (calc === 0) {
      if (query.lastRun === -1) {
        return true;
      }

      if (query.lastRun !== minute) {
        return true;
      }
    }

    return false;
  },

  apiGet: (url, callback, message) => {
    $.get(url, (response) => {
      tornBackend.requestsPerformed += 1;

      if (response.error) {
        console.error('Torn API Error: ' + response.error.code + ' ' + response.error.error)
        return;
      }

      if (callback) {
        callback(response);
      }

      if (message) {
        chrome.runtime.sendMessage({ msg: message });
      }
    });
  }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg === 'registerQuery') {
    tornBackend.registerQuery(request.name, request.callback, request.interval);
    sendResponse(`Registered ${request.name}`);
  } else if (request.msg === 'removeQuery') {
    tornBackend.removeQuery(request.name);
    sendResponse(`Removed ${request.name} from queries list`);
  } else if (request.msg === 'getQueriesCount') {
    sendResponse(tornBackend.getQueriesCount());
  } else if (request.msg === 'removeAll') {
    tornBackend.removeQuery('removeAll');
    sendResponse(`Removed all queries`);
  }

  sendResponse('0');
});

setInterval(() => {
  tornBackend.execute()
}, 1000);