
#SHOPIFY get Product Information

Overview
--------

The API exposes the rest end points and queries and the GraphQl End points of shopify

Tech Stack
--------
- serverless
- nodejs (Es6)
- Babel
- Shopify GraphQl Client

API Specs

/products/{id}?after=`<CursorStr>`&count=`<Number>`

A sample Version could be found in 

https://06qjmkw811.execute-api.us-east-1.amazonaws.com/prod/products/gid%3A%2F%2Fshopify%2FProduct%2F1124591337587&count=25

Id Can be of two types
- with gid, but encoded (preferred)
- just number, the gid prefix will be appended