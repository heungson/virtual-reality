# Project tools

## Verify Cup Room in Edge

Run these commands from the project directory. The tool was tested with Node.js 24 and Microsoft Edge on Windows. It requires no npm packages. Set `CUP_TEST_EDGE` to the full path of the Edge executable if Edge is installed outside its default location. The tool uses a temporary browser profile in the project Git directory and a local debugging connection.

| Command | Checks |
| --- | --- |
| `node tools/verify-cup.mjs` | Cup release and pickup on the table, stand, and floor. Original cup task, Reset, and recovery and Reset visibility at 800 × 480. |
| `node tools/verify-cup.mjs --connected` | All base checks, plus doorway movement, divider collision, and cup continuity between rooms. |
| `node tools/verify-cup.mjs --resident` | All connected checks, plus the resident's routine, interaction range, pause, resume, and Reset. |
| `node tools/verify-cup.mjs --journey` | Keyboard-only journey from the initial spawn. Complete the cup task, carry the cup into the second room, greet the resident, and reset. This mode sends input and reads state without changing it directly. |

Use both `--resident` and `--journey` in separate runs for a full check. The first run uses preset positions for repeatable cases. The journey uses normal keyboard actions. These are automated checks. They do not measure first-time human experience, willingness to stay, or headset behavior.

Expect a PASS message for each group and confirmation that test Edge exited and its temporary profile was removed. If a run fails or stops early, check for an Edge process with the project-specific `cup-test-` profile and close only that test instance. The delivery verification role maintains this tool.

## Session closeout

Run the closeout validator with the work record path before closing a session. Run it with the latest-record option before dispatching the next team.

Use the dispatch check below before starting a new work session. It also checks the management report, the next planning review threshold, and the total session limit. If a review is due, assign the planning agent and record its report before running the check again.

    node tools/verify-closeout.mjs --before-session

    node tools/verify-closeout.mjs --latest

The repository Git hook rejects invalid staged session closeouts. It is active in this checkout. Activate it in a new checkout with:

    git config --local core.hooksPath .githooks

The Codex Stop hook requests a correction if the latest record fails. Trust the hook through Codex before use. The checks verify fields and arithmetic. The coordinator must verify evidence and assess the quality of the management review.
