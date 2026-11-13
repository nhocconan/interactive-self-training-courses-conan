"""Frozen local contract gate; never calls a model. Exit 1 means checkpoint fails."""

import argparse
from contextlib import closing
import importlib
import json
from pathlib import Path
import sqlite3
import tempfile

import lab
import provider


def evaluate_policy(candidate):
    cases = json.loads(Path(__file__).with_name("heldout.json").read_text(encoding="utf-8"))
    results = []
    original = lab.policy_allows
    lab.policy_allows = candidate
    try:
        with tempfile.TemporaryDirectory(prefix="ai-checkpoint-") as folder:
            for case in cases:
                path = str(Path(folder) / (case["name"] + ".sqlite"))
                lab.setup(path)
                with closing(sqlite3.connect(path)) as db, db:
                    db.execute("UPDATE evidence SET max_quantity=?, action=? WHERE id='EV-7'", (case["limit"], case["evidence_action"]))
                draft = json.loads(provider.scripted()[0])
                draft["quantity"] = case["requested"]
                actual = "accepted"
                try:
                    lab.propose(path, "workshop-a", "linh", "checkpoint", json.dumps(draft))
                    approval = lab.approve(path, "workshop-a", "mai", "checkpoint")
                    lab.commit(path, "workshop-a", "linh", "checkpoint", approval["approval_id"], "checkpoint-key")
                except lab.Rejected as error:
                    actual = str(error)
                except NotImplementedError:
                    actual = "checkpoint_unfinished"
                with closing(sqlite3.connect(path)) as db, db:
                    stock = db.execute("SELECT available FROM stock WHERE scope='workshop-a'").fetchone()[0]
                    effects = db.execute("SELECT COUNT(*) FROM effects").fetchone()[0]
                    receipts = db.execute("SELECT COUNT(*) FROM receipts").fetchone()[0]
                passed = (actual, stock, effects, receipts) == (case["expected"], case["stock"], case["effects"], case["effects"])
                results.append({"name": case["name"], "actual": actual, "stock": stock, "effects": effects, "receipts": receipts, "passed": passed})
    finally:
        lab.policy_allows = original
    return {"kind": "heldout_control_gate", "passed": sum(row["passed"] for row in results), "total": len(results), "cases": results}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--module", choices=("checkpoint", "policy"), default="checkpoint")
    parser.add_argument("--inject-fault", action="store_true", help="deliberate test fault: approve every policy")
    args = parser.parse_args()
    candidate = (lambda draft, evidence: True) if args.inject_fault else importlib.import_module(args.module).policy_allows
    result = evaluate_policy(candidate)
    print(json.dumps(result, sort_keys=True))
    return 0 if result["passed"] == result["total"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
