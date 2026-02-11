# Perbandingan Lokal vs Remote Repository

## File/Folder yang ADA di LOKAL tapi TIDAK ada di REMOTE:

### Backend - Dokumentasi
- backend/AGENT_ALICE_SIMULATION.md
- backend/DEPLOYMENT_GUIDE.md
- backend/DOCUMENTATION_AUDIT.md
- backend/FINAL_ENDPOINT_TEST_REPORT.md
- backend/HEARTBEAT.md
- backend/PRODUCTION_READINESS.md
- backend/PRODUCTION_TEST_RESULTS.md
- backend/ROUTES_ENABLED.md
- backend/SKILL.md
- backend/WORK_SUMMARY.md
- backend/ars-llms.txt

### Backend - Deployment & Config
- backend/.dockerignore
- backend/Dockerfile
- backend/Dockerfile.railway
- backend/railway.toml
- backend/tsconfig.build.json
- backend/validate-dockerfile.sh

### Backend - Kode Baru
- backend/src/services/defi/kamino-client-real.ts
- backend/src/services/defi/kamino-sdk-client.ts
- backend/src/services/defi/kamino-client.DEPRECATED.ts
- backend/src/services/upstash-redis.ts

### Backend - Testing Scripts
- backend/test-all-endpoints.ps1
- backend/test-endpoints-simple.ps1
- backend/verify-real-api.ts

### Frontend
- frontend/public/HEARTBEAT.md
- frontend/public/SKILL.md
- frontend/public/ars-llms.txt
- frontend/public/logo/ (folder)
- frontend/src/components/layout/ (folder)
- frontend/src/components/sections/ (folder)
- frontend/src/components/ui/ (folder)

### Lainnya
- documentation/ (folder - kemungkinan duplikat dari docs/)
- frontend-old/ (folder - backup)
- scripts/ (folder dengan berbagai script)
- supabase/MIGRATION_013_ICR_HISTORY.sql

## File/Folder yang ADA di REMOTE tapi TIDAK ada di LOKAL:

### Backend
- backend/API_DOCUMENTATION.md
- backend/src/services/oracles/ (folder)
- backend/src/services/defi/kamino-client.ts (versi original)

### Frontend
- frontend/.env.example
- frontend/.gitignore
- frontend/eslint.config.js

### Lainnya
- docs/ (folder - kemungkinan sama dengan documentation/)
- .kiro/ (folder - Kiro IDE config)
- .vscode/ (folder - VS Code config)

### ARS Protocol Tests
- ars-protocol/tests/devnet-instructions.test.ts
- ars-protocol/tests/pda-derivation-properties.test.ts

## File yang BERBEDA (Modified):

### Root Level
- .gitignore
- docker-compose.yml
- Dockerfile.railway

### ARS Protocol
- ars-protocol/.gitignore
- ars-protocol/Anchor.toml
- ars-protocol/Cargo.lock
- ars-protocol/Cargo.toml
- ars-protocol/-core
- ars-protocol/-token
- ars-protocol/rust-toolchain.toml
- ars-protocol/show-program-info.sh
- ars-protocol/programs/ars-reserve/src/lib.rs

### Frontend
- frontend/index.html

### Skills
- .openclaw/skills/opensanctions-dataset.md

## Rekomendasi:

1. **File yang sebaiknya di-push ke remote:**
   - Semua dokumentasi baru di backend/
   - File deployment (Dockerfile, railway.toml, dll)
   - Kode baru (kamino-client-real.ts, kamino-sdk-client.ts, upstash-redis.ts)
   - Testing scripts
   - Frontend components baru
   - scripts/ folder
   - MIGRATION_013_ICR_HISTORY.sql

2. **File yang mungkin tidak perlu di-push:**
   - frontend-old/ (jika memang backup saja)
   - documentation/ (jika duplikat dari docs/)

3. **File yang perlu di-pull dari remote:**
   - backend/API_DOCUMENTATION.md
   - backend/src/services/oracles/
   - ars-protocol/tests/devnet-instructions.test.ts
   - ars-protocol/tests/pda-derivation-properties.test.ts
   - frontend/.env.example, .gitignore, eslint.config.js

4. **File yang perlu di-merge (ada perubahan di kedua sisi):**
   - .gitignore
   - docker-compose.yml
   - Dockerfile.railway
   - ars-protocol files
   - frontend/index.html
