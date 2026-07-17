# Agentic Decision Systems — source digest

Companion evidence map for
[`decision-intelligence-agentic-systems.html`](../decision-intelligence-agentic-systems.html).
The course is a clean-room teaching artifact: examples, numbers, policies, and
interfaces are illustrative unless a lesson explicitly labels a measured
result.

## Governing thesis

A self-improving decision system is **not** a model that silently rewrites its
own goals or production code. It improves through a controlled learning loop:
immutable decision episodes → delayed outcomes → offline evaluation →
champion/challenger comparison → human-approved promotion → monitored rollout
→ rollback. The deterministic policy kernel, action state machine, audit trail,
and safety constraints remain independently testable.

## Primary-source anchors

| Course topic | Primary source | How the course uses it |
|---|---|---|
| Decision provenance and replay | [W3C PROV-O](https://www.w3.org/TR/prov-o/) | Separates entities, activities, and agents so a recommendation can be reconstructed from an immutable episode. |
| Governed AI lifecycle | [NIST AI RMF Playbook](https://airc.nist.gov/AI_RMF_Knowledge_Base/Playbook) | Frames governance as Govern, Map, Measure, and Manage rather than an after-the-fact review. |
| Agent memory taxonomy | [CoALA](https://arxiv.org/abs/2309.02427) | Motivates working, episodic, semantic, procedural, and policy memory as distinct stores with distinct controls. |
| Long-horizon memory evaluation | [LongMemEval](https://arxiv.org/abs/2410.10813) | Supports evaluating extraction, multi-session reasoning, temporal reasoning, and abstention—not retrieval hit rate alone. |
| Off-policy evaluation | [Doubly Robust Policy Evaluation and Learning](https://proceedings.mlr.press/v7/dudik11a.html) | Introduces IPS/DR intuition, overlap, effective sample size, and uncertainty gates before policy promotion. |
| End-to-end traces | [OpenTelemetry semantic conventions](https://opentelemetry.io/docs/specs/semconv/) | Inspires correlation across decision, model, retrieval, tool, approval, and action spans while keeping sensitive payloads out of traces. |

## Claims deliberately avoided

- Pre/post movement is not called causal impact without a defensible
  counterfactual design.
- Logged-policy evaluation is not called reliable when propensities, overlap,
  reward definitions, or sample size are missing.
- A retrieved memory is evidence, not truth; scope, validity, conflicts,
  supersession, expiry, and provenance must travel with it.
- A successful API call is not a successful business outcome; action delivery,
  acceptance, and delayed effects are separate states.
- An LLM rationale is not the decision record. The episode stores inputs,
  versions, constraints, scores, approvals, actions, and observed outcomes.

## Review checklist

- Recheck linked primary sources when algorithms or governance guidance change.
- Keep formulas pedagogical and label toy numbers as illustrative.
- Keep all examples vendor-neutral and free of production/customer data.
- Treat any future claim of calibrated uplift, causal effect, or autonomous
  optimization as requiring a cited evaluation artifact.
