/**
 * firebase-shim.js
 * Drop-in replacement for localStorage that syncs to Firestore.
 * Pages import this and call initShim(onReady) instead of using localStorage directly.
 * All existing localStorage.getItem/setItem calls work unchanged after shimming.
 */

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDAWxRGQoHZDmL2EeukPCfLKPO22pWuVbc",
  authDomain: "personal-website-b1c9a.firebaseapp.com",
  projectId: "personal-website-b1c9a",
  storageBucket: "personal-website-b1c9a.firebasestorage.app",
  messagingSenderId: "287433829882",
  appId: "1:287433829882:web:6ec2050399838bb90a4843"
};

const app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);

let UID = null;
let cache = {}; // in-memory cache of all user data
let saveTimer = null;

// ── AUTH ─────────────────────────────────────────────────
export async function signIn(){
  await signInWithPopup(auth, new GoogleAuthProvider());
}
export async function signOutUser(){
  await signOut(auth);
  window.location.reload();
}

// ── INIT ─────────────────────────────────────────────────
export function initShim(onReady){
  // Inject auth overlay if not present
  if(!document.getElementById('auth-overlay')){
    const overlay = document.createElement('div');
    overlay.id = 'auth-overlay';
    overlay.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;align-items:center;justify-content:center';
    overlay.innerHTML = `
      <div style="background:var(--bg2,#fff);border:1px solid #ccc;border-radius:16px;padding:32px 36px;text-align:center;max-width:360px;width:90%">
        <div style="font-size:17px;font-weight:600;margin-bottom:6px;color:var(--text,#111)">Paul's Tools</div>
        <div style="font-size:12px;color:var(--text3,#999);margin-bottom:24px">Sign in to access your data</div>
        <button id="shim-signin-btn" style="font-family:inherit;font-size:13px;font-weight:600;padding:10px 24px;border-radius:20px;border:1.5px solid #ccc;background:#f0f0f0;cursor:pointer;width:100%">Sign in with Google</button>
      </div>`;
    document.body.prepend(overlay);
    document.getElementById('shim-signin-btn').onclick = signIn;
  }

  // Inject saving indicator
  if(!document.getElementById('shim-saving')){
    const el = document.createElement('div');
    el.id = 'shim-saving';
    el.textContent = 'Saved';
    el.style.cssText = 'position:fixed;bottom:1rem;right:1rem;background:var(--green-bg,#e0f5ec);color:var(--green-txt,#0e9e70);border:1px solid var(--green,#0e9e70);border-radius:20px;padding:4px 12px;font-size:11px;font-weight:600;opacity:0;transition:opacity .3s;pointer-events:none;z-index:1000;font-family:inherit';
    document.body.appendChild(el);
  }

  onAuthStateChanged(auth, async user => {
    const overlay = document.getElementById('auth-overlay');
    if(user){
      UID = user.uid;
      if(overlay) overlay.style.display = 'none';
      // Add sign out button to header actions if present
      const headerActions = document.querySelector('.header-actions');
      if(headerActions && !document.getElementById('shim-signout')){
        const btn = document.createElement('button');
        btn.id = 'shim-signout';
        btn.className = 'btn';
        btn.textContent = 'Sign out';
        btn.onclick = signOutUser;
        headerActions.appendChild(btn);
      }
      // Load all user data from Firestore into cache
      await loadAll();
      onReady();
    } else {
      UID = null;
      if(overlay) overlay.style.display = 'flex';
    }
  });
}

// ── LOAD ALL DATA ─────────────────────────────────────────
async function loadAll(){
  if(!UID) return;
  const ref = doc(db, 'users', UID, 'localStorage', 'data');
  const snap = await getDoc(ref);
  if(snap.exists()){
    cache = snap.data();
  } else {
    cache = {};
  }
}

// ── SAVE (debounced) ──────────────────────────────────────
function scheduleSave(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    if(!UID) return;
    const ref = doc(db, 'users', UID, 'localStorage', 'data');
    await setDoc(ref, cache);
    const el = document.getElementById('shim-saving');
    if(el){ el.style.opacity='1'; setTimeout(()=>{ el.style.opacity='0'; },1200); }
  }, 800);
}

// ── SHIM localStorage ─────────────────────────────────────
export function shimLocalStorage(){
  const _original = {
    getItem:   localStorage.getItem.bind(localStorage),
    setItem:   localStorage.setItem.bind(localStorage),
    removeItem:localStorage.removeItem.bind(localStorage),
  };

  localStorage.getItem = function(key){
    if(key === 'global_theme') return _original.getItem(key);
    return cache.hasOwnProperty(key) ? cache[key] : null;
  };

  localStorage.setItem = function(key, value){
    if(key === 'global_theme'){ _original.setItem(key, value); return; }
    cache[key] = value;
    scheduleSave();
  };

  localStorage.removeItem = function(key){
    if(key === 'global_theme'){ _original.removeItem(key); return; }
    delete cache[key];
    scheduleSave();
  };
}
