"""Split large losslessly compressed models into HTTP transport parts."""
from pathlib import Path
import hashlib,json
ROOT=Path(__file__).resolve().parents[2]/'atlas'
for p in ROOT.rglob('model.glb.gz'):
 if p.stat().st_size<=10*1024*1024:continue
 data=p.read_bytes();parts=[]
 for index,start in enumerate(range(0,len(data),8*1024*1024),1):
  chunk=data[start:start+8*1024*1024];out=p.with_name(p.name+f'.part{index:02}');out.write_bytes(chunk);parts.append({'file':out.name,'bytes':len(chunk),'sha256':hashlib.sha256(chunk).hexdigest()})
 p.with_name('model.parts.json').write_text(json.dumps({'schemaVersion':1,'compression':'gzip','bytes':len(data),'parts':parts},indent=2)+'\n')
 cat=p.parent/'catalog.json'
 if cat.exists():
  d=json.loads(cat.read_text());d['model']='model.parts.json';cat.write_text(json.dumps(d,indent=2)+'\n')
 p.unlink();print(p.parent.name,len(parts),'parts')
