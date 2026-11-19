# CI & automated tests

## What the `CI` workflow checks

Pushes and pull requests against `main`, `master`, or `develop` run two
independent jobs on GitHub Actions:

- **backend** (Python 3.11, `backend/` as the working directory)
  - installs `requirements.txt` and `requirements-dev.txt`
  - `python -m compileall -q app main.py` — byte-compiles all app modules to
    catch syntax errors
  - `python -m pytest tests/ -q` — runs the offline API smoke tests
- **frontend** (Node 20, `frontend/` as the working directory)
  - `npm ci` — clean, lockfile-driven dependency install
  - `npx tsc --noEmit` — TypeScript type check without emitting files
  - `npm run build` — production build

## Run the checks locally

Backend:

```bash
cd backend
pip install -r requirements-dev.txt
python -m pytest tests/ -q
```

(Install `requirements.txt` first in a fresh environment. The tests use
FastAPI's in-process `TestClient`, so no server needs to be running and no
external network access is required.)

Frontend:

```bash
cd frontend
npm ci
npx tsc --noEmit
npm run build
```
