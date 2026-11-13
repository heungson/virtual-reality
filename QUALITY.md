# Simulation quality

Use these criteria for the current desktop prototype. See README.md for the first version completion checks.

Assess the room from the perspective of a person who is familiar with an ordinary room and has never used this simulation. Check whether the person can identify the table, cup, and stand, understand the controls, and predict what happens when they walk, reach for the cup, or put it down.

| Criterion | Condition for success | Latest result |
| --- | --- | --- |
| Room load | Open the documented entry point. The room, table, cup, and stand are visible. | Passed in headless Edge. |
| Movement and keyboard look | Use the documented keys. The view moves and turns as commanded. | Passed in headless Edge. |
| Mouse look | Click the room in visible Edge. Move the mouse. The view turns. Press Esc to release the pointer. | Unverified. Headless Edge did not grant pointer lock. |
| Collision | Walk into a wall and the table. The player cannot pass through either. | Passed in headless Edge. |
| Cup pickup | Try from far away, then within reach. The cup stays on the table on the first attempt and moves with the player on the second. | Passed in headless Edge. |
| Cup placement | Put the cup on the stand and walk away. The cup stays on the stand and the completion status remains visible. | Passed in headless Edge. |
| Reset | Reset after placement. The player and cup return to their initial positions and the task is incomplete. | Passed in headless Edge. |
| Willingness to stay | After the cup task, record how many additional minutes first-time human users want to stay, including zero. Record their reasons and any optional time they choose to spend. Use the first human assessment as a baseline. Compare later results under similar conditions. | Unverified. No human session data. |

Baseline evidence is in [the prototype work record](work-logs/2026-11/2026-11-14-0055.md). The next quality check is mouse look in visible Edge. If it passes, check the full cup task with keyboard and mouse.

The baseline comes from browser checks and agent observation of screenshots. A human assessment of the experience remains unverified.
