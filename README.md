# tsql
A stupid stupid twitter client that uses sql commands to get tweets. Did I mention that this is totally stupid?

```
const config = {
  "twitter" : {
    "consumer_key": "",
    "consumer_secret": "",
    "access_token": "",
    "access_token_secret": ""
  }
}

const t = require('./twsql.js');
const tsql = new t(config);

tsql.query("select id, text from home").then(function(data){
  console.log(data);
});
```

or from the command line

```
chmod 755 console.js
./console.js select id, text, created_at from home where id between 1 and 900000000000000000 limit 10
```

## What columns can I select
Any property of the tweet. Can link into sub-objects as if they were joined tables. e.g.

`select user.name from home`

Child objects of the [Tweet object](https://developer.twitter.com/en/docs/tweets/data-dictionary/overview/tweet-object) are implicitly 'joined'.

Can use the `as` keyword to alias the columns.

## What 'tables'
`home` is a protected keyword, just like on twitter.com, and uses the authenticated user's home timeline.
Anything else is treated as a screen name and searches that user's tweets.

### What about joins?
Can join media and hashtags. Fields on those tables are accessed as if they are joined tables. e.g.
`select media.media_url from home join media`
or
`select hashtags.text from home join hashtags`

The timeline being queried will always be assumed to the first table in the from list.

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
* Better Table joining. Should be able to handle LEFT vs INNER joins
* ORDER BY
* The rest of the entities object, co-ordinates objects, and other sub-objects that are arrays.
