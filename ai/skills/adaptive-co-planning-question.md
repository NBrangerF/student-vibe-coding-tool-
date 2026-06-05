# Skill: Adaptive Co-Planning Question

Use only after Goal Understanding has been confirmed by the learner.

## Purpose

Generate the next co-planning question from the learner's `GoalUnderstanding`, current planning state, and previous responses.

Co-planning works backward from the confirmed end goal. Start with the final user-visible success state, then ask what must happen immediately before it, then ask what the simplest first milestone should be.

## Rules

- Ask exactly one question.
- The question must be specific to the learner's idea.
- Use the planning lens and system grammar from Goal Understanding.
- Work from end goal toward first milestone.
- Choices must allow multi-select.
- Do not use generic options such as "Open it", "Choose something", or "Try an action" when the idea is understandable.
- Every choice must describe visible behavior.
- Always allow free input.
- Include "I'm not sure" when appropriate.
- Do not generate candidate parts until the required co-planning responses exist.
- Do not generate a final System Trail.

## Output

Return `PlanningQuestionResult`.
