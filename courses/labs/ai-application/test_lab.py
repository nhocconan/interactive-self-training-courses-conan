import contextlib
import io
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
import time
import unittest
from unittest.mock import patch
import urllib.error

import checkpoint_gate
import lab
import policy
import provider


HERE = Path(__file__).resolve().parent


class LabTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="ai-lab-test-")
        self.addCleanup(self.temp.cleanup)
        self.path = str(Path(self.temp.name) / "lab.sqlite")
        lab.setup(self.path)

    def sql(self, query, params=()):
        with contextlib.closing(sqlite3.connect(self.path)) as db, db:
            return db.execute(query, params).fetchall()

    def facts(self):
        return {
            "stock": self.sql("SELECT available,revision FROM stock WHERE scope='workshop-a'")[0],
            "effects": self.sql("SELECT COUNT(*) FROM effects")[0][0],
            "receipts": self.sql("SELECT COUNT(*) FROM receipts")[0][0],
        }

    def unchanged(self):
        self.assertEqual(self.facts(), {"stock": (10, 1), "effects": 0, "receipts": 0})

    def proposal(self, intent="i-1", quantity=2):
        draft = json.loads(provider.scripted()[0])
        draft["quantity"] = quantity
        return lab.propose(self.path, "workshop-a", "linh", intent, json.dumps(draft))

    def approved(self, intent="i-1", **kwargs):
        self.proposal(intent)
        return lab.approve(self.path, "workshop-a", "mai", intent, **kwargs)["approval_id"]

    def commit(self, approval, intent="i-1", key="k-1", **kwargs):
        return lab.commit(self.path, "workshop-a", "linh", intent, approval, key, **kwargs)

    def reject(self, code, function, *args, **kwargs):
        with self.assertRaisesRegex(lab.Rejected, "^" + code + "$"):
            function(*args, **kwargs)

    def child(self, *args):
        return subprocess.run([sys.executable, str(HERE / "lab.py"), "--db", self.path, *args], cwd=HERE, text=True, capture_output=True, timeout=15)

    def test_happy_path_has_independent_domain_result(self):
        approval = self.approved()
        result = self.commit(approval)
        self.assertFalse(result["replayed"])
        self.assertEqual(self.facts(), {"stock": (8, 2), "effects": 1, "receipts": 1})
        self.assertEqual(self.sql("SELECT request_id,action,quantity,before_revision,after_revision FROM effects"), [("REQ-7", "reserve_filter", 2, 1, 2)])
        self.assertEqual(self.sql("SELECT state,target_revision FROM intents"), [("committed", 1)])
        self.assertEqual(self.sql("SELECT intent_id,approval_id,target_revision FROM receipts"), [("i-1", approval, 1)])

    def test_scripted_fixtures_check_labels_and_forbidden_effects(self):
        result = lab.evaluate()
        self.assertEqual((result["kind"], result["passed"], result["total"]), ("scripted_control_checks", 9, 9))

    def test_schema_rejects_nonobjects_bool_duplicates_missing_and_wrong_action(self):
        valid = json.loads(provider.scripted()[0])
        cases = [("[]", "invalid_schema"), ("{", "invalid_json"), ('{"quantity":1,"quantity":2}', "invalid_json")]
        for change in ({"quantity": True}, {"evidence_version": True}, {"action": "delete_all"}, {"evidence_ids": ["EV-7", "EV-7"]}, {"actor": "mai"}, {"approved": True}):
            cases.append((json.dumps(valid | change), "invalid_schema"))
        missing = dict(valid)
        del missing["quantity"]
        cases.append((json.dumps(missing), "invalid_schema"))
        for raw, expected in cases:
            with self.subTest(raw=raw):
                self.reject(expected, lab.propose, self.path, "workshop-a", "linh", "bad", raw)
                self.unchanged()

    def test_required_evidence_removed_or_contradictory(self):
        self.sql("DELETE FROM evidence WHERE id='EV-7'")
        self.reject("evidence_missing", self.proposal)
        self.unchanged()

    def test_freshness_rechecked_at_approval(self):
        self.proposal()
        self.sql("UPDATE evidence SET version=2 WHERE id='EV-7'")
        self.reject("evidence_stale", lab.approve, self.path, "workshop-a", "mai", "i-1")
        self.unchanged()

    def test_freshness_rechecked_at_execution(self):
        approval = self.approved()
        self.sql("UPDATE evidence SET version=2 WHERE id='EV-7'")
        self.reject("evidence_stale", self.commit, approval)
        self.unchanged()

    def test_policy_rechecked_at_execution(self):
        approval = self.approved()
        self.sql("UPDATE evidence SET max_quantity=1 WHERE id='EV-7'")
        self.reject("policy_denied", self.commit, approval)
        self.unchanged()

    def test_target_revision_checked_at_approval_and_commit(self):
        self.proposal()
        self.sql("UPDATE stock SET revision=2")
        self.reject("target_stale", lab.approve, self.path, "workshop-a", "mai", "i-1")
        self.sql("UPDATE stock SET revision=1")
        approval = lab.approve(self.path, "workshop-a", "mai", "i-1")["approval_id"]
        self.sql("UPDATE stock SET revision=2")
        self.reject("target_stale", self.commit, approval)
        self.assertEqual(self.facts(), {"stock": (10, 2), "effects": 0, "receipts": 0})

    def test_insufficient_stock_cannot_create_receipt(self):
        approval = self.approved()
        self.sql("UPDATE stock SET available=1")
        self.reject("stock_insufficient", self.commit, approval)
        self.assertEqual(self.facts(), {"stock": (1, 1), "effects": 0, "receipts": 0})

    def test_roles_scope_and_no_selection_are_enforced(self):
        raw = provider.scripted()[0]
        for actor, scope in (("guest", "workshop-a"), ("outsider", "workshop-a"), ("linh", ""), ("unknown", "workshop-a")):
            self.reject("unauthorized", lab.propose, self.path, scope, actor, "bad", raw)
        self.proposal()
        self.reject("unauthorized", lab.approve, self.path, "workshop-a", "linh", "i-1")
        approval = lab.approve(self.path, "workshop-a", "mai", "i-1")["approval_id"]
        self.reject("unauthorized", lab.commit, self.path, "workshop-a", "mai", "i-1", approval, "key")
        self.reject("unauthorized", lab.status, self.path, "workshop-a", "outsider")
        self.assertEqual(lab.status(self.path, "workshop-b", "outsider")["intents"], [])
        evidence = lab.read_evidence(self.path, "workshop-a", "linh")
        self.assertEqual({row["id"] for row in evidence}, {"EV-7", "NOTE-7"})
        self.unchanged()

    def test_missing_denied_and_expired_approvals_fail_closed(self):
        self.proposal()
        self.reject("approval_mismatch", self.commit, "absent")
        denied = lab.approve(self.path, "workshop-a", "mai", "i-1", decision="deny")["approval_id"]
        self.reject("approval_denied", self.commit, denied)
        expired = lab.approve(self.path, "workshop-a", "mai", "i-1", now=100, ttl=1)["approval_id"]
        self.reject("approval_expired", self.commit, expired, now=101)
        self.unchanged()

    def test_denial_is_for_one_approval_id_not_revocation_of_other_approvals(self):
        allowed = self.approved()
        denied = lab.approve(self.path, "workshop-a", "mai", "i-1", decision="deny")["approval_id"]
        self.reject("approval_denied", self.commit, denied)
        self.unchanged()
        self.assertFalse(self.commit(allowed)["replayed"])
        self.assertEqual(self.facts(), {"stock": (8, 2), "effects": 1, "receipts": 1})

    def test_wrong_intent_hash_scope_version_and_target_approval(self):
        approval = self.approved()
        self.proposal("i-2")
        self.reject("approval_mismatch", self.commit, approval, intent="i-2")
        for field, wrong in (("payload_hash", "wrong"), ("scope", "workshop-b"), ("evidence_version", 8), ("target_revision", 8)):
            old = self.sql(f"SELECT {field} FROM approvals WHERE id=?", (approval,))[0][0]
            self.sql(f"UPDATE approvals SET {field}=? WHERE id=?", (wrong, approval))
            self.reject("approval_mismatch", self.commit, approval)
            self.sql(f"UPDATE approvals SET {field}=? WHERE id=?", (old, approval))
        self.unchanged()

    def test_revoked_fixture_approver_permission_checked_at_execution(self):
        approval = self.approved()
        with patch.dict(lab.ACTORS, {"mai": ("workshop-a", {"read"})}):
            self.reject("unauthorized", self.commit, approval)
        self.unchanged()

    def test_changed_payload_does_not_reuse_intent_or_approval(self):
        approval = self.approved()
        self.reject("intent_conflict", self.proposal, quantity=1)
        draft = json.loads(provider.scripted()[0])
        draft["quantity"] = 1
        self.sql("UPDATE intents SET payload=?", (json.dumps(draft),))
        self.reject("intent_tampered", self.commit, approval)
        self.unchanged()

    def test_sequential_duplicate_returns_identical_receipt(self):
        approval = self.approved()
        first = self.commit(approval)
        replay = self.commit(approval)
        self.assertEqual(first["receipt"], replay["receipt"])
        self.assertTrue(replay["replayed"])
        self.assertEqual(self.facts(), {"stock": (8, 2), "effects": 1, "receipts": 1})
        self.reject("intent_already_committed", self.commit, approval, key="different-key")

    def test_same_key_changed_intent_and_payload_rejected(self):
        approval = self.approved()
        self.proposal("i-2", quantity=1)
        other = lab.approve(self.path, "workshop-a", "mai", "i-2")["approval_id"]
        self.commit(approval)
        self.reject("key_conflict", self.commit, other, intent="i-2")
        self.assertEqual(self.facts(), {"stock": (8, 2), "effects": 1, "receipts": 1})

    def test_separate_intent_with_same_arguments_can_execute_normally(self):
        self.commit(self.approved())
        second = self.approved("i-2")
        self.commit(second, intent="i-2", key="k-2")
        self.assertEqual(self.facts(), {"stock": (6, 3), "effects": 2, "receipts": 2})

    def test_replay_reports_past_result_after_expiry_and_evidence_update(self):
        approval = self.approved(now=100, ttl=1)
        first = self.commit(approval, now=100)
        self.sql("UPDATE evidence SET version=99 WHERE id='EV-7'")
        replay = self.commit(approval, now=999)
        self.assertEqual(first["receipt"], replay["receipt"])
        self.assertTrue(replay["replayed"])
        self.assertEqual(self.facts(), {"stock": (8, 2), "effects": 1, "receipts": 1})

    def test_actual_child_crash_before_commit_rolls_back_all_writes(self):
        approval = self.approved()
        child = self.child("commit", "--actor", "linh", "--intent", "i-1", "--approval", approval, "--key", "k-1", "--crash", "before-commit")
        self.assertEqual((child.returncode, child.stdout), (81, ""), child.stderr)
        self.unchanged()
        self.assertEqual(self.sql("SELECT state FROM intents"), [("proposed",)])
        recovered = self.child("commit", "--actor", "linh", "--intent", "i-1", "--approval", approval, "--key", "k-1")
        self.assertEqual(recovered.returncode, 0, recovered.stderr)
        self.assertFalse(json.loads(recovered.stdout)["replayed"])
        self.assertEqual(self.facts(), {"stock": (8, 2), "effects": 1, "receipts": 1})

    def test_actual_child_crash_after_commit_reconciles_in_new_process(self):
        approval = self.approved()
        child = self.child("commit", "--actor", "linh", "--intent", "i-1", "--approval", approval, "--key", "k-1", "--crash", "after-commit")
        self.assertEqual((child.returncode, child.stdout), (82, ""), child.stderr)
        self.assertEqual(self.facts(), {"stock": (8, 2), "effects": 1, "receipts": 1})
        self.assertEqual(self.sql("SELECT state FROM intents"), [("committed",)])
        persisted = self.sql("SELECT key,effect_id FROM receipts")
        recovered = self.child("commit", "--actor", "linh", "--intent", "i-1", "--approval", approval, "--key", "k-1")
        self.assertEqual(recovered.returncode, 0, recovered.stderr)
        self.assertTrue(json.loads(recovered.stdout)["replayed"])
        self.assertEqual(self.sql("SELECT key,effect_id FROM receipts"), persisted)
        self.assertEqual(self.facts(), {"stock": (8, 2), "effects": 1, "receipts": 1})

    def test_concurrent_independent_processes_share_one_effect(self):
        approval = self.approved()
        go = Path(self.temp.name) / "go"
        code = """
import json,pathlib,sys,time,lab
db,approval,ready,go=sys.argv[1:]
pathlib.Path(ready).touch()
deadline=time.monotonic()+10
while not pathlib.Path(go).exists():
    if time.monotonic()>deadline: raise RuntimeError('barrier timeout')
    time.sleep(0.005)
print(json.dumps(lab.commit(db,'workshop-a','linh','i-1',approval,'k-1')))
"""
        children = []
        markers = [Path(self.temp.name) / str(index) for index in range(2)]
        try:
            for marker in markers:
                children.append(subprocess.Popen([sys.executable, "-c", code, self.path, approval, str(marker), str(go)], cwd=HERE, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE))
            deadline = time.monotonic() + 10
            while not all(marker.exists() for marker in markers):
                self.assertLess(time.monotonic(), deadline, "children never reached barrier")
                time.sleep(0.005)
            go.touch()
            results = []
            for child in children:
                out, err = child.communicate(timeout=15)
                self.assertEqual(child.returncode, 0, err)
                results.append(json.loads(out))
            self.assertEqual(results[0]["receipt"], results[1]["receipt"])
            self.assertEqual(sorted(row["replayed"] for row in results), [False, True])
        finally:
            for child in children:
                if child.poll() is None:
                    child.terminate()
                child.communicate(timeout=5)
        self.assertEqual(self.facts(), {"stock": (8, 2), "effects": 1, "receipts": 1})

    def test_finished_policy_passes_frozen_gate_and_deliberate_fault_fails(self):
        good = checkpoint_gate.evaluate_policy(policy.policy_allows)
        bad = checkpoint_gate.evaluate_policy(lambda draft, evidence: True)
        self.assertEqual((good["passed"], good["total"]), (4, 4))
        self.assertEqual((bad["passed"], bad["total"]), (1, 4))
        self.assertEqual([row["stock"] for row in bad["cases"]], [9, 7, 8, 9])
        child = subprocess.run([sys.executable, str(HERE / "checkpoint_gate.py"), "--inject-fault"], cwd=HERE, text=True, capture_output=True, timeout=15)
        self.assertEqual(child.returncode, 1)
        self.assertEqual(json.loads(child.stdout)["passed"], 1)

    def test_unfinished_checkpoint_fails_without_effects(self):
        # Keep the starter regression independent of the learner's edited file.
        def unfinished(draft, evidence):
            raise NotImplementedError("learner TODO")
        result = checkpoint_gate.evaluate_policy(unfinished)
        self.assertEqual((result["passed"], result["total"]), (0, 4))
        self.assertTrue(all(row["effects"] == row["receipts"] == 0 for row in result["cases"]))

    def test_cli_demo_and_authorization_failure(self):
        result = self.child("demo")
        self.assertEqual(result.returncode, 0, result.stderr)
        output = json.loads(result.stdout)
        self.assertFalse(output["first"]["replayed"])
        self.assertTrue(output["replay"]["replayed"])
        self.assertEqual(self.facts(), {"stock": (8, 2), "effects": 1, "receipts": 1})
        failure = self.child("propose", "--actor", "guest", "--intent", "denied")
        self.assertEqual((failure.returncode, json.loads(failure.stdout)), (2, {"error": "unauthorized"}))


class ProviderTests(unittest.TestCase):
    def response(self, **changes):
        return {"status": "completed", "output": [{"type": "message", "content": [{"type": "output_text", "text": provider.scripted()[0]}]}], "usage": {"input_tokens": 10, "output_tokens": 20, "total_tokens": 30}} | changes

    def transport(self, value, captured):
        def send(request, timeout):
            captured["request"] = request
            captured["timeout"] = timeout
            return io.BytesIO(json.dumps(value).encode())
        return send

    @patch.dict(os.environ, {"OPENAI_API_KEY": "test-secret-not-a-key", "OPENAI_MODEL": "configured-test-model"})
    def test_mock_transport_contract_usage_and_no_fixture_routing(self):
        captured = {}
        raw, metadata = provider.live([{"text": "untrusted note"}], self.transport(self.response(), captured))
        request = captured["request"]
        body = json.loads(request.data)
        self.assertEqual(request.full_url, "https://api.openai.com/v1/responses")
        self.assertEqual((body["model"], body["store"], body["max_output_tokens"], captured["timeout"]), ("configured-test-model", False, 500, 15))
        self.assertEqual(body["text"]["format"], {"type": "json_schema", "name": "reservation_draft", "strict": True, "schema": provider.SCHEMA})
        self.assertIn("untrusted note", body["input"][1]["content"])
        self.assertNotIn("expected", body["input"][1]["content"])
        self.assertEqual(json.loads(raw)["quantity"], 2)
        self.assertEqual(metadata["usage"], {"input_tokens": 10, "output_tokens": 20, "total_tokens": 30})

    def test_refusal_incomplete_missing_output_and_usage(self):
        for response, expected in (
            (self.response(status="incomplete"), "provider_incomplete"),
            (self.response(output=[{"type": "message", "content": [{"type": "refusal", "refusal": "sensitive"}]}]), "provider_refusal"),
            (self.response(output=[]), "provider_missing_output"),
            (self.response(output_text="not-a-REST-output", output=[]), "provider_missing_output"),
        ):
            with self.subTest(expected=expected):
                with self.assertRaisesRegex(provider.ProviderError, "^" + expected + "$"):
                    provider.parse_response(response)
        self.assertEqual(provider.parse_response(self.response(usage={"input_tokens": True, "output_tokens": -1}))[1], {})

    def test_live_requires_explicit_configuration(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaisesRegex(provider.ProviderError, "configure_OPENAI_API_KEY_and_OPENAI_MODEL"):
                provider.live([])

    @patch.dict(os.environ, {"OPENAI_API_KEY": "test-secret-not-a-key", "OPENAI_MODEL": "configured-test-model"})
    def test_provider_failures_leave_database_unchanged_and_do_not_print_secrets(self):
        errors = [TimeoutError("test-secret-not-a-key"), urllib.error.URLError("test-secret-not-a-key")]
        responses = [self.response(status="incomplete"), self.response(output=[{"type": "message", "content": [{"type": "refusal"}]}])]
        with tempfile.TemporaryDirectory(prefix="ai-provider-test-") as folder:
            path = str(Path(folder) / "lab.sqlite")
            lab.setup(path)
            for error in errors:
                def fail(*args, **kwargs):
                    raise error
                output = io.StringIO()
                with patch("provider.urllib.request.urlopen", side_effect=fail), contextlib.redirect_stdout(output):
                    code = lab.main(["--db", path, "propose", "--actor", "linh", "--intent", "live", "--live"])
                self.assertEqual(code, 2)
                self.assertEqual(json.loads(output.getvalue()), {"error": "provider_request_failed"})
                self.assertNotIn("test-secret", output.getvalue())
            for response in responses:
                with patch("provider.urllib.request.urlopen", self.transport(response, {})), contextlib.redirect_stdout(io.StringIO()):
                    self.assertEqual(lab.main(["--db", path, "propose", "--actor", "linh", "--intent", "live", "--live"]), 2)
            with contextlib.closing(sqlite3.connect(path)) as db, db:
                self.assertEqual(db.execute("SELECT available,revision FROM stock").fetchall(), [(10, 1)])
                for table in ("intents", "effects", "receipts"):
                    self.assertEqual(db.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0], 0)


if __name__ == "__main__":
    unittest.main()
