# Bugs Report: Save and Fetch from Server/Database

## CONFIRMED BUGS

### Bug 1: Race condition in applySyncData - clearing before putting

**Location:** `src/lib/sync.js` - `applySyncData()` function (lines 63-77)

**Description:**
```javascript
await db.db.transacoes.clear();
if (txs.length > 0) await db.putTransacoes(txs);
```
If `putTransacoes` fails after `clear()`, ALL local data will be lost. This is a critical data loss bug.

**Fix:** Use a transaction to ensure atomicity, or put data first then clear, or use bulkPut with the existing data.

**Status:** CONFIRMED - HIGH PRIORITY

---

### Bug 2: Same race condition in applySyncDataIncremental

**Location:** `src/lib/sync.js` - `applySyncDataIncremental()` function (lines 79-97)

**Description:**
Same issue - clears data before putting new data. If put fails, data is lost.

**Status:** CONFIRMED - HIGH PRIORITY

---

### Bug 3: Clientes not being synced properly from server

**Location:** 
- `src-tauri/src/db.rs` - `sync_pull()` doesn't save `clientes` from server response
- `src-tauri/src/db.rs` - `sync_push()` doesn't include `clientes` in the request body
- `src/lib/sync.js` - `pushToCloud()` includes `clientes` but it's not being properly handled in Tauri

**Description:**
In `src-tauri/src/db.rs`, the `sync_pull` function handles `categorias`, `contas`, and `contasInvestimento` but NOT `clientes`. The same happens with `sync_push`. This means clientes are never saved/loaded properly in the Tauri desktop app.

**Status:** CONFIRMED - HIGH PRIORITY

---

### Bug 4: Missing statusLancamento in Tauri sync

**Location:** `src-tauri/src/db.rs` - `sync_pull()` and `sync_push()`

**Description:**
The Tauri sync functions don't handle `statusLancamento` in the config. This means statusLancamento changes are not synced in the desktop app.

**Status:** CONFIRMED - MEDIUM PRIORITY

---

### Bug 5: Silent error swallowing in localStorage backup

**Location:** `src/lib/db.js` - `putTransacoes()` function (lines 47-49)

**Description:**
```javascript
try {
  if (typeof localStorage !== 'undefined') localStorage.setItem(LS_BACKUP_KEY, JSON.stringify(items));
} catch (_) {}
```
The error is completely swallowed with no logging. If localStorage backup fails, there's no way to know.

**Fix:** Add console.warn or proper error logging.

**Status:** CONFIRMED - LOW PRIORITY

---

### Bug 6: Incremental sync date comparison may fail across timezones

**Location:** `server/repos/syncRepo.js` - `getSnapshot()` function (lines 41-42)

**Description:**
```javascript
transacoes = transacoes.filter((t) => t.updatedAt && t.updatedAt >= since);
```
String comparison of ISO dates can behave unexpectedly across different timezones.

**Status:** CONFIRMED - MEDIUM PRIORITY

---

### Bug 7: Tauri close handler race condition

**Location:** `src-tauri/src/lib.rs` - close handler (lines 155-170)

**Description:**
The 500ms sleep before sync_push is a fragile workaround. If the frontend hasn't finished writing to the database, data will be lost. There's no confirmation that data was successfully saved before closing.

**Status:** CONFIRMED - HIGH PRIORITY

---

### Bug 8: No retry logic for sync_push in Tauri close handler

**Location:** `src-tauri/src/lib.rs` - close handler (lines 155-170)

**Description:**
If sync_push fails on close, there's no retry mechanism and no local backup of the data.

**Status:** CONFIRMED - MEDIUM PRIORITY

---

### Bug 9: Token not checked before push in PWA

**Location:** `src/lib/sync.js` - `pushToCloud()` function

**Description:**
The function checks `!getToken()` at the start and returns early, but if the token becomes invalid during the request (e.g., expires), the push will fail without clear error handling.

**Status:** CONFIRMED - LOW PRIORITY

---

### Bug 10: Missing "lastSyncedAt" in Tauri config retrieval

**Location:** `src-tauri/src/db.rs` - `get_config()` function

**Description:**
The function retrieves lastSyncedAt from config but only as a string. There's potential for issues when the config is empty or null.

**Status:** CONFIRMED - LOW PRIORITY

---

## ADDITIONAL FINDINGS

### Potential Issue: No data validation on server response

**Location:** `server/routes/sync.js` - GET and POST routes

**Description:**
The server doesn't validate the structure of data being sent by the client. Malformed data could corrupt the database.

**Status:** NEEDS REVIEW

---

### Potential Issue: No limit on snapshot size

**Location:** `server/repos/syncRepo.js` - `saveSnapshot()`

**Description:**
There's no check for maximum payload size. Large amounts of data could cause memory issues or timeouts.

**Status:** NEEDS REVIEW

