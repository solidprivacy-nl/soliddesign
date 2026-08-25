# Discovery Cost Note

The Phase-1 Google Places adapter requests only fields useful for immediate qualification:

```text
places.id
places.displayName
places.formattedAddress
places.nationalPhoneNumber
places.websiteUri
places.rating
places.userRatingCount
places.types
```

Current Google Places Text Search (New) documentation classifies phone, rating, review count and website URI as higher-tier fields than ID-only/basic discovery fields.

Therefore:

1. record API cost from the first live run;
2. keep the field mask explicit;
3. do not add fields without a qualification use case;
4. if cost becomes material, split discovery into a cheap first pass and targeted enrichment.

Primary source:
https://developers.google.com/maps/documentation/places/web-service/text-search
