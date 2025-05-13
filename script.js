const form = document.getElementById('okr-form');
const list = document.getElementById('okr-list');

let okrs = JSON.parse(localStorage.getItem('okrs')) || [];
let chart;

// Function to render OKRs to the page
function renderOKRs() {
  list.innerHTML = '';

  okrs.forEach((okr, index) => {
    const item = document.createElement('div');
    item.className = 'okr-item';
    item.innerHTML = `
      <strong>${okr.objective}</strong><br>
      ${okr.keyResult}<br>
      <div class="progress-bar">
        <div class="progress-bar-fill" style="width: ${okr.progress}%"></div>
      </div>
      <small>${okr.progress}% complete</small><br>
      <button onclick="editOKR(${index})">Edit</button>
      <button onclick="deleteOKR(${index})">Delete</button>
    `;
    list.appendChild(item);
  });

  updateChart();
}

// Function to update the Chart.js dashboard
function updateChart() {
  const ctx = document.getElementById('okrChart').getContext('2d');
  const labels = okrs.map((okr, i) => `KR ${i + 1}`);
  const data = okrs.map(okr => okr.progress);

  if (chart) {
    chart.destroy(); // Clear previous chart
  }

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Progress %',
        data: data,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  });
}

// Event listener for form submission
form.addEventListener('submit', function (e) {
  e.preventDefault();
  const objective = document.getElementById('objective').value;
  const keyResult = document.getElementById('keyResult').value;
  const progress = parseInt(document.getElementById('progress').value);

  if (!objective || !keyResult || isNaN(progress)) return;

  okrs.push({ objective, keyResult, progress });
  localStorage.setItem('okrs', JSON.stringify(okrs));
  renderOKRs();
  form.reset();
});

// Edit OKR
function editOKR(index) {
  const okr = okrs[index];
  const newObjective = prompt('Edit Objective:', okr.objective);
  const newKeyResult = prompt('Edit Key Result:', okr.keyResult);
  const newProgress = prompt('Edit Progress (%)', okr.progress);

  if (newObjective && newKeyResult && newProgress !== null) {
    okrs[index] = {
      objective: newObjective,
      keyResult: newKeyResult,
      progress: parseInt(newProgress)
    };
    localStorage.setItem('okrs', JSON.stringify(okrs));
    renderOKRs();
  }
}

// Delete OKR
function deleteOKR(index) {
  if (confirm('Are you sure you want to delete this OKR?')) {
    okrs.splice(index, 1);
    localStorage.setItem('okrs', JSON.stringify(okrs));
    renderOKRs();
  }
}

// Initial render on page load
renderOKRs();
