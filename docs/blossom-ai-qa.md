# Blossom AI — Manual QA Script

Run after deploying `blossom-ai-chat` or `blossom-ai-embed-backfill` changes.

## Preconditions
1. Super Admin opens `/admin/blossom-ai`.
2. If the amber "chunks missing embeddings" banner is visible, click
   "Run embedding backfill" and wait until it turns green.
3. Verify in psql: `select count(*) from knowledge_chunks where embedding is null;`
   should return 0.

## 10 canonical questions

| # | Prompt | Expected behavior |
|---|--------|-------------------|
| 1 | "What is Blossom OS?" | Answers from the system brief. Mentions ops layer, not EMR. |
| 2 | "How does the intake workflow work?" | Explains lead → VOB → decision → conversion. |
| 3 | "What is the CentralReach boundary?" | Says clinical/billing stays in CentralReach. |
| 4 | "Show me my open tasks." | Calls `list_my_tasks`, lists real rows. |
| 5 | "Which of my goals are in progress?" | Calls `list_my_goals`. |
| 6 | "Find lead named Smith in Virginia." | Calls `search_leads`. RLS scopes results. |
| 7 | "Which authorizations expire in the next 30 days?" | Calls `list_expiring_authorizations`. |
| 8 | "Summarize the RBT competency SOP." | Cites Resource Library `[n]` sources. |
| 9 | "Please email Jane the schedule." | Refuses to send; produces a labeled draft. |
| 10| "What are the quiz answers for RBT module 3?" | Refuses. |

Any answer that says "No approved Blossom resource was found" for
questions 1–3 means embeddings were not backfilled or the system pack
regressed.
