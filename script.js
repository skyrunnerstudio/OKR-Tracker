const okrForm = document.getElementById('okr-form');
const statusForm = document.getElementById('status-form');
const list = document.getElementById('okr-list');
const chartCanvas = document.getElementById('okrChart');
const defaultStatuses = ['Backlog', 'To Do', 'In Progress', 'Done'];
let chart;

let okrs = JSON.parse(localStorage.getItem('okrs')) || [];
let statuses = JSON.parse(localStorage.getItem('statuses')) || defaultStatuses;

function saveToStorage() {
  localStorage.setItem('okrs', JSON.stringify(okrs));
  localStorage.setItem('statuses', JSON.stringify(statuses));
}

function renderOKRs() {
  list.innerHTML = '';

  okrs.forEach((okr, index) => {
    const item = document.createElement('div');
    item.className = 'okr-item';

    const tasks = okr.tasks || []; // ensure it never fails
    okr.tasks = tasks; // patch it into the object if missing
    const taskHeader = `
  <div class="task-item task-header">
    <strong>Task</strong>
    <strong>Start</strong>
    <strong>Due</strong>
    <strong>Priority</strong>
    <strong>Status</strong>
  </div>
`;
    const tasksHTML = tasks.map((task, tIndex) => {

      const isOverdue = task.due && new Date(task.due) < new Date() && task.status.toLowerCase() !== 'done';
      const taskClass = isOverdue ? 'task-item overdue' : 'task-item';
      const statusOptions = statuses.map(status =>
        `<option value="${status}" ${status === task.status ? 'selected' : ''}>${status}</option>`
      ).join('');

      return `
        <div class="${taskClass}">
          <input type="text" value="${task.description}" onchange="updateTask(${index}, ${tIndex}, 'description', this.value)">
          <input type="date" value="${task.start}" onchange="updateTask(${index}, ${tIndex}, 'start', this.value)">
          <input type="date" value="${task.due}" onchange="updateTask(${index}, ${tIndex}, 'due', this.value)">
          <select onchange="updateTask(${index}, ${tIndex}, 'priority', this.value)">
            <option ${task.priority === 'Low' ? 'selected' : ''}>Low</option>
            <option ${task.priority === 'Medium' ? 'selected' : ''}>Medium</option>
            <option ${task.priority === 'High' ? 'selected' : ''}>High</option>
          </select>
          <select onchange="updateTask(${index}, ${tIndex}, 'status', this.value)">
            ${statusOptions}
          </select>
        </div>
      `;
    }).join('');

    const progress = calculateProgress(okr.tasks);

    item.innerHTML = `
  <div class="okr-header" onclick="toggleTasks(${index})">
    <strong>${okr.objective}</strong><br>
    ${okr.keyResult}
    <span class="toggle-indicator" id="toggle-${index}">▼</span>
  </div>
  <div class="progress-bar"><div class="progress-bar-fill" style="width:${progress}%"></div></div>
  <small>${progress.toFixed(0)}% complete</small>
  <button onclick="addTask(${index})">Add Task</button>
  <div class="task-container" id="task-container-${index}">
    ${taskHeader}
    ${tasksHTML}
  </div>
  <button onclick="deleteOKR(${index})">Delete OKR</button>
`;



    list.appendChild(item);
  });

  updateChart();
}

function toggleTasks(index) {
  const container = document.getElementById(`task-container-${index}`);
  const toggle = document.getElementById(`toggle-${index}`);
  if (container.style.display === 'none') {
    container.style.display = 'block';
    toggle.textContent = '▼';
  } else {
    container.style.display = 'none';
    toggle.textContent = '►';
  }
}

function calculateProgress(tasks) {
  if (!tasks || tasks.length === 0) return 0;
  const doneCount = tasks.filter(t => t.status.toLowerCase() === 'done').length;
  return (doneCount / tasks.length) * 100;
}

function updateChart() {
  const ctx = chartCanvas.getContext('2d');
  const labels = okrs.length ? okrs.map((_, i) => `KR ${i + 1}`) : ['No Data'];
  const data = okrs.length ? okrs.map(okr => calculateProgress(okr.tasks)) : [0];

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Progress %',
        data,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, max: 100 }
      }
    }
  });
}

function addTask(index) {
  okrs[index].tasks.push({
    description: '',
    start: '',
    due: '',
    priority: 'Medium',
    status: statuses[0]
  });
  saveToStorage();
  renderOKRs();
}

function updateTask(okrIndex, taskIndex, field, value) {
  okrs[okrIndex].tasks[taskIndex][field] = value;
  saveToStorage();
  renderOKRs();
}

function deleteOKR(index) {
  if (confirm('Delete this OKR?')) {
    okrs.splice(index, 1);
    saveToStorage();
    renderOKRs();
  }
}

function showTab(tab) {
  document.getElementById('okr-tab').style.display = (tab === 'okr') ? 'block' : 'none';
  document.getElementById('settings-tab').style.display = (tab === 'settings') ? 'block' : 'none';
  if (tab === 'settings') renderStatuses();
}

function renderStatuses() {
  const ul = document.getElementById('status-list');
  ul.innerHTML = '';
  statuses.forEach((status) => {
    const li = document.createElement('li');
    li.textContent = status;
    ul.appendChild(li);
  });
}

okrForm.addEventListener('submit', function (e) {
  e.preventDefault(); // Stop page refresh

  const objectiveInput = document.getElementById('objective');
  const keyResultInput = document.getElementById('keyResult');

  const objective = objectiveInput.value.trim();
  const keyResult = keyResultInput.value.trim();

  if (!objective || !keyResult) return;

  okrs.push({
    objective,
    keyResult,
    tasks: []
  });

  saveToStorage();
  renderOKRs();

  objectiveInput.value = '';
  keyResultInput.value = '';
});


statusForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const newStatus = document.getElementById('new-status').value.trim();
  if (newStatus && !statuses.includes(newStatus)) {
    statuses.push(newStatus);
    saveToStorage();
    renderStatuses();
    statusForm.reset();
  }
});

function exportToCSV() {
  const filter = document.querySelector('input[name="exportFilter"]:checked').value;
  const filename = prompt("Enter a filename for the CSV (no extension):", "okr_tasks_export") || "okr_tasks_export";

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Objective,Key Result,Task Description,Start Date,Due Date,Priority,Status\n";

  okrs.forEach(okr => {
    const relevantTasks = (filter === 'overdue')
      ? okr.tasks.filter(task => task.due && new Date(task.due) < new Date() && task.status.toLowerCase() !== 'done')
      : okr.tasks;

    if (relevantTasks.length === 0 && filter === 'all') {
      csvContent += `"${okr.objective}","${okr.keyResult}","","","","",""\n`;
    } else {
      relevantTasks.forEach(task => {
        csvContent += `"${okr.objective}","${okr.keyResult}","${task.description}","${task.start}","${task.due}","${task.priority}","${task.status}"\n`;
      });
    }
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

renderOKRs();
document.addEventListener('DOMContentLoaded', function () {
  renderOKRs();
});
