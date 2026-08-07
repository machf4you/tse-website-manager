# Approved WordPress Synchronisation Architecture

## Core Architectural Rules
1. **Orchestration Only:** The Website Manager operates strictly as an orchestration and presentation layer. It must **never** contain any WordPress data extraction, parsing, or transformation logic.
2. **Dedicated Extraction Engine:** The **TSE WordPress Exporter** performs all WordPress REST API calls, pagination, content extraction, and package assembly.
3. **Decoupled Future Audits:** Future site audits, page evaluations, and SEO analysis must **use only the stored data package** saved within the Website Manager and must **never call WordPress directly**.
4. **Export Package Versioning & Unique Identification:** Every synchronisation package must carry explicit engine/schema version headers and a unique `packageId` UUID for audit referencing and historical tracking.

---

## Integration Specifications

### 1. What Website Manager Sends to the Exporter
The Website Manager issues a synchronise request sending **only**:
* **Website ID:** Internal unique record identifier.
* **Connection Details:** Target WordPress base URL, authenticated username, and Application Password.
* **Synchronise Request:** Execution command payload (`action: "SYNCHRONISE"`).

---

### 2. What the Exporter Performs & Returns
* **Extraction:** The Exporter connects to WordPress, processes all endpoints, handles pagination, parses site metadata, content, media, plugins, and Elementor configurations.
* **Complete Synchronisation Package:** The Exporter returns a single self-contained JSON bundle comprising:
  * **Package Identification & Versioning Headers (Mandatory):**
    * `packageId`: Unique Package Identifier (UUID v4) generated per export execution.
    * `exporterVersion`: Version string of the TSE WordPress Exporter engine (e.g., `v1.2.0`).
    * `schemaVersion`: Schema version of the returned package payload (e.g., `1.0`).
    * `exportTimestamp`: UTC ISO 8601 timestamp of export execution.
    * `websiteId`: Internal unique website identifier.
    * `exportStatus`: Execution status (`SUCCESS`, `PARTIAL`, `FAILED`).
  * **Site Environment Package:** WordPress version, active theme name, Elementor active status, and active plugin inventory.
  * **Content Package:** Complete page hierarchy, post collections, custom post types, and taxonomy structures.
  * **Media Package:** Full media library metadata index.

---

### 3. What Website Manager Stores
* **Stored Synchronisation Package:** The Website Manager stores the returned complete bundle locally / in its data store without altering its contents.
* **Recorded Identifiers & Versioning Metadata:** The Website Manager stores `packageId`, `exporterVersion`, `schemaVersion`, `exportTimestamp`, `websiteId`, and `exportStatus` with every synchronisation record.
* **Primary Key for History:** Synchronisation history within Website Manager uses `packageId` as the primary reference key.
* **Website Tile Record Update:**
  * Sets `lifecycleStage` (e.g., Stage 4: Pages Configured).
  * Updates `lastSyncTimestamp`.
  * Sets `topIndicator` to `CONNECTED`.
  * Updates status badges (e.g., `Configured: Pages Configured (X/Y)`).

---

### 4. Audit & History Reference Rules
* **Package ID Referencing:** All downstream audit modules must explicitly reference the specific `packageId` they are evaluating.
* **Traceability:** Every generated audit report, task, or analysis artifact must bind to a `packageId`, establishing complete lineage between audit results and the exact source package snapshot.
* **Backwards Compatibility:** Future versions of the TSE WordPress Exporter must maintain backwards compatibility with existing package schemas or include explicit migration rules.

---

### 5. What Happens After Synchronisation Completes
1. **UI Tile Refresh:** The Website Tile updates on the dashboard to reflect the verified connection and configured page metrics.
2. **Audit Readiness (Isolated Data Access):** Downstream audit engines consume **only** the stored package referenced by `packageId`. No direct network requests or API calls are ever made to the live WordPress site during audit workflows.
