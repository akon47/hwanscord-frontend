function saveTokenToLocalStorage(value) {
  localStorage.setItem("token", value);
}

function saveUserToLocalStorage(value) {
  localStorage.setItem("username", value);
}

function getTokenFromLocalStorage() {
  return localStorage.getItem("token");
}

function getUserFromLocalStorage() {
  return localStorage.getItem("username");
}

export {
  saveTokenToLocalStorage,
  saveUserToLocalStorage,
  getTokenFromLocalStorage,
  getUserFromLocalStorage
};
