# API Reference

## Base URL
`http://localhost:5000`

## Endpoints

### 1. `POST /api/onboard/`
Generates initial synthetic transaction data server-side and returns an onboarding summary.
- **Body**: `{ "name": "string", "monthly_income": "number", "current_savings": "number", "city": "string", "spending_style": "string" }`

### 2. `POST /api/analytics/health-score`
Computes the 7-factor composite health score.
- **Body**: `{ "transactions": [...], "current_savings": "number", "monthly_income": "number" }`

### 3. `POST /api/analytics/anomalies`
Category-aware modified z-score with IQR fallback.
- **Body**: `{ "transactions": [...] }`

### 4. `POST /api/analytics/persona`
Hybrid rule-based + k-means clustering classification.
- **Body**: `{ "transactions": [...], "monthly_income": "number" }`

### 5. `POST /api/analytics/simulate`
Stochastic Monte Carlo modeling.
- **Body**: `{ "current_savings": "number", "monthly_savings_rate": "number", "expense": "number", "months": "number", "goal_target": "number" }`

### 6. `POST /api/analytics/heatmap-data`
Aggregates transactions by date.
- **Body**: `{ "transactions": [...] }`

### 7. `POST /api/analytics/net-worth`
Computes net worth and trend.
- **Body**: `{ "current_savings": "number", "investments": "number", "liabilities": "number", "transactions": [...], "monthly_income": "number" }`

### 8. `POST /api/transactions/ocr-receipt`
Extracts transaction details from a receipt image.
- **Body**: `{ "image": "base64 string" }`

### 9. `POST /api/goals/` & `PUT /api/goals/{id}`
Manage financial goals.

### 10. `POST /api/notifications/`
Smart notification queue generation.
