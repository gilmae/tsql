
var parse = require('node-sqlparser').parse;
var Twit = require('twit')
require('console.table');
var wrap = require('word-wrap');

var printOptions = {
  leftPadding: 2,
  rightPadding: 3
};

var args = process.argv.slice(2);
var sql = args.join(" ");

var astObj = parse(sql);
var config = require('./.config')

var T = new Twit(config.twitter);
var table = []
var twit_options = {screen_name: astObj.from[0]['table']};

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

console.log(twit_options)

T.get('statuses/user_timeline', twit_options, function(err, data, response) {
  for (var ii=0;ii<data.length;ii++)
  {
    var row = {};
    for (var ij=0;ij<astObj.columns.length;ij++)
    {
      var value = data[ii][astObj.columns[ij].expr.column];
      if (typeof vale === "string")
      {
          data[ii][astObj.columns[ij].expr.column] = wrap(value.padEnd(50));
          continue;
      }
      row[astObj.columns[ij].expr.column] = value;
    }
    table.push(row);
  }

  console.table(table);
})
