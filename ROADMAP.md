# Polar Edge Scouting - Competition Readiness Roadmap

**Target Date:** March 7, 2026
**Created:** February 8, 2026

---

## Current State Assessment

Polar Edge has a solid foundation: stand scouting forms, pit scouting with photo upload, auto path designer, TBA integration, team browser, organization/member management, and advanced database metrics (Goblin, RPMagic, Clank). However, several critical features needed for competition-day strategic advantage are missing or incomplete.

---

## Gap Analysis

### Critical Gaps (No Implementation Exists)

| Gap | Impact | Current State |
|-----|--------|---------------|
| **Alliance Selection / Picklist** | Cannot support alliance selection process at all | No code exists |
| **Data Visualization Dashboard** | Cannot visually interpret scouting data | Graphs page is a placeholder stub |
| **Team Ranking Leaderboard** | Advanced metrics (Goblin, RPMagic, Clank) are computed in DB views but invisible to users | DB views exist, no UI |
| **Match Preview / Strategy View** | No way to analyze upcoming opponents before a match | No code exists |
| **Offline / PWA Support** | App is unusable when competition WiFi drops | No service worker or manifest |

### Partially Implemented (Needs Completion)

| Gap | Impact | Current State |
|-----|--------|---------------|
| **Team Comparison** | Cannot compare robots side-by-side for strategy decisions | TODO comment in `/data/page.tsx` |
| **Data Export** | No way to share data in strategy meetings without laptops | DB supports it, no UI or API endpoint |
| **Scout Assignment** | Scouts self-select matches; risk of gaps or duplicates | `scoutMemberId` tracked but no assignment UI |

### Nice-to-Have Enhancements

| Gap | Impact | Current State |
|-----|--------|---------------|
| **Scout Reliability Scoring** | No way to detect outlier or inconsistent scout data | Consensus median exists but no outlier flagging |
| **Schedule + Opponent Analysis** | Drive team must manually cross-reference upcoming matches | TBA match data synced but no strategy overlay |

---

## Prioritized Roadmap

### Week 1: Feb 8 - Feb 14 — Analytics Foundation

The advanced metrics already exist in database views but have zero UI. This week surfaces them.

#### 1.1 Team Ranking Leaderboard
- [ ] Create `/data/rankings` page displaying all teams at the active event
- [ ] Display sortable columns: Team #, Goblin score, RPMagic (fuel + tower), Clank, Consensus Expected Points
- [ ] Add column explanations/tooltips so scouts understand what each metric means
- [ ] Support sorting by any metric column
- [ ] Highlight your organization's team

#### 1.2 Data Visualization Dashboard
- [ ] Create `/data/graphs` page with chart components (recommend Recharts)
- [ ] **Team Performance Chart**: Bar chart of expected points per team (fuel vs tower breakdown)
- [ ] **Match History Chart**: Line chart showing a team's scoring trend across matches
- [ ] **Cycle Distribution**: Histogram of BPS bucket distribution per team
- [ ] **Climb Success Rate**: Stacked bar of climb levels and success rates
- [ ] Wire charts to existing database views via server actions

#### 1.3 Team Detail Page Enhancements
- [ ] Add sparkline/mini-charts to the existing team detail page (`/data/teams/[team]`)
- [ ] Show Goblin, RPMagic, Clank metrics on team detail page
- [ ] Add match-over-match trend indicators (improving/declining)

---

### Week 2: Feb 15 - Feb 21 — Strategy Tools

These are the features your drive team and strategists will use between matches.

#### 2.1 Team Comparison Tool
- [ ] Create `/data/compare` page
- [ ] Allow selecting 2-6 teams for side-by-side comparison
- [ ] Radar chart comparing key metrics (scoring, climbing, consistency)
- [ ] Table view with all metrics for quick scanning
- [ ] Deep link support (URL params) so comparisons can be shared

#### 2.2 Match Preview / Strategy View
- [ ] Create `/data/matches` page listing upcoming matches for the active event
- [ ] For each match, show both alliances with key team metrics inline
- [ ] Highlight matches your team participates in
- [ ] Show predicted score totals (from `vMatchExpectedTotals`)
- [ ] Click-through to detailed match analysis with strengths/weaknesses per team
- [ ] Flag specific threats (e.g., high climbers, fast cyclers) for drive team awareness

#### 2.3 Scout Assignment System
- [ ] Create `/admin/assignments` page
- [ ] Allow admins to assign scouts to specific matches and robot positions
- [ ] Show coverage matrix: which matches have assigned scouts, which have gaps
- [ ] When a scout opens the stand form, auto-suggest their assigned match/position
- [ ] Track assignment completion status

---

### Week 3: Feb 22 - Feb 28 — Competition Day Features

These features are specifically needed during elimination rounds and alliance selection.

#### 3.1 Alliance Selection / Picklist Tool
- [ ] Create `/data/picklist` page
- [ ] **Auto-generated ranked list** based on composite score (weighted Goblin + RPMagic + Clank + Consensus)
- [ ] **Drag-and-drop reordering** for manual strategy adjustments
- [ ] **Tier system**: Group teams into "Must Pick", "Strong Pick", "Solid Pick", "Available", "Do Not Pick"
- [ ] **Crossed-off tracking**: Mark teams as already picked by other alliances during selection
- [ ] **Persistence**: Save picklist state to database per organization/event
- [ ] **Notes per team**: Quick-add notes visible during the live selection process
- [ ] **Multi-user sync**: Multiple strategists see the same live picklist state

#### 3.2 Data Export
- [ ] Add CSV export button on Rankings page (all teams + metrics)
- [ ] Add CSV export on Team Detail page (all match data for that team)
- [ ] Add PDF export for Picklist (printable one-pager for alliance selection table)
- [ ] Add CSV export for raw stand form data (for external analysis tools)

#### 3.3 Offline / PWA Support
- [ ] Add `manifest.webmanifest` with app metadata and icons
- [ ] Configure Next.js for service worker generation (next-pwa or Serwist)
- [ ] Cache critical pages: stand form, pit form, team list, rankings
- [ ] Implement offline form queue: save submissions to IndexedDB when offline, sync when reconnected
- [ ] Add online/offline status indicator in the UI
- [ ] Test on Android and iOS (common scouting devices)

---

### Week 4: Mar 1 - Mar 7 — Polish & Reliability

Final hardening before competition.

#### 4.1 Scout Data Quality
- [ ] Add outlier detection flagging on team detail pages (scout submissions that deviate significantly from consensus)
- [ ] Add scout leaderboard: number of forms submitted, consistency score
- [ ] Add admin view showing missing coverage (matches with <2 scout submissions)

#### 4.2 Mobile UX Hardening
- [ ] Audit all pages on 375px-width viewport (iPhone SE)
- [ ] Ensure stand form is fully usable one-handed (large tap targets, swipe navigation)
- [ ] Optimize page load performance (lazy load charts, reduce bundle size)
- [ ] Add pull-to-refresh on data pages

#### 4.3 Real-time Data Refresh
- [ ] Add auto-refresh on rankings and match preview pages (polling or SSE)
- [ ] Show "last updated" timestamps on data pages
- [ ] Add manual refresh button on all data pages

#### 4.4 End-to-End Testing
- [ ] Test full scouting workflow: form submission -> consensus -> rankings -> picklist
- [ ] Test with realistic data volume (60+ teams, 80+ qual matches)
- [ ] Test offline form submission and sync
- [ ] Load test with concurrent scout submissions
- [ ] Verify all exports produce correct data

---

## Priority Matrix

If time is limited, implement in this order:

| Priority | Feature | Rationale |
|----------|---------|-----------|
| **P0** | Team Ranking Leaderboard | Metrics already computed; just needs UI. Immediate strategic value. |
| **P0** | Alliance Selection / Picklist | THE most critical tool at competition. No workaround exists. |
| **P0** | Data Visualization Dashboard | Visual interpretation of data is essential for strategy meetings. |
| **P1** | Match Preview / Strategy View | Drive team needs this between every match. |
| **P1** | Team Comparison Tool | Required for alliance selection deliberation. |
| **P1** | Offline / PWA Support | Competition WiFi is unreliable. Offline forms prevent data loss. |
| **P2** | Data Export | Useful for print-outs during alliance selection. Workaround: screenshots. |
| **P2** | Scout Assignment System | Prevents coverage gaps. Workaround: spreadsheet or whiteboard. |
| **P3** | Scout Data Quality | Improves data reliability. Workaround: manual review. |
| **P3** | Mobile UX Hardening | Current responsive design is functional. This is polish. |
| **P3** | Real-time Refresh | Manual refresh is acceptable. This is convenience. |

---

## Technical Considerations

### Recommended Libraries
- **Charts**: [Recharts](https://recharts.org/) - already React-based, composable, good for the existing stack
- **Drag-and-drop**: [@dnd-kit](https://dndkit.com/) - lightweight, accessible, works well with React
- **PWA**: [Serwist](https://serwist.pages.dev/) or `next-pwa` - service worker generation for Next.js
- **PDF Export**: [jsPDF](https://github.com/parallax/jsPDF) or browser print-to-PDF
- **CSV Export**: Native `Blob` API (no library needed)

### Database
- All metric views (`vTeamGoblin`, `vTeamRpMagic`, `vTeamClank`, `vMatchExpectedTotals`) already exist and are queryable
- New tables needed:
  - `picklist` (organizationId, eventId, teamNumber, rank, tier, notes, crossedOff)
  - `scout_assignment` (organizationId, eventId, matchId, memberId, position)
- Consider materialized views if ranking queries become slow with high data volume

### Architecture Decisions
- Server Actions for all data mutations (consistent with existing patterns)
- Server Components for initial data fetch on ranking/comparison pages
- Client Components only for interactive elements (drag-and-drop, chart interactions)
- URL state for filters and comparison selections (shareable links)
