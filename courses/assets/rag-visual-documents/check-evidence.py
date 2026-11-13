#!/usr/bin/env python3
"""Check authored evidence labels and arithmetic. Does not run retrieval or a model."""
import json
from pathlib import Path

root = Path(__file__).resolve().parent
data = json.loads((root / 'evidence-cases.json').read_text())
fixture = (root / data['fixture']).read_text()
for region in data['regions']:
    assert f'id="{region}"' in fixture, f'Missing source region: {region}'
calc = data['questions']['purchase']['worked_calculation']
assert calc['boxes'] * calc['units_per_box'] == data['questions']['purchase']['expected_answer']['value']
for case in data['cases']:
    question = data['questions'][case['question']]
    gold_sets = [set(items) for items in question['gold_sets']]
    retrieved = set(case['retrieved'])
    cited = set(case['citations'])
    assert retrieved | cited <= data['regions'].keys(), case['id']
    result = {
        'evidence_recall': max(len(retrieved & gold) / len(gold) for gold in gold_sets),
        'full_set_success': int(any(gold <= retrieved for gold in gold_sets)),
        'answer_exact': int(case['answer'] == question['expected_answer']),
        'citation_set_complete': int(any(gold <= (cited & retrieved) for gold in gold_sets)),
    }
    assert result == case['expected'], (case['id'], result, case['expected'])
    print(case['id'], json.dumps(result, sort_keys=True))
print('Authored cases consistent; no retrieval/model benchmark was run.')
