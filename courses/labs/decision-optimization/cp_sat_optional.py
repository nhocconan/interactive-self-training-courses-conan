"""Optional OR-Tools adapter; never installed or run by the stdlib oracle."""
import argparse
from copy import deepcopy
from importlib.metadata import PackageNotFoundError, version
import json
from pathlib import Path

from allocation import audit, solve, validate

PIN = "9.15.6755"


def cp_sat(data, penalty=None):
    validate(data)
    try:
        installed = version("ortools")
    except PackageNotFoundError:
        raise RuntimeError("optional_dependency_missing") from None
    if installed != PIN:
        raise RuntimeError("optional_version_mismatch:" + installed)
    from ortools.sat.python import cp_model
    m = cp_model.CpModel()
    x = [m.new_bool_var(i["id"]) for i in data["items"]]
    cost = sum(i["cost"] * bit for i, bit in zip(data["items"], x))
    slots = sum(i["slots"] * bit for i, bit in zip(data["items"], x))
    gross = sum(i["value"] * bit for i, bit in zip(data["items"], x))
    m.add(cost <= data["budget"])
    m.add(slots <= data["capacity"])
    if penalty is None:
        m.add(sum(x) >= data["min_items"])
        objective = gross
    else:
        if type(penalty) is not int or not 1 <= penalty <= 100000:
            raise ValueError("invalid_explicit_penalty")
        short = m.new_int_var(0, data["min_items"], "service_shortfall")
        m.add(sum(x) + short >= data["min_items"])
        objective = gross - penalty * short
    m.maximize(objective)
    invalid = m.validate()
    if invalid:
        return {"status": "MODEL_INVALID", "selected": None, "reason": invalid}
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 10.0
    solver.parameters.num_search_workers = 1
    solver.parameters.random_seed = 0
    solver.parameters.relative_gap_limit = 0.0
    solver.parameters.absolute_gap_limit = 0.0
    status = solver.solve(m)
    result = {"backend": "ortools_cp_sat", "version": installed,
              "status": solver.status_name(status), "selected": None,
              "model_version": "hard_v1" if penalty is None else "service_shortfall_v1",
              "proposal_only": True,
              "settings": {"time_limit": 10, "workers": 1, "seed": 0,
                           "relative_gap": 0, "absolute_gap": 0}}
    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        chosen = [i for i, bit in zip(data["items"], x) if solver.value(bit)]
        shortfall = max(0, data["min_items"] - len(chosen))
        result.update(selected=[i["id"] for i in chosen], cost=sum(i["cost"] for i in chosen),
                      slots=sum(i["slots"] for i in chosen), count=len(chosen), shortfall=shortfall,
                      gross=sum(i["value"] for i in chosen), objective=sum(i["value"] for i in chosen) - (penalty or 0) * shortfall,
                      bound=solver.best_objective_bound)
        if penalty is not None and solver.value(short) != shortfall:
            raise RuntimeError("nonminimal_solver_slack")
        if abs(solver.objective_value - result["objective"]) > 1e-6:
            raise RuntimeError("solver_objective_mismatch")
        audit(data, result, penalty=penalty, allow_feasible=True)
    else:
        audit(data, result, penalty=penalty)
    reference = solve(data, penalty=penalty)
    if result["status"] == "OPTIMAL" and result["objective"] != reference.get("objective"):
        raise RuntimeError("oracle_objective_mismatch")
    if result["status"] == "INFEASIBLE" and reference["status"] != "INFEASIBLE":
        raise RuntimeError("oracle_feasibility_mismatch")
    return result


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--case", choices=("nominal", "infeasible", "relaxed"), default="nominal")
    args = p.parse_args()
    data = json.loads(Path(__file__).with_name("fixture.json").read_text())
    if args.case != "nominal":
        data = dict(deepcopy(data), budget=9, min_items=2)
    try:
        result = cp_sat(data, penalty=4 if args.case == "relaxed" else None)
    except (RuntimeError, ValueError) as error:
        print(json.dumps({"adapter_error": str(error)}))
        return 2
    print(json.dumps(result, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
