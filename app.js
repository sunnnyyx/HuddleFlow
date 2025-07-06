document.addEventListener("DOMContentLoaded", () => {
  // Handle Add Note/Task Buttons
  const addButtons = document.querySelectorAll(".add-note-btn");

  addButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const columnType = button.dataset.column;
      const noteList = document.querySelector(`.note-list[data-column="${columnType}"]`);

      Swal.fire({
        title: 'Add a Note or Task',
        input: 'textarea',
        inputLabel: 'Your text',
        inputPlaceholder: 'Write something...',
        showCancelButton: true,
        confirmButtonText: 'Add',
        confirmButtonColor: '#14b8a6', // Tailwind teal-500
      }).then((result) => {
        if (result.isConfirmed && result.value.trim() !== "") {
          const userInput = result.value.trim();
          const newNote = createNoteElement(userInput, columnType);
          noteList.appendChild(newNote);
          updateLocalStorage(columnType);
        }
      });
    });
  });

  // Toggle sidebar on mobile
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebar");

  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("hidden");
    });
  }

  loadNotesFromLocalStorage();
  initializeSortable();
});

// Create a new note/task element
function createNoteElement(text, column, index = null) {
  const li = document.createElement("li");
  li.className =
    "p-2 bg-gray-100 rounded mb-2 flex justify-between items-center transition-all duration-300 ease-out opacity-0 scale-95";

  const span = document.createElement("span");
  span.textContent = text;

  const actions = document.createElement("div");
  actions.className = "space-x-2";

  // ✏️ Edit Button
  const editBtn = document.createElement("button");
  editBtn.textContent = "✏️";
  editBtn.title = "Edit";
  editBtn.onclick = () => {
    Swal.fire({
      title: 'Edit Note',
      input: 'text',
      inputLabel: 'Edit your task',
      inputValue: span.textContent,
      showCancelButton: true,
      confirmButtonText: 'Save',
      confirmButtonColor: '#14b8a6',
    }).then((result) => {
      if (result.isConfirmed && result.value.trim() !== "") {
        span.textContent = result.value.trim();
        updateLocalStorage(column);
      }
    });
  };

  // ❌ Delete Button
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "❌";
  deleteBtn.title = "Delete";
  deleteBtn.onclick = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "This note will be deleted!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48', // Tailwind red-600
      cancelButtonColor: '#6b7280', // Tailwind gray-500
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        li.remove();
        updateLocalStorage(column);
        Swal.fire('Deleted!', 'Your note has been removed.', 'success');
      }
    });
  };

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);
  li.appendChild(span);
  li.appendChild(actions);

  // Animate on enter
  setTimeout(() => {
    li.classList.remove("opacity-0", "scale-95");
    li.classList.add("opacity-100", "scale-100");
  }, 10);

  return li;
}

// Load notes/tasks from localStorage
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

// Save notes for a single column
function updateLocalStorage(column) {
  const list = document.querySelector(`.note-list[data-column="${column}"]`);
  const items = list.querySelectorAll("li span");
  const updated = Array.from(items).map((item) => item.textContent);

  let allData = JSON.parse(localStorage.getItem("huddleflow-data")) || {};
  allData[column] = updated;
  localStorage.setItem("huddleflow-data", JSON.stringify(allData));
}

// Save all lists (after drag-and-drop)
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

// Initialize drag-and-drop functionality
function initializeSortable() {
  const allLists = document.querySelectorAll(".note-list");

  allLists.forEach((list) => {
    new Sortable(list, {
      group: "shared",
      animation: 150,
      onEnd: saveAllListsToLocalStorage,
      onChoose: () => list.classList.add("drag-over"),
      onUnchoose: () => list.classList.remove("drag-over"),
    });
  });
}
