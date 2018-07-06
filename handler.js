'use strict';
import GraphQLClient from 'graphql-js-client';

import types from './types.js';
global.fetch = require('node-fetch');

const uuid = require('uuid/v4');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const s3 = new AWS.S3();

const SHOPIFY_PRODUCT_ID = "gid://shopify/Product/"
const SHOPITY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_GRAPHQL_URL = "https://testql.myshopify.com/admin/api/graphql"

module.exports.getProducts = (event, context, callback) => {

  let prodId = event.pathParameters.id;
  let requestId = undefined
  if(!isNaN(prodId)){
    requestId = SHOPIFY_PRODUCT_ID + prodId
  } else {
    requestId = decodeURIComponent(prodId)
  }
  
  const client = new GraphQLClient(types, {
    url: SHOPIFY_GRAPHQL_URL,
    fetcherOptions: {
      headers: {'X-Shopify-Access-Token': SHOPITY_ACCESS_TOKEN}
    }
  });

  const query = client.query((root) => {
    root.add('product', {args: {id: requestId}}, (product) => {
      product.add('id');
      product.add('productType')
      product.addConnection('variants', {args: {first: 100}}, (variant) => {
        variant.add('title')
        variant.add('price')
      });
    });
  });


  client.send(query).then(({model, data}) => {
    let res = {
      statusCode: 200,
      body: JSON.stringify(data)
    }
    s3.putObject({
      Bucket: process.env.BUCKET,
      Key: uuid() + ".json",
      Body: res.body
    }).promise().then(callback(null, res));
  });
  
};
