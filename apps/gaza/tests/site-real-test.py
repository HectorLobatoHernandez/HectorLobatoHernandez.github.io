import json, pathlib, sys, unittest, importlib.util
ROOT=pathlib.Path(__file__).resolve().parents[3]
MOD=ROOT/'tools/gaza/build_site_context.py'
spec=importlib.util.spec_from_file_location('build_site_context',MOD)
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
class SiteRealImport(unittest.TestCase):
 def test_center(self):
  self.assertEqual(mod.local(mod.LON0,mod.LAT0),[0.0,0.0])
 def test_valid_geometry_and_provenance(self):
  fc={'type':'FeatureCollection','features':[
   {'type':'Feature','properties':{'id':'way/123','highway':'residential','name':'Vial de prueba'},'geometry':{'type':'LineString','coordinates':[[-5.600,41.5235],[-5.599,41.5235]]}},
   {'type':'Feature','properties':{'building':'industrial'},'geometry':{'type':'Polygon','coordinates':[[[-5.6,41.5235],[-5.5999,41.5235],[-5.5999,41.5236],[-5.6,41.5235]]]}}
  ]}
  r=mod.convert(fc);self.assertEqual(len(r['roads']),1);self.assertEqual(len(r['buildings']),1)
  self.assertEqual(r['buildings'][0]['heightStatus'],'UNKNOWN')
  self.assertEqual(r['anchor']['status'],'USER_CONFIRMED_APPROXIMATE_NOT_SURVEYED')
 def test_reject_invalid_input(self):
  with self.assertRaises(ValueError):mod.convert({})
 def test_no_fabricated_roads(self):
  self.assertEqual(mod.convert({'type':'FeatureCollection','features':[]})['roads'],[])
if __name__=='__main__':unittest.main()
