
var parse = require('node-sqlparser').parse;
var Twit = require('twit')

var args = process.argv.slice(2);
var sql = args.join(" ");

var astObj = parse(sql);
var config = require('./.config')

var T = new Twit(config.twitter);

T.get('statuses/user_timeline', { screen_name: astObj.from[0]['table'], count: 100 }, function(err, data, response) {
  for (var ii=0;ii<data.length;ii++)
  {
    for (var ij=0;ij<astObj.columns.length;ij++)
    {
      console.log(data[ii][astObj.columns[ij].expr.column] + "|");
    }

    console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
  }
})
