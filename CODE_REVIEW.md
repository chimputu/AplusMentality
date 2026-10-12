# Security & Correctness Review — A+ Mentality (Next.js 16 / Prisma / Clerk)

Reviewed: `app/api/**` (80 route handlers), `app/(dashboard)/**`, `lib/**`, `prisma/schema.prisma`, `proxy.ts`, `next.config.ts`, `package.json`, `.env*`, configs.
Method: full-file reads plus targeted greps; every finding below is verified against the actual source. Line numbers are exact.

Authoritative role enum (`prisma/schema.prisma:18-24`): `ADMIN | SUPER_ADMIN | STUDENT | LECTURER | TUTOR`.

---

## Severity summary

| # | Severity | Area | Issue |
|---|---|---|---|
| C1 | Critical | AuthZ | `PATCH /api/users/me` — any student can set their own `role` |
| C2 | Critical | AuthZ | `PUT /api/users/[id]` — self-promotion to ADMIN |
| C3 | Critical | AuthZ | `/api/admin/tutor-requests` — missing `await` ⇒ fully public |
| C4 | Critical | AuthZ/PII | `lib/data/dropdowns.ts` — server actions with no auth; student name+email dump |
| C5 | Critical | Secrets | `lib/email/send.ts` is `'use server'` ⇒ public email/webhook relay |
| C6 | Critical | Integrity | Test/quiz submit persists the **client-supplied score** |
| C7 | Critical | Correctness | `recomputeAttemptScore` computes `totalPoints` from `pointsEarned` ⇒ every manual grade = 100% pass |
| C8 | Critical | Secrets | Live production secrets committed to `origin/main` in `.env.example` |
| C9 | Critical | AuthZ | `/api/fix-user` mints an ADMIN row for any signed-in user |
| H1 | High | Integrity | Exam `timeLimit`/`closeAt` never enforced server-side |
| H2 | High | Integrity | Anti-cheat counters trusted verbatim from the client |
| H3 | High | Integrity | Answer key returned by `/start` before submission |
| H4 | High | Integrity | Answer key shipped in the result page RSC payload |
| H5 | High | AuthZ | Broken object-level authz on native submit (`attemptId` vs `[id]`) |
| H6 | High | AuthZ | `GET /api/tests/[id]` + `/api/quizzes/[id]` expose every student's submissions |
| H7 | High | AuthZ | `lib/auth.ts` adopts an existing account by unverified email claim ⇒ account takeover |
| H8 | High | AuthZ | Mass assignment (`data: body`) in several admin routes |
| H9 | High | Correctness | MCQ/TF answers never match the answer key (payment of two graders on different field names) |
| H10 | High | Correctness | Assessment runner cannot render or grade 5 of 9 question types |
| M1 | Medium | AuthZ | `requireAuth` used inside `try/catch` in ~40 API routes ⇒ 401 becomes 500 |
| M2 | Medium | AuthZ | `/api/fix-user` grants ADMIN |
| M3 | Medium | AuthZ | Cross-tenant IDOR in admin mutations; no institution scoping |
| M4 | Medium | AuthZ | Grading actions not bound to the attempt; unbounded points |
| M5 | Medium | AuthZ | Bulk promote lacks the self-change guard; any ADMIN can re-role SUPER_ADMIN |
| M6 | Medium | Integrity | TOCTOU duplicate submissions (no `@@unique`) |
| M7 | Medium | Integrity | `attempts/answer` writes to already-submitted attempts |
| M8 | Medium | Correctness | `computeAttemptPolicy` written but never called |
| M9 | Medium | Correctness | `isBest` set on attempts that still need manual grading |
| M10 | Medium | Privacy | HTML injection into admin notification emails |
| M11 | Medium | Privacy | `app/api/submissions` returns every institution's submissions |
| M12 | Medium | Privacy | `app/api/debug/banners` unauthenticated, returns inactive banners |
| M13 | Medium | Privacy | Cache keys not user-scoped |
| M14 | Medium | Robustness | `parseInt`/enums unvalidated; `err.message` returned to clients |
| L1 | Low | Correctness | `facultyId` branch writes `programmeId` |
| L2 | Low | Robustness | `.env.example` ships real Cloudinary/Upstash credentials |
| L3 | Low | Robustness | `tsconfig` sets `strictNullChecks: false` under `strict: true` |
| L4 | Low | Robustness | Tests mock Prisma + Clerk as ADMIN ⇒ authz is never tested |
| L5 | Low | Robustness | `build` script masks `prisma migrate deploy` failures |
| L6 | Low | Correctness | Duplicate submission models and duplicate graders |
| L7 | Low | Robustness | `listUsers`/`listProgrammes` accept unbounded `pageSize` |
| L8 | Low | Privacy | `notificationId` accepted unvalidated |
| L9 | Low | Correctness | `/notifications` filters `TutorApplication` by Clerk id |

---

## Critical

### C1 — Any student can make themselves SUPER_ADMIN
`app/api/users/me/route.ts:17-35`

```ts
const body = await req.json();
const data: any = {};
...
if (body.role !== undefined) data.role = body.role;      // line 30
const updated = await prisma.user.update({ where: { clerkId: userId }, data });
```

`auth()` proves only *who* the caller is. `role` is copied from the request body into the caller's own row with no allow-list and no role check.

**Exploit:** a signed-in STUDENT sends `PATCH /api/users/me {"role":"SUPER_ADMIN"}`. Every `requireAdmin()` in `lib/actions/*` (assessments, questions, user-admin, institution-crud, tutor-crud, grading, banner) then authorises them, including `deleteUser`/`deactivateUser` against real admins.

**Fix:** never accept `role` from a self-update:
```ts
const { role: _ignored, ...safe } = body;         // or zod .pick() of allowed fields
```
and grant roles only through an admin-only action that requires `SUPER_ADMIN` to mint admins.

---

### C2 — Self-promotion through the per-user endpoint
`app/api/users/[id]/route.ts:59-79`

```ts
if (body.role && role !== 'ADMIN') {           // line 59 — guard exists…
  return NextResponse.json({ error: 'Only admins can change roles' }, { status: 403 });
}
if (role !== 'ADMIN' && id !== userId) {       // line 66 — …but self-targeting passes
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
}
const user = await prisma.user.update({
  where: { clerkId: id },
  data: { name: body.name, role: body.role },  // line 77 — ungated write
});
```

The line-59 guard is dead code for the self case: `id === userId` makes line 66 pass, and `role: body.role` is written unconditionally.

**Exploit:** `PUT /api/users/<my-own-clerkId>` with `{"role":"ADMIN"}`.

**Fix:** `data: { name: body.name, ...(role === 'ADMIN' ? { role: body.role } : {}) }` and reject `SUPER_ADMIN` grants unless the caller is `SUPER_ADMIN`.

---

### C3 — Admin endpoint is completely public (missing `await`)
`app/api/admin/tutor-requests/route.ts:7-10`

```ts
const admin = getAuthUser(['ADMIN']);   // async → a Promise, always truthy
if (!admin) {                            // never true
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

`getAuthUser` is `async` (`lib/auth.ts:147`). A pending Promise is never falsy, so the guard cannot fire. This is the only file in `app/api` with this bug (verified by grepping every `getAuthUser(`/`requireAuth(` call site).

**Exploit:** unauthenticated `GET /api/admin/tutor-requests` returns every `TutorRequest` — `studentName`, `studentEmail`, `studentPhone`, `message`, `adminNotes` — plus tutor names/emails.

**Fix:** `const admin = await getAuthUser(['ADMIN']);`

---

### C4 — Server actions with no auth expose student PII
`lib/data/dropdowns.ts:1` (`'use server'`, zero `auth()`/`requireAuth` calls in the file)

```ts
export async function fetchStudentsForDropdown(institutionId?: string) {   // line 129
  return prisma.user.findMany({
    where: { role: 'STUDENT', ...(institutionId && { institutionId }) },
    select: { id: true, firstName: true, lastName: true, email: true },
```

Every exported function in a `'use server'` module is an internet-reachable RPC endpoint. `fetchStudentsForDropdown` returns every student's name, surname and email address to an anonymous caller; `fetchQuestionsForDropdown` (line 159) returns the question bank; `fetchTutorsForDropdown` (line 110) returns staff emails.

Same missing-auth class: `lib/actions/programme-crud.ts:48` (`listProgrammes`), `:102` (`getProgramme`, includes `institution`, `faculty`, `branches`, `courses`), `:214`, `:224`; `lib/actions/institution-crud.ts:238` (`listInstitutions`, exposes `_count.users`), `:278`; `lib/actions/tutor-crud.ts:161,168,180,188`.

**Fix:** add `await requireAuth(['ADMIN','SUPER_ADMIN'])` to every dropdown/lookup export. Keep a deliberately public subset (institution/programme names for onboarding) separate and select-limited.

---

### C5 — `lib/email/send.ts` is a public, unauthenticated mail relay
`lib/email/send.ts:6`

```ts
'use server';
...
export async function sendEmail({ to, subject, html, replyTo }: SendEmailOptions) {   // line 32
```

The `'use server'` directive turns `sendEmail`/`sendTextEmail` into public server actions: `to`, `subject` and `html` are all caller-controlled, so anyone who obtains the action id can send arbitrary HTML from the verified sender (`EMAIL_FROM`, a Gmail address) to arbitrary recipients — phishing with your domain reputation. It also burns the Brevo 300/day quota and can get the sender blacklisted.

Best practice for this file: it is not a form action and is never invoked from a client component. `lib/email.ts:5` imports it normally.

**Fix:** delete the `'use server'` directive; keep it a plain server-only module (`import 'server-only'`).

---

### C6 — Students submit their own test/quiz score
`app/api/tests/[id]/submit/route.ts:13-53` (identical at `app/api/quizzes/[id]/submit/route.ts`)

```ts
const { score, total, responseId } = body;      // line 14 — client-supplied
...
const submission = await prisma.testSubmission.create({
  data: {
    testId: id,
    userId,
    score: score || null,                        // line 47 — persisted as the official grade
    total: total || null,
```

No recomputation, no clamp to `Test.maxScore`, no validation. `{"score": 999999, "total": 1}` is stored verbatim; negatives are accepted (`score || null` only nullifies `0`/`""`). The fabricated grade is then shown to staff through `app/api/submissions/route.ts:99-114` and `app/api/tests/[id]/submissions/route.ts:19-32`.

**Fix:** remove `score`/`total` from the accepted body; persist `status: 'PENDING'` and grade server-side.

---

### C7 — Every manually graded attempt reports 100% and "passed"
`lib/actions/grading.ts:139-153`

```ts
const score = answers.reduce((sum, a) => sum + (a.pointsEarned || 0), 0);
const totalPoints = answers.reduce((sum, a) => sum + (a.pointsEarned || 0), 0);  // line 145 — same sum
...
percentage: totalPoints > 0 ? Math.round((score / totalPoints) * 100) : null,     // always 100
```

`totalPoints` must be the sum of `question.points`, not of `pointsEarned`. As written, `score === totalPoints` whenever any points exist, so `percentage` is always `100` and `passed` is always true for essay/FILE_UPLOAD assessments.

**Fix:** join the questions and sum `question.points`:
```ts
const totalPoints = answers.reduce((sum, a) => sum + (a.question.points ?? 1), 0);
```
(include `question: { select: { points: true } }` in the query.)

---

### C8 — Live production secrets committed to `origin/main`
`.env` is correctly gitignored (`.gitignore:34`, verified with `git check-ignore -v .env`) — but **`.env.example:6` is a tracked file whose allowlist entry (`.gitignore:35`) exempts it**, and it contains real credentials:

| Line | Variable | Status |
|---|---|---|
| `.env.example:6` | `DATABASE_URL` | **real** Prisma Postgres URL including the API key *and* password |
| `.env.example:26` | `CLOUDINARY_CLOUD_NAME` | real |
| `.env.example:28` | `CLOUDINARY_API_KEY` | real |
| `.env.example:30` | `CLOUDINARY_API_SECRET` | **real** |
| `.env.example:36-38` | `UPSTASH_REDIS_REST_URL` / `_TOKEN` | **real** |
| `.env.example:14-16` | Clerk keys | real **test-mode** (`pk_test_`/`sk_test_`) |

Verified with git: the file is tracked, the working tree is clean, `HEAD` equals `origin/main` (`https://github.com/chimputu/AplusMentality.git`), and the file is present at `origin/main` — so this is published, not local-only, and it is in history (six commits touch the file). `.env` additionally holds the live `CLERK_SECRET_KEY` (`sk_live_…`), `CLERK_WEBHOOK_SECRET` and `BREVO_API_KEY` on the developer's disk.

**Impact:** full read/write to the production Postgres (users, roles, submissions, grades), arbitrary upload/delete in the Cloudinary account, read/write/flush of the production Redis cache, and email-sending capability.

**Fix:** rotate **all** of these at the provider dashboards first — a git cleanup without rotation is worthless. Then replace `.env.example` with placeholders, purge history (`git filter-repo`/BFG) and force-push, and enable GitHub push protection / gitleaks in CI. Keep the `!.env.example` allowlist but add a CI check that the file contains no non-placeholder values.

---

### C9 — `/api/fix-user` grants ADMIN to any signed-in user
`app/api/fix-user/route.ts:69-86`

```ts
user = await prisma.user.create({
  data: {
    clerkId: userId,
    email: email,
    name: claims?.firstName ? `${claims.firstName} ${claims.lastName || ''}`.trim() : null,
    role: 'ADMIN',            // line 74 — "Make you admin"
  },
});
```

The only check is `if (!userId) return 401` (line 9). Any authenticated user — including a brand-new self-registered student — whose DB row does not yet exist gets an ADMIN row, and the response confirms it: *"✅ User created successfully! You are now an ADMIN."* Authorization everywhere else reads `user.role` from the DB (`lib/auth.ts:30-33`), so this is one-request takeover. It is a `GET`, so it is also reachable by top-level navigation/CSRF. The email-matching branch at `:47-56` is the same defect as H7.

**Fix:** delete the route — nothing links to it and the Clerk webhook (`app/api/webhooks/clerk/route.ts:83-93`) already creates users as `STUDENT`. If a bootstrap admin is needed, make it an env-gated `scripts/` command, never an HTTP handler.


---

## High

### H1 — Exam timer and closing time are enforced only in the browser
`app/api/student/assessments/[id]/submit/route.ts:78-94`

```ts
const updatedAttempt = await prisma.assessmentAttempt.update({
  where: { id: attemptId },
  data: { answers, submittedAt: new Date(), timeSpent, ... },   // no closeAt / timeLimit check
});
```

`Assessment.timeLimit` and `Assessment.closeAt` are never read on submit (the only `closeAt` check is at `start/route.ts:71-76`), and `timeSpent` is the client's number. The only timer is `app/(dashboard)/assessments/[id]/_components/assessment-runner.tsx:58-79` — a React `setInterval` that calls `handleSubmit()`, which **starts with a `confirm()` dialog** (line 124), so even the client-side expiry does not auto-submit.

**Exploit:** start an attempt (or just keep the tab open), take unlimited time, submit days later. Equivalent for `lib/actions/attempts.ts:188-253` (`submitAttempt`).

**Fix:** on submit, load the assessment and reject when `now > closeAt` or `now - attempt.startedAt > timeLimit * 60_000 + grace`; compute `timeSpent` from `startedAt`, never from the body.

---

### H2 — Anti-cheat signals are client-supplied
`app/api/student/assessments/[id]/submit/route.ts:20,84-87`

```ts
const { attemptId, answers, timeSpent, tabSwitches, fullscreenExits, copyAttempts, violations } = body;
...
tabSwitches: tabSwitches ?? 0,
fullscreenExits: fullscreenExits ?? 0,
copyAttempts: copyAttempts ?? 0,
violations,
```

The proctoring columns (`Assessment.proctored`, `maxTabSwitches`, `requireFullscreen`, `disableCopyPaste`) exist in the schema, are settable in the admin UI, and are **never read by any server code** (grepped: they appear only in `admin/assessments/route.ts` writes and admin/student display pages). `hooks/useAntiCheat.ts` is purely client-side and trivially disabled.

**Fix:** if proctoring is a product requirement, server-side enforcement has to key off something the client cannot forge (server-recorded `startedAt`, per-request rate, or an external proctor). At minimum, record violations server-side rather than trusting the submitted counters, and stop advertising proctoring that does not exist.

---

### H3 — Answer key returned when the exam starts
`app/api/student/assessments/[id]/start/route.ts:30-42,131-138`

```ts
const assessment = await prisma.assessment.findUnique({
  where: { id },
  include: { questions: { orderBy: { order: 'asc' } }, ... },   // full Question rows
});
...
return NextResponse.json({ attempt, assessment: { ...assessment, questions }, policy });
```

The spread returns `correctId`, `correctText`, `acceptedAnswers`, `correctNumber`, `tolerance`, `matchingPairs` and `explanation` to the student before they answer. `ResultReveal`/`showAnswersAfter` is never consulted.

**Fix:** project a safe shape — `questions: { select: { id, order, type, prompt, imageUrl, options, points } }` — and strip every correctness field.

Note the contrast: `lib/actions/attempts.ts:94-97` gets this right for the page path (`options: null`), but `options` is what a *different* grader needs, so that sanitisation is also wrong in the opposite direction (see H9/H10).

---

### H4 — Answer key shipped in the result page payload
`app/(dashboard)/assessments/[id]/result/page.tsx:24,134-139` + `lib/actions/attempts.ts:289-291`

```ts
return { ..., assessment: attempt.assessment, answers: ..., showAnswers: attempt.assessment.showAnswersAfter === 'IMMEDIATELY' };
```

`showAnswers` only hides the key in the rendered JSX. `assessment.questions` (with `correctText`, `correctId`, `explanation`) is a serialised prop of the server component, so it is present in the RSC/flight payload in the browser regardless of the flag — and `getAttemptResult` is reachable directly as a server action too.

**Fix:** do the filtering on the server: select only the fields the page may display, and return `correctText`/`explanation` only when the reveal policy allows.

---

### H5 — Attempt is never bound to the assessment in the URL
`app/api/student/assessments/[id]/submit/route.ts:39-49,59-75`

```ts
const attempt = await prisma.assessmentAttempt.findUnique({ where: { id: attemptId } });
if (attempt.userId !== student.id) { return 403; }        // ownership checked
// attempt.assessmentId is never compared with `id` from the path
const assessment = await prisma.assessment.findUnique({ where: { id } });
const gradeResult = gradeAssessment({ questions: assessment.questions, answers: answers || [], ... });
```

**Exploit:** start an attempt on an easy PRACTICE assessment A, then `POST /api/student/assessments/<B>/submit` with A's `attemptId`; the attempt is graded against B's questions/passingScore/keepBestScore and stored on A's row. `mode === 'GOOGLE_FORM'` (line 118) additionally creates a `FormResponse` against B.

**Fix:** query `where: { id: attemptId, assessmentId: id, userId: student.id }` in one call.

---

### H6 — Any authenticated user can read every submission for any test/quiz
`app/api/tests/[id]/route.ts:12-33` (identical at `app/api/quizzes/[id]/route.ts:12-33`)

```ts
const auth = await getAuthUser();          // no roles, no ownership
...
const test = await prisma.test.findUnique({ where: { id }, include: {
  creator: { select: { name: true, email: true } },
  submissions: { include: { user: { select: { name: true, email: true } } } },   // all students
}});
```

A STUDENT gets every classmate's name, email, score, feedback and `responseId`. The admin-only `app/api/tests/[id]/submissions/route.ts:11` exists, so this is redundant exposure at a much lower privilege.

**Fix:** drop `submissions` from the include, or scope it: `submissions: { where: { userId: auth.userId } }` for students, unrestricted only for `ADMIN`/`SUPER_ADMIN`.

---

### H7 — Account takeover by unverified email claim
`lib/auth.ts:37-71` (duplicated at `:172-206`)

```ts
const email = claims?.email || claims?.user?.email || claims?.emailAddress || `user_${Date.now()}@temp.com`;
...
existingUser = await withRetry(() => prisma.user.findUnique({ where: { email } }), ...);
if (existingUser) {
  user = await withRetry(() => prisma.user.update({
    where: { email },
    data: { clerkId: userId },        // rebinds the account to the new Clerk identity
```

An account is adopted purely because a session claim matches a stored email — no verification check, and the `role` is inherited from the existing row. `app/api/fix-user/route.ts:47-56` does the same thing. Contrast `app/api/webhooks/clerk/route.ts:55-58`, which at least prefers the *primary* address.

**Exploit:** if email verification is not mandatory in the Clerk instance, an attacker registers a Clerk account claiming `admin@…`, hits any page, and inherits that ADMIN account; the legitimate owner is locked out because their `clerkId` was overwritten.

**Fix:** only adopt an existing row when the claim is verified (`claims.email_verified === true`); otherwise create a fresh, unprivileged row or fail closed. The `user_${Date.now()}@temp.com` fallback also masks claim-shape failures — prefer failing closed.

---

### H8 — Mass assignment in admin routes
| Location | Snippet |
|---|---|
| `app/api/admin/assessments/[id]/route.ts:76-83` | `const { questions, ...updateData } = body; const data: any = { ...updateData };` |
| `app/api/assignments/[id]/route.ts:57-60` | `prisma.assignment.update({ where: { id }, data: body })` |

Any model column passes through, including `id`, `createdBy`, `courseId`. **Exploit:** `PUT` with `{"createdBy":"user_attacker","courseId":"<victim course>"}` reassigns authorship and re-scopes content. Admin-gated today, but combined with C1/C2 it becomes reachable by anyone.

**Fix:** explicit allow-lists validated with zod `.strict()` (the sibling `app/api/assignments/route.ts:86-104` already destructures correctly — copy that pattern).

---

### H9 — Multiple choice and true/false answers never match the key
`lib/grade-assessment.ts:12-17,54-66` vs the writers

```ts
interface Answer { questionId: string; selectedId?: string | null; ... }   // line 14
...
case 'MULTIPLE_CHOICE':
  if (answer?.selectedId === question.correctId) earned = question.points;   // line 56
```

Nothing ever produces `selectedId`:
- `app/(dashboard)/assessments/[id]/_components/assessment-runner.tsx:242` sends `selectedOptionId: "opt-0"…"opt-5"`.
- `lib/actions/attempts.ts:30-40,172-178` stores `selectedOptionId`.
- `lib/assessment/grader.ts:29,77` reads `selectedOptionId` and `correctOptionId`.

So the REST submit path (`submit/route.ts:71`, which uses `grade-assessment.ts`) marks **every** MCQ/T-F answer wrong, and `points` for those questions can never be earned.

Two more layers of the same defect:
- The runner hardcodes `opt-${i}` (line 242) while the admin question form (`app/(dashboard)/admin/questions/components/question-form.tsx:70`) stores options with **no ids at all** — only `{text, isCorrect, order}` — and `lib/actions/questions.ts:176` sets `correctId` from `input.options?.find(o => o.isCorrect)?.id`, which is `undefined`. So `correctId` is usually `null` too.
- The runner renders the literal text `{label}. (Option {label})` (line 246) and never renders real option text, so students cannot even see the choices.

**Fix:** pick one answer-field contract and one grader; generate stable option ids at authoring time; render `question.options`; delete the unused grader. There are currently two parallel grading implementations (`lib/grade-assessment.ts` and `lib/assessment/grader.ts`) with incompatible field names, and two parallel submit paths that use different ones.

---

### H10 — Runner supports a third of the question types
`app/(dashboard)/assessments/[id]/_components/assessment-runner.tsx:227-274`

The type union in the schema is `MULTIPLE_CHOICE | TRUE_FALSE | SHORT_ANSWER | ESSAY | IMAGE_CHOICE | FILE_UPLOAD | FILL_IN_BLANK | MATCHING | NUMERIC` (`prisma/schema.prisma:103-113`), and the admin form can create `NUMERIC`, `MATCHING`, `ESSAY`, `SHORT_ANSWER`, `FILL_IN_BLANK`. The runner renders inputs only for `MULTIPLE_CHOICE`/`TRUE_FALSE` (as radio buttons), `FILL_IN_BLANK`/`SHORT_ANSWER`/`ESSAY` (textarea), and `NUMERIC` (number). `IMAGE_CHOICE`, `FILE_UPLOAD` and `MATCHING` render **nothing** — the question shows a prompt with no input, and grading scores it zero (or flags manual grading).

**Fix:** render from `question.type` exhaustively (a `switch` with a default error), and cover `MATCHING`/`IMAGE_CHOICE`/`FILE_UPLOAD`, or restrict authoring to the supported set with a validation error.

---

### H11 — Lint crashes, which silently disables tests and build in CI
`eslint.config.mjs:1` + `package.json:9,67`

```js
import { defineConfig, globalIgnores } from "eslint/config";   // eslint.config.mjs:1
```

`node_modules/eslint/package.json` reports version **9.0.0** and exports only `./package.json`, `.`, and `./use-at-your-own-risk` — there is no `eslint/config` subpath in 9.0.0 (it landed later). `package.json:67` pins `"eslint": "~9.0"`, which permits only 9.0.x, and `package-lock.json` pins exactly 9.0.0. So `npm run lint` fails with `ERR_PACKAGE_PATH_NOT_EXPORTED` every time.

`.github/workflows/ci.yml:60-70` then runs, in order: `tsc --noEmit` → **Lint** → `npm run test` → `npm run build`. GitHub Actions aborts a job at the first failing step, so **the vitest suite and the production build never execute in CI**. The only real gates are `prisma migrate deploy` and `tsc` — and `tsc` is weakened by L3. The entire `eslint-config-next` ruleset is enforced nowhere.

**Fix:** bump to `"eslint": "^9.22.0"` (and refresh the lockfile), or import from a shape 9.0.0 supports. Independently, reorder `ci.yml` so `Run tests` precedes `Lint`, and verify CI is green on `main` — with this config it cannot have been.

---

### H12 — `proxy.ts` protects nothing
`proxy.ts:3`

```ts
export const proxy = clerkMiddleware();
```

`clerkMiddleware()` with no handler performs session hydration only — it does **not** protect any route. Repo-wide, `createRouteMatcher`/`auth.protect(`/`redirectToSignIn` appear nowhere. 100% of authorization is therefore per-page/per-route, which is exactly why C1-C4, C9 and M1/M2 exist.

The matcher (`proxy.ts:6-13`) also has an escape hole:
```ts
'/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
```
The `[^?]*\.(?:…)` alternation is unanchored at both ends and `[^?]*` crosses `/`, so it excludes any path merely *containing* `.ext` — a future `/api/admin/report.csv` or `/api/data.zip/anything` would skip the proxy entirely. (`.json` is correctly spared by the `js(?!on)` lookahead.) Patterns 1 and 3 are redundant with pattern 2. Today a matcher miss is not a bypass (no handler means `auth()` simply sees no `userId`), but it is a trap the moment protection moves into the proxy.

**What is currently right:** `app/(dashboard)/admin/layout.tsx:12` does guard every admin page (`await requireAuth(['ADMIN', 'SUPER_ADMIN'])`), and 75 of 85 route handlers call `requireAuth`/`getAuthUser`. The failure mode is the 10 that do not.

**Fix:** add a positive-match handler as defence-in-depth (`createRouteMatcher(['/admin(.*)','/student(.*)','/tutor(.*)','/api/(?!webhooks).*'])` → `await auth.protect()`), and anchor the static exclusion (`'/((?!_next/static|_next/image|.*\\.(?:css|js|mjs|map|jpg|jpeg|png|gif|svg|webp|ico|woff2?|ttf)$).*)'`).

---

## Medium

### M1 — `requireAuth` inside `try/catch` turns 401 into 500 (~40 routes)
`requireAuth` (`lib/auth.ts:6-145`) signals failure with `redirect()`, which **throws** `NEXT_REDIRECT`. Any route that wraps it in a `try` with a returning `catch` reports a server error instead of a redirect/401 and leaks the redirect target.

```ts
// app/api/courses/route.ts:30 vs :91-96
const authResult = await requireAuth();
...
} catch (error) { console.error(...); return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 }); }
```

Affected (verified call sites): `courses/route.ts:30,104,171,237`, `courses/[id]/route.ts:10`, `videos/route.ts:29,83,283,343`, `videos/[id]/route.ts:11,64,107`, `module/route.ts:8,47,93,134`, `modules/route.ts:8,47,107,164`, `enrollments/route.ts:8,41,131`, `enrollments/progress/route.ts:7`, `lecture-slides/[id]/route.ts:10,32,62`, `tests/route.ts:8,43,90,125`, `tests/[id]/route.ts` (PUT/DELETE), `quizzes/route.ts:8,43,82,116`, `assignments/route.ts:8,43,84,119`, `assignments/[id]/route.ts:11,53,78`, `submissions/route.ts:9`, `users/route.ts:8`, `users/[id]/route.ts:10,55,100`, `users/role/route.ts:8`, `users/promote/bulk/route.ts:8`, the three `*/submit/route.ts:11`, and the three `*submissions/[submissionId]/grade/route.ts:11`. Each catch returns before privileged work, so this is a correctness/observability defect, not a bypass — but it is one careless edit away from becoming one.

**Fix:** in API routes use `getAuthUser()` + explicit `401`/`403`; or `catch (e) { if (isRedirectError(e)) throw e; ... }`.

### M2 — `/api/fix-user` is a privilege-escalation endpoint
`app/api/fix-user/route.ts:69-79`

```ts
user = await prisma.user.create({
  data: { clerkId: userId, email, name: ..., role: 'ADMIN' },   // line 74
});
```

Any authenticated user whose row does not yet exist becomes ADMIN. Combined with C1/C2 it is redundant, but it is the most obvious hole (a "debug" route left in production). **Delete it.** The email-matching takeover path at `:47-56` is the same defect as H7.

### M3 — Cross-tenant IDOR and missing institution scoping
- `lib/actions/programme-tree.ts:186` `updateCourse` / `:216` `deleteCourse` — never load the course's institution, although `addCourseToProgramme` (`:155-164`) does check it. An ADMIN at institution A can re-point or delete B's course (`data.programmeId = input.programmeId`, line 195).
- `lib/actions/assessments.ts:171,203,236,272,286` — `updateAssessment`, `deleteAssessment`, `addQuestionToAssessment`, `removeQuestionFromAssessment`, `reorderAssessmentQuestions` have no tenant check.
- `lib/actions/tutor-application.ts:378,427,552` — an institution-A admin can read/approve/reject institution-B applicants; approval also writes `isVerifiedTutor: true` and creates a `Tutor` row (`:466-497`). `listTutorApplications` filters by the **client-supplied** `institutionId` (`:322`).
- `app/api/submissions/route.ts:22-79` — every institution's quiz/test/assignment submissions with student emails; `requireAuth` returns the admin's `user` but the query never uses it.
- `app/api/courses/route.ts:23-41` — the filtered admin GET accepts any `programmeId` and returns that programme's catalogue; `?all=1&programmeId=<other>` enumerates other institutions.
- `app/api/admin/uploads/[id]/tag/route.ts:107-182` and `app/api/videos/route.ts:126-143` — `courseId`/`universityId`/`programmeId` are trusted without verifying they agree with each other or with the admin's institution.

**Fix:** load the target with its institution and reject when `admin.institutionId && target.institutionId !== admin.institutionId`; reserve cross-tenant rights for `SUPER_ADMIN`; derive list scoping from the session, not the query string.

### M4 — Grading writes are not bound to the attempt and are unbounded
`lib/actions/grading.ts:30-94`

```ts
export async function gradeAllAnswersInAttempt(attemptId: string, grades: { answerId: string; pointsEarned: number; ... }[]) {
  await requireAdmin();
  for (const grade of grades) {
    await prisma.answer.update({ where: { id: grade.answerId }, data: { isCorrect: grade.pointsEarned > 0, pointsEarned: grade.pointsEarned, ... } });
```

Nothing verifies `grade.answerId` belongs to `attemptId`, `grades` is unvalidated, and `pointsEarned` accepts negatives/values above the question's points. Recompute then mixes foreign attempts into the score.

**Fix:** zod-parse; `findMany({ where: { id: { in: ids }, attemptId } })` and reject any mismatch; clamp `0 <= pointsEarned <= question.points`.

### M5 — Bulk role change has no self-guard and no SUPER_ADMIN gate
`app/api/users/promote/bulk/route.ts:8-35`

```ts
await requireAuth(['ADMIN']);
const { userIds, newRole } = body;
if (!newRole || !['ADMIN','STUDENT'].includes(newRole)) ...
const updatePromises = userIds.map((userId) => prisma.user.update({ where: { clerkId: userId }, data: { role: newRole } }));
```

`userIds` is unvalidated (no element-type check, no length cap) and any ADMIN can re-role any account, including demoting the SUPER_ADMIN or promoting a second account they control. The single-user route has the guard; this one does not.

**Fix:** require `SUPER_ADMIN` for ADMIN-level grants, block self-modification, cap `userIds.length`, validate each id.

### M6 — Duplicate submissions via check-then-act
`app/api/tests/[id]/submit/route.ts:29-53` (identical at `quizzes/[id]/submit/route.ts`)

```ts
const existingSubmission = await prisma.testSubmission.findFirst({ where: { testId: id, userId } });
if (existingSubmission) { return 400; }
const submission = await prisma.testSubmission.create({ data: { testId: id, userId, ... } });
```

No transaction and no DB constraint: `TestSubmission` has only `@@index([userId])`/`@@index([testId])` (`prisma/schema.prisma:533-534`), `QuizSubmission` the same (`:478-479`). Concurrent POSTs create duplicates, and the grade shown depends on ordering in `/api/submissions`.

**Fix:** `@@unique([testId, userId])` (and `@@unique([quizId, userId])`), let P2002 produce the 400.

### M7 — Answer sync writes to submitted attempts and foreign questions
`app/api/attempts/answer/route.ts:35-56`

Ownership is verified (lines 30-33 — correct), but there is no `submittedAt` check, no check that `questionId` belongs to the attempt's assessment, and no `closeAt` check. After submitting an essay attempt (which stays `score: null` pending manual grading), the student can keep inserting/overwriting answers and change what the grader reads.

**Fix:** load `attempt.submittedAt`/`assessmentId`; reject when submitted; verify the question is in the assessment; enforce the window.

### M8 — `computeAttemptPolicy` is dead code; attempt limits are inconsistent
`lib/attempt-policy.ts` has **no production callers** (grep: only its own definition and tests). The start route re-implements an incomplete version (`app/api/student/assessments/[id]/start/route.ts:79-98`) and `lib/actions/attempts.ts:110-154` checks only `completedCount >= attemptsMax`, ignoring `openAt`/`closeAt`, `attemptCooldownHrs` and `AttemptOverride`. The submit paths check nothing.

Also `start/route.ts:115` sets `attemptNumber = assessment.attempts.length + 1`, which counts in-progress and abandoned attempts, and `@@index([assessmentId, userId, attemptNumber])` (`schema.prisma:959`) is not unique.

**Fix:** route all start/submit decisions through `computeAttemptPolicy` with the assessment window, cooldown and overrides; make the index unique and retry on collision.

### M9 — `isBest` set on attempts that still need manual grading
`app/api/student/assessments/[id]/submit/route.ts:109-114`

```ts
if (gradeResult.score !== null) {      // gradeResult.score is always a number
  await prisma.assessmentAttempt.update({ where: { id: attemptId }, data: { isBest: true } });
}
```

`grade-assessment.ts:89` always adds `earned`, so `score` is never `null`, while the stored `attempt.score` is explicitly `null` when `needsManualGrading`. An all-essay attempt is therefore flagged as the best score.

**Fix:** gate on `!gradeResult.needsManualGrading`.

### M10 — HTML injection into admin notification emails
`lib/email.ts:41-55`

```ts
body: `
  <h2>New Tutor Application</h2>
  <p><strong>Applicant:</strong> ${fullName}</p>
  <p><strong>Email:</strong> ${applicantEmail}</p>
```

`lib/actions/tutor-application.ts:231` passes `input.fullName`/`input.email` straight from the applicant's form (zod checks `min(2)`/`email()` only). A crafted `fullName` of `<a href="https://evil.tld/reset">Action required: re-verify your admin account</a>` is delivered as live HTML inside a genuine platform email to every admin. `createRejectedEmail`'s `reason` (`:89`) is unescaped too. No escaping helper exists in `lib/email*`.

**Fix:** add an `escapeHtml` helper and use it on every interpolated value.

### M11 — `app/api/submissions` ignores tenant scope
`app/api/submissions/route.ts:22-79` returns every quiz/test/assignment submission platform-wide with student email, `clerkId` and `imageUrl`. See M3.

### M12 — Unauthenticated debug endpoint
`app/api/debug/banners/route.ts:4-21` has no auth and returns up to 10 banners with `title`, `message`, `imageUrl` and `targets` — including inactive/not-yet-started/expired ones (the `active` filter at lines 24-29 is computed but never used in the response at line 34). Remove or gate it.

`app/api/health/route.ts:10-31` is also unauthenticated and returns raw `err.message` on DB failure, which can disclose host/database/user from the connection error.

### M13 — Cache keys are not user-scoped
`lib/cache.ts:4` is a bare Redis client; `app/api/chat/route.ts:272` builds `chat:${isSignedIn ? 'app-mulu' : 'landing'}:${normalizeMessage(message)}` with a 3600 s TTL. Today the prompts are static, so no personal data is cached — but `lib/ai/context.ts` already produces `firstName`/`institution`/`role` for exactly the personalisation that would turn this into a cross-user answer leak (user B receives user A's cached reply). Contrast `lib/actions/chat.ts`, which correctly scopes every query by `userId: user.id`.

**Fix:** key on `userId ?? ip` and shorten the TTL for personalised modes.

### M14 — Unvalidated input and leaked internals
- `parseInt` → `NaN` → 500: `app/api/courses/route.ts:136`, `app/api/lecture-slides/route.ts:82`, `app/api/admin/uploads/[id]/tag/route.ts:66,90,115`; `app/api/videos/route.ts:94` silently defaults `year` to `1`.
- Raw enum values written to Prisma enums: `app/api/admin/assessments/route.ts:106-107,122,134` (`type`, `mode`, `showAnswersAfter`). Use `z.nativeEnum`.
- `app/api/books/[id]/route.ts:34-36` passes the path segment into third-party URLs (`lib/books.ts:203,217` — `https://gutendex.com/books/${id}`); no numeric validation, so odd paths are requested upstream. Validate with `/^[A-Za-z0-9_-]{1,64}$/`.
- `err.message` returned to clients in ~30 routes (e.g. `app/api/videos/[id]/route.ts:95,142`, `app/api/lessons/route.ts:98,156,193`, `app/api/users/[id]/route.ts:44,89,111`, `app/api/admin/assessments/[id]/route.ts:128`), leaking Prisma model/column/constraint names. Log server-side, return a generic message.

---

## Low

- **L1** `lib/actions/user-admin.ts:163` — the `facultyId` branch writes `data.programmeId = input.programmeId`, so passing `facultyId` corrupts an unrelated field.
- **L2** `.env.example` also ships the live Prisma `DATABASE_URL` and Cloudinary/Upstash credentials — see C8, which supersedes this entry.
- **L3** `tsconfig.json:7-8` — `"strict": true` is immediately defeated by `"strictNullChecks": false`, which is why the numerous nullable/`any` issues in this codebase do not surface at build time.
- **L4** `vitest.setup.ts:12,19-24` mocks Clerk auth as `test-user-id` and Prisma's `user.findUnique` as `role: 'ADMIN'`. Every authz test therefore runs as an admin and no permission regression can be caught. Add negative cases (student, anonymous) with per-test overrides.
- **L5** `package.json:7` — `"build": "prisma generate && prisma migrate deploy || true && next build"`. In POSIX shells `&&`/`||` are left-associative and equal precedence, so this parses as `((prisma generate && prisma migrate deploy) || true) && next build` — a **failed migration is swallowed** and the app builds and deploys against an unmigrated database. Use `prisma migrate deploy; next build` deliberately or fail fast.
- **L6** Duplicate concepts: `Quiz/Test/Assignment` + `*Submission` alongside `Assessment`/`AssessmentItem`/`Attempt`/`Answer`; `lib/grade-assessment.ts` alongside `lib/assessment/grader.ts`. This is the root cause of H9/H10. Consolidate.
- **L7** Unbounded pagination: `lib/actions/user-admin.ts:59` (`pageSize` with no cap), `lib/actions/programme-crud.ts:55`, `lib/actions/questions.ts:87-89`. Add `z.coerce.number().int().min(1).max(100)`.
- **L8** `app/api/notifications/mark-seen/route.ts:24-36` accepts any `notificationId` string. Impact is confined to the caller's own seen-list, but validate against known prefixes.
- **L9** `app/api/notifications/route.ts:69` filters `tutorApplication` by `userId: auth.userId` (Clerk id) while `TutorApplication.userId` references `User.id` (`schema.prisma:1176-1177`) — that notification list is always empty. (Note: `NotificationSeen`, `Enrollment`, `LessonCompletion`, `SavedBook`, `*Submission` and `AssessmentAttempt` all reference `User.clerkId`, so the `auth.userId` usage there is correct.)

---

## Verified sound

- `app/api/webhooks/clerk/route.ts:18-38` — raw body read before parsing, secret required (fails closed with 500 when unset), svix `verify` enforced, 400 on failure, and replay handled by svix's timestamp tolerance. Role is never taken from webhook payloads.
- `app/api/users/me/theme/route.ts:39-44` — theme validated against an allow-list, update scoped to the session.
- `app/api/books/saved/[bookId]/route.ts` — `deleteMany` scoped by `userId` with a `count === 0` 404.
- `app/api/student/tutors/[id]/request/route.ts` — `studentId`/`studentName`/`studentEmail` taken from the session, not the body.
- `app/api/banners/active/route.ts` — `SPECIFIC`-scope banners withheld from callers without an `institutionId`, and the date filter is actually applied.
- `app/api/health/route.ts:14` — the only `$queryRaw` in the repo is the parameterised `` prisma.$queryRaw`SELECT 1` ``; there is no `$queryRawUnsafe`/`$executeRawUnsafe` and no interpolated SQL anywhere.
- `lib/actions/tutor-image.ts:29,44-53,95` — `requireAdmin()` on both actions, server-generated `publicId`, folder hard-coded in `lib/cloudinary.ts:15` (the 5 MB/`file.type` check trusts the client MIME, a hardening gap only).
- `lib/assessment/grader.ts` and `lib/grade-assessment.ts` — both recompute correctness from server-held keys and never accept client `isCorrect`/`pointsEarned`. The integrity failures are at the ingestion edges (C6, H1, H5, M4, M7), not in these functions.
- `lib/ai/context.ts` — loads only the caller's own row; no cross-user reads. `app/api/ai/chat/route.ts:99-102` coerces `role` to `user|assistant` and truncates content.
- `lib/orgs/lookup.ts`, `lib/clerk-org.ts`, `lib/retry.ts`, `lib/env.ts` — no secrets in responses; `CLERK_SECRET_KEY` read server-side only.
- `proxy.ts` — the `proxy` named export and `config.matcher` match the Next.js 16 file convention (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md:58`). Note `clerkMiddleware()` with no route protection only *populates* auth context; it does not gate any route, so every route/page must check for itself — which is exactly where C1-C4 and M1 bite.

---

## Remediation order

1. **C8** — rotate every committed credential (DB, Cloudinary, Upstash, Clerk test keys), then purge history.
2. **C1, C2, C3, C9** (role escalation + public admin endpoints) — one-request full takeover, partly unauthenticated.
3. **C5** (public mail relay), **C4** (student PII dump), **C6** (grading integrity).
4. **H3, H4, H5, H1, H2** — the exam engine is currently not enforceable: the key leaks before grading, attempts are not bound to assessments, and the timer/anti-cheat live only in the browser.
5. **H9, H10, C7** — the engine does not grade correctly for most question types, and manual grading always reports 100%. Consolidate on one grader (`lib/assessment/grader.ts`) and one answer-field contract.
6. **H6, H7, H8, M3, M5** — authorization and identity-binding hardening per route.
7. **H11, H12** — fix the lint crash so tests and build actually run in CI, then add proxy-level defence in depth.
8. **M1** — replace `requireAuth` with `getAuthUser` + explicit status codes across `app/api`; mechanical, and it removes ~40 masked failures.
9. **L3, L4, L5** — turn on `strictNullChecks` (incrementally per directory if needed), add negative authz tests, and stop swallowing migration failures.
