var parse = require('node-sqlparser').parse;
var Twit = require('twit')
require('console.table');
var wrap = require('word-wrap');

var printOptions = {
  leftPadding: 2,
  rightPadding: 3
};

// Based on https://stackoverflow.com/a/43053803, but modified to do object merging
const f = (a,b) => a.map(aa=> b.map(bb=>Object.assign(JSON.parse(JSON.stringify(aa)),JSON.parse(JSON.stringify(bb)))));
const cartesian = (a,b) => [].concat.apply([],f(a,b));

// The original cartesian
//const f = (a, b) => [].concat(...a.map(d => b.map(e => [].concat(d, e))));
//const cartesian = (a, b, ...c) => (b ? cartesian(f(a, b), ...c) : a);

var args = process.argv.slice(2);
var sql = args.join(" ");

var astObj = parse(sql);
var config = require('./.config')

var T = new Twit(config.twitter);
var table = []
var endpoint = "statuses/home_timeline";
var twit_options = {};

if (astObj.from[0]['table'].toLowerCase() != "home")
{
    endpoint = "statuses/user_timeline";
    twit_options.screen_name = astObj.from[0]['table'];
}

let join_media = false;
let join_hashtags = false;

for (var ii=1;ii<astObj.from.length;ii++)
{
   switch (astObj.from[ii]['table'].toLowerCase())
   {
      case "media":
        join_media = true;
        break;
      case "hashtags":
        join_hashtags = true;
        break;
   }
}

if (astObj.where != null)
{
  parseWhere(astObj.where, twit_options);
}

function parseWhere(part, options)
{
  if (part.left.hasOwnProperty('left')){
    parseWhere(part.left, options);
    parseWhere(part.right, options);
  }
  else
  {
    switch (part.left.column.toLowerCase())
    {
      case "id":
        switch (part.operator.toLowerCase())
        {

          case "<":
            options.max_id = part.right.value;
            break;
          case "between":
            options.since_id = part.right.value[0].value;
            options.max_id = part.right.value[1].value;
            break;
          case ">":
            options.since_id = part.right.value;
            break;
        }
        break;
      case "include_retweets":
        switch (part.operator.toLowerCase())
        {
            case "=":
              options.include_rts = toBoolean(part.right.value);
        }
        break;
      case "exclude_replies":
          switch (part.operator.toLowerCase())
          {
              case "=":
                options.exclude_replies = toBoolean(part.right.value);
          }
          break;
    }
  }
}

function toBoolean(value)
{
  return (value == 'true' || value == '1');
}

T.get('statuses/user_timeline', twit_options, function(err, data, response) {
  var tweets = [];

  for (var ii=0;ii<data.length;ii++)
  {
    var ot = data[ii];
    var tweet = [data[ii]];

    if (ot.entities)
    {
      if (join_media && ot.entities.media && ot.entities.media.length > 0)
      {
        tweet = cartesian(tweet,ot.entities.media);
      }

      if (join_media && ot.entities.hashtags && ot.entities.hashtags.length > 0)
      {
        tweet = cartesian(tweet,ot.entities.hashtags);
      }
    }

    tweets = tweets.concat(tweet);
  }

  for (var ii=0;ii<tweets.length;ii++)
  {
    var row = {};
    for (var ij=0;ij<astObj.columns.length;ij++)
    {
      var value = tweets[ii][astObj.columns[ij].expr.column];
      if (typeof vale === "string")
      {
          value = wrap(value.padEnd(50));
      }
      row[astObj.columns[ij].expr.column] = value;
    }
    table.push(row);
  }

  console.table(table);
})
