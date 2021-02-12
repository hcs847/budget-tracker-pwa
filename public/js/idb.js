// Establishing connection to the indexedDB database

// creating variable to hold db connection
let db;
// Establishing a connection to IndexDB database called 'budget_tracker' and seting it to version 1
const request = indexedDB.open("budget_tracker", 1);

// Event will emit if the db version changes
request.onupgradeneeded = function (event) {
  // saving a reference to the database
  const db = event.target.result;
  // creating an object store `new_transaction`
  db.createObjectStore("new_transaction", { autoIncrement: true });
};

request.onsuccess = function (event) {
  // when db is successfully created/established a connection, save reference to db in global variable
  db = event.target.result;

  // check if app is online, if yes, run uploadTransaction() function to send all local db data to api
  if (navigator.onLine) {
    uploadTransaction();
  }
};

request.onerror = function (event) {
  console.log(event.target.errorCode);
};

// Functionality for writing data to the indexedDB database
// to be triggered if there is no network connection
function saveRecord(record) {
  // open a new transaction with the database with read and write permissions
  const transaction = db.transaction(["new_transaction"], "readwrite");

  // access the object store for `new_transaction`
  const transactionObjectStore = transaction.objectStore("new_transaction");

  // add record to store
  transactionObjectStore.add(record);
}

// Functionality to handle collecting all data from indexedDB and posting to server
// ========================================================================================
function uploadTransaction() {
  // open a transaction on db
  const transaction = db.transaction(["new_transaction"], "readwrite");

  // access object store to read the data
  const transactionObjectStore = transaction.objectStore("new_transaction");

  // get all records from stroe
  const getAll = transactionObjectStore.getAll();

  //   upon a successful .getAll() execution(async), run this function
  getAll.onsuccess = function () {
    // if there was data in indexedDb's store, send it to the api server
    if (getAll.result.length > 0) {
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(["new_transaction"], "readwrite");
          // access the new_transaction object store
          const transactionObjectStore = transaction.objectStore("new_transaction");
          // clear all items in your store since it's been uploaded to the db
          transactionObjectStore.clear();

          alert("All saved transaction has been submitted!");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

//  listen for app coming back online, so the users won't have to manually trigger the upload
window.addEventListener("online", uploadTransaction);
