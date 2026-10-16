"""Build a read-only Market snapshot from the existing reviewed dataset (no collection)."""
import csv
import hashlib
import json
import math
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = 'data/training/shared/model-ready/maisondelux_model_ready_v1.csv'
OUTPUT = 'server-data/marrakech-market.json'


def build():
    source = ROOT / SOURCE
    with source.open(encoding='utf-8-sig', newline='') as stream:
        records = [r for r in csv.DictReader(stream) if r['city'] == 'Marrakech']
    rejected = Counter()
    rows = []
    seen = set()
    for r in records:
        reason = None
        if r['property_type_repaired'] != 'appartement' or r['transaction_type'] != 'sale':
            reason = 'unsupportedScope'
        elif r['is_model_ready'] != 'True' or r['validation_status'] != 'valid':
            reason = 'notValidated'
        elif r['duplicate_keep'] != 'True' or r['duplicate_status_repaired'] != 'unique':
            reason = 'duplicateRisk'
        elif r['batch_anomaly_status'] != 'not_flagged':
            reason = 'batchAnomaly'
        elif r['outlier_decision'] not in ('not_flagged', 'valid_extreme'):
            reason = 'uncertainOutlier'
        elif r['neighborhood_validation_status'] != 'valid' or not r['neighborhood_clean'].strip():
            reason = 'invalidNeighborhood'
        try:
            price, area = float(r['price_mad']), float(r['surface_m2'])
            numeric_valid = all(math.isfinite(v) and v > 0 for v in (price, area, price / area))
        except (ValueError, ZeroDivisionError):
            numeric_valid = False
        if not reason and (not numeric_valid or r['numeric_consistency_status'] != 'consistent'):
            reason = 'invalidNumeric'
        if not reason and (not r['listing_id'] or r['listing_id'] in seen):
            reason = 'duplicateIdentifier'
        if reason:
            rejected[reason] += 1
            continue
        seen.add(r['listing_id'])
        rows.append(dict(id=r['listing_id'], neighborhood=r['neighborhood_clean'].strip(),
                         price=price, area=area, collectedAt=r['scraped_at']))
    payload = dict(schemaVersion=1, city='Marrakech', source=SOURCE,
                   sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),
                   sourceRows=len(records), excluded=dict(rejected),
                   audit={f: dict(Counter(r[f] for r in records)) for f in (
                       'property_type_repaired', 'transaction_type', 'duplicate_status_repaired',
                       'batch_anomaly_status', 'outlier_decision', 'neighborhood_validation_status')},
                   missing={f: sum(not r[f].strip() for r in records) for f in (
                       'publication_date', 'latitude', 'longitude', 'url', 'bedrooms', 'bathrooms')},
                   rows=rows)
    (ROOT / OUTPUT).write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{OUTPUT}: {len(rows)}/{len(records)} observations; exclusions={dict(rejected)}')


if __name__ == '__main__':
    build()
