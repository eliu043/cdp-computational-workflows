import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import {
  getFunctions,
  httpsCallable,
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-functions.js';
import { firebaseConfig } from './firebase-config.js';

const messageInput = document.querySelector('#user-input');
const sendButton = document.querySelector('#send-btn');
const output = document.querySelector('#output');

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, 'us-central1');
const askOpenAI = httpsCallable(functions, 'askOpenAI');

async function submitMessage() {
  const message = messageInput.value.trim();

  if (!message) {
    output.textContent = 'Type a message first.';
    messageInput.focus();
    return;
  }

  sendButton.disabled = true;
  output.textContent = 'Thinking…';
  try {
    const response = await askOpenAI({ message });
    output.textContent = response.data.text;
  } catch (error) {
    output.textContent = `Error: ${error instanceof Error ? error.message : String(error)}`;
  } finally {
    sendButton.disabled = false;
  }
}

sendButton.addEventListener('click', submitMessage);
messageInput.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') submitMessage();
});
