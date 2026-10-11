#!/usr/bin/env python3
"""GAZA Site Real: deterministic OSM GeoJSON -> georeferenced site geometry.
No network, no invented footprints. Standard-library only.
Usage: python tools/gaza/build_site_context.py INPUT.geojson OUTPUT.json
"""
import argparse, datetime, json, math, pathlib, sys
LAT0=41.52355
LON0=-5.59993
R=6378137.0
def local(lon,lat):
    return [round(R*math.radians(lon-LON0)*math.cos(math.radians(LAT0)),3),
            round(R*math.radians(lat-LAT0),3)]
def coerce_float(v):
    try:
        n=float(v)
        return n if math.isfinite(n) else None
    except (TypeError, ValueError): return None
def convert(fc, max_dist_m=1800):
    if fc.get('type')!='FeatureCollection' or not isinstance(fc.get('features'),list):
        raise ValueError('Expected GeoJSON FeatureCollection')
    roads=[];buildings=[];landuse=[];rejected=0
    for i,feat in enumerate(fc['features']):
        if not isinstance(feat,dict): rejected+=1;continue
        props=feat.get('properties') or {}
        geo=feat.get('geometry') or {}
        kind=geo.get('type'); coords=geo.get('coordinates')
        if kind not in ('LineString','MultiLineString','Polygon','MultiPolygon') or not isinstance(coords,list):
            rejected+=1;continue
        try:
            sequences=(coords if kind=='MultiLineString' else [coords] if kind=='LineString' else
                     [coords[0]] if kind=='Polygon' else [polygon[0] for polygon in coords])
            parts=[]
            for seq in sequences:
                if not isinstance(seq,list) or len(seq)<2:continue
                points=[local(float(p[0]),float(p[1])) for p in seq]
                if any(not all(math.isfinite(v) for v in xy) for xy in points):continue
                if min(math.hypot(*xy) for xy in points)>max_dist_m:continue
                if kind in ('Polygon','MultiPolygon') and len(points)<4:continue
                parts.append(points)
            if not parts: rejected+=1;continue
        except (ValueError,TypeError,IndexError):rejected+=1;continue
        tags=props.get('tags') or {}
        if not isinstance(tags,dict):tags={}
        tags={**tags,**{k:v for k,v in props.items() if k not in ('tags','geometry')}}
        src=props.get('@id') or props.get('id') or props.get('osm_id')
        item={'id':str(src or f'input-{i}'), 'name':str(tags.get('name') or ''),
              'source':'OPENSTREETMAP', 'provenance':'PUBLIC_REFERENCE','geometry':parts}
        if tags.get('highway') and kind in ('LineString','MultiLineString'):
            item['highway']=str(tags['highway'])
            item['ref']=str(tags.get('ref',''))
            item['oneway']=str(tags.get('oneway','no'))
            item['lanes']=str(tags.get('lanes',''))
            roads.append(item)
        elif tags.get('building') and kind in ('Polygon','MultiPolygon'):
            item['levels']=coerce_float(tags.get('building:levels'))
            item['heightM']=coerce_float(str(tags.get('height','')).replace(' m',''))
            item['heightStatus']='OSM_ATTRIBUTE' if item['heightM'] is not None else 'UNKNOWN'
            buildings.append(item)
        elif tags.get('landuse') and kind in ('Polygon','MultiPolygon'):
            item['landuse']=str(tags['landuse']);landuse.append(item)
        else: rejected+=1
    return {
      'schemaVersion':1,'type':'GAZA_GEO_CONTEXT','provenance':'PUBLIC_REFERENCE',
      'source':'OPENSTREETMAP_GEOJSON_USER_SUPPLIED','metricCrs':'LOCAL_ENU_APPROX',
      'originalCrs':'EPSG:4326','engineeringCrsRecommended':'EPSG:25830',
      'anchor':{'lat':LAT0,'lon':LON0,'status':'USER_CONFIRMED_APPROXIMATE_NOT_SURVEYED'},
      'areaLimitMeters':max_dist_m,'roads':roads,'buildings':buildings,'landuse':landuse,
      'statistics':{'roads':len(roads),'buildings':len(buildings),'landuse':len(landuse),'rejected':rejected},
      'boundary':'PUBLIC OSM context. Heights, private entrances, exact factory footprints and geometry not surveyed.'
    }
def main():
    ap=argparse.ArgumentParser();ap.add_argument('input');ap.add_argument('output');ap.add_argument('--radius',type=int,default=1800)
    args=ap.parse_args()
    inp=pathlib.Path(args.input);out=pathlib.Path(args.output)
    result=convert(json.loads(inp.read_text(encoding='utf-8')),args.radius)
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print(f"Output: {out} roads={len(result['roads'])} buildings={len(result['buildings'])} rejected={result['statistics']['rejected']}")
if __name__=='__main__':main()
