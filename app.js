// --- Configuration ---
const STEPS_PER_BLOCK = 500;  // 1 block = 500 steps
const BLOCKS_PER_DAY = 24;    // 1 block per hour, 24/7

// --- Storage helpers ---
function getData() {
  const raw = localStorage.getItem('stepTracker');
  if (!raw) return null;
  return JSON.parse(raw);
}

function saveData(data) {
  localStorage.setItem('stepTracker', JSON.stringify(data));
}

function initData() {
  const existing = getData();
  if (existing) return existing;

  const data = {
    startTimestamp: new Date().toISOString(),
    completedBlocks: 0,
  };
  saveData(data);
  return data;
}

// --- Core computation ---
function computeState(now) {
  const data = initData();
  const startTimestamp = new Date(data.startTimestamp);

  // Total hours elapsed since tracking began (24/7, no gaps)
  const totalAccrued = Math.floor((now - startTimestamp) / (1000 * 60 * 60));

  // Today's accrued = hours elapsed since midnight
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const todayAccrued = Math.min(now.getHours(), BLOCKS_PER_DAY);

  const pending = Math.max(0, totalAccrued - data.completedBlocks);
  const stepsRemaining = pending * STEPS_PER_BLOCK;

  const completionPct = totalAccrued > 0
    ? Math.min(100, (data.completedBlocks / totalAccrued) * 100)
    : 100;

  return {
    totalAccrued,
    todayAccrued,
    completedBlocks: data.completedBlocks,
    pending,
    stepsRemaining,
    completionPct,
  };
}

// --- Actions ---
function completeBlocks(count) {
  const data = initData();
  const state = computeState(new Date());

  const toComplete = Math.min(count, state.pending);
  if (toComplete <= 0) return;

  data.completedBlocks += toComplete;
  saveData(data);
  stepperValue = 1;
  render();
}

// --- Render ---
function render() {
  const state = computeState(new Date());

  // Pending count
  const pendingEl = document.getElementById('pending-count');
  pendingEl.textContent = state.pending;
  pendingEl.className = 'pending-count ' + (
    state.pending <= 5 ? 'green' : state.pending <= 10 ? 'yellow' : 'red'
  );

  // Steps remaining
  document.getElementById('steps-remaining').textContent =
    state.stepsRemaining.toLocaleString();

  // Stats
  document.getElementById('today-accrued').textContent = state.todayAccrued;
  document.getElementById('lifetime-completed').textContent = state.completedBlocks;
  document.getElementById('lifetime-accrued').textContent = state.totalAccrued;

  // Progress bar
  const bar = document.getElementById('progress-bar');
  bar.style.width = state.completionPct + '%';
  bar.style.background = state.completionPct >= 80
    ? 'var(--green)'
    : state.completionPct >= 50
      ? 'var(--yellow)'
      : 'var(--red)';

  // Complete button state
  const btn = document.getElementById('btn-complete');
  btn.disabled = state.pending <= 0;

  // Stepper display
  document.getElementById('stepper-value').textContent = stepperValue;

  // Weight
  renderWeight();
}

// --- Stepper ---
let stepperValue = 1;

function setupStepper() {
  document.getElementById('btn-minus').addEventListener('click', () => {
    if (stepperValue > 1) {
      stepperValue--;
      document.getElementById('stepper-value').textContent = stepperValue;
    }
  });

  document.getElementById('btn-plus').addEventListener('click', () => {
    const state = computeState(new Date());
    if (stepperValue < state.pending) {
      stepperValue++;
      document.getElementById('stepper-value').textContent = stepperValue;
    }
  });

  document.getElementById('btn-complete').addEventListener('click', () => {
    completeBlocks(stepperValue);
    if (navigator.vibrate) navigator.vibrate(100);
  });
}

// --- Weight Tracker ---
const WEIGHT_GOAL = 70;

function getWeightData() {
  const raw = localStorage.getItem('weightTracker');
  if (!raw) return null;
  return JSON.parse(raw);
}

function saveWeightData(data) {
  localStorage.setItem('weightTracker', JSON.stringify(data));
}

function initWeightData() {
  const existing = getWeightData();
  const currentYear = new Date().getFullYear();

  // Year reset
  if (existing && existing.currentYear !== currentYear) {
    const fresh = { currentYear, goal: WEIGHT_GOAL, entries: [], yearMin: null, yearMax: null };
    saveWeightData(fresh);
    return fresh;
  }

  if (existing) return existing;

  const data = { currentYear, goal: WEIGHT_GOAL, entries: [], yearMin: null, yearMax: null };
  saveWeightData(data);
  return data;
}

function calcTomorrowTarget(weight, goal) {
  const now = new Date();
  const endOfYear = new Date(now.getFullYear(), 11, 31);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysRemaining = Math.max(1, Math.round((endOfYear - today) / (1000 * 60 * 60 * 24)));
  const dailyLoss = (weight - goal) / daysRemaining;
  return Math.round((weight - dailyLoss) * 100) / 100;
}

function logWeight(weight) {
  const data = initWeightData();
  const today = new Date().toISOString().slice(0, 10);

  // Calculate and freeze tomorrow's target at log time
  const tomorrowTarget = calcTomorrowTarget(weight, data.goal);

  // Replace or add today's entry
  const idx = data.entries.findIndex(e => e.date === today);
  if (idx >= 0) {
    data.entries[idx].weight = weight;
    data.entries[idx].tomorrowTarget = tomorrowTarget;
  } else {
    data.entries.push({ date: today, weight, tomorrowTarget });
  }

  // Update min/max
  if (data.yearMin === null || weight < data.yearMin) data.yearMin = weight;
  if (data.yearMax === null || weight > data.yearMax) data.yearMax = weight;

  saveWeightData(data);
  renderWeight();
}

function computeWeightState() {
  const data = initWeightData();
  if (data.entries.length === 0) return null;

  // Latest entry
  const latest = data.entries[data.entries.length - 1];
  const currentWeight = latest.weight;
  const lastDate = latest.date;

  // Use the frozen target from the last log
  const tomorrowTarget = latest.tomorrowTarget;

  // Days remaining in year (for display only)
  const now = new Date();
  const endOfYear = new Date(now.getFullYear(), 11, 31);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysRemaining = Math.max(1, Math.round((endOfYear - today) / (1000 * 60 * 60 * 24)));

  return {
    currentWeight,
    tomorrowTarget,
    daysRemaining,
    yearMin: data.yearMin,
    yearMax: data.yearMax,
    goal: data.goal,
    lastDate,
  };
}

function renderWeight() {
  const state = computeWeightState();
  const section = document.getElementById('weight-stats');

  if (!state) {
    section.style.display = 'none';
    return;
  }

  section.style.display = '';

  document.getElementById('tomorrow-target').textContent = state.tomorrowTarget + ' kg';
  document.getElementById('weight-goal').textContent = state.goal + ' kg by Dec 31';
  document.getElementById('days-remaining').textContent = state.daysRemaining;
  document.getElementById('year-min').textContent = state.yearMin + ' kg';
  document.getElementById('year-max').textContent = state.yearMax + ' kg';

  // Format last logged date
  const d = new Date(state.lastDate + 'T00:00:00');
  document.getElementById('last-logged').textContent = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function setupWeight() {
  document.getElementById('btn-log-weight').addEventListener('click', () => {
    const input = document.getElementById('weight-input');
    const val = parseFloat(input.value);
    if (isNaN(val) || val <= 0) return;
    logWeight(val);
    if (navigator.vibrate) navigator.vibrate(100);
  });
}

// --- Hourly foreground alert ---
function scheduleHourlyCheck() {
  const now = new Date();
  const msUntilNextHour =
    ((60 - now.getMinutes()) * 60 - now.getSeconds()) * 1000;

  setTimeout(() => {
    render();
    const state = computeState(new Date());
    if (state.pending > 0) {
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      document.body.classList.add('flash');
      setTimeout(() => document.body.classList.remove('flash'), 2000);
    }
    scheduleHourlyCheck();
  }, msUntilNextHour);
}

// --- Notifications ---
async function setupNotifications() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') return;

  await Notification.requestPermission();
}

// --- Service Worker ---
function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

// --- Tabs ---
function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });
}

// --- Init ---
function init() {
  initData();
  initWeightData();
  setupTabs();
  setupStepper();
  setupWeight();
  render();
  scheduleHourlyCheck();
  setupNotifications();
  registerSW();

  // Re-render every minute to catch hour boundaries
  setInterval(render, 60000);

  // Re-render when app comes back to foreground
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) render();
  });
}

document.addEventListener('DOMContentLoaded', init);