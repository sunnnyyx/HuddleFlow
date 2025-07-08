document.addEventListener("DOMContentLoaded", () => {
  const currentUser = localStorage.getItem("loggedInUser");
  if (!currentUser) {
    window.location.href = "auth.html";
    return;
  }

  const greetingEl = document.getElementById("userGreeting");
  if (greetingEl) {
    greetingEl.textContent = `Hello, ${currentUser}`;
  }

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

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("loggedInUser");
      window.location.href = "auth.html";
    });
  }

  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebar");
  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("-translate-x-full");
    });
  }

  initializeBoardSelector();
  loadNotesFromLocalStorage();
  initializeSortable();

  const exportBtn = document.getElementById("exportBoardBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const currentUser = localStorage.getItem("loggedInUser");
      const userData = JSON.parse(localStorage.getItem(`huddleflow-user-${currentUser}`));
      if (!userData || !userData.currentBoard) return alert("No board data found.");

      const boardName = userData.currentBoard;
      const boardData = userData.boards[boardName];
      const json = JSON.stringify({ boards: { [boardName]: boardData }, currentBoard: boardName }, null, 2);

      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${boardName}.json`;
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  const importBtn = document.getElementById("importBoardBtn");
  const importInput = document.getElementById("importBoardInput");

  if (importBtn && importInput) {
    importBtn.addEventListener("click", () => {
      importInput.click();
    });

    importInput.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          const currentUser = localStorage.getItem("loggedInUser");
          if (!currentUser || !data || !data.boards || !data.currentBoard) {
            alert("Invalid file format.");
            return;
          }

          const userData = JSON.parse(localStorage.getItem(`huddleflow-user-${currentUser}`)) || {
            boards: {},
            currentBoard: "My First Board"
          };

          // Merge imported board into existing user data
          userData.boards = { ...userData.boards, ...data.boards };
          userData.currentBoard = data.currentBoard;

          localStorage.setItem(`huddleflow-user-${currentUser}`, JSON.stringify(userData));
          initializeBoardSelector();
          reloadBoard();
          alert("Board imported successfully.");
        } catch (error) {
          alert("Failed to import board. Invalid JSON.");
        }
      };
      reader.readAsText(file);
    });
  }
});

function initializeBoardSelector() {
  const boardSelector = document.getElementById("boardSelector");
  const createBoardBtn = document.getElementById("createBoardBtn");
  const newBoardInput = document.getElementById("newBoardName");
  const renameBoardBtn = document.getElementById("renameBoardBtn");
  const deleteBoardBtn = document.getElementById("deleteBoardBtn");

  const currentUser = localStorage.getItem("loggedInUser");
  if (!currentUser || !boardSelector || !createBoardBtn || !newBoardInput) return;

  let userData = JSON.parse(localStorage.getItem(`huddleflow-user-${currentUser}`)) || {
    currentBoard: "My First Board",
    boards: { "My First Board": {} },
  };

  const boards = Object.keys(userData.boards);
  const currentBoard = userData.currentBoard;

  boardSelector.innerHTML = "";
  boards.forEach((board) => {
    const option = document.createElement("option");
    option.value = board;
    option.textContent = board;
    if (board === currentBoard) option.selected = true;
    boardSelector.appendChild(option);
  });

  boardSelector.onchange = () => {
    userData.currentBoard = boardSelector.value;
    localStorage.setItem(`huddleflow-user-${currentUser}`, JSON.stringify(userData));
    reloadBoard();
  };

  createBoardBtn.onclick = () => {
    const newBoard = newBoardInput.value.trim();
    if (!newBoard || userData.boards[newBoard]) {
      alert("Invalid or duplicate board name.");
      return;
    }
    userData.boards[newBoard] = {};
    userData.currentBoard = newBoard;
    localStorage.setItem(`huddleflow-user-${currentUser}`, JSON.stringify(userData));
    newBoardInput.value = "";
    initializeBoardSelector();
    reloadBoard();
  };

  if (renameBoardBtn) {
    renameBoardBtn.addEventListener("click", () => {
      const oldName = boardSelector.value;
      const newName = prompt("Enter new board name:", oldName);
      if (!newName || newName === oldName || userData.boards[newName]) {
        alert("Invalid or duplicate name.");
        return;
      }
      userData.boards[newName] = userData.boards[oldName];
      delete userData.boards[oldName];
      if (userData.currentBoard === oldName) {
        userData.currentBoard = newName;
      }
      localStorage.setItem(`huddleflow-user-${currentUser}`, JSON.stringify(userData));
      initializeBoardSelector();
      reloadBoard();
    });
  }

  if (deleteBoardBtn) {
    deleteBoardBtn.addEventListener("click", () => {
      const boardToDelete = boardSelector.value;
      if (!confirm(`Are you sure you want to delete "${boardToDelete}"?`)) return;

      delete userData.boards[boardToDelete];
      const remaining = Object.keys(userData.boards);
      userData.currentBoard = remaining[0] || "My First Board";
      if (!userData.boards[userData.currentBoard]) {
        userData.boards[userData.currentBoard] = {};
      }

      localStorage.setItem(`huddleflow-user-${currentUser}`, JSON.stringify(userData));
      initializeBoardSelector();
      reloadBoard();
    });
  }
}

function reloadBoard() {
  document.querySelectorAll(".note-list").forEach((list) => (list.innerHTML = ""));
  loadNotesFromLocalStorage();
}

function createNoteElement(text, column) {
  const li = document.createElement("li");
  li.className =
    "p-3 bg-white/30 backdrop-blur-md rounded-xl shadow flex justify-between items-start gap-3 transform scale-95 opacity-0 transition duration-300";

  const span = document.createElement("span");
  span.textContent = text;
  span.className = "text-white";

  const actions = document.createElement("div");
  actions.className = "space-x-2 flex items-center";

  const editBtn = document.createElement("button");
  editBtn.innerHTML = '<i class="fas fa-pen text-yellow-400"></i>';
  editBtn.title = "Edit";
  editBtn.className = "hover:scale-110 transform transition";
  editBtn.onclick = () => {
    Swal.fire({
      title: "Edit Note",
      input: "text",
      inputLabel: "Edit your task",
      inputValue: span.textContent,
      showCancelButton: true,
      confirmButtonText: "Save",
      confirmButtonColor: "#14b8a6",
    }).then((result) => {
      if (result.isConfirmed && result.value.trim() !== "") {
        span.textContent = result.value.trim();
        updateLocalStorage(column);
      }
    });
  };

  const deleteBtn = document.createElement("button");
  deleteBtn.innerHTML = '<i class="fas fa-trash text-red-500"></i>';
  deleteBtn.title = "Delete";
  deleteBtn.className = "hover:scale-110 transform transition";
  deleteBtn.onclick = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "This note will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        li.remove();
        updateLocalStorage(column);
        Swal.fire("Deleted!", "Your note has been removed.", "success");
      }
    });
  };

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);
  li.appendChild(span);
  li.appendChild(actions);

  setTimeout(() => {
    li.classList.remove("scale-95", "opacity-0");
    li.classList.add("scale-100", "opacity-100");
  }, 20);

  return li;
}

function loadNotesFromLocalStorage() {
  const currentUser = localStorage.getItem("loggedInUser");
  if (!currentUser) return;

  const userData = JSON.parse(localStorage.getItem(`huddleflow-user-${currentUser}`));
  if (!userData || !userData.boards) return;

  const currentBoard = userData.currentBoard || "My First Board";
  const boardData = userData.boards[currentBoard] || {};

  for (let columnKey in boardData) {
    const list = document.querySelector(`.note-list[data-column="${columnKey}"]`);
    if (!list) continue;

    boardData[columnKey].forEach((text) => {
      const li = createNoteElement(text, columnKey);
      list.appendChild(li);
    });
  }
}

function updateLocalStorage(column) {
  const currentUser = localStorage.getItem("loggedInUser");
  if (!currentUser) return;

  const list = document.querySelector(`.note-list[data-column="${column}"]`);
  const items = list.querySelectorAll("li span");
  const updatedNotes = Array.from(items).map((item) => item.textContent);

  const userData = JSON.parse(localStorage.getItem(`huddleflow-user-${currentUser}`)) || {
    currentBoard: "My First Board",
    boards: {}
  };

  const currentBoard = userData.currentBoard || "My First Board";

  if (!userData.boards[currentBoard]) {
    userData.boards[currentBoard] = {};
  }

  userData.boards[currentBoard][column] = updatedNotes;
  localStorage.setItem(`huddleflow-user-${currentUser}`, JSON.stringify(userData));
}

function saveAllListsToLocalStorage() {
  const currentUser = localStorage.getItem("loggedInUser");
  if (!currentUser) return;

  const userData = JSON.parse(localStorage.getItem(`huddleflow-user-${currentUser}`)) || {
    currentBoard: "My First Board",
    boards: {}
  };

  const currentBoard = userData.currentBoard || "My First Board";
  const allLists = document.querySelectorAll(".note-list");
  const newBoardData = {};

  allLists.forEach((list) => {
    const column = list.dataset.column;
    newBoardData[column] = [];
    list.querySelectorAll("li span").forEach((item) => {
      newBoardData[column].push(item.textContent);
    });
  });

  userData.boards[currentBoard] = newBoardData;
  localStorage.setItem(`huddleflow-user-${currentUser}`, JSON.stringify(userData));
}

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
