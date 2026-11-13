# Simulation quality

Use these criteria for the current desktop prototype. See README.md for the first version completion checks.

Assess the room from the perspective of a person who is familiar with an ordinary room and has never used this simulation. Check whether the person can identify the table, cup, and stand, understand the controls, and predict what happens when they walk, reach for the cup, or put it down.

| Criterion | Condition for success | Latest result |
| --- | --- | --- |
| Room load | Open the documented entry point. The room, table, cup, and stand are visible. | Passed in headless Edge. |
| Movement and keyboard look | Use the documented keys. The view moves and turns as commanded. | Passed in headless Edge. |
| Mouse look | Click the room in visible Edge. Move the mouse. The view turns. Press Esc to release the pointer. | Passed with browser automation in visible Edge 157. |
| Controls and status visibility | At desktop viewport sizes 800 × 480, 960 × 640, and 1280 × 720, the room, instructions, task status, and Reset button are visible without scrolling. | Passed with browser automation in visible Edge 157. |
| Collision | Walk into a wall and the table. The player cannot pass through either. | Passed in headless Edge. |
| Cup pickup | Try from far away, then within reach. The cup stays on the table on the first attempt and moves with the player on the second. | Passed in headless Edge. |
| Cup placement | Put the cup on the stand and walk away. The cup stays on the stand and the completion status remains visible. | Passed in headless Edge. |
| Reset | Reset after placement. The player and cup return to their initial positions and the task is incomplete. | Passed in headless Edge. |
| Willingness to stay | After the cup task, record how many additional minutes first-time human users want to stay, including zero. Record their reasons and any optional time they choose to spend. Use the first human assessment as a baseline. Compare later results under similar conditions. | Unverified. No human session data. |

Baseline evidence is in [the prototype work record](work-logs/2026-11/2026-11-14-0055.md). The full cup task and reset also passed with keyboard and mouse in [visible Edge](work-logs/2026-11/2026-11-14-0110.md).

The baseline comes from browser checks and agent observation of screenshots. A human assessment of the experience remains unverified.

## First human assessment

Use a desktop browser with a keyboard and mouse. Give the participant this task: put the cup on the yellow stand. Let the participant use the instructions on the page. Record any help the participant needs.

- Record whether the participant can identify the cup and stand, find the controls, and complete the task. Record where the participant hesitates or gets a result they did not expect.
- After the task, record how many more minutes the participant wants to stay, including zero. If they give a reason, record it in their own words.
- Let the participant choose whether to continue or leave. Record actual optional time separately. If the test ends before they choose to leave, record that limit.
- Record the prototype version, browser, and input devices. Use similar conditions for later comparisons.
