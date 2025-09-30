// ==== Firebase config (replace with your real keys) ====
// Get these from Firebase Console → Project settings → Your apps → Web app.
const firebaseConfig = {
  apiKey: "AIzaSyC5vTSKIlJexlnv7WtvN2yAfaxZbb6eHpw",
  authDomain: "happy-birthday-web.firebaseapp.com",
  projectId: "happy-birthday-web",
  storageBucket: "happy-birthday-web.firebasestorage.app",
  messagingSenderId: "936794639915",
  appId: "1:936794639915:web:6b2c3b750ce37c6400246e",
  measurementId: "G-TJZ86C49JJ"
};
// ================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, serverTimestamp,
  query, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Init
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let sortOrder = "desc"; // 'desc' = newest first, 'asc' = oldest first

// DOM
const btnWrite = document.getElementById("btnWrite");
const btnView = document.getElementById("btnView");
const compose = document.getElementById("compose");
const feed = document.getElementById("feed");
const form = document.getElementById("wishForm");
const nicknameEl = document.getElementById("nickname");
const wishEl = document.getElementById("wish");
const statusEl = document.getElementById("status");
const listEl = document.getElementById("wishList");
const emptyEl = document.getElementById("emptyState");
const btnCancel = document.getElementById("btnCancel");
const sortNewest = document.getElementById("sortNewest");
const sortOldest = document.getElementById("sortOldest");

// UI helpers
function showCompose(show) {
  compose.classList.toggle("hidden", !show);
  if (show) wishEl.focus();
}
btnWrite.addEventListener("click", () => showCompose(true));
btnCancel.addEventListener("click", () => showCompose(false));
btnView.addEventListener("click", () => feed.scrollIntoView({ behavior: "smooth" }));

// Sort buttons
function updateSort(order) {
  sortOrder = order;
  sortNewest.classList.toggle("chip-active", order === "desc");
  sortOldest.classList.toggle("chip-active", order === "asc");
  subscribeFeed(); // re-subscribe with new order
}
sortNewest.addEventListener("click", () => updateSort("desc"));
sortOldest.addEventListener("click", () => updateSort("asc"));

// Throttle to reduce spam
function canPost() {
  const last = Number(localStorage.getItem("lastPostTs") || "0");
  const now = Date.now();
  return now - last > 10_000; // 10 seconds
}
function markPosted() {
  localStorage.setItem("lastPostTs", String(Date.now()));
}

// Confetti celebration
function burstConfetti() {
  if (typeof confetti !== "function") return;
  const end = Date.now() + 600;
  (function frame() {
    confetti({ particleCount: 60, spread: 60, startVelocity: 45, ticks: 120 });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusEl.textContent = "";
  statusEl.classList.remove("error");

  const name = nicknameEl.value.trim().slice(0, 30);
  const msg = wishEl.value.trim().slice(0, 500);
  if (!msg) {
    statusEl.textContent = "Please write a wish before sending.";
    statusEl.classList.add("error");
    return;
  }
  if (!canPost()) {
    statusEl.textContent = "You're sending too fast. Please wait ~10 seconds.";
    statusEl.classList.add("error");
    return;
  }

  try {
    await addDoc(collection(db, "wishes"), {
      name: name || "Anonymous",
      message: msg,
      createdAt: serverTimestamp()
    });
    wishEl.value = "";
    nicknameEl.value = "";
    statusEl.textContent = "Sent! Thank you 💖";
    markPosted();
    showCompose(false);
    burstConfetti();
    feed.scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Failed to send. Please try again.";
    statusEl.classList.add("error");
  }
});

// Live feed (realtime)
let unsubscribe = null;
function subscribeFeed() {
  if (unsubscribe) unsubscribe();
  const q = query(collection(db, "wishes"), orderBy("createdAt", sortOrder));
  unsubscribe = onSnapshot(q, (snap) => {
    listEl.innerHTML = "";
    let count = 0;
    snap.forEach((doc) => {
      const data = doc.data();
      const li = document.createElement("li");
      li.className = "wish";

      const meta = document.createElement("div");
      meta.className = "meta";
      const name = document.createElement("strong");
      name.textContent = data.name || "Anonymous";
      const time = document.createElement("span");
      time.textContent = formatDate(data.createdAt?.toDate?.());

      meta.appendChild(name);
      meta.appendChild(document.createTextNode(" • "));
      meta.appendChild(time);

      const msg = document.createElement("div");
      msg.className = "msg";
      msg.textContent = data.message || "";

      li.appendChild(meta);
      li.appendChild(msg);
      listEl.appendChild(li);
      count++;
    });
    emptyEl.style.display = count ? "none" : "block";
  });
}
subscribeFeed();

function formatDate(d) {
  if (!d) return "";
  return d.toLocaleString("en-AU", { hour12: false });
}
