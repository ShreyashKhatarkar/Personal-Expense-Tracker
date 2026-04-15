const state = {
  transactions: [],
};

let isUpdate = false;
let tid = null;

const form = document.getElementById("transactionForm");

function renderTransactions() {
  const container = document.querySelector(".transactions");
  const netEl = document.getElementById("netAmount");
  const earnEl = document.getElementById("earning");
  const expEl = document.getElementById("expense");

  container.innerHTML = "";

  let income = 0;
  let expense = 0;

  state.transactions.forEach((t) => {
    const div = document.createElement("div");
    div.classList.add("transaction", t.type);

    div.innerHTML = `
      <div>
        <p>${t.text}</p>
        <p>${t.type === "income" ? "+" : "-"} ₹${t.amount}</p>
      </div>

      <div class="actions">
        <button onclick="editTransaction(${t.id})" class="edit-btn">✏️</button>
        <button onclick="deleteTransaction(${t.id})" class="delete-btn">🗑️</button>
      </div>
    `;

    container.appendChild(div);

    if (t.type === "income") {
      income += t.amount;
    } else {
      expense += t.amount;
    }
  });

  const net = income - expense;

  netEl.innerText = `₹${net}`;
  earnEl.innerText = `₹${income}`;
  expEl.innerText = `₹${expense}`;
}

function addTransaction(e) {
  e.preventDefault();

  const text = document.getElementById("text").value;
  const amount = +document.getElementById("amount").value;

  const isIncome = e.submitter.id === "earnBtn";

  const transaction = {
    id: isUpdate ? tid : Date.now(),
    text,
    amount,
    type: isIncome ? "income" : "expense",
  };

  if (isUpdate) {
    const index = state.transactions.findIndex(t => t.id === tid);
    state.transactions[index] = transaction;
    isUpdate = false;
    tid = null;
  } else {
    state.transactions.push(transaction);
  }

  renderTransactions();
  form.reset();
}

function editTransaction(id) {
  const transaction = state.transactions.find(t => t.id === id);

  document.getElementById("text").value = transaction.text;
  document.getElementById("amount").value = transaction.amount;

  isUpdate = true;
  tid = id;
}

function deleteTransaction(id) {
  state.transactions = state.transactions.filter(t => t.id !== id);
  renderTransactions();
}

form.addEventListener("submit", addTransaction);

renderTransactions();
