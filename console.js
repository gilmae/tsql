#!/usr/bin/env node

require('console.table');
const t = require('./tsql.js');
const config = require('./.config')
const sql = process.argv.slice(2).join(" ");
const tsql = new t(config);

tsql.query(sql).then(function(data){
  console.table(data);
});
