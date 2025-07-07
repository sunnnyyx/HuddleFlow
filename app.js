document.addEventListener("DOMContentLoaded", () => {
  const currentUser = localStorage.getItem("loggedInUser");
  if (!currentUser) {
    window.location.href = "auth.html";
    return;
  }

  // Update greeting
  const greetingEl = document.getElementById("userGreeting");
  if (greetingEl) {
    greetingEl.textContent = `Hello, ${currentUser}`;
  }

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
        confirmButtonColor: '#14b8a6',
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

  // Handle logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("loggedInUser");
      window.location.href = "auth.html";
    });
  }

  // Sidebar toggle for mobile
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebar");

  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("-translate-x-full");
    });
  }

  loadNotesFromLocalStorage();
  initializeSortable();
});

// Create note card
function createNoteElement(text, column) {
  const li = document.createElement("li");
  li.className =
    "p-3 bg-white/30 backdrop-blur-md rounded-xl shadow flex justify-between items-start gap-3 transform scale-95 opacity-0 transition duration-300";

  const span = document.createElement("span");
  span.textContent = text;
  span.className = "text-white";

  const actions = document.createElement("div");
  actions.className = "space-x-2 flex items-center";

  // Edit Button
  const editBtn = document.createElement("button");
  editBtn.innerHTML = '<i class="fas fa-pen text-yellow-400"></i>';
  editBtn.title = "Edit";
  editBtn.className = "hover:scale-110 transform transition";
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

  // Delete Button
  const deleteBtn = document.createElement("button");
  deleteBtn.innerHTML = '<i class="fas fa-trash text-red-500"></i>';
  deleteBtn.title = "Delete";
  deleteBtn.className = "hover:scale-110 transform transition";
  deleteBtn.onclick = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "This note will be deleted!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#6b7280',
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

  // Animate entry
  setTimeout(() => {
    li.classList.remove("scale-95", "opacity-0");
    li.classList.add("scale-100", "opacity-100");
  }, 20);

  return li;
}

// Load notes from localStorage
function loadNotesFromLocalStorage() {
  const currentUser = localStorage.getItem("loggedInUser");
  if (!currentUser) return;

  const savedData = JSON.parse(localStorage.getItem(`huddleflow-data-${currentUser}`)) || {};

  for (let columnKey in savedData) {
    const list = document.querySelector(`.note-list[data-column="${columnKey}"]`);
    if (!list) continue;

    savedData[columnKey].forEach((text) => {
      const li = createNoteElement(text, columnKey);
      list.appendChild(li);
    });
  }
}

// Save notes for a column
function updateLocalStorage(column) {
  const currentUser = localStorage.getItem("loggedInUser");
  if (!currentUser) return;

  const list = document.querySelector(`.note-list[data-column="${column}"]`);
  const items = list.querySelectorAll("li span");
  const updated = Array.from(items).map((item) => item.textContent);

  let allData = JSON.parse(localStorage.getItem(`huddleflow-data-${currentUser}`)) || {};
  allData[column] = updated;
  localStorage.setItem(`huddleflow-data-${currentUser}`, JSON.stringify(allData));
}

// Save all columns (used after drag)
function saveAllListsToLocalStorage() {
  const currentUser = localStorage.getItem("loggedInUser");
  if (!currentUser) return;

  const allLists = document.querySelectorAll(".note-list");
  const newData = {};

  allLists.forEach((list) => {
    const column = list.dataset.column;
    newData[column] = [];

    list.querySelectorAll("li span").forEach((item) => {
      newData[column].push(item.textContent);
    });
  });

  localStorage.setItem(`huddleflow-data-${currentUser}`, JSON.stringify(newData));
}

// Drag-and-drop
function initializeSortable() {
  const allLists = document.querySelectorAll(".note-list");

  allLists.forEach((list) => {
    new Sortable(list, {
      group: "shared",
      animation: 150,
      onStart: (evt) => {
        evt.item.classList.add("ring-2", "ring-teal-300", "scale-105");
      },
      onEnd: (evt) => {
        evt.item.classList.remove("ring-2", "ring-teal-300", "scale-105");
        saveAllListsToLocalStorage();
      },
      onChoose: () => list.classList.add("drag-over"),
      onUnchoose: () => list.classList.remove("drag-over"),
    });
  });
}
