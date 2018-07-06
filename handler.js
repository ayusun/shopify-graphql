'use strict';
import GraphQLClient from 'graphql-js-client';

import types from './types.js';
import { EHOSTUNREACH } from 'constants';
global.fetch = require('node-fetch');

const uuid = require('uuid/v4');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

const s3 = new AWS.S3();

const SHOPIFY_PRODUCT_ID = "gid://shopify/Product/"
const SHOPITY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_GRAPHQL_URL = "https://testql.myshopify.com/admin/api/graphql"
const DEFAULT_VARIATIONS_COUNT = 100;

module.exports.getProducts = (event, context, callback) => {
  let prodId = event.pathParameters.id;
  let requestId = undefined
  let afterCursor = undefined
  let count = undefined

  if(event.queryStringParameters != undefined || event.queryStringParameters != null){
    afterCursor = event.queryStringParameters.after
    count = parseInt(event.queryStringParameters.count)
  }

  if(count == undefined || count == null || isNaN(count)){
    count = DEFAULT_VARIATIONS_COUNT;
  }

  let variationArgs
  if(afterCursor != undefined || afterCursor != null){
    variationArgs = {
      args: {first: count, after: afterCursor}
    }
  } else {
    variationArgs = {
      args: {first: count}
    }
  }
  
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
      product.addConnection('variants', variationArgs, (variant) => {
        variant.add('title')
        variant.add('price')
        //variant.add('available')
      });
    });
  });


  client.send(query).then(({model, data}) => {
    let res = {}
    if(data == undefined){
      res = {
        statusCode:404,
        body:undefined
      }
    } else {
      res = {
        statusCode: 200,
        body: JSON.stringify(data)
      }

    }
    s3.putObject({
      Bucket: process.env.BUCKET,
      Key: uuid() + ".json",
      Body: res.body
    }).promise().then(callback(null, res));
  });
  
};
