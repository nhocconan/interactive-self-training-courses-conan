"""Exact teaching oracle for <=10 binary choices; standard library only."""
import argparse
from copy import deepcopy
from fractions import Fraction
from itertools import product
import json
from pathlib import Path


STATUSES = {"OPTIMAL", "FEASIBLE", "INFEASIBLE", "UNKNOWN", "MODEL_INVALID"}


def validate(data):
    if type(data) is not dict or set(data) != {"items", "budget", "capacity", "min_items"}:
        raise ValueError("invalid_fields")
    items = data["items"]
    if type(items) is not list or not 1 <= len(items) <= 10:
        raise ValueError("oracle_requires_1_to_10_items")
    ids = set()
    for item in items:
        if type(item) is not dict or set(item) != {"id", "cost", "slots", "value"}:
            raise ValueError("invalid_item_fields")
        if type(item["id"]) is not str or not item["id"] or item["id"] in ids:
            raise ValueError("invalid_item_id")
        ids.add(item["id"])
        for name in ("cost", "slots", "value"):
            if type(item[name]) is not int or not 0 <= item[name] <= 100000:
                raise ValueError("invalid_integer_unit")
    for name in ("budget", "capacity", "min_items"):
        if type(data[name]) is not int or not 0 <= data[name] <= 100000:
            raise ValueError("invalid_integer_unit")
    if data["min_items"] > len(items):
        raise ValueError("invalid_min_items")
    return data


def solve(data, penalty=None):
    validate(data)
    if penalty is not None and (type(penalty) is not int or not 1 <= penalty <= 100000):
        raise ValueError("invalid_explicit_penalty")
    best = None
    for bits in product((0, 1), repeat=len(data["items"])):
        chosen = [item for item, bit in zip(data["items"], bits) if bit]
        cost = sum(i["cost"] for i in chosen)
        slots = sum(i["slots"] for i in chosen)
        shortfall = max(0, data["min_items"] - len(chosen))
        if cost > data["budget"] or slots > data["capacity"] or (shortfall and penalty is None):
            continue
        gross = sum(i["value"] for i in chosen)
        objective = gross - (penalty or 0) * shortfall
        row = {"status": "OPTIMAL", "selected": [i["id"] for i in chosen],
               "cost": cost, "slots": slots, "count": len(chosen), "shortfall": shortfall,
               "gross": gross, "objective": objective}
        if best is None or objective > best["objective"]:
            best = row
    return best or {"status": "INFEASIBLE", "selected": None}


def audit(data, result, penalty=None, allow_feasible=False):
    """Recheck returned IDs by subtracting resources, without oracle bit vectors."""
    validate(data)
    status = result.get("status")
    if status not in STATUSES:
        raise ValueError("unknown_solver_status")
    if status not in {"OPTIMAL", "FEASIBLE"}:
        if result.get("selected") is not None:
            raise ValueError("non_incumbent_status_has_values")
        return False
    selected = result.get("selected")
    if type(selected) is not list or any(type(x) is not str for x in selected) or len(set(selected)) != len(selected):
        raise ValueError("invalid_selection")
    lookup = {x["id"]: x for x in data["items"]}
    money_left, slots_left, gross = data["budget"], data["capacity"], 0
    for ident in selected:
        if ident not in lookup:
            raise ValueError("unknown_selected_id")
        item = lookup[ident]
        money_left -= item["cost"]
        slots_left -= item["slots"]
        gross += item["value"]
    shortfall = max(data["min_items"] - len(selected), 0)
    if money_left < 0 or slots_left < 0 or (shortfall and penalty is None):
        raise ValueError("hard_constraint_violated")
    calculated = {"cost": data["budget"] - money_left, "slots": data["capacity"] - slots_left,
                  "count": len(selected), "gross": gross, "shortfall": shortfall,
                  "objective": gross - (penalty or 0) * shortfall}
    if any(type(result.get(k)) is not int or result[k] != v for k, v in calculated.items()):
        raise ValueError("reported_totals_mismatch")
    return status == "OPTIMAL" or allow_feasible


def record(data, selected):
    chosen = [i for i in data["items"] if i["id"] in selected]
    return {"status": "FEASIBLE", "selected": selected,
            "cost": sum(i["cost"] for i in chosen), "slots": sum(i["slots"] for i in chosen),
            "count": len(chosen), "shortfall": max(0, data["min_items"] - len(chosen)),
            "gross": sum(i["value"] for i in chosen), "objective": sum(i["value"] for i in chosen)}


def greedy(data):
    money, slots, selected = data["budget"], data["capacity"], []
    for item in sorted(data["items"], key=lambda x: (-x["value"], x["id"])):
        if item["cost"] <= money and item["slots"] <= slots:
            selected.append(item["id"])
            money -= item["cost"]
            slots -= item["slots"]
    return record(data, selected)


def scenarios(data):
    values = deepcopy(data)
    for item in values["items"]:
        if item["id"] in {"B", "C"}:
            item["value"] = 4
    budget = dict(deepcopy(data), budget=9)
    capacity = dict(deepcopy(data), capacity=1)
    return [("nominal", deepcopy(data)), ("value_drop", values),
            ("budget_9", budget), ("capacity_1", capacity)]


def build_report(data):
    nominal = solve(data)
    assert audit(data, nominal)
    infeasible_data = dict(deepcopy(data), budget=9, min_items=2)
    infeasible = solve(infeasible_data)
    relaxed = solve(infeasible_data, penalty=4)
    assert audit(infeasible_data, relaxed, penalty=4)
    scenario_rows = []
    cases = scenarios(data)
    for name, case in cases:
        fixed = record(case, nominal["selected"])
        try:
            fixed_ok = audit(case, fixed, allow_feasible=True)
        except ValueError:
            fixed_ok = False
        optimum = solve(case)
        assert audit(case, optimum)
        scenario_rows.append({"scenario": name, "fixed_feasible": fixed_ok,
                              "fixed_value": fixed["gross"] if fixed_ok else None,
                              "best": optimum})
    robust_candidates = []
    for bits in product((0, 1), repeat=len(data["items"])):
        selected = [i["id"] for i, b in zip(data["items"], bits) if b]
        payoffs = []
        for _, case in cases[:2]:
            row = record(case, selected)
            try:
                audit(case, row, allow_feasible=True)
            except ValueError:
                break
            payoffs.append(row["gross"])
        if len(payoffs) == 2:
            robust_candidates.append({"selected": selected, "payoffs": payoffs, "worst": min(payoffs)})
    robust = max(robust_candidates, key=lambda r: r["worst"])
    frac = [Fraction(1), Fraction(4, 5), Fraction(0)]
    lp_cost = sum(b * i["cost"] for b, i in zip(frac, data["items"]))
    lp_slots = sum(b * i["slots"] for b, i in zip(frac, data["items"]))
    lp_value = sum(b * i["value"] for b, i in zip(frac, data["items"]))
    return {"backend": "stdlib_exhaustive", "subsets": 2 ** len(data["items"]),
            "nominal": nominal, "greedy": greedy(data),
            "lp_fixture": {"x": [str(x) for x in frac], "cost": str(lp_cost),
                           "slots": str(lp_slots), "value": str(lp_value),
                           "floor": record(data, ["A"]), "nearest": record(data, ["A", "B"])},
            "infeasible": infeasible, "relaxed_penalty_4": relaxed,
            "scenarios": scenario_rows, "robust_two_value_scenarios": robust,
            "cp_sat_execution": "not_run"}


def self_check(data, report):
    checks = []
    def check(name, condition):
        assert condition, name
        checks.append(name)
    check("nominal_BC_18", report["nominal"]["selected"] == ["B", "C"] and report["nominal"]["objective"] == 18)
    check("greedy_A_12", report["greedy"]["selected"] == ["A"] and report["greedy"]["objective"] == 12)
    check("fractional_96_over_5", report["lp_fixture"]["value"] == "96/5" and report["lp_fixture"]["cost"] == "10")
    check("floor_A_12", report["lp_fixture"]["floor"]["objective"] == 12)
    try:
        audit(data, report["lp_fixture"]["nearest"], allow_feasible=True)
    except ValueError as error:
        check("nearest_rounding_rejected", str(error) == "hard_constraint_violated")
    else:
        raise AssertionError("rounding not caught")
    check("hard_infeasible", report["infeasible"] == {"status": "INFEASIBLE", "selected": None})
    relaxed = report["relaxed_penalty_4"]
    check("explicit_slack_A_1_net_8", relaxed["selected"] == ["A"] and relaxed["shortfall"] == 1 and relaxed["objective"] == 8)
    check("four_scenarios", [x["fixed_feasible"] for x in report["scenarios"]] == [True, True, False, False])
    check("value_drop_fixed_8_best_12", report["scenarios"][1]["fixed_value"] == 8 and report["scenarios"][1]["best"]["objective"] == 12)
    check("robust_A_worst_12", report["robust_two_value_scenarios"] == {"selected": ["A"], "payoffs": [12, 12], "worst": 12})
    for status in ("INFEASIBLE", "UNKNOWN", "MODEL_INVALID"):
        check("no_incumbent_" + status, audit(data, {"status": status, "selected": None}) is False)
    feasible = dict(report["nominal"], status="FEASIBLE")
    check("feasible_needs_policy", not audit(data, feasible) and audit(data, feasible, allow_feasible=True))
    for name, change in (("bool_budget", True), ("negative_budget", -1)):
        try:
            validate(dict(data, budget=change))
        except ValueError:
            checks.append("reject_" + name)
        else:
            raise AssertionError(name)
    try:
        audit(data, dict(report["nominal"], selected=["A", "Z"]))
    except ValueError:
        checks.append("reject_forged_selected_id")
    else:
        raise AssertionError("forged id")
    for name, field, value in (("fractional_cost", "cost", 5.5), ("text_unit", "slots", "1")):
        changed = deepcopy(data)
        changed["items"][0][field] = value
        try:
            validate(changed)
        except ValueError:
            checks.append("reject_" + name)
        else:
            raise AssertionError(name)
    too_many = deepcopy(data)
    too_many["items"] = [{"id": str(i), "cost": 1, "slots": 1, "value": 1} for i in range(11)]
    try:
        validate(too_many)
    except ValueError:
        checks.append("reject_eleven_items")
    else:
        raise AssertionError("oracle size cap")
    try:
        audit(data, dict(report["nominal"], objective=999))
    except ValueError:
        checks.append("reject_forged_objective")
    else:
        raise AssertionError("forged objective")
    return checks


def markdown(data, r):
    lines = ["| Hạng mục | Ngân sách | Suất việc | Điểm |", "|---|---:|---:|---:|"]
    lines += [f'| {i["id"]} | {i["cost"]} | {i["slots"]} | {i["value"]} |' for i in data["items"]]
    lines += ["", "| Kịch bản | BC còn khả thi? | Điểm BC | Tối ưu mới | Điểm mới |", "|---|---|---:|---|---:|"]
    for row in r["scenarios"]:
        lines.append(f'| {row["scenario"]} | {row["fixed_feasible"]} | {row["fixed_value"]} | {"+".join(row["best"]["selected"])} | {row["best"]["objective"]} |')
    return "\n".join(lines) + "\n"


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--write", type=Path)
    p.add_argument("--tables", type=Path)
    args = p.parse_args()
    data = json.loads(Path(__file__).with_name("fixture.json").read_text())
    report = build_report(data)
    report["checks"] = self_check(data, report)
    text = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    if args.write:
        args.write.write_text(text)
    else:
        print(text, end="")
    if args.tables:
        args.tables.write_text(markdown(data, report))


if __name__ == "__main__":
    main()
