import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  getAnalytics,
  isSupported as analyticsIsSupported,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-analytics.js";
import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAv18pU76-ldEhaR9-AD3U-eC-pTEXlCg4",
  authDomain: "test-75144.firebaseapp.com",
  projectId: "test-75144",
  storageBucket: "test-75144.firebasestorage.app",
  messagingSenderId: "546839554197",
  appId: "1:546839554197:web:f7617becd912a3db32939c",
  measurementId: "G-TF90GVMKLD",
};

const POLL_ID = "next-computational-experiment";
const VALID_OPTIONS = [
  "generative-cities",
  "climate-cartographies",
  "machine-vision",
  "collective-interfaces",
];
const VOTER_KEY = `poll:${POLL_ID}:voter`;
const CHOICE_KEY = `poll:${POLL_ID}:choice`;

const buttons = [...document.querySelectorAll(".poll-option")];
const statusElement = document.querySelector("#poll-status");
const totalElement = document.querySelector("#total-count");
const totalLabelElement = document.querySelector("#total-label");

let savedChoice = localStorage.getItem(CHOICE_KEY);
let isSubmitting = false;

function setStatus(message, isError = false) {
  statusElement.textContent = message;
  statusElement.classList.toggle("is-error", isError);
}

function getVoterId() {
  let voterId = localStorage.getItem(VOTER_KEY);

  if (!voterId) {
    voterId = crypto.randomUUID();
    localStorage.setItem(VOTER_KEY, voterId);
  }

  return voterId;
}

function applySavedChoice() {
  buttons.forEach((button) => {
    const selected = button.dataset.option === savedChoice;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
    button.disabled = Boolean(savedChoice) || isSubmitting;
  });
}

function renderResults(votes) {
  const counts = Object.fromEntries(VALID_OPTIONS.map((option) => [option, 0]));

  votes.forEach((vote) => {
    if (vote.option in counts) {
      counts[vote.option] += 1;
    }
  });

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  totalElement.textContent = total.toLocaleString();
  totalLabelElement.textContent = total === 1 ? "vote recorded" : "votes recorded";

  buttons.forEach((button) => {
    const option = button.dataset.option;
    const percentage = total ? Math.round((counts[option] / total) * 100) : 0;
    button.querySelector(".option-percent").textContent = `${percentage}%`;
    button.querySelector(".result-fill").style.width = `${percentage}%`;
    button.setAttribute(
      "aria-label",
      `${button.querySelector("strong").textContent}, ${percentage} percent`
    );
  });
}

async function submitVote(database, option) {
  if (savedChoice || isSubmitting || !VALID_OPTIONS.includes(option)) {
    return;
  }

  isSubmitting = true;
  applySavedChoice();
  setStatus("Recording your response…");

  try {
    const voterId = getVoterId();
    const voteReference = doc(database, "pollVotes", `${POLL_ID}_${voterId}`);

    await setDoc(voteReference, {
      pollId: POLL_ID,
      option,
      createdAt: serverTimestamp(),
    });

    savedChoice = option;
    localStorage.setItem(CHOICE_KEY, option);
    setStatus("Your response is in. Results update live.");
  } catch (error) {
    console.error("Unable to record vote:", error);
    setStatus("Your vote could not be saved. Please try again.", true);
  } finally {
    isSubmitting = false;
    applySavedChoice();
  }
}

function startPoll() {
  const app = initializeApp(firebaseConfig);
  const database = getFirestore(app);
  const votesQuery = query(
    collection(database, "pollVotes"),
    where("pollId", "==", POLL_ID)
  );

  analyticsIsSupported()
    .then((supported) => {
      if (supported) {
        getAnalytics(app);
      }
    })
    .catch(() => {
      // Analytics is optional; voting remains available when it is blocked.
    });

  buttons.forEach((button) => {
    button.addEventListener("click", () => submitVote(database, button.dataset.option));
  });

  applySavedChoice();

  onSnapshot(
    votesQuery,
    (snapshot) => {
      renderResults(snapshot.docs.map((vote) => vote.data()));
      setStatus(
        savedChoice
          ? "Your response is in. Results update live."
          : "Select one option to cast your vote."
      );
    },
    (error) => {
      console.error("Unable to load poll:", error);
      totalElement.textContent = "—";
      setStatus("The live poll is not available yet. Please try again shortly.", true);
    }
  );
}

try {
  startPoll();
} catch (error) {
  console.error("Unable to start poll:", error);
  setStatus("The live poll could not connect. Please refresh and try again.", true);
}
