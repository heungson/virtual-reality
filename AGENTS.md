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
4. Run `node tools/codex-limits.mjs` to check the available quota windows. Record the remaining percentages and reset times. If a window or exact token count is unavailable, record it as unknown.
5. Estimate the time for the task and its checks. Compare the estimate with the window and the available quota. If the task is likely to finish much earlier, add a useful result or list the next useful step to do if time and quota permit. Reserve time for checks and the work record.

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

Before closing the record, compare actual time with the estimate. Record the elapsed time, the unused time, and the percentage of the window used. Assess whether the results justified ending the session when it did. Explain the cause of a large difference and identify useful work that could have fit in the remaining time, or explain why none could fit.

Before starting, record the next useful step and how to verify it. If the plan depends on a person, tool, or other condition outside the agent's control, also record a fallback that can proceed without it. Estimate the time for the fallback and its checks.

When a session ends with substantial time unused, record one specific change to improve time use in the next session. Name the additional result and its check, or explain why a shorter window is better. Compare the next session's result with this plan.

If the goal is complete early or a required condition is unavailable, check the remaining time and quota. Start the next useful step or fallback if it can be completed and checked before the deadline. Before ending early, record the work considered and the specific reason it could not proceed. Use the assessment to set the next window, goal, and checks.

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

## Rule 7: Decide without questions and follow user instructions

Do not ask the user questions. Use available evidence and project goals to make decisions within the authority given to the agent. When information is missing, make a reasonable assumption and record it. If work cannot proceed, report the reason without asking a question, and continue other useful work when possible.

Respect and follow instructions from the user. Apply new instructions to the current work and update affected plans and rules. Agent decisions and assumptions must not override user instructions. Higher-priority instructions still apply.

## Rule 8: Use subagents for parallel work

The AI agent can assign tasks to multiple subagents and run them in parallel without asking for approval. Use this method when separate tasks can advance the selected goal within the available time and token allowance.

Give each subagent a clear goal, scope, verification method, and deadline. All subagents must follow the project rules and stay inside the project directory.

Assign separate file ownership when subagents edit files. Coordinate shared changes to prevent conflicting edits. Assign any code integration or review to a subagent. The main agent must verify the combined result under Rule 9 and record each subagent's contribution in the work period record.

Subagent work shares the same work window and token allowance. Reserve time to combine and verify results before the window closes. Use fewer subagents when coordination or token costs exceed the expected benefit.

## Rule 9: Assign all code work to subagents

Only subagents can read or write code. Assign all code inspection, review, implementation, and changes to subagents. The agent that communicates with the user must not read or write code, including code in diffs.

The agent that communicates with the user verifies the result. Use observable behavior, test results, and reports from subagents to check the completion conditions. If a check requires reading or changing code, assign it to a subagent and verify the reported result.

## Rule 10: Respect compute limits

Compute resources are limited. Before work that uses significant compute, check the available quota, time, and applicable CPU, memory, GPU, or storage limits. Record unknown limits as unknown.

Use the smallest workload that can produce and verify the required result. Limit parallel work to tasks that benefit from it. Reuse valid results and stop processes that are no longer necessary. If work approaches a limit, reduce the scope or defer the remaining work. Record any limit that affects the result.

## Rule 11: Assess and improve simulation quality

Use QUALITY.md to find the criteria catalog and latest quality assessment. Give each criterion a stable ID, an observable check, and a condition for success. Keep dated evidence separate from the catalog. Record the tested build, criteria revision, results, and limits.

Use the ultimate goal in README.md to define criteria for the simulated world. Link each simulation milestone to a gap in those criteria and specify the evidence that will show progress. Keep prototype regression checks separate. Record the reason for changes to the criteria or milestones.

Assess quality from the perspective of a typical human user. For each scenario, describe what a person with no prior knowledge of the simulation would expect to see, understand, and do. Compare the experience with ordinary human experience in a similar real setting. Record assumptions about the user. Identify which results come from human observation and which come from automated checks or agent judgment.

Include how much longer human users want to stay when the required part of the session ends. Record the additional time they say they want, including zero, and their reasons if they give them. If users can choose to stay longer, record that time separately. Treat the result as one part of quality. Mark it as unverified until human users take part.

Improve how the simulation gets feedback from voluntary user behavior without asking users for feedback. Use observable actions such as choosing to stay, exploring, restarting, or leaving. Explain what is measured and respect the user's choice to take part. Collect only the information needed for the assessment. Record what each action could indicate and other possible causes. Keep observed behavior separate from comments users volunteer. Check that changes to feedback collection preserve the user's ability to leave freely.

Assess the current simulation before choosing a quality improvement. Give priority to the issue that most affects the project goal. After the change, repeat the affected checks and compare the results. Keep checks for behavior that must continue to work.

Review the criteria when a check misses a defect or the simulation gains a new feature. Record why each criterion changes. Preserve the basis for comparing results over time.

## Rule 12: Close test applications after verification

Track the applications, browser windows and tabs, and background processes opened for testing. Include those opened by subagents. When verification ends, close them and check that they are closed. Close only the instances or tabs opened for the test. Record the closure check and any cleanup that could not be completed in the work log.

## Rule 13: Plan for document growth

Before creating or changing a recurring record, consider how it will work after 10,000 and 1,000,000 updates. Record how to find current information, add a record, find old evidence, and migrate without losing history. Keep current summaries small and use stable IDs for references. Group or index history so routine work does not require reading all records. Measure lookup and update costs before changing storage.

## Rule 14: Plan across three session ranges

Maintain short-, mid-, and long-term goals at the same time. Use about 2 to 3, 10, and 100 sessions as initial planning estimates. Adjust each estimate as the work, evidence, and available resources change. Keep the current goals and estimates in GOALS.md. Give each goal a completion condition and link it to the next longer goal or the ultimate goal. Link the next work session to a short-term goal.

Review all three goals before choosing a session task and after checking the results. Use current progress, quality evidence, time, and compute limits to decide whether to revise the goals or their estimates. Use the completion conditions to decide when a goal is complete. Record what changed and why in the work log. Keep completed goals and past revisions available through the work logs and Git history. Preserve the original ultimate goal under Rule 5.

## Rule 15: Organize teams and assign roles

Organize one or more subagent teams when this will help complete the session goal more efficiently. Give each team a specific result. Assign every member a role with a clear responsibility, scope, expected result, and check. Choose roles to match the work, such as implementation, testing, or evidence review.

The agent that communicates with the user coordinates the teams and verifies the combined result under Rule 9. Identify work that must happen in order. Assign separate ownership when members edit files, and specify who gives each result to the next member.

Use the smallest team structure that fits the work and available compute. Record roles and contributions in the work log. After the work, use the results and time spent on coordination to decide whether to keep or change the team structure.

## Work log management

Keep work logs in the work-logs/ folder. Use work-logs/README.md as the entry point for current settings, the latest record, and the file structure.

The AI agent can change how work logs are managed without asking for approval. Choose a structure that makes records easy to find and avoids reading unnecessary history. Preserve past records, record the reason for each structure change, and update affected links and scheduled instructions.

## Other project rules

- Use ASD-STE100 Simplified Technical English.
- Use the long-term goal in README.md to guide project decisions.
- Treat items listed as decisions still required as open questions until they are resolved and recorded under Rule 5 or by the user.
