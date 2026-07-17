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

The implementation architecture uses four separately governed planes:

1. an online serving plane that reads point-in-time features and may propose,
   validate, approve, and dispatch, but never trains;
2. an append-only episode/outcome plane that preserves the exact decision-time
   context and joins delayed, censored, or late outcomes;
3. an asynchronous learning plane that builds frozen datasets, evaluates one
   explicit change surface, and emits versioned candidates; and
4. a control plane that owns policy, artifacts, authority, rollout, and
   rollback.

This separation is the course's central technical safeguard against leakage,
silent self-editing, and reward hacking.

## Primary-source anchors

| Course topic | Primary source | How the course uses it |
|---|---|---|
| Decision provenance and replay | [W3C PROV-O](https://www.w3.org/TR/prov-o/) | Separates entities, activities, and agents so a recommendation can be reconstructed from an immutable episode. |
| Governed AI lifecycle | [NIST AI RMF Playbook](https://airc.nist.gov/AI_RMF_Knowledge_Base/Playbook) | Frames governance as Govern, Map, Measure, and Manage rather than an after-the-fact review. |
| GenAI lifecycle risk | [NIST AI 600-1](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence) | Grounds the control-plane treatment of measurement, monitoring, human oversight, and incident response. |
| Agent memory taxonomy | [CoALA](https://arxiv.org/abs/2309.02427) | Motivates working, episodic, semantic, procedural, and policy memory as distinct stores with distinct controls. |
| Long-horizon memory evaluation | [LongMemEval](https://arxiv.org/abs/2410.10813) | Supports evaluating extraction, multi-session reasoning, temporal reasoning, and abstention—not retrieval hit rate alone. |
| Off-policy evaluation | [Doubly Robust Policy Evaluation and Learning](https://proceedings.mlr.press/v7/dudik11a.html) | Introduces IPS/DR intuition, overlap, effective sample size, and uncertainty gates before policy promotion. |
| End-to-end traces | [OpenTelemetry semantic conventions](https://opentelemetry.io/docs/specs/semconv/) | Inspires correlation across decision, model, retrieval, tool, approval, and action spans while keeping sensitive payloads out of traces. |
| Self-evolving design space | [A Survey of Self-Evolving Agents](https://arxiv.org/abs/2507.21046) | Organizes adaptation by what evolves, when it evolves, and how; the course adds production gates and rollback around those research mechanisms. |
| Trajectory-level research | [AgentEvolver](https://arxiv.org/abs/2511.10395) | Illustrates state/action contribution and experience reuse as a research frontier; it is not presented as evidence for autonomous production promotion. |

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
- Reflection inside a run is not continual learning. A production capability
  changes only when a versioned candidate passes its promotion contract.
- A higher primary reward does not justify promotion when safety, margin,
  fairness, uncertainty, or intervention-cost guardrails regress.

## Review checklist

- Recheck linked primary sources when algorithms or governance guidance change.
- Keep formulas pedagogical and label toy numbers as illustrative.
- Keep all examples vendor-neutral and free of production/customer data.
- Treat any future claim of calibrated uplift, causal effect, or autonomous
  optimization as requiring a cited evaluation artifact.
