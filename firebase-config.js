// Firebase configuration — shared across all pages
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, addDoc, deleteDoc, updateDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDAWxRGQoHZDmL2EeukPCfLKPO22pWuVbc",
  authDomain: "personal-website-b1c9a.firebaseapp.com",
  projectId: "personal-website-b1c9a",
  storageBucket: "personal-website-b1c9a.firebasestorage.app",
  messagingSenderId: "287433829882",
  appId: "1:287433829882:web:6ec2050399838bb90a4843"
};

const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ── AUTH HELPERS ───────────────────────────────────────────
async function signIn(){ await signInWithPopup(auth, provider); }
async function signOutUser(){ await signOut(auth); }
function onAuth(callback){ return onAuthStateChanged(auth, callback); }
function currentUser(){ return auth.currentUser; }

// ── FIRESTORE HELPERS ──────────────────────────────────────
// All data lives under users/{uid}/{collection}

// Get a single document (used for blob storage like state objects)
async function getBlob(collectionName){
  const uid = auth.currentUser?.uid;
  if(!uid) return null;
  const ref = doc(db, 'users', uid, collectionName, 'data');
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

// Set a single document blob
async function setBlob(collectionName, data){
  const uid = auth.currentUser?.uid;
  if(!uid) return;
  const ref = doc(db, 'users', uid, collectionName, 'data');
  await setDoc(ref, data);
}

// Get all documents in a sub-collection
async function getCollection(collectionName){
  const uid = auth.currentUser?.uid;
  if(!uid) return [];
  const ref = collection(db, 'users', uid, collectionName);
  const snap = await getDocs(ref);
  return snap.docs.map(d => ({id: d.id, ...d.data()}));
}

// Add a document to a sub-collection
async function addToCollection(collectionName, data){
  const uid = auth.currentUser?.uid;
  if(!uid) return null;
  const ref = collection(db, 'users', uid, collectionName);
  const docRef = await addDoc(ref, {...data, createdAt: new Date().toISOString()});
  return docRef.id;
}

// Update a document in a sub-collection
async function updateInCollection(collectionName, docId, data){
  const uid = auth.currentUser?.uid;
  if(!uid) return;
  const ref = doc(db, 'users', uid, collectionName, docId);
  await updateDoc(ref, data);
}

// Delete a document from a sub-collection
async function deleteFromCollection(collectionName, docId){
  const uid = auth.currentUser?.uid;
  if(!uid) return;
  const ref = doc(db, 'users', uid, collectionName, docId);
  await deleteDoc(ref);
}

export {
  db, auth, signIn, signOutUser, onAuth, currentUser,
  getBlob, setBlob, getCollection, addToCollection, updateInCollection, deleteFromCollection,
  doc, getDoc, setDoc, collection, getDocs, addDoc, deleteDoc, updateDoc
};
