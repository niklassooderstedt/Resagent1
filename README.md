# DestyPoint v1.5

Based directly on the supplied ResAgent_v1.4_CLEAN package.

## v1.5 changes
- Rebranded to DestyPoint.
- Added italic subtitle: "Din AI-baserade resebyrå".
- The description field is the central input for destination, people, budget, activities and preferences.
- No automatic activities are inserted from destination/trip type; an activity only appears when the user explicitly mentions it.
- Accommodation output explicitly distinguishes prototype estimates from live supplier prices.
- Prepared the result structure for future hotel API integration with hotel name, room type, price, date and source/provider.
- Preserved the existing v1.4 natural-language parsing and Swedish transport prototype.

## Important
This prototype does not contain a live hotel API. It therefore must not present an estimated hotel price as a live fetched supplier price.
