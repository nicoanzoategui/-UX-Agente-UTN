#!/usr/bin/env python3
"""
Genera el cuerpo JSON para POST /deploy/preview y POST /deploy (PaaS new-feats).
Uso:
  export PAAS_TOKEN='paas_...'
  export JWT_SECRET="$(openssl rand -hex 32)"   # obligatorio en prod
  export GOOGLE_CLIENT_ID='xxx.apps.googleusercontent.com'  # opcional; default placeholder
  python3 scripts/paas_deploy_request.py preview | curl ... -d @-
  python3 scripts/paas_deploy_request.py deploy | curl ... -d @-
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
ZONE = "new-feats.redtecnologica.org"
PROJECT_ID = "ux-agente-utn"
FRONT_URL = f"https://PROJECT_ID.{ZONE}".replace("PROJECT_ID", PROJECT_ID)
API_URL = f"https://PROJECT_ID-api.{ZONE}".replace("PROJECT_ID", PROJECT_ID)


def load_dotenv() -> dict[str, str]:
    env: dict[str, str] = {}
    p = REPO_ROOT / ".env"
    if not p.is_file():
        return env
    for line in p.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def body() -> dict:
    dot = load_dotenv()
    jwt = os.environ.get("JWT_SECRET", "").strip()
    if len(jwt) < 16:
        raise SystemExit("Definí JWT_SECRET (≥16 caracteres), ej: export JWT_SECRET=$(openssl rand -hex 32)")

    gemini = os.environ.get("GEMINI_API_KEY", dot.get("GEMINI_API_KEY", "")).strip()
    if not gemini:
        raise SystemExit("Falta GEMINI_API_KEY en el entorno o en .env")

    google = os.environ.get("GOOGLE_CLIENT_ID", dot.get("GOOGLE_CLIENT_ID", "")).strip() or (
        "000000000000-replace-with-real-client-id.apps.googleusercontent.com"
    )

    return {
        "project_id": PROJECT_ID,
        "domain_prefix": PROJECT_ID,
        "source": {
            "type": "git",
            "url": "https://github.com/nicoanzoategui/-UX-Agente-UTN.git",
        },
        "services": {
            "frontend": {
                "dockerfile_path": "Dockerfile",
                "build_context": "frontend",
                "port": 8080,
                "memory": 512,
                "env": {
                    "VITE_API_URL": API_URL,
                    "VITE_GOOGLE_CLIENT_ID": google,
                },
            },
            "backend": {
                "dockerfile_path": "Dockerfile",
                "build_context": "backend",
                "port": 3001,
                "memory": 1024,
                "cpu": 512,
                "env": {
                    "NODE_ENV": "production",
                    "PORT": "3001",
                    "TRUST_PROXY": "1",
                    "FRONTEND_URL": FRONT_URL,
                    "GEMINI_API_KEY": gemini,
                    "GEMINI_MODEL": dot.get("GEMINI_MODEL", "gemini-2.5-flash"),
                    "JWT_SECRET": jwt,
                    "GOOGLE_CLIENT_ID": google,
                    "TURSO_DATABASE_URL": "file:/app/data/local.db",
                },
            },
        },
    }


def main() -> None:
    mode = (sys.argv[1] if len(sys.argv) > 1 else "preview").lower()
    if mode not in ("preview", "deploy"):
        raise SystemExit("Uso: paas_deploy_request.py [preview|deploy]")
    print(json.dumps(body(), indent=2))


if __name__ == "__main__":
    main()
