# Simulation quality

## Progress toward the ultimate goal

The goal is to create a virtual reality that simulates the human world. Assess each scenario against what a person would expect in a similar real setting. Use the following criteria to choose milestones. Each milestone tests a bounded part of the goal.

| Criterion | Observable check | Current evidence |
| --- | --- | --- |
| Physical behavior | Use the same physical rule in different situations. For example, release an object over a table and over open floor. It settles on the surface below it. | Cup Room has collision and fixed placement checks. General object behavior is unverified. |
| Continuity | Change an object, leave the area, and return. Its state reflects what happened while the user was away. | Cup placement persists while the player walks in the room. Continuity across areas is unverified. |
| Human activity | Complete a familiar activity by more than one reasonable sequence. The world responds consistently and shows the consequences. | One scripted cup task works. Multiple valid sequences are unverified. |
| Social behavior | Observe a simulated person pursue a routine. Interrupt it. Check that their response fits the situation and their knowledge. | No evidence yet. |
| Connected places | Carry an object from one place to another. Check that the same rules apply and that both places retain the effects of the action. | Only one room exists. |
| Human experience | Observe first-time users. Record where their actions match real-world expectations, where they need help, and whether they choose to stay or explore. | Browser checks exist. Human evidence is unavailable. |

### Next milestone

Make the cup behave consistently on the table, stand, and floor. Use one rule for releasing it. Check that it settles on the correct surface, can be picked up again, and remains where it settled when the player walks away and returns. Keep the existing cup task and reset checks. Record browser results separately from any human observations.

This milestone addresses physical behavior first. A shared rule for a familiar object gives later rooms and activities behavior that can be tested in more than one setting.

## Cup Room regression checks

Use these criteria for the current desktop prototype. See README.md for the first version completion checks.

Assess the room from the perspective of a person who is familiar with an ordinary room and has never used this simulation. Check whether the person can identify the table, cup, and stand, understand the controls, and predict what happens when they walk, reach for the cup, or put it down.

| Criterion | Condition for success | Latest result |
| --- | --- | --- |
| Room load | Open the documented entry point. The room, table, cup, and stand are visible. | Passed in headless Edge. |
| Movement and keyboard look | Use the documented keys. The view moves and turns as commanded. | Passed in headless Edge. |
| Mouse look | Click the room in visible Edge. Move the mouse. The view turns. Press Esc to release the pointer. | Passed with browser automation in visible Edge 157. |
| Controls and status visibility | At desktop viewport sizes 800 × 480, 960 × 640, and 1280 × 720, the room, instructions, task status, and Reset button are visible without scrolling. | Passed with browser automation in visible Edge 157. |
| Keyboard access in a narrow viewport | Tab to the room, trigger a recovery message, tab to Reset, and press Enter. The focus outline is visible and there is no horizontal scrolling. | Passed in Edge at a 400 × 240 CSS viewport with 2× display scale. Native 200% browser zoom remains unverified. |
| Collision | Walk into a wall and the table. The player cannot pass through either. | Passed in headless Edge. |
| Cup pickup | Try from far away, then within reach. The cup stays on the table on the first attempt and moves with the player on the second. | Passed in headless Edge. |
| Cup placement | Put the cup on the stand and walk away. The cup stays on the stand and the completion status remains visible. | Passed in headless Edge. |
| Recovery after a failed action | Try pickup and placement from too far away, then while facing away within reach. The message identifies the correction and tells the user which key to press again. | All four cases passed in an automated rehearsal in visible Edge. |
| Reset | Reset after placement. The player and cup return to their initial positions and the task is incomplete. | Passed in headless Edge. |
| Willingness to stay | After the cup task, let first-time human users continue or leave. Record voluntary active time, including zero, separately from any time or reasons they volunteer. Use the first human assessment as a baseline. Compare later results under similar conditions. | Unverified. No human session data. |

Baseline evidence is in [the prototype work record](work-logs/2026-11/2026-11-14-0055.md). The full cup task and reset also passed with keyboard and mouse in [visible Edge](work-logs/2026-11/2026-11-14-0110.md).

The baseline comes from browser checks and agent observation of screenshots. A human assessment of the experience remains unverified.

## First human assessment

Use the [human assessment record](HUMAN-ASSESSMENT.md).

Use a desktop browser with a keyboard and mouse. Give the participant this task: put the cup on the yellow stand. Let the participant use the instructions on the page. Record any help the participant needs.

- Record whether the participant can identify the cup and stand, find the controls, and complete the task. Record where the participant hesitates or gets a result they did not expect.
- Explain what will be observed before the test and let the participant choose whether to take part. After the task, let them continue or leave freely. Record optional active time, including zero. If the test ends before they choose to leave, record that limit.
- Note optional actions such as exploring or restarting. Consider other causes such as confusion, idle time, or interruption before using an action as evidence of interest. Record any comments or desired extra time that the participant volunteers separately.
- Record the prototype version, browser, and input devices. Use similar conditions for later comparisons.
