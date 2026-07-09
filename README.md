# HeecoWorld — Learner Access, Progress, Search & Assessment-Code Patch

## Use this patch instead of the earlier learner patch

This package includes the learner features from the previous patch **plus** the missing teacher assessment-code flow.

## Copy into project root

Extract the ZIP into `C:\heecoworld` and allow files to replace existing files.

It replaces these existing files:

```text
app/my-learning/page.tsx
app/my-learning/assessments/[testId]/page.tsx
app/school-dashboard/schools/[schoolId]/assessments/page.tsx
app/school-dashboard/schools/[schoolId]/assessments/[testId]/page.tsx
app/api/learner-assessments/route.ts
app/api/learner-assessments/[testId]/route.ts
app/api/learner-assessments/[testId]/start/route.ts
```

It also adds:

```text
app/my-learning/progress/page.tsx
app/api/school-portal/assessments/[testId]/access-code/route.ts
```

## What changed

- Matching learners still see relevant tests automatically.
- Learners search/filter available tests and have separate **Available tests**, **Completed**, and **Progress** views.
- A learner must enter the assessment code only when starting the first attempt.
- Teachers see the assessment code immediately after publishing in the test editor, with a **Copy code** button.
- Teachers and school admins can open **Assessment code** from the published-test dashboard and copy it. The route verifies active school membership and the test's school before returning the code.
- No public assessment URL is used or displayed.

## Required prior file

This patch uses the results-access helper already installed by the teacher/school-admin results bundle:

```text
lib/schoolAssessmentResultsAccess.ts
```

## Build

```bash
npm run build
```

## QA checklist

1. Publish a draft test as its teacher. Confirm the editor shows **Assessment code** immediately.
2. Refresh the editor. Confirm the same code remains visible.
3. Return to **My Assessments**. On the published test, click **Assessment code**, then **Copy**.
4. As school admin, open the school assessment workspace and confirm the published test can also reveal its code.
5. As matching learner, confirm the card stays visible in **Available tests**.
6. Press **Start assessment**. Wrong code must fail; correct code must start the one permitted attempt.
7. Refresh midway and confirm Resume works. Submit and confirm the card moves to **Completed** and appears in **Progress**.
