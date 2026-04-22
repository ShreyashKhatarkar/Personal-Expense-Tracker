let expenses = [];
let budget = 0;
let pieChart, barChart;

let categories = ['Food', 'Travel', 'Shopping', 'Other'];
const DEFAULT_CATEGORIES = ['Food', 'Travel', 'Shopping', 'Other'];

const dashboard = document.getElementById('dashboard');
const loginModal = document.getElementById('login-modal');
const usernameInput = document.getElementById('username-input');
const loginBtn = document.getElementById('login-btn');
const greeting = document.getElementById('greeting');

const budgetInput = document.getElementById('budget-input');
const setBudgetBtn = document.getElementById('set-budget-btn');
const totalBudgetEl = document.getElementById('total-budget');
const totalExpensesEl = document.getElementById('total-expenses');
const remainingBalanceEl = document.getElementById('remaining-balance');

const expenseNameInput = document.getElementById('expense-name');
const expenseAmountInput = document.getElementById('expense-amount');
const expenseCategoryInput = document.getElementById('expense-category');
const expenseDateInput = document.getElementById('expense-date');
const addExpenseBtn = document.getElementById('add-expense-btn');

const expenseList = document.getElementById('expense-list');
const smartMessageEl = document.getElementById('smart-message');
const filterCategory = document.getElementById('filter-category');
const sortAmount = document.getElementById('sort-amount');
const downloadReportBtn = document.getElementById('download-report-btn');
const clearAllDataBtn = document.getElementById('clear-data-btn');

const newCategoryInput = document.getElementById('new-category-input');
const addCategoryBtn = document.getElementById('add-category-btn');


function loadData() {
    const userName = localStorage.getItem('userName');
    if (userName) {
        loginModal.classList.add('hidden');
        dashboard.classList.remove('hidden');
        greeting.textContent = `Hello, ${userName}! 👋`;
    } else {
        loginModal.classList.remove('hidden');
        return; 
    }
    
    const storedBudget = localStorage.getItem('budget');
    if (storedBudget) {
        budget = parseFloat(storedBudget);
        budgetInput.value = budget;
    }

    const storedExpenses = localStorage.getItem('expenses');
    if (storedExpenses) {
        expenses = JSON.parse(storedExpenses).map(exp => ({
            ...exp,
            amount: parseFloat(exp.amount)
        }));
    }

    loadCategories();
    
    updateCategoryDropdowns();
    updateSummary();
    renderExpenses();
    initCharts(); 
    updateCharts();
    updateSmartInsights();
}

function saveData() {
    localStorage.setItem('budget', budget);
    localStorage.setItem('expenses', JSON.stringify(expenses));
}



function loadCategories() {
    const storedCategories = localStorage.getItem('categories');
    if (storedCategories) {
        categories = [...new Set([...DEFAULT_CATEGORIES, ...JSON.parse(storedCategories)])];
    }
}

function saveCategories() {
    // Only save custom categories (exclude the defaults)
    const customCats = categories.filter(cat => !DEFAULT_CATEGORIES.includes(cat));
    localStorage.setItem('categories', JSON.stringify(customCats));
}

function updateCategoryDropdowns() {
    const selectorIds = ['expense-category', 'filter-category'];

    selectorIds.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;

        const currentSelection = select.value;

        while (select.options.length > (id === 'filter-category' ? 1 : 0)) {
            select.remove(id === 'filter-category' ? 1 : 0);
        }
        
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            select.appendChild(option);
        });

        select.value = currentSelection || (id === 'filter-category' ? 'All' : '');
    });
}


function updateSummary() {
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const remaining = budget - totalExpenses;

    budget = parseFloat(budget) || 0;

    totalBudgetEl.textContent = `₹${budget.toFixed(2)}`;
    totalExpensesEl.textContent = `₹${totalExpenses.toFixed(2)}`;
    remainingBalanceEl.textContent = `₹${remaining.toFixed(2)}`;

    remainingBalanceEl.classList.remove('positive', 'negative', 'neutral');
    totalExpensesEl.classList.remove('negative');
    
    if (totalExpenses > budget && budget > 0) {
        remainingBalanceEl.classList.add('negative'); 
        totalExpensesEl.classList.add('negative');
    } else if (remaining >= 0) {
        remainingBalanceEl.classList.add('positive'); 
    } else {
        remainingBalanceEl.classList.add('neutral'); 
    }

    saveData();
    updateCharts();
    updateSmartInsights();
}


function addExpense() {
    const name = expenseNameInput.value.trim();
    const amount = parseFloat(expenseAmountInput.value);
    const category = expenseCategoryInput.value;
    const date = expenseDateInput.value;

    if (!name || isNaN(amount) || amount <= 0 || !category || !date) {
        alert('Please fill out all fields with valid data.');
        return;
    }

    const newExpense = {
        id: Date.now(), 
        name,
        amount,
        category,
        date
    };

    expenses.push(newExpense);
    
    expenseNameInput.value = '';
    expenseAmountInput.value = '';
    expenseCategoryInput.value = '';

    renderExpenses();
    updateSummary();
}


function deleteExpense(id) {
    expenses = expenses.filter(exp => exp.id !== id);
    renderExpenses();
    updateSummary();
}


function renderExpenses() {
    expenseList.innerHTML = ''; 

    let currentExpenses = [...expenses]; 

    const selectedCategory = filterCategory.value;
    if (selectedCategory !== 'All') {
        currentExpenses = currentExpenses.filter(exp => exp.category === selectedCategory);
    }

    const sortType = sortAmount.value;
    if (sortType !== 'none') {
        currentExpenses.sort((a, b) => {
            if (sortType === 'asc') {
                return a.amount - b.amount;
            } else {
                return b.amount - a.amount;
            }
        });
    }

    if (currentExpenses.length === 0) {
        expenseList.innerHTML = `<li style="text-align:center; padding: 20px; color: #777;">No expenses found for the current filter.</li>`;
        return;
    }

    currentExpenses.forEach(exp => {
        const listItem = document.createElement('li');
        listItem.className = 'expense-item';
        
        listItem.innerHTML = `
            <div class="expense-info" id="exp-info-${exp.id}">
                <strong>${exp.name} - ₹${exp.amount.toFixed(2)}</strong>
                <small>${exp.category} on ${exp.date}</small>
            </div>
            <div class="expense-actions">
                <button class="edit-btn btn-action" data-id="${exp.id}"><i class="fas fa-edit"></i></button> 
                <button class="delete-btn btn-action" data-id="${exp.id}"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;

        listItem.querySelector('.delete-btn').addEventListener('click', (e) => {
            deleteExpense(parseInt(e.currentTarget.dataset.id));
        });
        
        listItem.querySelector('.edit-btn').addEventListener('click', (e) => {
            toggleEdit(parseInt(e.currentTarget.dataset.id), listItem);
        });

        expenseList.appendChild(listItem);
    });
}


function toggleEdit(id, listItem) {
    const expense = expenses.find(exp => exp.id === id);
    if (!expense) return;

    const infoDiv = listItem.querySelector(`#exp-info-${id}`);
    const editBtn = listItem.querySelector('.edit-btn');
    const actionsDiv = listItem.querySelector('.expense-actions');


    if (editBtn.classList.contains('save-btn')) {
        const newName = listItem.querySelector('.edit-name').value.trim();
        const newAmount = parseFloat(listItem.querySelector('.edit-amount').value);
        const newCategory = listItem.querySelector('.edit-category').value;
        const newDate = listItem.querySelector('.edit-date').value;

        if (!newName || isNaN(newAmount) || newAmount <= 0) {
            alert('Invalid input. Changes not saved.');
            renderExpenses(); 
            return;
        }

        const index = expenses.findIndex(exp => exp.id === id);
        expenses[index] = { ...expense, name: newName, amount: newAmount, category: newCategory, date: newDate };

        renderExpenses(); 
        updateSummary();
        alert('Expense updated successfully!');

    } else {
        infoDiv.innerHTML = `
            <input type="text" class="edit-name" value="${expense.name}" style="width: 100%; margin-bottom: 5px;">
            <input type="number" class="edit-amount" value="${expense.amount}" style="width: 100%; margin-bottom: 5px;">
            <div style="display: flex; gap: 5px;">
                <select class="edit-category" style="flex: 1;">
                    ${categories.map(cat => 
                        `<option value="${cat}" ${cat === expense.category ? 'selected' : ''}>${cat}</option>`
                    ).join('')}
                </select>
                <input type="date" class="edit-date" value="${expense.date}" style="flex: 1;">
            </div>
        `;
        editBtn.innerHTML = '<i class="fas fa-save"></i>';
        editBtn.classList.add('save-btn');
        editBtn.classList.remove('edit-btn');
    }
}



function updateSmartInsights() {
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const remaining = budget - totalExpenses;
    const categoriesList = categories;
    const categoryTotals = categoriesList.map(cat => ({
        name: cat,
        total: expenses.filter(exp => exp.category === cat).reduce((sum, exp) => sum + exp.amount, 0)
    }));

    categoryTotals.sort((a, b) => b.total - a.total);
    const topCategory = categoryTotals[0];

    let message = '🎯 **You’re managing well, keep it up!**'; 
    
    if (expenses.length === 0) {
        message = '💡 **Start adding expenses** to unlock your smart insights!';
    } else if (budget > 0) {
        if (remaining < 0) {
            message = `🔥 **Alert! You are over budget by ₹${Math.abs(remaining).toFixed(2)}.** Time to cut back!`;
        } else if (remaining < (budget * 0.15)) {
            message = `⚠️ **You're close to hitting your budget!** Only ₹${remaining.toFixed(2)} remaining.`;
        } else if (remaining > (budget * 0.25) && totalExpenses > 0) {
            message = `💰 **You saved ₹${remaining.toFixed(2)} under budget this month.** Excellent discipline!`;
        }
    }
    
    if (topCategory && totalExpenses > 1000 && topCategory.total > (totalExpenses * 0.4)) {
        message = `⚠️ **Category Focus:** ${topCategory.name} expenses are high. They account for ${(topCategory.total / totalExpenses * 100).toFixed(0)}% of your total spending.`;
    }

    smartMessageEl.innerHTML = message;
}


function initCharts() {
    const pieCtx = document.getElementById('categoryPieChart').getContext('2d');
    pieChart = new Chart(pieCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{ data: [], backgroundColor: [] }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } }
        }
    });

    const barCtx = document.getElementById('dailyBarChart').getContext('2d');
    barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{ label: 'Daily Spending (₹)', data: [], backgroundColor: 'rgba(54, 162, 235, 0.7)' }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
        }
    });
}

function updateCharts() {
    if (!pieChart || !barChart) return;

    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9933']; 
    const categoryData = categories.map(cat => 
        expenses.filter(exp => exp.category === cat).reduce((sum, exp) => sum + exp.amount, 0)
    );

    const nonZeroCategories = categories.filter((_, index) => categoryData[index] > 0);
    const nonZeroData = categoryData.filter(data => data > 0);
    const nonZeroColors = colors.filter((_, index) => categoryData[index] > 0);


    pieChart.data.labels = nonZeroCategories;
    pieChart.data.datasets[0].data = nonZeroData;
    pieChart.data.datasets[0].backgroundColor = nonZeroColors;
    pieChart.update();

    const dailyDataMap = expenses.reduce((map, exp) => {
        const date = exp.date;
        map[date] = (map[date] || 0) + exp.amount;
        return map;
    }, {});

    const sortedDates = Object.keys(dailyDataMap).sort();
    const dailyAmounts = sortedDates.map(date => dailyDataMap[date]);

    barChart.data.labels = sortedDates;
    barChart.data.datasets[0].data = dailyAmounts;
    barChart.update();
}


function downloadCSVReport() {
    if (expenses.length === 0) {
        alert('No expenses to download!');
        return;
    }

    const header = ['ID', 'Name', 'Amount', 'Category', 'Date'];
    const rows = expenses.map(exp => [
        exp.id,
        `"${exp.name.replace(/"/g, '""')}"`, 
        exp.amount.toFixed(2),
        exp.category,
        exp.date
    ]);

    let csvContent = header.join(',') + '\n';
    rows.forEach(row => {
        csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `expense_report_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function clearAllData() {
    if (confirm("Are you sure you want to clear ALL stored data (expenses, budget, and username)? This cannot be undone.")) {
        localStorage.clear();
        window.location.reload(); 
    }
}


loginBtn.addEventListener('click', () => {
    const userName = usernameInput.value.trim();
    if (userName) {
        localStorage.setItem('userName', userName);
        loadData(); 
    } else {
        alert('Please enter your name.');
    }
});

setBudgetBtn.addEventListener('click', () => {
    const newBudget = parseFloat(budgetInput.value);
    if (isNaN(newBudget) || newBudget < 0) {
        alert('Please enter a valid budget amount.');
        return;
    }
    budget = newBudget;
    updateSummary();
    alert(`Budget set to ₹${budget.toFixed(2)}`);
});

addExpenseBtn.addEventListener('click', addExpense);

filterCategory.addEventListener('change', renderExpenses);
sortAmount.addEventListener('change', renderExpenses);

downloadReportBtn.addEventListener('click', downloadCSVReport);

clearAllDataBtn.addEventListener('click', clearAllData);

addCategoryBtn.addEventListener('click', () => {
    const newCat = newCategoryInput.value.trim();
    if (newCat && !categories.includes(newCat)) {
        categories.push(newCat);
        newCategoryInput.value = '';
        saveCategories();
        updateCategoryDropdowns();
        updateCharts(); 
    } else if (newCat) {
        alert('Category already exists!');
    }
});


expenseDateInput.valueAsDate = new Date();

document.addEventListener('DOMContentLoaded', loadData);
