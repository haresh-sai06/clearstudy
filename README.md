# ClearStudy

A browser-local revision workspace: plan your time, build an editable question bank, answer from memory, reveal a reference answer and schedule your next review. A focus timer, activity dashboard and full backups make the workflow resumable.

Live demo: https://haresh-sai06.github.io/clearstudy/

## Version 0.2

- Up to 500 questions, manual editing and quoted/multiline CSV import with duplicate detection.
- Due or whole-bank practice, topic filters, reference reveal and self-rated recall.
- Transparent review intervals, seven-day activity and questions needing another look.
- Focus clock, active queue and draft answers survive reloads.
- Full JSON export/restore includes plans, questions, history and timer; older planner backups remain supported.
- Offline application cache after a successful first online load.

See [architecture](docs-evidence/ARCHITECTURE.md) and the evidence-based [TRL self-assessment](docs-evidence/TRL-ASSESSMENT.md).

## Version 0.3 pilot preparation

Full banks now render 12 cards per page. Stale tabs detect a newer save and warn before overwriting it. A selected topic survives session reload, with the filter locked during unfinished practice. Download a local session report with progress counts and optional usability feedback; question text and written answers are excluded. No telemetry or report upload is added.

The [TRL6 pilot protocol](docs-evidence/TRL6-PILOT.md) is ready. The user deferred the real-user trial; engineering self-assessment remains TRL5 until the documented demonstration and review are complete.

## Run

Use a static HTTP server to serve `dist/`. For example: `python -m http.server 8742 --directory dist --bind 127.0.0.1`. Open http://127.0.0.1:8742/. ES modules need HTTP; opening index.html directly as a file is not supported.

Run `npm ci`, then `npm test` or `node --test tests/*.test.mjs`. Runtime has no dependencies. The interface test uses pinned jsdom as a development dependency and emulates modal opening/closing; it does not prove browser rendering. Node 24.19+ is used for the full suite. Core tests alone need no dependency installation: `node --test tests/core.test.mjs`.

## How it works

Topics receive importance × (4 − confidence) as a priority score. Each selected topic receives at least five minutes; remaining minutes are distributed proportionally. A short window defers lower-priority topics. Ties preserve input order. Every valid plan uses the exact requested whole-minute budget.

Progress and notes use localStorage on this origin. They do not sync between devices or between the local and hosted origins. JSON restore validates all included records before prompting to replace current state. The most recent 500 recall attempts are retained. Import your CSV with the header `topic,question,answer`; quote fields containing commas, quotes or newlines. Repeating an import skips identical topic/question pairs. A template is available in Question bank. Browser storage errors display a warning and users can download a backup. Use a private device for personal notes.

Topic/time edits stay in a separate draft until you make a plan. They do not erase saved notes or completion. Rebuilding unchanged settings preserves progress; replacing a changed plan that has notes or completion requires confirmation. Restoring a backup also requires confirmation. Full backups include the question bank, self-ratings, active session and focus timer alongside the saved plan. They exclude unapplied edits. Older plan-only backups leave the question bank unchanged. Reload discards unapplied edits and restores saved settings.

## Scope and honesty

Fresh project created October 11, 2026 for the Hyperbloom October backup opportunity. No existing application source reused, no cross-submission. AI assistance was used extensively for design, code, testing and documentation. The app has no runtime AI model; allocation and review intervals are transparent deterministic rules. Recall ratings are selected by the user. It does not generate educational answers, predict exam questions, assess mastery or guarantee grades. No user study or educational outcome claim is made. Example topic names are illustrative.

Labels, keyboard focus, a skip link, status announcements, responsive layout and text explanations are supplied. Accessibility is a design goal, not a certification. Buildless HTML/CSS/JavaScript with no third-party fonts, analytics or external requests. MIT license.
