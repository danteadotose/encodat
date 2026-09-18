"""Copy approved source cells into a public aggregate snapshot; never estimate in the frontend."""
import argparse, json, hashlib
from pathlib import Path
p=argparse.ArgumentParser(); p.add_argument('--manifest', required=True); a=p.parse_args()
root=Path(__file__).resolve().parents[1]
m=json.loads(Path(a.manifest).read_text())
raw=root/'data/estimates.json'
assert hashlib.sha256(raw.read_bytes()).hexdigest()==m['snapshot_sha256']['estimates'], 'Source changed; audit again'
records=json.loads(raw.read_text())['records']
key=lambda r:'|'.join(str(r[k]) for k in ['indicator_id','geo_level','region_id','sex','age_group'])
allowed={c['key']:c for c in m['allowed_cells']}
assert len(allowed)==len(m['allowed_cells'])
output=[]
for r in records:
    c=allowed.get(key(r))
    if not c: continue
    row={k:v for k,v in r.items() if k not in ['n','n_pos']}
    row.update(weighted_n=c['weighted_n'],weighted_n_meaning=c['weighted_n_meaning'],source_locator=c['source_locator'],evidence_level=c['evidence_level'])
    output.append(row)
assert len(output)==len(allowed), 'Unmatched audit cell'
(root/'data/estimates_reviewed.json').write_text(json.dumps({'year':2025,'records':output},ensure_ascii=False,indent=2)+'\n')
(root/'data/release_manifest.json').write_text(json.dumps({'audit_date':m['audit_date'],'source_sha256':m['snapshot_sha256'],'checks':m['checks'],'availability':m['availability'],'blocked_cells':m.get('blocked_cells',[]),'allowed_keys':list(allowed)},ensure_ascii=False,indent=2)+'\n')
print(f'{len(output)} approved cells; source SHA-256 verified; original snapshot unchanged')
