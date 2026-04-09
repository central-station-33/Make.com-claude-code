# CC-Make-Retool

A unified automation stack for the Central Station real estate CRM, combining **Claude Code**, **Make.com**, and **Retool** to automate lead intake, qualification, and agent workflows.

---

## Overview

This repository connects three platforms:

| Platform | Role |
|----------|------|
| **Make.com** | Scenario automation — receives leads from WordPress forms, routes and qualifies them |
| **Claude (Anthropic)** | AI qualification — scores leads, assesses chain risk, generates agent notes |
| **Retool** | Internal dashboards — agent-facing UI for managing leads, chains, and campaigns |

---

## Scenarios

| File | Description |
|------|-------------|
| `scenarios/seller-lead-intake.json` | Seller-only lead intake from WordPress |
| `scenarios/chain-seller-intake.json` | Seller chain intake with risk assessment |

### Module Flow (all scenarios)
```
WordPress Form POST
  → Make.com Custom Webhook
  → Anthropic Claude (qualify / assess)
  → JSON Parse
  → PostgreSQL Insert (Supabase)
  → HTTP Notify (Edge Function)
  → Webhook Response
```

---

## Edge Functions

Deployed to Supabase. Each function is called by Make.com's HTTP module.

| Function | Endpoint | Purpose |
|----------|----------|---------|
| `process-seller-lead` | `/functions/v1/process-seller-lead` | Seller lead intake + Claude qualification |
| `process-chain-lead` | `/functions/v1/process-chain-lead` | Seller chain intake + chain risk assessment |
| `handle-agent-interaction` | `/functions/v1/handle-agent-interaction` | AI agent chat (Claude Haiku) |
| `send-sms` | `/functions/v1/send-sms` | Twilio SMS to leads |
| `process-inbound-email` | `/functions/v1/process-inbound-email` | Email-to-lead conversion |

---

## Setup

### 1. Supabase Edge Functions

Deploy all functions:
```bash
supabase functions deploy process-seller-lead
supabase functions deploy process-chain-lead
supabase functions deploy handle-agent-interaction
```

Set secrets:
```bash
supabase secrets set ANTHROPIC_API_KEY=your_key
supabase secrets set TWILIO_ACCOUNT_SID=your_sid
supabase secrets set TWILIO_AUTH_TOKEN=your_token
supabase secrets set TWILIO_PHONE_NUMBER=your_number
supabase secrets set RESEND_API_KEY=your_key
```

### 2. Make.com Scenarios

1. Go to Make.com → **Create a new scenario** → **Import Blueprint**
2. Upload the relevant JSON from the `scenarios/` folder
3. Configure each module:

| Module | What to set |
|--------|------------|
| Webhooks (trigger) | Generate new webhook URL |
| Anthropic Claude | Connect your Anthropic API key |
| PostgreSQL | Supabase DB connection (`db.YOUR_REF.supabase.co`, port `5432`) |
| HTTP | Replace `YOUR_PROJECT_REF` and `YOUR_SUPABASE_ANON_KEY` |

### 3. Retool

Connect Retool to Supabase using the PostgreSQL resource:
- **Host:** `db.YOUR_PROJECT_REF.supabase.co`
- **Port:** `5432`
- **Database:** `postgres`
- **User:** `postgres`
- **Password:** your Supabase DB password

---

## Environment Variables

| Variable | Used by |
|----------|---------|
| `ANTHROPIC_API_KEY` | All Claude-powered edge functions |
| `SUPABASE_URL` | All edge functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge functions requiring DB writes |
| `SUPABASE_ANON_KEY` | Make.com HTTP module headers |
| `TWILIO_ACCOUNT_SID` | `send-sms` |
| `TWILIO_AUTH_TOKEN` | `send-sms` |
| `TWILIO_PHONE_NUMBER` | `send-sms` |
| `RESEND_API_KEY` | Email functions |

---

## Lead Types

| Type | Source | Scenario |
|------|--------|----------|
| `BUYER` | WordPress buyer form | Buyer Lead Intake |
| `SELLER` | WordPress seller form | Seller Lead Intake |
| `SELLER` (chain) | WordPress chain form | Seller Chain Intake |

### Claude Qualification Output

**Seller leads:** `lead_score` (hot / warm / cold), `follow_up_priority`, `summary`, `notes`

**Chain leads:** `chain_risk` (low / medium / high), `follow_up_priority`, `weak_links`, `recommended_action`

---

## Repository Structure

```
├── scenarios/
│   ├── seller-lead-intake.json       # Make.com seller scenario blueprint
│   └── chain-seller-intake.json      # Make.com chain scenario blueprint
├── supabase/
│   └── functions/
│       ├── process-seller-lead/
│       ├── process-chain-lead/
│       ├── handle-agent-interaction/
│       ├── send-sms/
│       └── process-inbound-email/
└── src/                              # Retool-connected React CRM frontend
```
