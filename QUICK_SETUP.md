# Quick Setup Guide - ARS Demo

Follow these 3 simple steps to run the demo.

## Step 1: Create Database Tables

You need to run the SQL migration in Supabase Dashboard.

### Instructions:

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Login with your account

2. **Select Your Project**
   - Click on project: `nbgyuavahktdbxpgpyvr`
   - Or go directly to: https://supabase.com/dashboard/project/nbgyuavahktdbxpgpyvr

3. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Or go to: https://supabase.com/dashboard/project/nbgyuavahktdbxpgpyvr/sql

4. **Create New Query**
   - Click "+ New Query" button

5. **Copy SQL Migration**
   - Open file: `supabase/migrations/002_create_all_tables.sql`
   - Copy ALL contents (Ctrl+A, Ctrl+C)

6. **Paste and Run**
   - Paste in SQL Editor (Ctrl+V)
   - Click "Run" button (or press Ctrl+Enter)
   - Wait for "Success. No rows returned" message

7. **Verify Tables Created**
   - Click "Table Editor" in left sidebar
   - You should see these tables:
     - ili_history
     - proposals
     - votes
     - agents
     - reserve_events
     - revenue_events
     - agent_staking
     - oracle_data
     - agent_transactions

---

## Step 2: Seed Database

Now populate the database with demo data.

### Instructions:

1. **Open Terminal**
   - Navigate to project folder
   ```bash
   cd path/to/agentic-reserve-system
   ```

2. **Go to Backend Folder**
   ```bash
   cd backend
   ```

3. **Run Seed Script**
   ```bash
   npm run seed
   ```
   
   Or if that doesn't work:
   ```bash
   npx ts-node src/seed-database.ts
   ```

4. **Expected Output**
   ```
   ========================================
   ARS Database Seeding Script
   ========================================

   Seeding ILI history...
   ✓ Seeded 168 ILI history records
   Seeding proposals...
   ✓ Seeded 4 proposals
   Seeding votes...
   ✓ Seeded 9 votes
   Seeding agents...
   ✓ Seeded 5 agents
   Seeding reserve events...
   ✓ Seeded 8 reserve events
   Seeding revenue events...
   ✓ Seeded 48 revenue events
   Seeding agent staking...
   ✓ Seeded 5 agent staking records

   ========================================
   ✓ Database seeding completed successfully!
   ========================================
   ```

5. **Verify Data in Supabase**
   - Go back to Supabase Dashboard
   - Click "Table Editor"
   - Click on `ili_history` table
   - You should see 168 rows of data

---

## Step 3: Start API Server

Now start the backend API server.

### Instructions:

1. **Make Sure You're in Backend Folder**
   ```bash
   cd backend
   ```

2. **Start Server**
   ```bash
   npm run dev:simple
   ```
   
   Or if that doesn't work:
   ```bash
   npx ts-node src/simple-server.ts
   ```

3. **Expected Output**
   ```
   ========================================
   ARS Simple API Server
   ========================================
   Server running on http://localhost:3000

   Available endpoints:
     GET  /health
     GET  /ili/current
     GET  /ili/history
     GET  /icr/current
     GET  /reserve/state
     GET  /reserve/rebalance-history
     GET  /proposals
     GET  /proposals/:id
     GET  /revenue/current
     GET  /revenue/breakdown
     GET  /agents/staking/metrics
     GET  /history/policies
   ========================================
   ```

4. **Keep Terminal Open**
   - Don't close this terminal
   - Server needs to keep running

---

## Step 4: Test API

Test that everything is working.

### Option A: Browser

Open these URLs in your browser:

- http://localhost:3000/health
- http://localhost:3000/ili/current
- http://localhost:3000/proposals
- http://localhost:3000/revenue/current
- http://localhost:3000/reserve/state

### Option B: PowerShell

```powershell
# Test health endpoint
Invoke-WebRequest -UseBasicParsing -Uri http://localhost:3000/health | Select-Object -ExpandProperty Content

# Test ILI endpoint
Invoke-WebRequest -UseBasicParsing -Uri http://localhost:3000/ili/current | Select-Object -ExpandProperty Content

# Test proposals endpoint
Invoke-WebRequest -UseBasicParsing -Uri http://localhost:3000/proposals | Select-Object -ExpandProperty Content
```

### Option C: curl (Git Bash)

```bash
curl http://localhost:3000/health
curl http://localhost:3000/ili/current
curl http://localhost:3000/proposals
```

### Expected Response Examples

**GET /health**
```json
{"status":"ok","timestamp":"2026-02-04T15:23:09.756Z"}
```

**GET /ili/current**
```json
{
  "value": 487.23,
  "timestamp": 1738656000000,
  "avgYield": 1250,
  "volatility": 320,
  "tvl": 35000000
}
```

**GET /proposals**
```json
{
  "proposals": [
    {
      "id": 4,
      "title": "ICR_UPDATE Proposal #4",
      "description": "Adjust based on market conditions",
      "policy_type": "icr_update",
      "status": "active",
      "yes_stake": 10000,
      "no_stake": 6000,
      "total_stake": 16000
    }
  ]
}
```

---

## Step 5: Start Frontend (Optional)

If you want to see the dashboard UI.

### Instructions:

1. **Open New Terminal**
   - Keep backend terminal running
   - Open a new terminal window

2. **Go to Frontend Folder**
   ```bash
   cd path/to/agentic-reserve-system/frontend
   ```

3. **Start Frontend**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   - Go to: http://localhost:5173
   - You should see the ARS Dashboard

---

## Troubleshooting

### Problem: "Table not found" error

**Solution**: You didn't run Step 1 (Create Database Tables)
- Go back to Supabase Dashboard
- Run the SQL migration
- Then try again

### Problem: "npm run dev:simple" not found

**Solution**: Use the direct command instead:
```bash
npx ts-node src/simple-server.ts
```

### Problem: Port 3000 already in use

**Solution**: Kill the existing process
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Git Bash
lsof -ti:3000 | xargs kill -9
```

### Problem: Seeding fails with "table not found"

**Solution**: Run Step 1 first (Create Database Tables)

### Problem: No data returned from API

**Solution**: Run Step 2 (Seed Database)

---

## Summary

After completing all steps, you should have:

✅ Database tables created in Supabase  
✅ Database seeded with 7 days of demo data  
✅ API server running on http://localhost:3000  
✅ 12 endpoints working and returning data  
✅ Frontend dashboard (optional) on http://localhost:5173  

**Demo is ready!** 🎉

---

## Quick Commands Reference

```bash
# Step 1: Create tables (via Supabase Dashboard)
# Copy SQL from: supabase/migrations/002_create_all_tables.sql

# Step 2: Seed database
cd backend
npm run seed
# OR
npx ts-node src/seed-database.ts

# Step 3: Start API server
npm run dev:simple
# OR
npx ts-node src/simple-server.ts

# Step 4: Test API
# Open in browser: http://localhost:3000/health

# Step 5: Start frontend (optional)
cd frontend
npm run dev
# Open in browser: http://localhost:5173
```

---

**Need Help?**
- Check `RUN_DEMO.md` for detailed guide
- Check `TASK_COMPLETION_SUMMARY.md` for technical details
- Review error messages carefully
- Make sure all steps are completed in order

**Last Updated**: February 4, 2026
