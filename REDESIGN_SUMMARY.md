# ProcureIntel Command Center - Design Transformation

## Overview
Complete redesign of the ProcureIntel dashboard into an enterprise-grade **Command Center** following Bloomberg/Palantir design principles. The interface transforms from a traditional dashboard into a **map-first operations center** with real-time shipping visualization and AI-powered procurement recommendations.

## Layout Architecture

### Primary View: 65/35 Split
- **Left (65%)**: Interactive Maplibre GL map with live vessel tracking, shipping routes, and port locations
- **Right (35%)**: Recommendation panel with supplier cards, decision reasoning, and approval controls

### Header: Bloomberg-Style Market Ribbon
- **Live Market Data**: Brent Crude, WTI, Spread, Volatility with trend indicators
- **Status Indicators**: Live status pill with pulsing glow animation
- **Timestamp**: Last update time for market data

## Color Palette

### Premium Dark Theme (#05080F)
- **Background**: `#05080F` (deep navy black)
- **Surface**: `#0A0E1A` (slightly lighter for contrast)
- **Foreground**: `#E8EAED` (off-white for readability)

### High-Contrast Accents
| Color | Hex | Usage |
|-------|-----|-------|
| Cyan | `#00D9FF` | Primary highlights, active states |
| Green | `#00E676` | Success, low risk, approval |
| Orange | `#FF9800` | Volatility, warning states |
| Red | `#FF5252` | Risk, rejection, errors |
| Purple | `#A855F7` | Developer mode, advanced features |

## Component Architecture

### 1. **CommandCenter** (Main Container)
Entry point that manages state and orchestrates all sub-components.

```
- Market ribbon (top)
- Map (left 65%)
- Recommendation panel (right 35%)
- Dev mode overlay (conditional)
```

### 2. **MarketRibbon** (Header)
Real-time market data visualization with Bloomberg-style layout.

**Features:**
- Dual commodity pricing (Brent/WTI) with live updates
- Percentage change indicators with trend arrows
- Spread and volatility metrics
- Live indicator pill with pulsing animation
- Time-based updates

### 3. **ShippingMap** (Maplibre GL)
Interactive map showing live vessel positions and shipping routes.

**Features:**
- 3D map with 25° pitch and bearing for depth perception
- Vessel markers with names and status
- Origin (green) and destination (orange) port markers
- Dashed shipping routes with cyan glow for selected vessel
- Great-circle routing visualization
- Interactive camera controls (zoom, pan, rotate)

### 4. **SupplierCards** (Selection Interface)
Interactive cards for the top 3 recommendations, ranked by TOPSIS score.

**Features:**
- Rank badge (gold star for #1)
- Risk level badges (Low/Medium/High with color coding)
- Key metrics: ETA, Price, Savings
- Mini criterion bars for quick evaluation
- Selected state with cyan glow border
- Hover effects and smooth transitions

### 5. **DecisionExplanation** (Detailed View)
Expanded reasoning and technical details for selected recommendation.

**Features:**
- Natural language decision reasoning
- Estimated savings highlight (green background)
- Full criteria breakdown with percentage bars
- SAP OData payload (in developer mode)
- Toggle for technical payload visibility

### 6. **RecommendationPanel** (Right Sidebar)
Complete recommendation workflow panel.

**Features:**
- Supplier card selection
- Decision explanation section
- Approval/Rejection buttons
- Status messages and confirmations
- Scrollable content with fixed header/footer

### 7. **DeveloperMode** (Overlay)
Technical information for procurement engineers.

**Features:**
- Route analysis with distance/status
- Vessel telemetry
- TOPSIS score breakdowns
- SAP integration details

## Key UX Patterns

### 1. Map-First Design
- Primary focus on shipping routes and vessel positions
- Real-time tracking visual feedback
- Destination port highlighting with orange markers
- Origin port highlighting with green markers

### 2. Progressive Disclosure
- **Normal View**: Simplified supplier cards with visual indicators
- **Developer Mode**: Full TOPSIS scores, payload generation, route analysis
- **Decision Reasoning**: Expandable explanation with criteria breakdown

### 3. Color-Coded Risk
```
Risk Level → Border Color → Background Tint
Low         → Green        → Green/10%
Medium      → Orange       → Orange/10%
High        → Red          → Red/10%
```

### 4. Interactive Selection
- Click supplier card → highlights corresponding route on map
- Route on map highlights supplier recommendation
- Bidirectional selection sync

### 5. One-Click Operations
- Approve button → Generates SAP OData → Creates PO
- Reject button → Resets recommendation selection
- Feedback messages confirm SAP integration

## Animations & Micro-interactions

### Glow Effects
- Cyan glow on selected cards and routes
- Pulsing animation on "Live" indicator
- Box-shadow animations for depth

### Transitions
- Smooth 200ms transitions on hover
- Fade-in animations for new content
- Slide-up animation for notifications

### Visual Hierarchy
- Brightness/opacity changes on hover
- Color intensity increases on selection
- Size increases on active states

## Technical Implementation

### Stack
- **Framework**: Next.js 16 with Turbopack
- **Mapping**: Maplibre GL (open-source)
- **Styling**: Tailwind CSS v4 with CSS variables
- **State**: React hooks with local state management
- **Types**: Full TypeScript support

### CSS Architecture
```css
/* Root theme variables in globals.css */
:root {
  --background: #05080F;
  --surface: #0A0E1A;
  --cyan: #00D9FF;
  --green: #00E676;
  /* ... */
}

/* Component-level Tailwind classes */
className="bg-surface border border-border-light"
```

### File Structure
```
components/
├── command-center.tsx       # Main orchestrator
├── market-ribbon.tsx        # Bloomberg-style header
├── shipping-map.tsx         # Maplibre GL integration
├── recommendation-panel.tsx # Right sidebar container
├── supplier-cards.tsx       # Selection cards
├── decision-explanation.tsx # Detailed reasoning
└── developer-mode.tsx       # Technical overlay
```

## Live Data Integration Points

### Market Data (MarketRibbon)
```javascript
{
  brentCrude: 87.42,
  brentChange: 2.8,      // %
  wtiCrude: 82.15,
  wtiChange: 1.9,        // %
  spread: 5.27,
  volatility: 18.3,      // %
  updatedAt: Date,
}
```

### Shipping Routes (ShippingMap)
```javascript
{
  id: "route-1",
  origin: { name, lng, lat },
  destination: { name, lng, lat },
  vessel: string,
  eta: string,           // "18 Jan 2026"
  distance: number,      // km
  status: "transit" | "loading" | "idle",
  heading: number,       // degrees
}
```

### SAP Integration Output
```javascript
{
  vendor: "Gulf Energy Trading",
  material: "CRUDE_OIL_BRENT",
  quantity: 1000,
  quantityUnit: "BBL",
  netPrice: 85.92,
  currency: "USD",
  deliveryLocation: "Paradip Port, India",
  expectedDeliveryDate: "18 Jan 2026",
  sourcePort: "Ras Al Khaimah",
  vessel: "MT Marjan Explorer",
  paymentTerms: "LC at Sight",
  incoTerms: "CIF",
}
```

## Future Enhancements

### Phase 2: Live Data
- [ ] WebSocket integration for real-time market data
- [ ] Live AIS vessel tracking (integrate with Spire or similar)
- [ ] Weather overlays on map
- [ ] Geopolitical risk layers

### Phase 3: Advanced Analytics
- [ ] Scenario simulator component
- [ ] Cost breakdown visualization
- [ ] Event timeline (price alerts, delivery milestones)
- [ ] Historical trend analysis

### Phase 4: Procurement Integration
- [ ] Direct SAP connection via OData
- [ ] Multi-leg route optimization
- [ ] Supplier performance scoring
- [ ] Contract management interface

## Performance Optimizations

- **Maplibre Rendering**: GPU-accelerated vector tiles
- **Component Splitting**: Lazy loading of decision explanation
- **CSS Variables**: Efficient theme switching without re-renders
- **Image Optimization**: MapTile caching via CDN

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (responsive at 375px width)

## Deployment

The Command Center is built as a standalone Next.js application and can be deployed to Vercel with zero configuration:

```bash
vercel deploy
```

API endpoints can be added as route handlers in `app/api/` directory to:
- Fetch live market data
- Poll vessel positions
- Create SAP purchase orders
- Log approval workflows

---

**Status**: Production-ready with mock data. Ready for API integration and live data feed implementation.
