# ProcureIntel India

**India-focused crude procurement intelligence platform** — generates 5–7 sourcing options, scores them across 6 criteria using real formulas, ranks with **TOPSIS (MCDA)**, optimizes for savings, and delivers human-approved recommendations to **SAP**.

Built for hackathon demos with production-grade system design principles.

---

## Architecture

```
[Data Sources] → [Graph Engine DAG] → [Option Generator] → [Feature Scorer]
       → [Decision Engine] → [TOPSIS Ranker] → [Optimizer] → [Recommendation]
       → [Human Approval] → [SAP OData] + [Dashboard WebSocket]
```

### Design principles

| Principle | Implementation |
|-----------|----------------|
| **Intelligence ≠ LLM** | Rankings from TOPSIS + Pareto. LLM optional for explanation only. |
| **Auditable scores** | Every criterion has a dedicated formula tracing to data. |
| **Human-in-the-loop** | Recommendations require explicit Approve before SAP PO. |
| **Event-driven** | Market triggers recompute full pipeline; WebSocket pushes to UI. |
| **India-specific** | Monsoon factor, Gulf risk, INR/USD, Mundra/Jamnagar ports. |

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for full system design.

---

## Quick Start

### Prerequisites

- Java 17+
- Node.js 18+
- Maven 3.8+

### 1. Start Backend (port 8080)

```bash
cd backend
mvn spring-boot:run
```

Backend auto-runs pipeline on startup. APIs:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/graph` | GET | DAG structure |
| `/api/pipeline/latest` | GET | Latest full result |
| `/api/pipeline/run` | POST | Re-run pipeline |
| `/api/pipeline/trigger` | POST | `{ "triggerType": "gulf_risk", "magnitude": 35 }` |
| `/api/weights` | GET/PUT | TOPSIS criteria weights |
| `/api/recommendations` | GET | History |
| `/api/recommendations/{id}/approve` | POST | Approve → SAP PO |
| `/api/recommendations/{id}/reject` | POST | Reject |
| `/ws` | WebSocket | STOMP topics: `/topic/pipeline`, `/topic/recommendations` |

### 2. Start Frontend (port 3000)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**

---

## Demo Script (90 seconds)

1. **Show live dashboard** — Final Price DAG, 5–7 ranked options, TOPSIS scores.
2. **Click "Gulf Risk Spike"** — watch Hormuz routes drop, rankings reshuffle live.
3. **Adjust weights** → "Prioritize Safety" — TOPSIS re-ranks without page refresh.
4. **Show Pareto chart** — green dots = non-dominated options; grey = provably worse.
5. **Read recommendation** — deterministic reasoning with ₹ savings estimate.
6. **Click Approve → SAP PO** — modal shows OData payload (mock S/4HANA).
7. **Key line:** *"Disable any LLM — rankings still update in real time."*

### Trigger types

| Trigger | Effect |
|---------|--------|
| `gulf_risk` | Blocks Hormuz routes, raises geo-risk |
| `weather` | High severity, impacts ETA |
| `congestion` | Port congestion, triggers demurrage optimizer |
| `oil_price` | Changes price advantage scores |
| `fx` | INR rate change, affects landed cost |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Spring Boot 3.2, Java 17 |
| Graph Engine | Custom DAG (topological recompute) |
| MCDA | TOPSIS + Pareto frontier |
| Optimizer | Rule-based tricks (timing, spot/term, FX, demurrage) |
| Decision Engine | Hard eligibility rules (pre-TOPSIS) |
| Database | H2 (dev) / Postgres (prod) |
| Real-time | Spring WebSocket (STOMP) |
| Frontend | Next.js 14, React Flow, Recharts, Tailwind |
| SAP | Mock OData PO (swap for S/4HANA) |

---

## Project Structure

```
hackathon-5/
├── backend/
│   └── src/main/java/com/procureintel/
│       ├── graph/          # Final Price DAG engine
│       ├── options/        # Combinatorial option generator
│       ├── scoring/        # Per-criterion feature formulas
│       ├── decision/       # Eligibility business rules
│       ├── mcda/           # TOPSIS + Pareto
│       ├── optimizer/      # Savings tricks
│       ├── recommendation/ # Template recommendations
│       ├── aggregation/    # Pipeline orchestrator
│       └── delivery/       # SAP, notifications, WebSocket
├── frontend/
│   ├── app/page.tsx        # Main dashboard
│   └── components/         # Graph, table, weights, approval
└── docs/ARCHITECTURE.md
```

---

## Production Roadmap

- [ ] Kafka event bus for multi-source ingestion
- [ ] LangGraph agent orchestration (data gathering only)
- [ ] OR-Tools LP for blend/route optimization
- [ ] Real SAP S/4HANA OData integration
- [ ] GDELT + MarineTraffic live feeds
- [ ] Flutter mobile + FCM push
- [ ] TimescaleDB for price history

---

## License

Hackathon project — MIT
# Hackathon
