# TRL 6 demonstration plan

Status: **prepared for later**, as requested by the user on 13 October 2026. Current engineering self-assessment remains TRL 5. The engineering agent's course-material checks are not student feedback.

NASA's software TRL 6 description calls for prototype demonstration on full-scale realistic problems and documented performance. We apply that to a real revision workflow, with the following acceptance criteria. [Definition](https://www.nasa.gov/pdf/458490main_TRL_Definitions.pdf).

## Intended demonstration

Use consenting students' own permitted course materials on a real desktop/laptop and a real phone. Complete a 15-minute revision block, an interruption/recovery, a next-day review, and a backup recovery. The private local pilot deck contains 30 Part-A Quantum Computing questions across three modules; course content is not published in the repository.

1. Record date, device/browser and an anonymous participant code. Capture participation consent without putting names or contact details in public evidence.
2. Export an existing full backup before changing the workspace. Import the private pilot CSV; verify the count and a reference answer. References are short plain-English drafts for recall, not complete 16-mark solutions.
3. Create a plan with topic names matching the deck. Use **Practise this topic**. Attempt at least five answers before revealing and rating them.
4. Start the focus timer. Type a draft, reload, and check that the draft, active topic, queue and timer remain correct.
5. After a successful online load, disconnect the device temporarily and check cached reload and practice. Reconnect afterwards.
6. Download a full backup. Restore it in a separate browser profile/device, accepting replacement only after preserving existing data. Verify counts, notes, ratings and active session.
7. Complete the local **Download session report** feedback fields. Automatic counts and self-reported usability remain separate; the report excludes question text and written answers.
8. Return on the next day; verify scheduled questions are due at the expected time. Record defects, confusion and whether another person's help was required.

## Acceptance criteria

- Both device classes complete import, practice, recovery and report export without losing saved work.
- Saved time allocation equals the chosen budget; the queue matches the selected topic and retains progress after interruption.
- The export/restore roundtrip preserves actual user state. No critical data-loss defect remains unresolved.
- Offline use succeeds after cache installation; first-load offline use is not promised.
- Reported problems are reproduced, fixed and retested where possible.
- An independent reviewer examines the evidence against this protocol. No grade improvement is inferred from a short usability test.

Record observed outcomes rather than marking a step passed because it was attempted. One failed mandatory criterion keeps the next level pending. Archive the release commit, browser/device versions, anonymized reports, screenshots and defect resolutions. Keep course materials and private backups local.

## Engineering preparation completed

The 0.3 release adds paginated rendering at the 500-question limit, stale-tab write detection, persistent active-topic selection, and local reports with private content omitted. Automated tests cover these behaviors. Browser checks use a 500-question synthetic workload and a private 30-question course deck. These checks improve readiness, but do not replace a consenting student demonstration.

Stale-tab detection is an optimistic snapshot check. It protects demonstrated sequential conflicting edits; it is not a multi-user transaction database and does not guarantee conflict-free simultaneous writes. The app remains a personal-device workspace.
