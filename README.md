# VirtualReality

## Codex end-of-work review

When Codex first attempts to finish a turn, the project Stop hook requires one more pass. It directs the agent to read AGENTS.md and GOALS.md, compare the result with the applicable rules and goals, and report unresolved checks. The next stop can proceed.

Use Codex with Git and Node.js on PATH. Trust the project and review the hook with `/hooks` in the CLI or **Settings > Hooks** in the desktop app. Codex skips the hook until it is trusted. The hook can require another pass. It cannot prove that the agent completed the review. See the [Codex hook documentation](https://learn.chatgpt.com/docs/hooks).

## Ultimate goal

Create a virtual reality that simulates the human world.

This is the original ultimate goal. The AI agent must preserve it. Under Rule 5 in AGENTS.md, the agent can improve, add, or remove other goals and project rules to support it.

## First version

Build a small 3D room where one person can complete an everyday task. The first user is a project tester who checks that movement, object interaction, and world state work together.

The tester starts in the room, walks to a table, picks up a cup, and puts it on a marked surface. Start with keyboard and mouse controls on a desktop. Keep the controls separate from the simulation logic so a later version can use a headset. The room, one cup, and this task define the scope of the first version.

The first version is complete when these checks pass:

1. Start the simulation. Confirm that the tester starts inside the room and can walk and look around.
2. Walk into a wall and into the table. Confirm that neither can be passed through.
3. Try to pick up the cup from across the room. Confirm that it stays on the table. Move within reach and pick it up. Confirm that it moves with the tester.
4. Put the cup on the marked surface. Confirm that it stays there when the tester moves away and that the simulation reports task completion.
5. Restart the simulation. Confirm that the tester and cup return to their initial positions and that the task is incomplete.

The agent selected this scope during the first work session. The cup task gives the project a small test of how human actions change the state of a simulated world.

## Run the prototype

Open `prototype/index.html` in a desktop browser. The prototype uses HTML, JavaScript, and Canvas 2D to draw the 3D room. It needs no server or package installation.

1. Click the room to focus it and enable mouse look. You can also use Tab to focus the room and the arrow keys to look.
2. Use W, A, S, and D to walk.
3. Move close to the cup and face it. Press E to pick it up.
4. Move close to the yellow stand and face it. Press E to put the cup on it. The status below the room reports completion.
   To release the cup freely, press R while holding it. It settles on the table, stand, or floor one meter ahead. Move within reach and press E to pick it up again.
5. Press Esc to release the mouse. Select **Reset room** to start again.

## Decisions still required

- Set device and resource limits before adding headset support or more simulation features.

## Check Codex CLI usage limits

Run this command from the project directory with Node.js and Codex CLI on PATH. Sign in to Codex CLI with ChatGPT.

```powershell
node tools/codex-limits.mjs
```

The tool returns JSON with the reported quota windows, percentages used and remaining, and reset times in UTC. A window of 10,080 minutes is one week. Use the reported windows when planning work. Treat missing windows and exact remaining token counts as unknown.

The tool uses the [Codex app-server rate limit request](https://learn.chatgpt.com/docs/app-server#6-rate-limits-chatgpt). It does not start a model turn. If the request fails or returns no windows, the tool prints an error and exits with code 1.
