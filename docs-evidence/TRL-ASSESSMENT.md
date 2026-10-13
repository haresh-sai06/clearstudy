# ClearStudy maturity assessment — 13 October 2026

Engineering self-assessment: **TRL 5**, advanced from the earlier TRL 4 planner. This is an application of the TRL framework to a browser-local revision workspace, not an independent certification or organizer determination.

NASA distinguishes component validation in a relevant environment at level 5 from a prototype demonstration at level 6. The environment must be defined and the assessment must be tied to demonstrated behavior. Sources: [TRL definitions](https://www.nasa.gov/pdf/458490main_TRL_Definitions.pdf), [assessment guidance](https://www.nasa.gov/reference/appendix-g-technology-assessment-insertion/).

## Defined scope and relevant environment

The critical components are a deterministic plan allocator, editable question bank, CSV ingestion, self-rated review scheduler, practice session, persistent timer, validated backup and offline application shell. They are integrated in one static application. The supported environment is a modern browser on a personal device, served over HTTPS (or localhost during testing), with local storage available. The app does not provide multi-user accounts, cloud sync, automated marking or AI answer generation.

The relevant engineering scenarios are ordinary study materials, a limited revision window, refresh or interruption during practice, repeated question-bank imports and temporary loss of the serving network. Synthetic computing questions were used; no real student participation was fabricated. Mobile checks used an emulated viewport, not a physical phone.

## Evidence

| Requirement | Demonstrated evidence |
| --- | --- |
| Exact 5–180 minute allocation and safe plan replacement | Core tests plus earlier public browser regression; old notes and completion survived the upgrade |
| Create and edit questions without uploading material | Actual browser-created computing question; local persistence; UI handler test |
| Import a real question CSV and prevent duplicates | Browser file-chooser import added 3 questions; repeat import added 0 and skipped 3, retaining prior review |
| Answer before reference reveal, then record an honest self-rating | Browser reveal and Good rating produced a scheduled next day and updated activity; offline Again rating scheduled 10 minutes |
| Resume interrupted work | Reload retained completed rating, active queue and typed draft answer; running focus timer continued from its deadline |
| Move the complete workspace | Browser downloaded and restored a real full backup; question count, history, queue, draft answer and original planner work were retained |
| Operate after losing the serving network | Owned preview server stopped; HTTP probe confirmed unreachability; cached app reloaded and recorded a rating |
| Small-screen usability | 390px viewport checks for planner, bank and study room found no horizontal overflow; visible non-file controls had labels |
| Deterministic edge-case handling | Automated checks exercise malformed CSV/backups, capacity, scheduling bounds, timer expiry, escaping, and actual UI handlers |

The checked-in tests are reproducible. Browser screenshots and the precise release commit are retained with the release report. Public deployment is verified separately after pushing the release.

The final automated suite has 28 passing tests and zero failures. Scaling is explicitly bounded: 20 planner topics, 500 questions, 500 retained recall attempts, 3 MB CSV ingestion, 32 MB full-backup ingestion and 180-minute planning/focus windows. These are application limits rather than a promise of available device storage. Typical short answers are the intended workload; very large banks may exhaust the browser quota. Such writes warn the user to export work rather than claiming it was saved. Full-bank capacity and atomic over-capacity rejection are tested at the domain layer; no 500-question browser latency benchmark is claimed.

## Remaining boundary

No independent reviewer, longitudinal study, physical-mobile validation, assistive-technology audit, measured learning benefit or routine operational use is claimed. Question reference answers come from the user. Ratings are subjective. Clock scheduling uses the device clock. Storage is local, may be cleared by the browser, and has finite quota; a warning asks for backup when writes fail. The most recent 500 recall attempts are retained.

## Next gate: TRL 6 demonstration

Run a documented pilot with consenting students using their own permitted course material on real desktop and mobile devices. Complete import → revision → interruption/recovery → next-day review → backup recovery. Record observed task completion, data-loss defects, confusion and browser/device versions. Fix material defects, repeat failed tasks, and obtain an independent review of the evidence before claiming the next level. Do not claim grade improvement from a short usability pilot.
