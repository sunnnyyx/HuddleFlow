// app.js

document.addEventListener("DOMContentLoaded", () => {
  const addButtons = document.querySelectorAll(".add-note-btn");

  addButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const columnType = button.dataset.column;
      const noteList = document.querySelector(`.note-list[data-column="${columnType}"]`);

      const userInput = prompt("Enter your note or task:");
      if (!userInput || userInput.trim() === "") return;

      const newNote = createNoteElement(userInput, columnType);
      noteList.appendChild(newNote);

      updateLocalStorage(columnType);
    });
  });

  loadNotesFromLocalStorage();
  initializeSortable();
});

// Create a new <li> element for the note/task
function createNoteElement(text, column, index = null) {
  const li = document.createElement("li");
  li.className = "p-2 bg-gray-100 rounded mb-2 flex justify-between items-center";

  const span = document.createElement("span");
  span.textContent = text;

  const actions = document.createElement("div");
  actions.className = "space-x-2";

  // Edit Button
  const editBtn = document.createElement("button");
  editBtn.textContent = "✏️";
  editBtn.title = "Edit";
  editBtn.onclick = () => {
    const updated = prompt("Edit your note:", span.textContent);
    if (!updated || updated.trim() === "") return;
    span.textContent = updated;
    updateLocalStorage(column);
  };

  // Delete Button
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "❌";
  deleteBtn.title = "Delete";
  deleteBtn.onclick = () => {
    li.remove();
    updateLocalStorage(column);
  };

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);
  li.appendChild(span);
  li.appendChild(actions);
  return li;
}

// Load all saved notes/tasks on page load
function loadNotesFromLocalStorage() {
  const savedData = JSON.parse(localStorage.getItem("huddleflow-data")) || {};

  for (let columnKey in savedData) {
    const list = document.querySelector(`.note-list[data-column="${columnKey}"]`);
    if (!list) continue;

    savedData[columnKey].forEach((text) => {
      const li = createNoteElement(text, columnKey);
      list.appendChild(li);
    });
  }
}

// Save current state of a single column to localStorage
function updateLocalStorage(column) {
  const list = document.querySelector(`.note-list[data-column="${column}"]`);
  const items = list.querySelectorAll("li span");
  const updated = Array.from(items).map(item => item.textContent);

  let allData = JSON.parse(localStorage.getItem("huddleflow-data")) || {};
  allData[column] = updated;
  localStorage.setItem("huddleflow-data", JSON.stringify(allData));
}

// Save state of all columns to localStorage (after drag-and-drop)
function saveAllListsToLocalStorage() {
  const allLists = document.querySelectorAll(".note-list");
  const newData = {};

  allLists.forEach((list) => {
    const column = list.dataset.column;
    newData[column] = [];

    list.querySelectorAll("li span").forEach((item) => {
      newData[column].push(item.textContent);
    });
  });

  localStorage.setItem("huddleflow-data", JSON.stringify(newData));
}

// Enable drag-and-drop using Sortable.js
function initializeSortable() {
  const allLists = document.querySelectorAll(".note-list");

  allLists.forEach((list) => {
    new Sortable(list, {
      group: "shared",
      animation: 150,
      onEnd: saveAllListsToLocalStorage,
    });
  });
}
