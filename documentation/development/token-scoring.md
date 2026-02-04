Version 1.8 — January 2026

Close
Overview
The Market Score evaluates on-chain and market metrics only—liquidity, holder distribution, trading activity, and token age. Scores range from 0-100, providing a measure of market health and maturity.

Important: This score does NOT assess team legitimacy, project fundamentals, or protection against rugs/scams. A high score means strong market metrics, not that a token is "safe." Always DYOR.

Grades
Grade	Range	Label	Description
A	85-100	Trusted	Strong market metrics. Healthy liquidity, trading activity, and holder distribution.
B	70-84	Developing / Speculative	Mixed metrics. "Developing" if < 6 months old, "Speculative" if older.
C	0-69	Volatile	Poor market data. Limiting factors detected or weak metrics across the board.
Scoring Components
Component	Weight	Measures
Liquidity Health	35.3%	Trade execution without slippage
Holder Distribution	23.5%	Ownership spread across wallets
Trading Activity	23.5%	Healthy, organic volume
Holder Count	17.6%	Unique wallet addresses
Total: 85 points, normalized to 0-100 scale.

Linear Interpolation
All component scores use linear interpolation between thresholds. Scores transition smoothly—small metric improvements yield small score improvements with no arbitrary cliff edges.

Example: $7.5M liquidity scores 90% (midpoint between $5M at 80% and $10M at 100%), not a flat 80%.

1. Liquidity Health
Measures ability to trade without significant price impact. Uses a two-tier system: absolute liquidity (USD in pools) and relative liquidity (% of market cap). Higher score is used.

$100K Floor: Tokens below $100K absolute liquidity cap at 20% on ratio scoring.

Absolute Liquidity
Liquidity	Score
≥ $10M	100%
$5M	80%
$1M	60%
$500K	40%
$100K	20%
< $100K	→ 0%
Scores interpolate linearly between thresholds.

Ratio (Liquidity / Market Cap)
Ratio	Score
≥ 5%	100%
3%	80%
1%	60%
0.5%	40%
0.1%	20%
< 0.1%	→ 0%
2. Holder Distribution
Measures ownership concentration among top holders. Lower concentration = higher score. Protocol accounts (DEX pools, lending vaults, staking contracts) are filtered out.

Top 10 %	Score	Status
≤ 20%	100%	Excellent
30%	80%	Good
40%	60%	Moderate
50%	40%	High
≥ 80%	0%	Whale dominance
Stablecoins and xStocks exempt—concentrated holdings are expected.

3. Trading Activity
Measures whether volume is healthy and organic. Two-tier system: absolute volume (7d USD) and volume/liquidity ratio.

Absolute Volume (7d)
Volume	Score
≥ $5M	100%
$1M	80%
$500K	60%
$100K	40%
$50K	20%
< $50K	→ 0%
Volume / Liquidity Ratio
Uses a "sweet spot" model—both low and high ratios are penalized:

Ratio	Score	Status
0.5x - 4x	100%	Healthy (sweet spot)
0.3x - 0.5x	70% → 100%	Ramping up
4x - 5x	100% → 70%	Ramping down
0.1x - 0.3x	40% → 70%	Low activity
5x - 7x	70% → 40%	Elevated
< 0.1x	→ 40%	Very low
> 7x	0%	Unusual volume
4. Holder Count
Counts unique wallet addresses. Higher thresholds resist sybil attacks.

Holders	Score	Status
≥ 5,000	100%	Strong community
2,000	80%	Good adoption
1,000	60%	Growing
500	40%	Early stage
200	20%	Very early
< 200	→ 0%	Minimal
Limiting Factors
Conditions that cap the maximum score regardless of other metrics. These use hard thresholds (no interpolation).

Caps to Grade C (Max: 69)
Condition	Threshold
Concentrated Ownership	> 80% top 10
Low Holders	< 20 holders
Inactive	< $100 daily volume
Low Liquidity	< $1,000
New Token	< 1 day old
Low Market Cap	< $100K
Multiple Risk Signals	4+ borderline metrics
Insufficient Data	Missing required data
Caps to Grade B (Max: 84)
Condition	Threshold
High Concentration	> 50% top 10
Unusual Volume	> 9x vol/liq
Young Token	< 1 week old
Elevated Risk	3 borderline metrics
Multiple caps: lowest cap applies.

Composite Signal Detection
Tokens where multiple metrics are "borderline" (passing individual thresholds but still weak) receive additional caps. This catches tokens that game individual metrics while having overall poor market health.

Borderline Thresholds
Metric	Borderline Range
Holder Count	20-500
Concentration	40-50% top 10
Liquidity	$100K-$200K
Market Cap	$100K-$500K
Volume	$100-$10K
Token Age	1-4 weeks
Stablecoins and xStocks exempt from concentration borderline check.

3 borderline signals → Elevated Risk (Grade B max). 4+ borderline signals → Multiple Risk Signals (Grade C max). Metrics already triggering individual caps are not double-counted.

Trusted Launch
Curated tokens (Majors, DeFi, Cults, etc.) that launched publicly within the last 3 weeks receive a "Trusted Launch" designation. This prevents legitimate high-profile launches from being marked as high risk due to early-stage metrics.

Minimum Grade B: Score floor of 70, overriding Grade C caps
Label: Shows "Trusted Launch" instead of "Speculative"
Duration: First 3 weeks after public launch
Grade A: Still achievable if metrics are excellent
After 3 weeks, tokens use normal trust score calculations.

Special Cases
Stablecoins: Exempt from holder concentration penalties (issuer reserves expected)
xStocks: Exempt from holder concentration penalties (custodian holdings expected)
LSTs: Liquid Staking Tokens are exempt from holder concentration penalties (staking protocols naturally hold large positions)
Insufficient Data: Tokens with <$1K liquidity or market cap score 0
What This Score Cannot Detect
Rug pulls or exit scams: Malicious intent is not visible in market data
Team legitimacy: No assessment of founders, roadmap, or project fundamentals
Smart contract risks: Code vulnerabilities or exploits are not analyzed
Market manipulation: Sophisticated actors may artificially inflate metrics
Future performance: Past market data does not predict future outcomes
This is a point-in-time snapshot based solely on observable market metrics. Scores can change rapidly. Always conduct your own research.