# Admin real-data integration and end-to-end verification

16 October 2026. Branch `main`; pre-existing Market/admin work retained. This report supersedes the earlier integration report's checksum blocker and unqualified model availability captions. Full per-display lineage: [admin-data-lineage.md](admin-data-lineage.md).

## Findings and corrections

The dashboard was already reading the actual PostgreSQL/Supabase tables, not demo arrays. The public website's current estimation path already persists through the existing transactional RPC, rather than the older Casablanca-only `logEstimation` helper. No new production write path or schema was needed.

Real gaps corrected:

1. A failed refresh could leave last-success data visible without sufficient qualification. `readAdminSnapshot` now fails closed on unsuccessful reads, unconfigured storage and malformed success responses; `currentAdminData` prevents failed/previous-filter snapshots from rendering as current KPIs. Initial/query errors never produce zero-filled cards.
2. Operational/model endpoints now explicitly return private/no-store responses. Database unavailability produces an error, including the model and PDF endpoints, instead of an empty model list or empty report that could be interpreted as real inactivity.
3. Successful reads carry server `readAt` timestamps; the existing UI displays seconds and timezone and states its explicit manual-refresh policy. Latest event creation is separately available as `kpis.latest_event_at`. No polling, Realtime subscription or automated ingestion claim was added.
4. Casablanca, as well as Marrakech, now distinguishes database public permission from verified deployment. Training dates come from `trained_at`; null remains undocumented. Approval is labelled documentary. No healthy deployment, production accuracy or completed training date is inferred from an artifact, model registry permission or Market data.
5. Monitoring identifies cities by stable slug and model ownership, rather than comparing mutable database display names. A fixture explicitly changes the Casablanca display name and confirms the same recorded feature source is still selected.
6. `today` now uses the database calendar day (`CURRENT_DATE`, UTC in the inspected database), rather than accidentally reading a rolling 24-hour period. Period parsing excludes inherited object-property names.
7. Saved-result provenance is now read from the actual `estimation_passports` relationship. The table and period summary distinguish saved results from legacy non-test events without a saved result. Recorded-event totals are preserved and are not misrepresented as a complete log of requests, failures or human submissions.
8. PDF error logging no longer prints arbitrary exception objects. Tests inject a credential-like PostgreSQL URL and verify that logged diagnostics redact it and API errors contain no sensitive details.
9. Marrakech's manifest checksum failure came from Windows CRLF checkout bytes. The Git HEAD blob, LF-normalized working bytes and release metadata all have the same expected SHA-256. The exact committed LF bytes were restored; a narrowly scoped `models/marrakech/v1/.gitattributes` pins that manifest to LF. JSON values, weights, feature contract, release metadata and checksum validation are unchanged. This is a checkout-integrity correction, not training, activation or deployment.
10. The browser outage check found a read hanging against a duplicate local Next development runtime. Shared operational, quality and security readers now have a 20-second client deadline and cancel superseded requests. A focused test verifies both deadline and cancellation. The duplicate processes were verified as this exact workspace's local Next runtime and stopped before the final build/restart; no database or unrelated process was stopped.

The sidebar, layout, charts, typography and themes were retained. UI edits are limited to accurate provenance, availability, loading/error states and read timestamps. No production record, role, authentication policy, RLS policy or schema was changed. No production estimate/account was generated for testing.

## Read-only live evidence

`outputs/admin-data/audit-live.cjs` loads the existing server configuration without emitting credentials. It opens a transaction with `BEGIN READ ONLY`, reads schemas, aggregate counts and persistence-function evidence, rolls back, then signs in through the normal local admin login endpoint and compares authenticated admin responses with the database aggregates. The report deliberately excludes customer identities, emails, event keys and individual property records.

Aggregate evidence is saved in the ignored local artifact `outputs/admin-data/live-evidence.json`. The inspected database is UTC. The live city IDs are Casablanca **1** and Marrakech **3**; actual API filters bind those IDs. The immutable slug/model-version pairing is used for reference selection and model ownership.

| Checked value, all periods and non-test events | Casablanca | Marrakech | Comparison |
|---|---:|---:|---|
| Registered event records | 20 | 2 | Direct SQL = API KPI = API table total = summed daily chart counts |
| Saved-result snapshots | 10 | 2 | Existing passport relationship; exposed as saved_results and row has_saved_result |
| Mean estimated price, unrounded MAD | 3,266,755.9 | 1,749,280.5 | Direct SQL AVG = API |
| Mean displayed MAD | 3,266,756 | 1,749,281 | Existing whole-MAD formatting |
| Median estimated price, MAD | 3,349,451 | 1,749,280.5 | Direct SQL percentile_cont = API |
| Median displayed MAD | 3,349,451 | 1,749,281 | Existing whole-MAD formatting |
| Mean recorded area, m² | 200.6 | 162 | Direct SQL AVG = API |
| Latest recorded event, UTC | 5 October 2026 22:51:13.499 | 12 October 2026 16:08:07.711 | Actual MAX(created_at), not request read time |
| Invalid/nonpositive recorded prices | 0 | 0 | Direct aggregate validation |
| Model/city FK mismatches | 0 | 0 | Joined database ownership check |
| Saved result versus event price mismatches | 0 | 0 | Existing linked prediction snapshot compared with event price |

Global independent aggregates: **2 cities, 2 registered models, 2 cities with models, 2 public model permissions, 22 non-test event records**. These match the API's global `platform` fields under both city selections. User/security comparisons match **3 registered users**, **8 consumed guest entitlements**, **1 claimed guest result**, and the actual role distribution. No online-user, active-session or conversion metric is inferred.

Important provenance limitation: Casablanca's 10 non-test rows without saved results are historical records. The database does not prove that they originated from the current public persistence pipeline. They were not deleted, silently excluded or relabelled as verified completed inference. Twelve saved results are not a denominator for all historical attempts or failed requests.

The historical references independently reconcile to **1,172 Casablanca reference rows** and **2,472 Marrakech source / 1,339 retained / 1,133 excluded rows**, with **62 represented / 30 publishable Marrakech neighborhoods**. These are file-backed reference counts, not website usage. Marrakech collection dates are 14 August–1 September 2026. Casablanca's reference is cached per server process; neither dataset has verified automatic ingestion/history in this admin. API read timestamps do not imply new collection or ingestion.

## Actual persistence path

1. The shared public estimator submits through `predictCasablanca` in `lib/api/client.ts` (despite its legacy name, it supports both cities).
2. `/api/estimations` verifies input contract, caller identity, entitlement and rate limits. The client cannot choose a model version, city fallback, prepared-input bypass or stored event owner.
3. `lib/estimations/gateway.ts` signs the exact request with HMAC, selects the configured inference transport and verifies returned city/model/version identity.
4. After a valid prediction, the server calls `phase_c_complete_estimation(token,request,user,input,prediction,locale)`.
5. The deployed six-argument wrapper calls the existing internal persistence path and stores locale. The internal function resolves `cities.slug`, owning model identity/version and public permission, then transactionally creates an event and its saved passport. Guest completion also consumes its existing lease. Live function signatures, hashes and relevant write/ownership clauses were inspected read-only.
6. Admin overview/event readers query those same city/model foreign keys and saved-result relationship. Refresh repeats the server reads and renders their returned values.

Inference failure occurs before completion, releases an existing guest lease and creates no successful event. The current schema does not support a complete per-city request/failure/success ratio; an absent successful event is not counted as a recorded failed attempt. `/api/analytics/events` still rejects client-authored event insertion. No extra production logger or duplicate event insertion was added.

## Controlled real-model pipeline tests

`tests/admin/operational-pipeline.test.ts` uses an isolated in-memory PostgreSQL/PGlite database with the existing migrations. The live database credentials are never used by those fixtures. Existing SQL/RPC functions, public client serialization, route handlers, input/entitlement checks, gateway HMAC signing/result verification, admin readers and the existing React overview/table renderers execute unchanged.

The HTTP transport and framework/auth session adapter are controlled fixtures. The model output is **not** mocked: the transport executes the actual Python CPU inference service and original serialized model. This is an isolated in-process integration test, not a claim that a real visitor was sent through a deployed public URL.

| Scenario | Evidence / outcome |
|---|---|
| A — Casablanca | Real CPU output 1,217,911 MAD; actual RPC creates the city-1 fixture event and saved result; refreshed API/table/chart count goes 0→1; same value appears in the existing React table. Replayed request ID does not infer/persist again. |
| B — Marrakech | Actual stacking-model CPU result matches the recorded golden raw price 1,468,447.422627404 within 1e-6; RPC creates the Marrakech-owned fixture event; refreshed KPI/table/chart count goes 0→1; saved-result badge and model version appear only in Marrakech's scoped render. |
| C — No activity | Registered fixture city Rabat has zero events and renders honest empty charts/activity/table state. It is not published or activated in production. Market reference counts are independent. |
| D — Database error | Injected read failure through the real server adapter produces 5xx API errors with no total/kpis payload. The real client reader rejects the response; failed/old-filter snapshots are hidden. Missing configuration and malformed HTTP-200 data also fail closed. Log redaction is checked. |
| E — New event | Both city predictions use the actual CPU models and real transactional RPC in the isolated database; event IDs, city/model ownership, locale, price and passport relationship match the refreshed admin response/render. No production traffic or inserts. |
| F — Refresh | Calling the actual shared snapshot reader again performs exactly two fresh no-store API reads; new persisted records and readAt become visible. Browser Actualiser also produces a new server-read timestamp. No automatic interval is promised. |
| User source change | A new isolated auth.users fixture row runs the actual existing signup trigger; the protected user API changes total 2→3 and returns matching roles/signup/audit records without account identities. |
| Inference outage | Simulated transport failure leaves successful-event totals unchanged and the guest trial unconsumed. It never fabricates a prediction or failure-rate statistic. |

### Python runtime detail

The default machine Python has scikit-learn **1.8.0**, while the existing `requirements.txt` and Marrakech release require **1.9.0**. The latter requirement was preserved, not relaxed. A local ignored test environment at `outputs/admin-data/runtime` overlays the required 1.9.0 on the installed compatible Python 3.12.10/dependencies; global Python was not upgraded. It inherits an unrelated `sklearn-compat` package whose own pip constraint is incompatible with 1.9; that package is outside project requirements and is not used by these model tests. No clean deployment-environment or general `pip check` claim is made.

Run real-model tests with the matching runtime:

```powershell
$env:MDL_TEST_PYTHON = (Resolve-Path '.\outputs\admin-data\runtime\Scripts\python.exe').Path
npm run test:admin
npm run test:security
```

A fresh CI/deployment environment should install the repository's existing pinned requirements. Running the model tests against the machine's incompatible default Python will correctly fail Marrakech's dependency gate. Nothing in this work installs into or activates a deployed runtime.

Manifest SHA-256 now matches the committed release: `6c6b38750b0a53a10d4af7896302ff047997bd7a326f758af46ef7af0e939cd1`. Model binary SHA-256 remains `623de883b958bb3fca1bfd545fa0f1d41d084179a45f901940f8901170e8dcf4`. No checksum bypass, training, changed parameter or changed model output was introduced.

## Browser, security and regression evidence

The actual authenticated admin is compared with the independently queried API/database values. Ignored screenshots and aggregate artifacts are under `outputs/admin-data/`; no sensitive customer records are included in this report. The final build recovered after the transient connection timeout: the actual Users & Security view displayed 3 users / 8 consumed entitlements / 1 claim, and Marrakech displayed its two saved results with a successful read timestamp of 02:50:20 UTC. `final-marrakech.png`, `users-live.png` and `model-integrity.png` record the recovered final views. The integrity banner is verified while remote deployment remains explicitly unverified. A 390-pixel mobile check reported scrollWidth 382, with no page overflow (`mobile-marrakech.png`). The UI preserves the existing design. Freshness, provenance and unavailable states are the intended visible changes. Admin remains French-only; no unsupported Arabic admin was invented.

Final local production HTTP checks (`http-checks.json`) return `/admin` → 307 login, seven protected admin reads → 401, direct snapshot/model file URLs → 404, and all four Casablanca/Marrakech public Market FR/AR routes → 200. Existing customer/admin/RLS regression tests also verify the server gate. Sensitive datasets/model binaries remain private server files. Model permission is global-admin-visible across cities, without new per-city privilege rules. No authentication/role/RLS policy was loosened.

### Verified test outcomes

| Check | Result |
|---|---|
| Admin backend/data-access/API/UI pipeline tests | **25/25 PASS** within the final full suite, using the compatible isolated Python runtime |
| Full auth/admin/security/frontend regression suite | **106/106 PASS**, including the previously failing real Marrakech CPU integration and real PostgreSQL RLS tests |
| Market regression suite | **20/20 PASS** |
| `npx tsc --noEmit` | **PASS** |
| `npm run lint` | **PASS**, no warnings/errors |
| Final `npm run build` | **PASS**: compilation, lint, TypeScript validation, 39 static pages and trace generation |
| `git diff --check` | **PASS** |

The final live SQL/API comparison completed at **2026-10-16T02:49:01Z** with all city totals, chart sums, prices, areas, saved-result coverage and global/user/security aggregate comparisons matching. Browser inspection independently confirmed Casablanca city ID 1, 20 rows, 10 saved-result badges and 10 legacy badges; Marrakech city ID 3, 2 rows and 2 saved-result badges. Mean/median display values match the rounding table above. Manual refresh changed the visible successful server-read timestamp from **02:34:41 UTC** to **02:35:12 UTC**. A successful today query returned an honest empty table.

Artifacts: `live-evidence.json`, `browser-refresh.json`, `casablanca-live.png`, `marrakech-live.png`, and `empty-today.png`, all under ignored `outputs/admin-data/`. The browser transport-outage check is recorded in `browser-failure.json` and `read-failure.png`: after failure, KPI cards **0**, displayed event rows **0**, and an explicit unavailable alert; these are absence-of-rendered-data checks, not a displayed zero activity count. A later final-build check also encountered actual Supabase pooler connection timeouts: the same unavailable behavior was observed, and the subsequent read-only SQL/API comparison recovered successfully. The database was never intentionally taken offline; the separate isolated database-failure test exercises actual API error responses and redacted logging.

## Remaining limits

* Remote deployment availability was not tested by generating production estimates. Registered/publicly permitted models remain distinct from remotely verified deployments.
* There is no complete request-attempt/failure log or verified transaction-price ground truth, so request conversion, failure rate, online users and production accuracy remain unavailable.
* Legacy event provenance cannot be reconstructed from current tables alone; saved-result coverage is explicitly shown.
* Dataset ingestion history and automatic freshness are not connected; references remain historical. Marrakech has no compatible connected drift baseline.
* The pinned Python runtime is required for Marrakech. A local passing CPU/persistence fixture is not a production activation or deployment.

No production/staging migration or production data write was executed. Existing migrations ran only in the isolated in-memory test database. No model was trained or activated/deployed in production. No commit, push, merge or deployment was made.

## Files changed for this correction

* `lib/admin/client-data.ts` — new shared, fail-closed snapshot reader/current-context guard and timestamp formatter.
* `lib/admin/analytics.ts` — actual saved-result coverage, source event timestamp/read timestamp, stable monitoring slug, calendar-day filtering, safe period parser and explicit unverified deployment status.
* `app/api/admin/overview/route.ts`, `estimations/route.ts`, `model/route.ts` — cache/error contracts and real city/model/period query parameters.
* `app/api/admin/data-intelligence/route.ts` — historical-source classification and read timestamp.
* `app/api/admin/users-security/route.ts` — same admin gate using the explicit request and successful read timestamp.
* `app/api/admin/report/route.ts` — unavailable-source error, corrected recorded-event/deployment wording and sanitized error logging.
* `components/admin/AdminDashboard.tsx` — uses the shared reader/guard, real timestamp and saved-result provenance; truthful model statuses; existing overview/table renderers exported for actual rendering tests.
* `components/admin/UsersSecurity.tsx` — abortable reads and read freshness.
* `components/admin/DataIntelligencePanels.tsx` — monitoring sample explicitly identified as recorded non-test inputs, rather than assumed live inference traffic.
* `models/marrakech/v1/.gitattributes` — keeps the checksummed manifest at LF. `preprocessing.json` was physically restored to its existing committed blob, with no JSON/Git-content change.
* `tests/admin/operational-pipeline.test.ts` — new real CPU/persistence/API/render/refresh and failure tests.
* `tests/admin/multi-city.test.ts` — verified saved-result table fixture, calendar-day and period-parser coverage.
* `docs/admin-data-lineage.md` and this report — metric lineage, actual evidence, scenarios, test/runtime details and limits.
* `docs/marrakech-admin-integration.md` — forward reference to this superseding operational audit, preserving the earlier report's historical results.

Pre-existing Market files and prior admin integration changes were preserved. Local evidence/runtime artifacts are ignored; no credentials or production identities are included in these documents.
