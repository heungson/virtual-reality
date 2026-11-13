# Project rules

## Rule 1: Prevent repeated mistakes

The AI agent must improve project rules and skills to prevent the same mistake from happening again.

When the agent finds a mistake or receives a correction:

1. Identify the cause of the mistake.
2. Correct the affected work.
3. Update the applicable rule or skill with a clear prevention step. If none applies, add a project rule or skill.
4. Check that the correction solves the problem and that the prevention step addresses the cause.
5. Report the correction and the rule or skill change.

Keep each change specific to the cause. Check for an existing rule before adding a new one. Project rules and skills must not conflict with higher-priority instructions.

## Rule 2: Define the goal and verification method before work

Before each task, the AI agent must state:

1. A clear goal that describes the required result.
2. The checks that will verify the result, including the conditions for completion.

At the end of the task, perform these checks and report the results. If a check cannot be completed, report the reason and what remains unverified.

## Rule 3: Focus on the task with the greatest impact

The AI agent must set task priorities based on their expected contribution to the project goal.

Before choosing the next task:

1. Compare the available tasks and their expected impact.
2. Select the task with the greatest impact that can be done within the agreed scope. If it depends on other work, complete the required work first.
3. State why the selected task has priority.

Focus on the selected task until it is complete or blocked. Review priorities when new information or user instructions change the expected impact.

## Rule 4: Use a limited daily work period

Work on the project each day within a planned time window. Start with a 15-minute window.

The daily start time is 09:00 Korea Standard Time. The user can also request a start. Check work-logs/README.md and the records for today before a scheduled start to avoid a second work period on the same date, unless the user requests an additional period.

Before each work period:

1. Record the start date and time in Korea Standard Time, the window length, and the planned end time in a new record under work-logs/.
2. Select the task with the greatest impact under Rule 3. Choose an amount of work that can be completed and checked within the window.
3. Record the goal, planned results, and verification method under Rule 2.
4. Check the available daily and weekly token limits and remaining allowance. Use available usage data or data supplied by the user. If this data is unavailable, record it as unknown. Do not invent a token balance.

During each work period:

- Check the time at task boundaries. Reserve time to verify the result and complete the work record.
- Finish the selected task and its checks within the window. Do not start work that cannot fit in the remaining time.
- Stop work when the window closes. If the goal is not complete, record the incomplete work and its cause. Do not report incomplete work as complete or extend the current window to hide a missed goal.

At the end of each work period, record:

- The actual end time and elapsed time.
- The results achieved compared with the planned results.
- The verification results and any incomplete work.
- Available token usage and remaining daily and weekly allowance, or an explicit note that the data is unknown.
- The next window length, planned amount of work, and reason for any change.

Adjust the next work period in small steps based on the results. Use a one-minute step for time changes unless the work record gives a reason for a different step.

If the goal was completed within the window, choose either a shorter window for the same amount of work or the same window for more work. Increase work only when available token data supports it. If token data is unknown, do not assume that more work is affordable; prefer a shorter window for the same amount of work.

Use daily and weekly token limits to decide whether to increase, reduce, or keep the same amount of work. If a goal was missed, reduce the next task scope or make a small change to the next window based on the cause and available token allowance. Record the decision.

## Rule 5: Improve rules and goals

The AI agent has authority to improve, add, or remove project rules and goals without asking for approval, except for the original ultimate goal:

> Create a virtual reality that simulates the human world.

The agent must not change, remove, or replace this ultimate goal. Changes to other goals and rules must support it and comply with higher-priority instructions.

For each change, record what changed and why, and update affected project files. The agent can resolve open project decisions under this authority. Record these as agent decisions, not as requirements supplied by the user.

## Rule 6: Git authority and project boundary

The AI agent has full authority to commit and push project changes when needed to `git@github.com:heungson/virtual-reality.git`. No separate approval is required.

Check the changes before committing. After a push, verify that the remote branch contains the commit.

The agent must not delete the whole local or remote repository.

All project work and file operations must stay inside `C:\Users\heung\OneDrive\문서\ChatGPT\VirtualReality`. Do not create or use work files, checkouts, or worktrees outside this directory. The authorized Git remote is the destination for pushes.

Rule 5 does not authorize the agent to remove or weaken these user limits.

## Work log management

Keep work logs in the work-logs/ folder. Use work-logs/README.md as the entry point for current settings, the latest record, and the file structure.

The AI agent can change how work logs are managed without asking for approval. Choose a structure that makes records easy to find and avoids reading unnecessary history. Preserve past records, record the reason for each structure change, and update affected links and scheduled instructions.

## Other project rules

- Use ASD-STE100 Simplified Technical English.
- Use the long-term goal in README.md to guide project decisions.
- Treat items listed as decisions still required as open questions until they are resolved and recorded under Rule 5 or by the user.
