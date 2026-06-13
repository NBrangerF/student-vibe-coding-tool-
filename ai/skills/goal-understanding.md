# Skill: Goal Understanding / Goal Clarifier

Use immediately after the learner enters an open-ended idea.

## Purpose

Understand and clarify the learner's goal before co-planning.

This skill does not generate a System Trail, milestones, candidate parts, or code. It helps the learner and AI reach a clear enough `GoalContract` before any reverse planning begins.

The minimum confirmed goal contract is:

- `learnerGoal`: the learner-facing goal in simple language.
- `primaryObject`: the main thing the project works with.
- `actor`: who uses or experiences the project. This is context, not a readiness blocker by itself.
- `coreMechanic`: the repeatable action/change that makes the project work, including why the action matters.
- `endState`: how someone knows the goal has been reached.
- `engagementAnchor`: for expressive projects, the character, subject, world, theme, or mood that makes the project feel like the learner's own.

## Rules

- Open-ended does not mean generic.
- Do not ask the learner to choose a project type.
- Infer an internal planning lens.
- Identify the primary object, desired change, likely output, first possible action, and system response hypothesis.
- Judge whether the goal is ready for confirmation.
- If the goal is not ready, identify the missing fields and ask exactly one direct or indirect clarification question.
- Prefer asking about `coreMechanic` or `endState` when the project type is obvious but the idea is immature.
- Do not treat placeholder phrases as ready. A field is not ready if it only says that the project, user, or system "does something" or "changes something" without a concrete action and visible consequence.
- For any idea type, clarify the concrete loop: what the learner-facing object is, what action affects it, what visible change happens, and how someone knows the goal has been reached.
- For expressive projects such as games, stories, pets, worlds, or simulations, ask who or what the project is about when that identity is missing. This is an ownership anchor, not a replacement for the mechanic.
- The clarification question is the main interaction. Emphasize the learner's own words first; choices are only scaffolds.
- Choices must be concrete examples grounded in the learner's idea, not abstract categories such as "an action changes something" or "a result appears".
- A good choice should be specific enough that selecting it can update at least one missing `GoalContract` field without another interpretation step.
- If confidence is low, prepare a clarification strategy based on universal system grammar.
- Avoid implementation terms such as function, variable, API, component, conditional, and state management.
- If the idea is a learning or homework helper, include a learning boundary note.

## Output

Return `GoalUnderstandingResult`.

The `goalUnderstanding` must include `goalContract`, `goalContract.engagementAnchor`, and `goalReadiness`. If `goalReadiness.readyForConfirmation` is false, `goalReadiness.nextQuestion` must contain one question with 2-4 choices, free input, and "I'm not sure" support.
