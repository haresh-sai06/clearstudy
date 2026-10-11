# ClearStudy

A browser-local study planner for a short revision window. Add topics, set importance and confidence, and generate an exact time allocation. Follow read/recall/check steps, write notes, mark progress and download or restore a JSON backup.

## Run

Use a static HTTP server to serve `dist/`. For example: `python -m http.server 8742 --directory dist --bind 127.0.0.1`. Open http://127.0.0.1:8742/. ES modules need HTTP; opening index.html directly as a file is not supported.

Run `npm test` or `node --test tests/*.test.mjs`. No npm dependencies or installation are required. Tests use Node 18+.

## How it works

Topics receive importance × (4 − confidence) as a priority score. Each selected topic receives at least five minutes; remaining minutes are distributed proportionally. A short window defers lower-priority topics. Ties preserve input order. Every valid plan uses the exact requested whole-minute budget.

Progress and notes use localStorage on this origin. They do not sync between devices or between the local and hosted origins. JSON restore validates the data before replacing current state. Browser storage errors display a warning and users can download a backup. Use a private device for personal notes.

## Scope and honesty

Fresh project created October 11, 2026 for the Hyperbloom October backup opportunity. No existing application source reused, no cross-submission. AI assistance was used extensively for design, code, testing and documentation. The app has no runtime AI model; allocation is a transparent deterministic rule. It does not generate educational answers, predict exam questions, assess mastery or guarantee grades. No user study or educational outcome claim is made. Example topic names are illustrative.

Labels, keyboard focus, a skip link, status announcements, responsive layout and text explanations are supplied. Accessibility is a design goal, not a certification. Buildless HTML/CSS/JavaScript with no third-party fonts, analytics or external requests. MIT license.
