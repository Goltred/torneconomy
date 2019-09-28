let tornStocks = {};

function loadTornStocks() {
  chrome.storage.local.get('tornStocks', (data) => {
    if (data.tornStocks) {
      for(const k in data.tornStocks) {
        const { acronym } = data.tornStocks[k];
        tornStocks[acronym] = data.tornStocks[k];
      }

      var msg = new Event('popupLoadedTornStocks');
      document.dispatchEvent(msg);
    }
  })
}

function loadStocks() {
  let stocksTable = document.getElementById('stocks');
  let tBody = stocksTable.querySelector('tbody');

  //Clean up the table rows
  while (tBody.firstChild) {
    tBody.firstChild.remove();
  }

  // Load the data into the table
  chrome.storage.local.get('stocks', function(data) {
    let stocks = data.stocks;
    for(const k in stocks) {
      const row = createStockRow(tBody, k, stocks[k]);

      if (row && row.stockName) {
        const tornStock = tornStocks[row.stockName];
        if (tornStock) {
          row.setCurrent(tornStock.current_price);
          row.setAvailable(tornStock.available_shares);
        }
      }
    }
  });
}

function saveAllStocks() {
  // Get the table
  let rows = document.querySelectorAll('tbody > tr');

  stocks = {};
  rows.forEach((row) => {
    let stock = getStockFromRow(row);
    stocks[stock.name] = {
      buy: stock.buy,
      sell: stock.sell
    }
  });

  // Save the new object
  chrome.storage.local.set({ stocks });

  chrome.runtime.sendMessage({ msg: 'popupSavedStocks' });
}

function rowSaveClick(e) {
  // Validate that saved row is not already in the table
  let row = e.target.closest('tr');
  saveAllStocks();
}

function rowDeleteClick(e) {
  let row = e.target.closest('tr');
  row.remove();

  saveAllStocks();
}

function getStockFromRow(row) {
  // Get all tds
  let tds = row.querySelectorAll('td');
  // Get the buy and sell values
  let buyVal = tds[settings.buyCol].querySelector('input').value;
  let sellVal = tds[settings.sellCol].querySelector('input').value;

  let nameInput = tds[settings.nameCol].querySelector('input');
  if (nameInput) {
    // We are saving, replace the input field by text
    let name = nameInput.value
    nameInput.remove();
    tds[settings.nameCol].innerText = name;
  }

  let name = tds[settings.nameCol].innerText;

  return {
    name,
    buy: buyVal,
    sell: sellVal
  }
}

function saveRow(row) {
  let stock = getStockFromRow(row);

  chrome.storage.local.get('stocks', function(data) {
    let stocks = data.stocks;
    name = stock.name.toUpperCase();

    if (!Object.keys(stocks).includes(name)) {
      // New stock
      stocks[name] = {};
    }

    // Save the stock
    try {
      stocks[name].buy = parseFloat(buyVal);
    } catch (err) {
      if (err.name === 'TypeError') {
        stocks[name].buy = 0;
      }
    }

    try {
      stocks[name].sell = parseFloat(sellVal);
    } catch (err) {
      if (err.name === 'TypeError') {
        stocks[name].sell = 0;
      }
    }

    chrome.storage.local.set({ stocks });
  });
}

function addNew() {
  let stocksTable = document.getElementById('stocks');
  let tBody = stocksTable.getElementsByTagName('tbody')[0];
  createStockRow(tBody, undefined, {}, true);
}

function createStockRow(tBody, name, stock, addingStock) {
  let row = document.createElement('tr');
  let currentRowNumber = tBody.querySelectorAll('tr').length + 1;

  // Create name td
  let nameField = document.createElement('td');
  if (addingStock) {
    // This should be an input field to allow ID modification
    let nameInput = createStockInputField('name', currentRowNumber, '')
    nameField.appendChild(nameInput);
  } else {
    nameField.innerHTML = name;
  }

  row.appendChild(nameField);
  
  // Create current price td
  let currentField = document.createElement('td');
  row.appendChild(currentField);

  // Create buy price field
  let buyField = document.createElement('td');
  let buyInput = createStockInputField('buyPrice', currentRowNumber, stock.buy ? stock.buy : '');
  buyField.appendChild(buyInput);
  row.appendChild(buyField);
  
  // Create sell price field
  let sellField = document.createElement('td');
  let sellInput = createStockInputField('sellPrice', currentRowNumber, stock.sell ? stock.sell : '');
  sellField.appendChild(sellInput);
  row.appendChild(sellField);

  // Create available price td
  let availableField = document.createElement('td');
  row.appendChild(availableField);

  // Add action buttons
  let actionsField = document.createElement('td');
  let actionsDiv = document.createElement('div');
  actionsDiv.classList = 'row d-flex align-items-center';

  let saveButton = document.createElement('button');
  saveButton.classList = 'btn btn-sm btn-outline-primary';
  saveButton.setAttribute('type', 'button');
  saveButton.setAttribute('id', 'btnSave-' + name);
  let saveIcon = document.createElement('i');
  saveIcon.classList = 'fa fa-save';
  saveButton.appendChild(saveIcon);
  saveButton.addEventListener("click", rowSaveClick);
  actionsDiv.appendChild(saveButton);

  let deleteButton = document.createElement('button');
  deleteButton.classList = 'btn btn-sm btn-outline-danger';
  deleteButton.setAttribute('type', 'button');
  deleteButton.setAttribute('id', 'btnDelete-' + name);
  let deleteIcon = document.createElement('i');
  deleteIcon.classList = 'fas fa-minus-circle';
  deleteButton.appendChild(deleteIcon);
  deleteButton.addEventListener('click', rowDeleteClick);
  actionsDiv.appendChild(deleteButton);
  actionsField.appendChild(actionsDiv);
  row.appendChild(actionsField);

  $(tBody).prepend(row);

  return { 
    stockName: name,
    element: row,
    setCurrent: function(val) {
      currentField.innerText = val;
    },
    setAvailable: function(val) {
      availableField.innerText = val;
    }
  };
}

function createStockInputField(idString, row, value) {
  let newInput = document.createElement('input');
  newInput.setAttribute('type', 'text');
  newInput.classList = ['form-control'];
  newInput.setAttribute('value', value);
  newInput.setAttribute('id', idString + row);
  
  return newInput
}

function showErrorModal(errorTitle, error) {
  $("#modalLabel").text(errorTitle);
  $(".modal-body").text(error);
  $("#errorModal").modal('show');
}

document.addEventListener('apiKeyLoaded', () => {
  $('#apisettings').remove();
});

document.addEventListener('apiKeySaved', () => {
  $('#apisettings').remove();
});

document.addEventListener('popupSettingsLoaded', () => {
  loadTornStocks();
});

document.addEventListener('popupLoadedTornStocks', () => {
  loadStocks();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('got message');
  console.log(request);

  if (request.msg === 'stocksLoaded') {
    loadTornStocks();
  }

  sendResponse();
});

// Attach the addNew function to the button
$('#btnAdd').on('click', function() {
  addNew();
});

// Attach the saveAll function to its button
$('#btnSaveStocks').on('click', function() {
  saveAllStocks();
});

$('#btnSaveApiKey').on('click', () => {
  settings.saveKey($('#apikey').val(), true);
});

// Validate our settings
settings.validateSettings(undefined, 'popupSettingsLoaded');