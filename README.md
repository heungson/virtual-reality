# VirtualReality

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

## Decisions still required

- Select the tools for the first prototype and record how to run it.
- Set device and resource limits before adding headset support or more simulation features.

## Check Codex CLI usage limits

Run this command from the project directory with Node.js and Codex CLI on PATH. Sign in to Codex CLI with ChatGPT.

```powershell
node tools/codex-limits.mjs
```

The tool returns JSON with the reported quota windows, percentages used and remaining, and reset times in UTC. A window of 10,080 minutes is one week. Use the reported windows when planning work. Treat missing windows and exact remaining token counts as unknown.

The tool uses the [Codex app-server rate limit request](https://learn.chatgpt.com/docs/app-server#6-rate-limits-chatgpt). It does not start a model turn. If the request fails or returns no windows, the tool prints an error and exits with code 1.
