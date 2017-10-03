# tsql
A stupid stupid twitter client that uses sql commands to get tweets. Did I mention that this is totally stupid?

`node tsql.js "select id, text, created_at from gilmae where id between 1 and 900000000000000000"`

## What columns can I select
Any property of the tweet. But cannot link into sub-objects.

## What 'tables'
`home` is a protected keyword, just like on twitter.com, and uses the authenticated user's home timeline.
Anything else is treated as a screen name and searches that user's tweets.

### What about joins?
Can join media and hashtags. Fields on those tables are accessed as if part of the Tweet object. BEcause we can't link into sub-objects
Will always assume the first table mentioned is the desired timeline

## What filters can I use
`id` can be filtered using `<`, `>`, and `between`.
`include_retweets` is a boolean to filter retweets from the results.
`exclude_replies` is a boolean to filter replies from the results.

## LIMIT
Uses the MySql syntax for limiting

`LIMIT 2`
Returns 2 rows.

`LIMIT 1,2`
Returns 2 rows, offset by 1

TODO
* Further parsing of WHERE clauses into timeline filters
* Better Table joining. Should be able to handle LEF vs INNER joins
