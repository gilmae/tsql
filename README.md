# tsql
A stupid stupid twitter client that uses sql commands to get tweets. Did I mention that this is totally stupid?

`node tsql.js select text, created_at from gilmae`

## What columns can I select
Any property of the tweet. But cannot link into sub-objects

## What 'tables'
`home` is a protected keyword, just like on twitter.com, and uses the authenticated user's home timeline.
Anything else is treated as a screen name and searches that user's tweets.

### What about joins?
No.

## What filters can I use
`id` can be filtered using `<`, `>`, and `between`.
`include_retweets` is a boolean to filter retweets from the results.
`exclude_replies` is a boolean to filter replies from the results.

TODO
* Further parsing of WHERE clauses into timeline filters
* Table joining, maybe.
