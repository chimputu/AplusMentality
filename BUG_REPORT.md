# Bug Report — A+ Mentality web app

Method: read-only walkthrough of the running app's code paths (all pages, components, API routes and server actions that a user actually touches), plus a production `next build` to catch compile-level breakage. Focus is on **functional bugs a user hits**, not the security findings (those are in `CODE_REVIEW.md`).

Build result: `next build` **compiled successfully** (10.6 min, Turbopack). TypeScript checking could not complete in this environment (`spawn EPERM` — a sandbox restriction on spawning, not an app error), so the items below are from source-level tracing rather than type errors.

Two root causes explain most of the breakage:
1. **User-id confusion.** Some relations are `User.clerkId`, others are `User.id` (schema has both patterns). Several routes write/query the wrong one — those calls violate a foreign key or silently match nothing.
2. **Dead routes.** Links point at `/results` (plural), `/student/tutors/[id]`, `/tutor/requests`, etc., which have no page files. Each is a 404.

---

## 1. Native assessments cannot be started at all (foreign-key violation)

`app/api/student/assessments/[id]/start/route.ts:117-123`

```ts
const attempt = await prisma.assessmentAttempt.create({
  data: {
    assessmentId: id,
    userId: student.id,      // ← wrong id space
    attemptNumber,
  },
});
```

`AssessmentAttempt.userId` references **`User.clerkId`** (`prisma/schema.prisma:931-932`):

```prisma
userId       String
user         User       @relation(fields: [userId], references: [clerkId], onDelete: Cascade)
```

`student` was loaded by `where: { clerkId: auth.userId }` (line 21), so `student.id` is the internal cuid. Every `POST /api/student/assessments/<id>/start` therefore fails the foreign key (P2003) and returns 500 — the student sees "Failed to start assessment".

Contrast the input validation in the same flow, which also reads from the wrong space:

`app/api/student/assessments/[id]/start/route.ts:34-41`
```ts
attempts: { where: { userId: student.id }, ... }      // matches nothing
overrides: { where: { userId: student.id } },          // matches nothing
```

So even if the create succeeded, attempt limits and per-student overrides would see zero prior attempts.

**Fix:** use one id consistently. `lib/actions/attempts.ts` already does it correctly (`userId: user.clerkId`, lines 75-305) — copy that, or change the relation to `User.id` everywhere and update all call sites in one go.

The same wrong id is written at:

| Location | Value written | Expected |
|---|---|---|
| `app/api/student/assessments/[id]/start/route.ts:120` | `student.id` | `clerkId` |
| `app/api/student/assessments/[id]/submit/route.ts:102` (FormResponse) | `student.id` | `clerkId` for `AssessmentAttempt`, but `User.id` for `FormResponse` (`schema.prisma:966-967`) — mixed |
| `app/api/ai/insights/route.ts:23` (read) | `student.id` | `clerkId` — so the AI insights page always sees "No attempts yet" |
| `app/api/student/assessments/[id]/submit/route.ts:122` (FormResponse) | `student.id` | correct for `FormResponse` here |

Note the inconsistency is *within* the same feature: `start/route.ts:35,39` read `student.id` while `course/[courseId]/page.tsx:114` reads `userId` (clerkId). One of the two is always wrong.

---

## 2. The native assessment runner never collects any answers

`app/(dashboard)/assessments/[id]/_components/assessment-runner.tsx:94-119`

```ts
const debouncedSave = useCallback((questionId: string, answer: any) => {
    ...
    await saveAnswer({ attemptId, questionId, ...answer });
```

`saveAnswer` is the server action in `lib/actions/attempts.ts:30-40,156-186`, and it stores answers into `attempt.answers` keyed by `questionId`, then grading reads `answers[q.id]` (line 226). That part is consistent.

The break is in what the UI can send:

- **Multiple choice / true–false** (`:227-250`) renders a hardcoded list of six options labelled `A. (Option A)`, `B. (Option B)` … It never reads `question.options`, and `getAssessmentForStudent` nulls that field anyway (`lib/actions/attempts.ts:94-97`, `options: null as any`). Students literally cannot see the answer choices — only the letters.
- **NUMERIC** sends `parseFloat(e.target.value)` (`:270`), so clearing the field sends `NaN`, which `z.number()` rejects (`lib/actions/attempts.ts:35`) → the save silently fails and shows "Failed to save answer".
- **IMAGE_CHOICE, FILE_UPLOAD and MATCHING** are in the `QuestionType` enum (`schema.prisma:103-113`) and can be authored in the admin form, but the runner renders **no input at all** for them — the question appears with no way to answer.
- The runner still hands `saveAnswer` `{ attemptId, questionId, ...answer }` where `answer` came from `handleAnswer(field, value)`; that is fine, but for MCQ the field is `selectedOptionId` **and** the value is the synthetic `opt-0` string, whereas the REST submit path grades on `selectedId` (see next item).

**Fix:** render from `question.options`, generate stable option ids at authoring time, add inputs for the remaining types (or restrict authoring), and coerce empty numeric input to `undefined` instead of `NaN`.

---

## 3. Two graders, two different answer field names — MCQ/TF is always marked wrong

`lib/grade-assessment.ts:12-17,54-66`

```ts
interface Answer { questionId: string; selectedId?: string | null; ... }

case 'MULTIPLE_CHOICE':
  if (answer?.selectedId === question.correctId) earned = question.points;
```

Nothing in the app ever produces `selectedId`. The runner sends `selectedOptionId` (`assessment-runner.tsx:242`), the server action stores `selectedOptionId` (`lib/actions/attempts.ts:172-178`), and the other grader reads `selectedOptionId`/`correctOptionId` (`lib/assessment/grader.ts:29,77`). So the REST path (`app/api/student/assessments/[id]/submit/route.ts:71` → `gradeAssessment`) gives **0 points for every multiple-choice and true/false question**, regardless of the answer.

Additionally, the admin question form never produces an option `id` at all:

`app/(dashboard)/admin/questions/components/question-form.tsx:70`
```ts
data.options = options.map((o, i) => ({ ...o, order: i }));   // {text, isCorrect, order} — no id
```
and `lib/actions/questions.ts:176` derives `correctId` from `input.options?.find(o => o.isCorrect)?.id`, which is therefore `undefined`. So the answer key for MCQ is usually `null` as well.

**Fix:** pick one contract (recommend `selectedOptionId` + `correctOptionId`), generate option ids when authoring, and delete the unused grader.

---

## 4. Wrong score type shown to students ("Score: 45%")

`components/StudentQuizList.tsx:76` and `components/StudentTestList.tsx:82`

```tsx
Score: {submission.score || 0}%
```

`submission.score` is stored as a raw mark (`/api/quizzes/submissions/[submissionId]/grade/route.ts:25` writes `parseInt(score)`, with `total` separately). Appending `%` to it tells a student who scored 45 out of 50 that they got **45%**. `score || 0` also renders a real 0 as "0%" and a `null` as "0%" indistinguishably.

**Fix:** compute `Math.round((score / total) * 100)` and guard `total > 0`, or show `score/total` — the result pages already do this correctly (`student/quizzes/[id]/result/page.tsx:141-143`).

---

## 5. Broken links — `/results` instead of `/result` (4 places)

The result routes are `app/(dashboard)/student/{quizzes,tests,assignments}/[id]/result/page.tsx` (singular), but these link to `/results`:

| File | Line |
|---|---|
| `components/StudentQuizList.tsx` | 95 |
| `components/StudentTestList.tsx` | 101 |
| `app/(dashboard)/student/quizzes/[id]/page.tsx` | 51 |
| `app/(dashboard)/student/tests/[id]/page.tsx` | 51 |

Every "View Results" link a student clicks after submitting a quiz or test lands on a 404. (Interestingly the *list* pages `student/quizzes/page.tsx:156` and `student/tests/page.tsx:162` get it right, as does `student/assignments/page.tsx:168` — only the components and detail pages are wrong.)

---

## 6. Tutor feature is mostly dead routes

Only two files exist under `app/(dashboard)/tutor/`:

```
app/(dashboard)/tutor/layout.tsx
app/(dashboard)/tutor/page.tsx
```

But `components/DashboardLayout.tsx:376-419` builds the entire tutor sidebar from routes that have no page:

| Sidebar link | Exists? |
|---|---|
| `/tutor/requests` | ❌ |
| `/tutor/specialties` | ❌ |
| `/tutor/offerings` | ❌ |
| `/tutor/reviews` | ❌ |
| `/tutor/settings` | ❌ |
| `/apply-as-tutor/status` | ❌ |

A TUTOR who logs in and clicks any sidebar item (other than Dashboard) gets a 404. `/apply-as-tutor/status` is additionally shown in the "Account" section of a *student's* sidebar (`:290`) and does not exist for them either.

---

## 7. Student → tutor discovery is a dead end

`app/(dashboard)/student/tutors/page.tsx:104`

```tsx
<Link href={`/student/tutors/${tutor.id}`}>
```

There is no `app/(dashboard)/student/tutors/[id]/` route — every tutor card is a 404, so there is no UI anywhere to open a tutor profile or send a request, even though the API for it exists (`app/api/student/tutors/[id]/request/route.ts`).

---

## 8. Quiz/test/assignment file submissions are silently discarded

The three submit buttons all do the same thing — upload the file, then send only the URL:

`components/QuizSubmitButton.tsx:34-47` (identical in `TestSubmitButton.tsx:34-47` and `AssignmentSubmitButton.tsx:34-47`)
```ts
const { url } = await uploadRes.json();
...
body: JSON.stringify({ fileUrl }),
```

But the receiving routes never read `fileUrl`:

`app/api/quizzes/[id]/submit/route.ts:13-14,43-53`
```ts
const { score, total, responseId } = body;      // fileUrl ignored
...
const submission = await prisma.quizSubmission.create({
  data: { quizId: id, userId, score: score || null, total: total || null, ... },
```

`QuizSubmission` has no file column (`schema.prisma:460-480`), and `AssignmentSubmission.fileUrl` exists (`:589`) but the assignment route ignores it too. Net effect: the student's uploaded answer is stored in Cloudinary but **the teacher never sees it**, and the submission row is created with `score: null, status: 'PENDING'` with nothing to grade.

**Fix:** include `fileUrl` in the accepted body and persist it (add the column to `QuizSubmission`/`TestSubmission`), or drop the upload UI.

---

## 9. Anti-cheat is written but never wired up

`hooks/useAntiCheat.ts` implements tab-switch counting, fullscreen-exit detection, copy/paste blocking and auto-submit — but a repo-wide search finds **no importer**; only its own definition matches. The runner (`assessment-runner.tsx`) does not use it and never sends `tabSwitches`/`violations`.

So `Assessment.proctored`, `maxTabSwitches`, `requireFullscreen`, `disableCopyPaste`, `requireCamera` are all inert: settable in the admin UI, displayed to students, and enforced nowhere. Proctoring a exam currently produces exactly the same experience as not proctoring it.

---

## 10. Quiz result data never matches the page that renders it

`app/(dashboard)/student/quizzes/[id]/result/page.tsx:49`
```ts
const submission = quiz.submissions[0];
```

The query at `:22-29` filters `where: { userId }` but has **no `orderBy`**, so with more than one submission row for the same student the "result" shown is whichever row Postgres returns first — it can differ between page loads. Same pattern in the test result page.

Also on that page, the "Review Quiz" link (`:178`) sends the student to the quiz page, which immediately bounces them back:

`app/(dashboard)/student/quizzes/[id]/page.tsx:41-58` returns the "You have already submitted this quiz" screen, whose only action links to the (broken, see #5) `/results`. A student who has submitted has **no way to view the quiz content again**.

---

## 11. Redirect loop / dead end for TUTOR sign-in

`app/(dashboard)/student/page.tsx:49-51`
```ts
if (!dbUser || dbUser.role !== 'STUDENT') {
  redirect('/admin');
}
```

Anyone who is not a STUDENT is sent to `/admin`, whose layout requires `ADMIN | SUPER_ADMIN` (`app/(dashboard)/admin/layout.tsx:12`) and therefore redirects to `/unauthorized`. A TUTOR (or LECTURER) who lands on `/student` — which is what `/dashboard` falls back to for unknown roles (`app/dashboard/page.tsx:28`) — ends at `/unauthorized` rather than their own dashboard.

**Fix:** switch on the role (`/admin`, `/tutor`, `/student`), as `/dashboard/page.tsx:21-22` already does.

---

## 12. Unreachable "already a verified tutor" redirect

`app/(dashboard)/apply-as-tutor/page.tsx:23-28`
```ts
if (u.role !== 'STUDENT') redirect('/unauthorized');

// Check if user is already a verified tutor
if (u.isVerifiedTutor) {
  redirect('/student');
}
```

Approving an application sets `role: 'TUTOR'` (`lib/actions/tutor-application.ts:466-497`), so a verified tutor always fails the line-23 check first and is sent to `/unauthorized`. The line-26 branch can only be reached by a STUDENT flagged `isVerifiedTutor`, which is the one case it was written to avoid. Dead logic that hides a real UX bug (verified tutors get "unauthorized" instead of their dashboard).

---

## 13. `/api/search` produces links to routes that don't exist

`app/api/search/route.ts:151-213` builds hrefs as `${prefix}/<section>` for every result type, e.g.:

```ts
...videos.map((v) => ({ ..., href: `${prefix}/videos` })),          // :159
...announcements.map((a) => ({ ..., href: `${prefix}/announcements` })),  // :151
```

- There is **no `/student/videos` route** (the videos page is `app/(dashboard)/student/videos/page.tsx`… which does exist — but no `video` *detail* page), so search results never deep-link into the individual item; the dropdown's item titles imply you are opening that item.
- `prefix` is `isAdmin ? '/admin' : '/student'` (`:21`), so for the new TUTOR role every hit points at `/student/...`, which redirects to `/unauthorized` (see #11).
- `content` is `v.description` / `a.description`, which are nullable (`schema.prisma:261`), so the dropdown renders `null` for items without a description.

---

## 14. Admin dashboard serializes data it never fetched

`app/(dashboard)/admin/page.tsx:83-97` selects courses with `_count: { modules, enrollments }` only — no `modules` or `enrollments` arrays. Then `:122-135` does:

```ts
modules: (Array.isArray(c.modules) ? c.modules : []).map((m: any) => ({ ... })),
enrollments: (Array.isArray(c.enrollments) ? c.enrollments : []).map((e: any) => ({ ... })),
```

Both are always empty, so the defensive mapping is dead code left over from the "lightweight query" optimisation (commit `f6a6a47`). Harmless today, but it will silently serve empty arrays if a future component expects them.

---

## 15. Retry layer retries non-retryable errors

`lib/prisma.ts:27-28`
```ts
const transientCodes = ['P1001', 'P1002', 'P1008', 'P1017', 'P2024', 'P2025', 'P2028', 'P2030', 'P2034'];
```

`P2025` is "record not found" — a deterministic result, not a transient failure. It is retried three times with 100/200 ms backoff before surfacing, so a genuine 404-shaped query costs ~300 ms extra. The keyword list at `:33-46` is also over-broad: `'pool'` and `'retry'` match substrings of unrelated error text.

Related: `app/api/enrollments/progress/route.ts:66-74` calls `enrollment.update` without first checking the student is enrolled; a missing enrollment surfaces as P2025 → three retries → generic 500 instead of a clear 404.

---

## 16. `isBest` set on attempts that still need manual grading

`app/api/student/assessments/[id]/submit/route.ts:109-114`
```ts
if (gradeResult.score !== null) {
  await prisma.assessmentAttempt.update({ where: { id: attemptId }, data: { isBest: true } });
}
```

`gradeAssessment` always accumulates a numeric `score` (`lib/grade-assessment.ts:89`), so this condition is always true — while the *stored* `score` is explicitly set to `null` when `needsManualGrading` (`submit/route.ts:88`). An all-essay attempt is therefore flagged as the student's best result before anyone has graded it.

---

## 17. Auth failures surface as 500s instead of 401s (~40 routes)

`requireAuth` signals failure with `redirect()` (`lib/auth.ts:10,26,32,55,70,122,130,135,141`), which throws `NEXT_REDIRECT`. Every route that wraps it in a `try` with a returning `catch` converts that into a server error:

`app/api/enrollments/route.ts:8` + `:111-125`, `app/api/courses/route.ts:30` + `:91-96`, `app/api/tests/route.ts:8` + `:…`, and the same shape in `quizzes`, `assignments`, `videos`, `modules`, `module`, `submissions`, `users/*`, `lecture-slides/[id]`, `users/promote/bulk`, and the three `*/submit` routes. A signed-out user hitting these gets `500 {"error":"Failed to fetch …"}` (and the internal `/sign-in` redirect target leaks into the response), which is also why the client-side error handling shows generic "an error occurred" alerts.

Recommended: use `getAuthUser()` in API routes and return explicit 401/403, or re-throw redirect errors in each `catch`.

---

## Also worth fixing (lower impact)

- `app/api/quizzes/[id]/submit/route.ts:47` and `app/api/tests/[id]/submit/route.ts:47` accept the **client-supplied `score`** verbatim (`{"score": 999999}`), while the three submit buttons never send one. So the score is both unauthentic *and* normally absent — the field should not exist.
- `app/api/tests/[id]/route.ts:12-33` and `app/api/quizzes/[id]/route.ts:12-33` return every student's submission (name, email, score, feedback) to any signed-in user, including the student whose own result page then only shows `submissions[0]`.
- `app/(dashboard)/student/courses/[courseId]/page.tsx:294` renders `Max {a.mode === 'NATIVE' ? 'native' : 'external'} assessment` — leftover placeholder text that reads "Max native assessment" to the student. It looks like it was meant to be `attemptsMax`.
- `components/StudentQuizList.tsx:108-114` renders `<a href={quiz.formUrl}>` where `formUrl` is nullable for quizzes that use an inline embed (`schema.prisma:434-435`), producing an empty link for those items.
- `app/(dashboard)/student/quizzes/[id]/result/page.tsx:190` uses an `ArrowLeft` icon rotated 180° for "View Form" — cosmetic, but the same "back arrow" idiom is used for a forward action elsewhere.
- `components/DashboardLayout.tsx:459` builds the "view all" URL from `role.toLowerCase()`, so a SUPER_ADMIN navigates to `/super_admin?search=…` (no such route). `:831` similarly labels every non-ADMIN role as "Student".

---

## Suggested fix order

1. **#1 + #3 + #2** — the native-assessment engine. Nothing in it works end to end today: attempts can't be created, answers can't all be entered, and MCQ is always scored zero.
2. **#8** — uploaded answers are thrown away; teachers are grading empty submissions.
3. **#5, #6, #7** — the click-paths that 404 (quiz/test results, the whole tutor sidebar, tutor profiles).
4. **#4, #10, #16** — wrong or nondeterministic results shown to students.
5. **#11, #12** — role routing for TUTOR accounts.
6. **#9, #13, #14, #15, #17** — unfinished features advertised in the UI (anti-cheat, deep links), and the error-path cleanups.
