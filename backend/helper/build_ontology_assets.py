"""
This script exports the ontology data from the database as asset files
in CSV format and updates the manifest file.
"""

import json
import os
from pathlib import Path

import pandas as pd

conn_str = os.getenv("CONN_STR", "postgresql://postgres:password@localhost/ontologies")
try:
    from medconb.config import config

    conn_str = config["database"]["ontologies"]["url"].get(str)
    print("Using connection string from config")
except Exception:
    print("Using connection string from environment")

assets_folder = os.path.join(os.path.dirname(__file__), "..", "assets")
manifest_file = Path(assets_folder, "manifest.json")


def main():
    os.makedirs(assets_folder, exist_ok=True)

    counts = pd.read_sql_query(
        "SELECT ontology_id, COUNT(*) FROM code GROUP BY ontology_id",
        conn_str,
        index_col="ontology_id",
    ).to_dict(orient="dict")["count"]
    print(
        f"Exporting {sum(counts.values())} codes from {len(counts)} ontologies:\n",
        *[f"  {ontology_id}: {count}\n" for ontology_id, count in counts.items()],
    )

    for ontology_id in counts:
        df = pd.read_sql_query(
            f"SELECT * FROM code WHERE ontology_id = '{ontology_id}' ORDER BY id ASC",
            conn_str,
        )
        df.to_csv(
            os.path.join(assets_folder, f"codes_{ontology_id}.csv.gz"), index=False
        )
        print(f"Exported ontology {ontology_id}")

    manifest = {}
    if manifest_file.is_file():
        with open(manifest_file) as f:
            manifest = json.load(f)

    manifest_files_dict = (
        {f["name"]: f for f in manifest["files"]} if "files" in manifest else {}
    )
    manifest_files_dict.update(
        {
            f"codes_{ontology_id}.csv.gz": {
                "name": f"codes_{ontology_id}.csv.gz",
                "num_codes": counts[ontology_id],
                "ontology_id": ontology_id,
            }
            for ontology_id in counts
        }
    )

    manifest["files"] = list(manifest_files_dict.values())

    with open(manifest_file, "w") as f:
        json.dump(manifest, f, indent=4)

    print("Updated manifest file")


if __name__ == "__main__":
    main()
