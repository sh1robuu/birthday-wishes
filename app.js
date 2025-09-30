// ==== Firebase config (your keys) ====
const firebaseConfig = {
  apiKey: "AIzaSyC5vTSKIlJexlnv7WtvN2yAfaxZbb6eHpw",
  authDomain: "happy-birthday-web.firebaseapp.com",
  projectId: "happy-birthday-web",
  storageBucket: "happy-birthday-web.firebasestorage.app",
  messagingSenderId: "936794639915",
  appId: "1:936794639915:web:6b2c3b750ce37c6400246e",
  measurementId: "G-TJZ86C49JJ"
};
// ======================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, serverTimestamp,
  query, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// UI refs
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

let sortOrder = "desc"; // 'desc' (newest) | 'asc' (oldest)

// Helpers
function showCompose(show) {
  compose.classList.toggle("hidden", !show);
  if (show) wishEl.focus();
}
btnWrite.addEventListener("click", () => showCompose(true));
btnCancel.addEventListener("click", () => showCompose(false));
btnView.addEventListener("click", () => feed.scrollIntoView({ behavior: "smooth" }));

function updateSort(order) {
  sortOrder = order;
  sortNewest.classList.toggle("chip-active", order === "desc");
  sortOldest.classList.toggle("chip-active", order === "asc");
  subscribeFeed(); // re-subscribe with new order
}
sortNewest.addEventListener("click", () => updateSort("desc"));
sortOldest.addEventListener("click", () => updateSort("asc"));

// Throttle (10s) để hạn chế spam
function canPost() {
  const last = Number(localStorage.getItem("lastPostTs") || "0");
  return Date.now() - last > 10_000;
}
function markPosted() {
  localStorage.setItem("lastPostTs", String(Date.now()));
}

// Confetti helpers
function confettiBurstCenter() {
  if (typeof confetti !== "function") return;
  const end = Date.now() + 600;
  (function frame() {
    confetti({ particleCount: 60, spread: 60, startVelocity: 45, ticks: 120 });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
function confettiFromElement(el) {
  if (typeof confetti !== "function" || !el) return;
  const rect = el.getBoundingClientRect();
  const originX = (rect.left + rect.width / 2) / window.innerWidth;
  const originY = (rect.top + 24) / window.innerHeight;
  confetti({ particleCount: 70, spread: 70, startVelocity: 40, ticks: 140, origin: { x: originX, y: originY } });
}

// Submit form
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
    confettiBurstCenter(); // confetti khi gửi thành công
    feed.scrollIntoView({ behavior: "smooth" });
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Failed to send. Please try again.";
    statusEl.classList.add("error");
  }
});

// Realtime feed với “gift reveal”
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
      li.className = "wish gift-mode";

      // Nút bấm (để focus/keyboard cũng mở được)
      const btn = document.createElement("button");
      btn.className = "gift-btn";
      btn.setAttribute("aria-expanded", "false");
      btn.title = "Open the gift";

      // Hộp quà
      const gift = document.createElement("div");
      gift.className = "gift";
      const lid = document.createElement("div");  lid.className = "lid";
      const box = document.createElement("div");  box.className = "box";
      const ribV = document.createElement("div"); ribV.className = "ribbon-vert";
      const ribH = document.createElement("div"); ribH.className = "ribbon-horz";
      const bow  = document.createElement("div"); bow.className  = "bow";
      const heart= document.createElement("div"); heart.className= "heart";
      const label= document.createElement("div"); label.className= "label";
      label.textContent = "Tap to open";

      box.appendChild(ribV);
      box.appendChild(ribH);
      box.appendChild(heart);
      gift.appendChild(lid);
      gift.appendChild(box);
      gift.appendChild(bow);
      gift.appendChild(label);

      btn.appendChild(gift);
      li.appendChild(btn);

      // Khối reveal nội dung thật
      const reveal = document.createElement("div");
      reveal.className = "reveal";

      const meta = document.createElement("div");
      meta.className = "meta";
      const nameEl = document.createElement("strong");
      nameEl.textContent = data.name || "Anonymous";
      const timeEl = document.createElement("span");
      timeEl.textContent = " • " + (formatDate(data.createdAt?.toDate?.()) || "");

      meta.appendChild(nameEl);
      meta.appendChild(timeEl);

      const msg = document.createElement("div");
      msg.className = "msg";
      msg.textContent = data.message || "";

      reveal.appendChild(meta);
      reveal.appendChild(msg);
      li.appendChild(reveal);

      // Toggle mở hộp + confetti mini (mỗi item chỉ nổ 1 lần)
      let opened = false;
      btn.addEventListener("click", () => {
        const isOpen = li.classList.toggle("open");
        btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
        if (isOpen && !opened) {
          opened = true;
          confettiFromElement(li);
        }
      });

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
