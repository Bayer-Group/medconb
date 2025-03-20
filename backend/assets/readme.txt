
On Deployed Container:
pip install pandas  # not installed by default
PYTHONPATH="$(pwd)" python helper/build_ontology_assets.py



On Mac:
wc -c codes_ICD-10-CM.csv
stat -f%z codes_ICD-9-CM.csv

stat -f%z codes_ICD-9-CM.csv.gz
md5sum codes_ICD-10-CM.csv.gz



df = pd.read_csv("codes_ICD-9-CM.csv")
df.path = df.path.str.replace("{","[").str.replace("}","]")
df.children_ids = df.children_ids.str.replace("{","[").str.replace("}","]")
df.to_csv("codes_ICD-9-CM.2.csv", index=False)

