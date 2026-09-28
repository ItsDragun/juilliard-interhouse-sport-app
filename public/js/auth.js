/**
 * Authentication & Role Management Layer
 * Features:
 * - Email whitelist verification (only authorized staff can administer)
 * - Individual Admin ID assignment (ADM-001, ADM-002, etc.)
 * - Personal password setup & credential management
 * - Login timestamp tracking & session storage
 * - Audit metadata generation for all score/event edits
 */

import { getFirebaseInstances } from "./firebase-config.js";

// Permanent Super Administrators (Whitelisted Permanent System Scrutineers)
export const PERMANENT_SUPER_ADMINS = [
  {
    id: "ADM-001",
    email: "davidfestusugwu@gmail.com",
    name: "David Festus",
    title: "Chief Scrutineer & System Administrator",
    role: "super_admin",
    createdAt: "2026-09-24T00:00:00.000Z"
  },
  {
    id: "ADM-003",
    email: "osaruyiaideyan@gmail.com",
    name: "Osaruyi Aideyan",
    title: "Super Administrator & Scrutineer",
    role: "super_admin",
    createdAt: "2026-09-24T00:00:00.000Z"
  }
];

// Root Super Administrator (Primary System Scrutineer)
export const ROOT_SUPER_ADMIN = PERMANENT_SUPER_ADMINS[0];

// Exported for backward compatibility
export const VERIFIED_ADMIN_ACCOUNTS = PERMANENT_SUPER_ADMINS;

export function isPermanentSuperAdmin(emailOrId) {
  if (!emailOrId) return false;
  const norm = String(emailOrId).trim().toLowerCase();
  return PERMANENT_SUPER_ADMINS.some(p => 
    p.id.toLowerCase() === norm || p.email.toLowerCase() === norm
  );
}

const ADMIN_REGISTRY_KEY = "juilliard_admin_registry_v3";
const ADMIN_SESSION_KEY = "juilliard_active_admin_session";
const ADMIN_CREDS_KEY = "juilliard_admin_credentials_store";
const ADMIN_LOGS_KEY = "juilliard_admin_login_history";

let localAdminsList = null;
let adminChangeListeners = [];

let currentUser = null;
let currentRole = "public"; // "public" | "teacher" | "admin"
let authListeners = [];

/**
 * Retrieve all registered admins (merges permanent super admins with dynamic storage)
 */
export function getRegisteredAdmins() {
  if (localAdminsList && Array.isArray(localAdminsList) && localAdminsList.length > 0) {
    PERMANENT_SUPER_ADMINS.forEach(permAdmin => {
      const idx = localAdminsList.findIndex(a => 
        (a.email && a.email.toLowerCase() === permAdmin.email.toLowerCase()) || a.id === permAdmin.id
      );
      if (idx < 0) {
        localAdminsList.push(permAdmin);
      } else {
        if ((localAdminsList[idx].email || "").toLowerCase() !== permAdmin.email.toLowerCase()) {
          Object.assign(localAdminsList[idx], permAdmin);
        }
        localAdminsList[idx].role = "super_admin";
      }
    });
    return localAdminsList;
  }
  try {
    const raw = localStorage.getItem(ADMIN_REGISTRY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        PERMANENT_SUPER_ADMINS.forEach(permAdmin => {
          const idx = parsed.findIndex(a => 
            (a.email && a.email.toLowerCase() === permAdmin.email.toLowerCase()) || a.id === permAdmin.id
          );
          if (idx < 0) {
            parsed.push(permAdmin);
          } else {
            if ((parsed[idx].email || "").toLowerCase() !== permAdmin.email.toLowerCase()) {
              Object.assign(parsed[idx], permAdmin);
            }
            parsed[idx].role = "super_admin";
          }
        });
        localAdminsList = parsed;
        return localAdminsList;
      }
    }
  } catch (e) {
    console.debug("Error reading admin registry:", e);
  }

  localAdminsList = [...PERMANENT_SUPER_ADMINS];
  saveAdminsRegistry(localAdminsList);
  return localAdminsList;
}

function saveAdminsRegistry(admins) {
  try {
    localStorage.setItem(ADMIN_REGISTRY_KEY, JSON.stringify(admins));
  } catch (e) {
    console.warn("Could not save admins locally:", e);
  }
}

export function onAdminsChange(callback) {
  adminChangeListeners.push(callback);
  callback(getRegisteredAdmins());
  return () => {
    adminChangeListeners = adminChangeListeners.filter(cb => cb !== callback);
  };
}

function notifyAdminChangeListeners() {
  const admins = getRegisteredAdmins();
  adminChangeListeners.forEach(cb => {
    try { cb(admins); } catch (e) { console.error("Admin listener error:", e); }
  });
}

/**
 * Subscribe to realtime Cloud Firestore updates for registered admins
 */
export function subscribeToAdmins(onAdminsUpdate) {
  const current = getRegisteredAdmins();
  if (onAdminsUpdate) onAdminsUpdate(current);

  const { db, isConnected } = getFirebaseInstances();
  if (!isConnected || !db) return () => {};

  return db.collection("admins").onSnapshot(async (snapshot) => {
    if (snapshot.empty) {
      try {
        for (const sa of PERMANENT_SUPER_ADMINS) {
          await db.collection("admins").doc(sa.id).set(sa, { merge: true });
        }
      } catch (err) {
        console.warn("Could not seed permanent super admins to firestore:", err);
      }
      return;
    }

    const firestoreAdmins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    PERMANENT_SUPER_ADMINS.forEach(permAdmin => {
      const existing = firestoreAdmins.find(a => 
        (a.email && a.email.toLowerCase() === permAdmin.email.toLowerCase()) || a.id === permAdmin.id
      );
      if (!existing) {
        firestoreAdmins.push(permAdmin);
      } else {
        if ((existing.email || "").toLowerCase() !== permAdmin.email.toLowerCase()) {
          Object.assign(existing, permAdmin);
          db.collection("admins").doc(permAdmin.id).set(permAdmin, { merge: true })
            .catch(err => console.warn("Could not migrate permanent admin identity:", err));
        }
        existing.role = "super_admin";
      }
    });

    firestoreAdmins.sort((a, b) => (a.id || "").localeCompare(b.id || ""));
    localAdminsList = firestoreAdmins;
    saveAdminsRegistry(firestoreAdmins);
    notifyAdminChangeListeners();
    if (onAdminsUpdate) onAdminsUpdate(firestoreAdmins);
  }, (err) => {
    console.warn("Firestore admins listen error (using local cache):", err);
    if (onAdminsUpdate) onAdminsUpdate(getRegisteredAdmins());
  });
}

export function isUserAdmin() {
  if (currentRole === "admin") return true;
  const admin = getCurrentAdmin();
  return Boolean(admin && (admin.id || admin.adminId) && admin.email);
}

export function isUserSuperAdmin() {
  const admin = getCurrentAdmin();
  if (!admin) return false;
  if (admin.role === "super_admin") return true;
  if (admin.email && isPermanentSuperAdmin(admin.email)) return true;
  if (admin.id && isPermanentSuperAdmin(admin.id)) return true;
  return false;
}

export function isUserTeacher() {
  return currentRole === "teacher" || currentRole === "admin";
}

export function getCurrentUser() {
  return currentUser;
}

export function getCurrentRole() {
  return currentRole;
}

export function getCurrentAdmin() {
  if (currentUser && currentUser.isAdmin) {
    return currentUser;
  }
  const saved = sessionStorage.getItem(ADMIN_SESSION_KEY) || localStorage.getItem(ADMIN_SESSION_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return null;
    }
  }
  return null;
}

export function onAuthChange(callback) {
  authListeners.push(callback);
  callback({ user: currentUser, role: currentRole, admin: getCurrentAdmin() });
  return () => {
    authListeners = authListeners.filter(cb => cb !== callback);
  };
}

function notifyAuthListeners() {
  authListeners.forEach(cb => {
    try {
      cb({ user: currentUser, role: currentRole, admin: getCurrentAdmin() });
    } catch (e) {
      console.error("Auth listener error:", e);
    }
  });
}

/**
 * Format timestamp helper
 */
export function formatAdminTimestamp(dateInput) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput || Date.now());
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const day = d.getDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[d.getMonth()];
  return `${day} ${month}, ${hours}:${minutes}:${seconds}`;
}

/**
 * Look up verified admin by email across all registered accounts
 */
export function getVerifiedAdmin(email) {
  const norm = (email || "").trim().toLowerCase();
  if (!norm) return null;
  const list = getRegisteredAdmins();
  return list.find(a => (a.email || "").toLowerCase() === norm) || null;
}

export function isEmailWhitelisted(email) {
  return Boolean(getVerifiedAdmin(email));
}

/**
 * Add a new Admin / Official account (Super Admin privilege only)
 */
export async function addAdminAccount({ name, email, title, role, initialPassword }) {
  if (!isUserSuperAdmin()) {
    throw new Error("Access Denied: Only a Super Administrator can register new officials.");
  }

  const cleanName = (name || "").trim();
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanTitle = (title || "Score Judge & Marshal").trim();
  const cleanRole = role === "super_admin" ? "super_admin" : "admin";

  if (!cleanName || cleanName.length < 2) {
    throw new Error("Please enter a valid official name (at least 2 characters).");
  }
  if (!cleanEmail || !cleanEmail.includes("@")) {
    throw new Error("Please enter a valid official email address.");
  }

  const existing = getVerifiedAdmin(cleanEmail);
  if (existing) {
    throw new Error(`An official with email "${cleanEmail}" is already registered (${existing.name} • ${existing.id}).`);
  }

  const allAdmins = getRegisteredAdmins();
  let maxNum = 1;
  allAdmins.forEach(a => {
    const match = (a.id || "").match(/^ADM-(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });

  const nextId = "ADM-" + String(maxNum + 1).padStart(3, "0");
  const now = new Date();
  const creator = getCurrentAdmin()?.name || "Super Admin";

  const newAdmin = {
    id: nextId,
    email: cleanEmail,
    name: cleanName,
    title: cleanTitle,
    role: cleanRole,
    createdAt: now.toISOString(),
    createdBy: creator,
    createdFormatted: formatAdminTimestamp(now)
  };

  allAdmins.push(newAdmin);
  localAdminsList = allAdmins;
  saveAdminsRegistry(allAdmins);
  notifyAdminChangeListeners();

  if (initialPassword && initialPassword.trim().length >= 4) {
    await setAdminPassword(newAdmin.id, initialPassword.trim());
  }

  try {
    const { firestore, db } = getFirebaseInstances();
    const firestoreInstance = firestore || db;
    if (firestoreInstance) {
      await firestoreInstance.collection("admins").doc(newAdmin.id).set(newAdmin);
    }
  } catch (err) {
    console.warn("Could not save new admin to Firestore:", err);
  }

  if (typeof window.recordAuditLog === "function") {
    window.recordAuditLog({
      type: "admin_created",
      title: `Official Registered: ${newAdmin.name} (${newAdmin.id})`,
      details: `Official account created for ${newAdmin.name} (${newAdmin.email}) assigned role "${newAdmin.role === 'super_admin' ? 'Super Administrator' : 'Score Judge & Marshal'}" by ${creator}.`,
      summary: `Admin account ${newAdmin.id} created for ${newAdmin.name}`,
      adminId: getCurrentAdmin()?.id || "ADM-001",
      adminName: creator,
      adminEmail: getCurrentAdmin()?.email || ROOT_SUPER_ADMIN.email,
      adminRole: "super_admin",
      metadata: { newAdminId: newAdmin.id, newAdminEmail: newAdmin.email, newAdminRole: newAdmin.role }
    });
  }

  return { success: true, admin: newAdmin };
}

/**
 * Update an existing admin's title, name, or role (Super Admin privilege only)
 */
export async function updateAdminAccount(adminId, { name, title, role }) {
  if (!isUserSuperAdmin()) {
    throw new Error("Access Denied: Only a Super Administrator can edit official accounts.");
  }

  const allAdmins = getRegisteredAdmins();
  const idx = allAdmins.findIndex(a => a.id === adminId);
  if (idx < 0) {
    throw new Error("Official account not found.");
  }

  const target = allAdmins[idx];
  let updatedRole = role === "super_admin" ? "super_admin" : "admin";
  if (isPermanentSuperAdmin(target.id) || isPermanentSuperAdmin(target.email)) {
    updatedRole = "super_admin";
  }

  const updatedAdmin = {
    ...target,
    name: name ? name.trim() : target.name,
    title: title ? title.trim() : target.title,
    role: updatedRole,
    updatedAt: new Date().toISOString()
  };

  allAdmins[idx] = updatedAdmin;
  localAdminsList = allAdmins;
  saveAdminsRegistry(allAdmins);
  notifyAdminChangeListeners();

  try {
    const { firestore, db } = getFirebaseInstances();
    const firestoreInstance = firestore || db;
    if (firestoreInstance) {
      await firestoreInstance.collection("admins").doc(adminId).set(updatedAdmin, { merge: true });
    }
  } catch (err) {
    console.warn("Could not update admin in Firestore:", err);
  }

  if (typeof window.recordAuditLog === "function") {
    window.recordAuditLog({
      type: "admin_updated",
      title: `Official Updated: ${updatedAdmin.name} (${updatedAdmin.id})`,
      details: `Official account details modified for ${updatedAdmin.name} (${updatedAdmin.email}) by ${getCurrentAdmin()?.name || 'Super Admin'}.`,
      summary: `Admin account ${updatedAdmin.id} updated`,
      adminId: getCurrentAdmin()?.id || "ADM-001",
      adminName: getCurrentAdmin()?.name || "Super Admin",
      adminEmail: getCurrentAdmin()?.email || ROOT_SUPER_ADMIN.email,
      adminRole: "super_admin"
    });
  }

  return { success: true, admin: updatedAdmin };
}

/**
 * Remove an admin account (Super Admin privilege only)
 */
export async function deleteAdminAccount(adminId) {
  if (!isUserSuperAdmin()) {
    throw new Error("Access Denied: Only a Super Administrator can remove officials.");
  }

  if (isPermanentSuperAdmin(adminId)) {
    throw new Error("Action Prohibited: Permanent Super Administrator accounts cannot be deleted.");
  }

  const allAdmins = getRegisteredAdmins();
  const target = allAdmins.find(a => a.id === adminId);
  if (!target) {
    throw new Error("Official account not found.");
  }

  if (isPermanentSuperAdmin(target.email)) {
    throw new Error("Action Prohibited: Permanent Super Administrator accounts cannot be deleted.");
  }

  localAdminsList = allAdmins.filter(a => a.id !== adminId);
  saveAdminsRegistry(localAdminsList);
  notifyAdminChangeListeners();

  try {
    const { firestore, db } = getFirebaseInstances();
    const firestoreInstance = firestore || db;
    if (firestoreInstance) {
      await firestoreInstance.collection("admins").doc(adminId).delete();
      await firestoreInstance.collection("admin_credentials").doc(adminId).delete().catch(() => {});
      if (target.email) {
        await firestoreInstance.collection("admin_credentials").doc(target.email.toLowerCase()).delete().catch(() => {});
      }
    }
  } catch (err) {
    console.warn("Could not delete admin from Firestore:", err);
  }

  if (typeof window.recordAuditLog === "function") {
    window.recordAuditLog({
      type: "admin_removed",
      title: `Official Removed: ${target.name} (${target.id})`,
      details: `Official account ${target.name} (${target.email}, ${target.id}) was removed by ${getCurrentAdmin()?.name || 'Super Admin'}.`,
      summary: `Admin account ${target.id} removed`,
      adminId: getCurrentAdmin()?.id || "ADM-001",
      adminName: getCurrentAdmin()?.name || "Super Admin",
      adminEmail: getCurrentAdmin()?.email || ROOT_SUPER_ADMIN.email,
      adminRole: "super_admin"
    });
  }

  return { success: true };
}

/**
 * Reset an admin's password (Super Admin privilege only)
 */
export async function resetAdminPassword(adminId, newPassword) {
  if (!isUserSuperAdmin()) {
    throw new Error("Access Denied: Only a Super Administrator can reset official passwords.");
  }
  const cleanPass = (newPassword || "").trim();
  if (cleanPass.length < 4) {
    throw new Error("Password must be at least 4 characters long.");
  }

  const allAdmins = getRegisteredAdmins();
  const target = allAdmins.find(a => a.id === adminId);
  if (!target) {
    throw new Error("Official account not found.");
  }

  await setAdminPassword(adminId, cleanPass);

  if (typeof window.recordAuditLog === "function") {
    window.recordAuditLog({
      type: "admin_password_reset",
      title: `Password Reset: ${target.name} (${target.id})`,
      details: `Official password for ${target.name} (${target.email}) was reset by ${getCurrentAdmin()?.name || 'Super Admin'}.`,
      summary: `Password reset for ${target.id}`,
      adminId: getCurrentAdmin()?.id || "ADM-001",
      adminName: getCurrentAdmin()?.name || "Super Admin",
      adminEmail: getCurrentAdmin()?.email || ROOT_SUPER_ADMIN.email,
      adminRole: "super_admin"
    });
  }

  return { success: true };
}

/**
 * Get credentials store (local cache with Firestore fallback)
 */
function getCredentialsStore() {
  try {
    const raw = localStorage.getItem(ADMIN_CREDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveCredentialsStore(store) {
  try {
    localStorage.setItem(ADMIN_CREDS_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn("Could not save admin creds locally:", e);
  }
}

/**
 * Check if admin has set a password (checks localStorage and Cloud Firestore)
 */
export async function hasAdminPassword(identifier) {
  const norm = (identifier || "").trim().toLowerCase();
  const allAdmins = getRegisteredAdmins();
  const admin = allAdmins.find(a => 
    a.id.toLowerCase() === norm || (a.email && a.email.toLowerCase() === norm)
  ) || ROOT_SUPER_ADMIN;

  const primaryId = admin ? admin.id : identifier;
  const primaryEmail = admin ? admin.email.toLowerCase() : null;

  const store = getCredentialsStore();
  if (store[primaryId] || (primaryEmail && store[primaryEmail])) {
    return true;
  }

  try {
    const { firestore, db } = getFirebaseInstances();
    const firestoreInstance = firestore || db;
    if (firestoreInstance) {
      let doc = await firestoreInstance.collection("admin_credentials").doc(primaryId).get();
      if (doc.exists && doc.data()?.passwordHash) {
        const hash = doc.data().passwordHash;
        store[primaryId] = hash;
        if (primaryEmail) store[primaryEmail] = hash;
        saveCredentialsStore(store);
        return true;
      }

      if (primaryEmail) {
        doc = await firestoreInstance.collection("admin_credentials").doc(primaryEmail).get();
        if (doc.exists && doc.data()?.passwordHash) {
          const hash = doc.data().passwordHash;
          store[primaryId] = hash;
          store[primaryEmail] = hash;
          saveCredentialsStore(store);
          return true;
        }
      }
    }
  } catch (e) {
    console.warn("Error checking remote admin password:", e);
  }
  return false;
}

/**
 * Simple client-side hash for password storage
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return "h_" + Math.abs(hash).toString(36) + "_" + str.length;
}

/**
 * Set or reset an admin's password (persists to both localStorage and Cloud Firestore)
 */
export async function setAdminPassword(identifier, newPassword) {
  const cleanPass = (newPassword || "").trim();
  if (cleanPass.length < 4) {
    throw new Error("Password must be at least 4 characters long.");
  }

  const norm = (identifier || "").trim().toLowerCase();
  const allAdmins = getRegisteredAdmins();
  const admin = allAdmins.find(a => 
    a.id.toLowerCase() === norm || (a.email && a.email.toLowerCase() === norm)
  ) || ROOT_SUPER_ADMIN;

  const primaryId = admin ? admin.id : identifier;
  const primaryEmail = admin ? admin.email.toLowerCase() : null;

  const hash = simpleHash(cleanPass);
  const store = getCredentialsStore();
  store[primaryId] = hash;
  if (primaryEmail) {
    store[primaryEmail] = hash;
  }
  saveCredentialsStore(store);

  let synced = false;
  try {
    const { firestore, db } = getFirebaseInstances();
    const firestoreInstance = firestore || db;
    if (firestoreInstance) {
      const payload = {
        adminId: primaryId,
        email: primaryEmail || identifier,
        passwordHash: hash,
        updatedAt: new Date().toISOString()
      };
      await firestoreInstance.collection("admin_credentials").doc(primaryId).set(payload, { merge: true });
      if (primaryEmail) {
        await firestoreInstance.collection("admin_credentials").doc(primaryEmail).set(payload, { merge: true });
      }
      synced = true;
    }
  } catch (e) {
    console.warn("Could not sync admin credentials to firestore:", e);
  }

  return { success: true, synced };
}

/**
 * Update the signed-in admin's own name and/or password.
 */
export async function updateCurrentAdminProfile({ name, newPassword }) {
  const currentAdmin = getCurrentAdmin();
  if (!currentAdmin?.id) {
    throw new Error("Sign in as an official before editing your account.");
  }

  const cleanName = (name || "").trim();
  if (cleanName.length < 2) {
    throw new Error("Please enter a name with at least 2 characters.");
  }

  const allAdmins = getRegisteredAdmins();
  const adminIndex = allAdmins.findIndex(admin => admin.id === currentAdmin.id);
  if (adminIndex < 0) {
    throw new Error("Your official account could not be found.");
  }

  const updatedAdmin = {
    ...allAdmins[adminIndex],
    name: cleanName,
    updatedAt: new Date().toISOString()
  };
  allAdmins[adminIndex] = updatedAdmin;
  localAdminsList = allAdmins;
  saveAdminsRegistry(allAdmins);

  const updatedSession = { ...currentAdmin, name: cleanName };
  currentUser = updatedSession;
  sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(updatedSession));
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(updatedSession));
  notifyAdminChangeListeners();
  notifyAuthListeners();

  let synced = false;
  try {
    const { firestore, db } = getFirebaseInstances();
    const firestoreInstance = firestore || db;
    if (firestoreInstance) {
      await firestoreInstance.collection("admins").doc(updatedAdmin.id).set(updatedAdmin, { merge: true });
      synced = true;
    }
  } catch (err) {
    console.warn("Could not sync admin profile to Firestore:", err);
  }

  if (newPassword) {
    const passwordResult = await setAdminPassword(updatedAdmin.id, newPassword);
    synced = synced && passwordResult.synced;
  }

  return { success: true, synced };
}

/**
 * Authenticate verified admin with email and password
 */
export async function loginAdminWithPassword(email, password) {
  const admin = getVerifiedAdmin(email);
  if (!admin) {
    throw new Error(`Access Denied: The email "${email}" is not verified in the official Juilliard Admin Registry. Only whitelisted school officials can log in.`);
  }

  const cleanPass = (password || "").trim();

  // Check if admin has set a password
  const hasPass = await hasAdminPassword(admin.id);

  if (!hasPass) {
    // If no password set yet, but user entered a valid password (>= 4 chars):
    // Auto-save this as their official password and log in immediately!
    if (cleanPass.length >= 4) {
      await setAdminPassword(admin.id, cleanPass);
      return completeAdminLogin(admin);
    }
    return {
      needsPasswordSetup: true,
      admin
    };
  }

  // Password exists — require non-empty entry
  if (!cleanPass) {
    throw new Error("Please enter your official password to sign in.");
  }

  const store = getCredentialsStore();
  const expectedHash = store[admin.id] || store[admin.email.toLowerCase()];
  const providedHash = simpleHash(cleanPass);

  if (expectedHash !== providedHash) {
    throw new Error("Incorrect official password. Please re-enter your password or click 'Set / Reset Password'.");
  }

  return completeAdminLogin(admin);
}

/**
 * Complete the admin login and record audit log
 */
export async function completeAdminLogin(admin) {
  const now = new Date();
  const session = {
    id: admin.id,
    adminId: admin.id,
    email: admin.email,
    name: admin.name,
    title: admin.title || "Official Marshal",
    role: admin.role || "admin",
    isAdmin: true,
    loginTimestamp: now.toISOString(),
    loginFormatted: formatAdminTimestamp(now)
  };

  currentUser = session;
  currentRole = "admin";

  sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));

  // Record to local audit log history
  recordLoginLog(session);

  notifyAuthListeners();
  return { success: true, admin: session };
}

function recordLoginLog(session) {
  try {
    let logs = [];
    const raw = localStorage.getItem(ADMIN_LOGS_KEY);
    if (raw) logs = JSON.parse(raw);
    logs.unshift({
      adminId: session.id,
      adminName: session.name,
      adminEmail: session.email,
      title: session.title,
      timestamp: session.loginTimestamp,
      formatted: session.loginFormatted,
      type: "login"
    });
    // Keep last 60 entries
    if (logs.length > 60) logs = logs.slice(0, 60);
    localStorage.setItem(ADMIN_LOGS_KEY, JSON.stringify(logs));

    if (typeof window.recordAuditLog === "function") {
      window.recordAuditLog({
        type: "admin_login",
        title: `Admin Login: ${session.name || 'Admin'} (${session.id || 'ADM-001'})`,
        details: `Official verified session authenticated for ${session.email} (${session.title || 'System Administrator'}).`,
        summary: `Admin session started by ${session.name || 'Admin'}`,
        adminId: session.id || "ADM-001",
        adminName: session.name || "Admin",
        adminEmail: session.email,
        adminRole: session.role || "super_admin",
        metadata: { loginFormatted: session.loginFormatted }
      });
    }
  } catch (e) {
    console.warn("Could not save login log:", e);
  }

  // Firestore sync for audit log
  try {
    const { firestore, db, isConnected } = getFirebaseInstances();
    const firestoreInstance = firestore || db;
    if (firestoreInstance) {
      firestoreInstance.collection("admin_audit_logs").add({
        type: "login",
        adminId: session.id,
        adminName: session.name,
        adminEmail: session.email,
        title: session.title,
        timestamp: session.loginTimestamp,
        formatted: session.loginFormatted
      }).catch(err => console.warn("Firestore audit log add error:", err));
    }
  } catch (e) {
    // Non-blocking
  }
}

export function getAdminLoginHistory() {
  try {
    const raw = localStorage.getItem(ADMIN_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Initialize Authentication Observer
 */
export function initAuth() {
  // 1. Check for active admin session
  const savedAdmin = sessionStorage.getItem(ADMIN_SESSION_KEY) || localStorage.getItem(ADMIN_SESSION_KEY);
  if (savedAdmin) {
    try {
      const parsed = JSON.parse(savedAdmin);
      if (parsed && (parsed.id || parsed.adminId) && parsed.email) {
        if (!parsed.id && parsed.adminId) parsed.id = parsed.adminId;
        currentUser = parsed;
        currentRole = "admin";
        notifyAuthListeners();
        return;
      }
    } catch (e) {
      console.warn("Failed to parse saved admin session:", e);
    }
  }

  // 2. Initialize Firebase Auth State Observer
  const { auth, isConnected } = getFirebaseInstances();
  if (!isConnected || !auth) {
    console.debug("Running with guest role.");
    return;
  }

  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUser = user;
      const email = (user.email || "").toLowerCase();
      const verified = getVerifiedAdmin(email);
      if (verified) {
        completeAdminLogin(verified);
      } else {
        currentRole = "teacher";
        notifyAuthListeners();
      }
    } else {
      const activeAdmin = getCurrentAdmin();
      if (activeAdmin) {
        currentUser = activeAdmin;
        currentRole = "admin";
      } else {
        currentUser = null;
        currentRole = "public";
      }
      notifyAuthListeners();
    }
  });
}

/**
 * Sign In with Google
 */
export async function signInWithGoogle() {
  const { auth, isConnected } = getFirebaseInstances();
  if (!isConnected || !auth) {
    throw new Error("Authentication service is currently offline.");
  }
  const provider = new window.firebase.auth.GoogleAuthProvider();
  return auth.signInWithPopup(provider);
}

export async function signInWithEmail(email, password) {
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanPass = (password || "").trim();

  // If verified admin, route to admin login
  const verified = getVerifiedAdmin(cleanEmail);
  if (verified) {
    return loginAdminWithPassword(cleanEmail, cleanPass);
  }

  // Try Firebase Auth if connected
  const { auth, isConnected } = getFirebaseInstances();
  if (isConnected && auth && cleanPass) {
    return auth.signInWithEmailAndPassword(cleanEmail, cleanPass);
  }

  // Regular spectator sign-in
  currentUser = {
    displayName: cleanEmail.split("@")[0] || "Spectator",
    email: cleanEmail,
    isAdmin: false
  };
  currentRole = "public";
  notifyAuthListeners();
  return { user: currentUser };
}

/**
 * Sign Out Admin
 */
export function signOutAdmin() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  localStorage.removeItem(ADMIN_SESSION_KEY);
  currentUser = null;
  currentRole = "public";
  notifyAuthListeners();
}

/**
 * Sign Out User
 */
export async function signOutUser() {
  signOutAdmin();
  const { auth, isConnected } = getFirebaseInstances();
  if (isConnected && auth) {
    await auth.signOut();
  }
  notifyAuthListeners();
}
