"""Sync the contents of the local data folder into MongoDB.

The script preserves source scope so global seed files and workspace-specific
files can coexist in the same collections without overwriting each other.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

import pandas as pd

import config
from database import get_db


ROOT_DIR = Path(__file__).resolve().parent
DATA_DIR = ROOT_DIR / "data"
WORKSPACES_DIR = DATA_DIR / "workspaces"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def rel_source(path: Path) -> str:
    return path.relative_to(DATA_DIR).as_posix()


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def load_csv(path: Path) -> list[dict[str, Any]]:
    frame = pd.read_csv(path)
    frame = frame.where(pd.notnull(frame), None)
    return frame.to_dict(orient="records")


def fingerprint(value: Any) -> str:
    payload = json.dumps(value, sort_keys=True, default=str, ensure_ascii=True)
    return hashlib.sha1(payload.encode("utf-8")).hexdigest()


def upsert_many(
    collection,
    documents: list[dict[str, Any]],
    key_builder: Callable[[dict[str, Any]], dict[str, Any]],
) -> int:
    count = 0
    for document in documents:
        collection.replace_one(key_builder(document), document, upsert=True)
        count += 1
    return count


def import_users(db) -> int:
    path = DATA_DIR / "users.json"
    if not path.exists():
        return 0

    payload = load_json(path)
    documents = []
    for email, user_doc in payload.items():
        document = dict(user_doc)
        document.setdefault("email", email)
        document["source_file"] = rel_source(path)
        document["scope"] = "global"
        document["imported_at"] = utc_now()
        documents.append(document)

    return upsert_many(db.users, documents, lambda doc: {"email": doc["email"]})


def import_sessions(db) -> int:
    path = DATA_DIR / "sessions.json"
    if not path.exists():
        return 0

    payload = load_json(path)
    documents = []
    for token, email in payload.items():
        document = {
            "token": token,
            "email": email,
            "source_file": rel_source(path),
            "scope": "global",
            "imported_at": utc_now(),
        }
        documents.append(document)

    return upsert_many(db.sessions, documents, lambda doc: {"token": doc["token"]})


def import_rows(db, path: Path, collection_name: str, scope: str) -> int:
    rows = load_csv(path)
    documents = []
    for row in rows:
        document = dict(row)
        document["source_file"] = rel_source(path)
        document["scope"] = scope
        document["workspace_id"] = None if scope == "global" else scope
        document["imported_at"] = utc_now()
        documents.append(document)

    collection = db[collection_name]

    if collection_name == "inventory":
        return upsert_many(
            collection,
            documents,
            lambda doc: {
                "scope": doc["scope"],
                "source_file": doc["source_file"],
                "ProductID": doc.get("ProductID"),
            },
        )

    if collection_name == "transactions":
        return upsert_many(
            collection,
            documents,
            lambda doc: {
                "scope": doc["scope"],
                "source_file": doc["source_file"],
                "TransactionID": doc.get("TransactionID"),
            },
        )

    return upsert_many(collection, documents, lambda doc: {"_fingerprint": fingerprint(doc)})


def import_json_array(db, path: Path, collection_name: str, scope: str) -> int:
    payload = load_json(path)
    if not isinstance(payload, list):
        raise ValueError(f"Expected a JSON array in {path}")

    documents = []
    for record in payload:
        document = dict(record)
        document["source_file"] = rel_source(path)
        document["scope"] = scope
        document["workspace_id"] = document.get("workspace_id") or (None if scope == "global" else scope)
        document["imported_at"] = utc_now()
        if collection_name == "whatsapp_logs":
            document["import_key"] = fingerprint({k: v for k, v in document.items() if k != "imported_at"})
        documents.append(document)

    def key_builder(doc: dict[str, Any]) -> dict[str, Any]:
        if collection_name == "whatsapp_logs":
            return {
                "import_key": doc["import_key"],
            }

        if collection_name == "customers":
            return {
                "workspace_id": doc.get("workspace_id"),
                "id": doc.get("id"),
            }

        if collection_name == "suppliers":
            return {
                "workspace_id": doc.get("workspace_id"),
                "id": doc.get("id"),
            }

        if collection_name == "purchase_orders":
            return {
                "workspace_id": doc.get("workspace_id"),
                "po_id": doc.get("po_id"),
            }

        if collection_name == "onboarding":
            return {"workspace_id": doc.get("workspace_id")}

        if collection_name == "workspaces":
            return {"workspace_id": doc.get("workspace_id")}

        return {"_fingerprint": fingerprint(doc)}

    return upsert_many(db[collection_name], documents, key_builder)


def import_onboarding(db, path: Path, scope: str) -> int:
    payload = load_json(path)
    if not isinstance(payload, dict):
        raise ValueError(f"Expected a JSON object in {path}")

    document = dict(payload)
    document["source_file"] = rel_source(path)
    document["scope"] = scope
    document["workspace_id"] = scope
    document["imported_at"] = utc_now()

    db.onboarding.replace_one({"workspace_id": scope}, document, upsert=True)
    return 1


def collect_workspace_docs(workspace_dir: Path) -> dict[str, Any]:
    workspace_id = workspace_dir.name
    summary = {
        "workspace_id": workspace_id,
        "source_file": rel_source(workspace_dir / "__workspace__"),
        "scope": workspace_id,
        "workspace_id": workspace_id,
        "files": [],
        "imported_at": utc_now(),
    }

    for file_path in sorted(workspace_dir.rglob("*")):
        if file_path.is_file():
            summary["files"].append(file_path.relative_to(workspace_dir).as_posix())

    onboarding_path = workspace_dir / "onboarding.json"
    if onboarding_path.exists():
        onboarding = load_json(onboarding_path)
        if isinstance(onboarding, dict):
            summary["onboarding"] = onboarding

    return summary


def import_workspace(db, workspace_dir: Path) -> dict[str, int]:
    counts = {
        "customers": 0,
        "suppliers": 0,
        "purchase_orders": 0,
        "whatsapp_logs": 0,
        "inventory": 0,
        "transactions": 0,
        "onboarding": 0,
        "workspaces": 0,
    }

    if not workspace_dir.is_dir():
        return counts

    workspace_id = workspace_dir.name
    workspace_doc = collect_workspace_docs(workspace_dir)
    workspace_doc["source_file"] = f"workspaces/{workspace_id}"
    db.workspaces.replace_one({"workspace_id": workspace_id}, workspace_doc, upsert=True)
    counts["workspaces"] = 1

    for file_path in sorted(workspace_dir.rglob("*")):
        if not file_path.is_file():
            continue

        filename = file_path.name.lower()
        scope = workspace_id

        if filename == "customers.json":
            counts["customers"] += import_json_array(db, file_path, "customers", scope)
        elif filename == "suppliers.json":
            counts["suppliers"] += import_json_array(db, file_path, "suppliers", scope)
        elif filename == "purchase_orders.json":
            counts["purchase_orders"] += import_json_array(db, file_path, "purchase_orders", scope)
        elif filename == "whatsapp_logs.json":
            counts["whatsapp_logs"] += import_json_array(db, file_path, "whatsapp_logs", scope)
        elif filename == "onboarding.json":
            counts["onboarding"] += import_onboarding(db, file_path, scope)
        elif filename == "inventory.csv":
            counts["inventory"] += import_rows(db, file_path, "inventory", scope)
        elif filename == "transactions.csv":
            counts["transactions"] += import_rows(db, file_path, "transactions", scope)

    return counts


def clear_collections(db) -> None:
    for name in [
        "users",
        "sessions",
        "inventory",
        "transactions",
        "customers",
        "suppliers",
        "purchase_orders",
        "whatsapp_logs",
        "onboarding",
        "workspaces",
    ]:
        db[name].delete_many({})


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync local data files to MongoDB.")
    parser.add_argument(
        "--clear",
        action="store_true",
        help="Delete the target collections before importing.",
    )
    args = parser.parse_args()

    database = get_db()
    if database is None:
        print("MongoDB is unavailable. Set MONGO_URI in .env and ensure the cluster accepts your IP.")
        return 1

    if args.clear:
        clear_collections(database)

    counts = {
        "users": import_users(database),
        "sessions": import_sessions(database),
        "inventory": 0,
        "transactions": 0,
        "customers": 0,
        "suppliers": 0,
        "purchase_orders": 0,
        "whatsapp_logs": 0,
        "onboarding": 0,
        "workspaces": 0,
    }

    global_inventory = DATA_DIR / "inventory.csv"
    if global_inventory.exists():
        counts["inventory"] += import_rows(database, global_inventory, "inventory", "global")

    global_transactions = DATA_DIR / "transactions.csv"
    if global_transactions.exists():
        counts["transactions"] += import_rows(database, global_transactions, "transactions", "global")

    global_logs = DATA_DIR / "whatsapp_logs.json"
    if global_logs.exists():
        counts["whatsapp_logs"] += import_json_array(database, global_logs, "whatsapp_logs", "global")

    for workspace_dir in sorted(WORKSPACES_DIR.iterdir()) if WORKSPACES_DIR.exists() else []:
        if workspace_dir.is_dir():
            workspace_counts = import_workspace(database, workspace_dir)
            for key, value in workspace_counts.items():
                counts[key] += value

    print("Import complete:")
    for key, value in counts.items():
        print(f"  {key}: {value}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())