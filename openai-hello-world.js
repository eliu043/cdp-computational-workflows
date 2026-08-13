import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import {
  getFunctions,
  httpsCallable,
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-functions.js';
import { firebaseConfig } from './firebase-config.js';

const form = document.querySelector('#critique-form');
const artifactInput = document.querySelector('#artifact');
const intentInput = document.querySelector('#intent');
const customLensWrap = document.querySelector('#custom-lens-wrap');
const customLensInput = document.querySelector('#custom-lens');
const submitButton = document.querySelector('#submit-button');
const emptyState = document.querySelector('#empty-state');
const loadingState = document.querySelector('#loading-state');
const errorState = document.querySelector('#error-state');
const critiqueOutput = document.querySelector('#critique-output');
const actionRow = document.querySelector('#action-row');
const resetButton = document.querySelector('#reset-button');

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, 'us-central1');
const askOpenAI = httpsCallable(functions, 'askOpenAI');

let previousResponseId = null;
let iteration = 0;
let activeLens = '';

function selectedLens() {
  const selected = form.elements.lens.value;
  return selected === 'custom' ? customLensInput.value.trim() : selected;
}

function setBusy(isBusy, message = 'Attending to the work…') {
  submitButton.disabled = isBusy;
  actionRow.querySelectorAll('button').forEach((button) => { button.disabled = isBusy; });
  loadingState.querySelector('.status-label').textContent = message;

  if (isBusy) {
    emptyState.hidden = true;
    critiqueOutput.hidden = true;
    errorState.hidden = true;
    loadingState.hidden = false;
  } else {
    loadingState.hidden = true;
  }
}

function addListItems(container, items) {
  container.replaceChildren();
  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    container.append(li);
  });
}

function renderCritique(critique) {
  document.querySelector('#lens-tag').textContent = activeLens;
  document.querySelector('#iteration-tag').textContent = `Critique ${String(iteration).padStart(2, '0')}`;
  document.querySelector('#output-title').textContent = critique.title;
  document.querySelector('#output-framing').textContent = critique.framing;
  document.querySelector('#counter-reading').textContent = critique.counterReading;
  document.querySelector('#question').textContent = critique.question;
  document.querySelector('#proposed-move').textContent = critique.proposedMove;

  const observationContainer = document.querySelector('#observations');
  observationContainer.replaceChildren();
  critique.observations.forEach((observation) => {
    const article = document.createElement('article');
    article.className = 'observation';

    const evidence = document.createElement('q');
    evidence.className = 'evidence';
    evidence.textContent = observation.evidence;

    const reading = document.createElement('p');
    reading.textContent = observation.interpretation;

    const certainty = document.createElement('span');
    certainty.className = 'certainty';
    certainty.textContent = `${observation.certainty} inference`;

    article.append(evidence, reading, certainty);
    observationContainer.append(article);
  });

  addListItems(document.querySelector('#tensions'), critique.tensions);
  addListItems(document.querySelector('#blind-spots'), critique.blindSpots);

  critiqueOutput.hidden = false;
  emptyState.hidden = true;
  errorState.hidden = true;
  critiqueOutput.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showError(error) {
  const message = error instanceof Error ? error.message : String(error);
  errorState.textContent = `The critique could not be completed. ${message}`;
  errorState.hidden = false;
  critiqueOutput.hidden = iteration === 0;
  emptyState.hidden = iteration > 0;
}

async function requestCritique(payload, loadingMessage) {
  setBusy(true, loadingMessage);
  try {
    const response = await askOpenAI(payload);
    previousResponseId = response.data.responseId;
    iteration += 1;
    renderCritique(response.data.critique);
  } catch (error) {
    showError(error);
  } finally {
    setBusy(false);
  }
}

form.addEventListener('change', (event) => {
  if (event.target.name !== 'lens') return;
  const isCustom = event.target.value === 'custom';
  customLensWrap.hidden = !isCustom;
  customLensInput.required = isCustom;
  if (isCustom) customLensInput.focus();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const artifact = artifactInput.value.trim();
  const lens = selectedLens();

  if (!artifact || !lens) {
    showError(new Error('Add an artifact and choose or construct a critical lens.'));
    return;
  }

  previousResponseId = null;
  iteration = 0;
  activeLens = lens;
  await requestCritique({
    artifact,
    intent: intentInput.value.trim(),
    lens,
  }, 'Attending to the work…');
});

actionRow.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button || !previousResponseId) return;

  await requestCritique({
    previousResponseId,
    followUp: button.dataset.action,
    lens: activeLens,
  }, 'Returning to the work…');
});

resetButton.addEventListener('click', () => {
  previousResponseId = null;
  iteration = 0;
  critiqueOutput.hidden = true;
  errorState.hidden = true;
  emptyState.hidden = false;
  artifactInput.focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
