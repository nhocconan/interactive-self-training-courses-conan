"""Completed reference for the learner's policy checkpoint."""


def policy_allows(draft, evidence):
    return draft["action"] == evidence["action"] and draft["quantity"] <= evidence["max_quantity"]
