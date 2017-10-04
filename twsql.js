let parse = require('node-sqlparser').parse;
let Twit = require('twit')

// Based on https://stackoverflow.com/a/43053803, but modified to do object merging
const f = (a,b) => a.map(aa=> b.map(bb=>Object.assign(JSON.parse(JSON.stringify(aa)),JSON.parse(JSON.stringify(bb)))));
const cartesian = (a,b) => [].concat.apply([],f(a,b));

function toBoolean(value)
{
  return (value == 'true' || value == '1');
}

function parseWhere(part, options)
{
  if (part.left.hasOwnProperty('left'))
  {
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


// The original cartesian
//const f = (a, b) => [].concat(...a.map(d => b.map(e => [].concat(d, e))));
//const cartesian = (a, b, ...c) => (b ? cartesian(f(a, b), ...c) : a);

var Tsql = function (config) {
  if (!(this instanceof Tsql)) {
    return new Tsql(config);
  }
  var self = this;

  this.config = config;
  this.T = new Twit(config.twitter);

  this.query = (sql) => {
    let astObj = parse(sql);
    let endpoint = "statuses/home_timeline";

    let table = []
    let twit_options = {};

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

    let limitFrom = 0;
    let limitTo = 200;

    if (astObj.limit != null)
    {
      limitFrom = parseInt(astObj.limit[0].value);
      limitTo = parseInt(astObj.limit[1].value);
    }

    return new Promise(function(resolve, reject)
    {
      const GetValue = (tweet, key) => {
        let subkeys = key.split('.');
console.log(key);
        if (subkeys.length == 1){
          return tweet[key];
        }
        return GetValue(tweet[subkeys[0]], subkeys.slice(1).join('.'));
      }

      self.T.get('statuses/user_timeline', twit_options, function(err, data, response)
      {
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

        tweets = tweets.slice(limitFrom, limitTo + limitFrom);

        for (var ii=0;ii<tweets.length;ii++)
        {
          var row = {};
          for (var ij=0;ij<astObj.columns.length;ij++)
          {
            let column = astObj.columns[ij].expr.column;

            if (astObj.columns[ij].expr.table != "")
            {
               column = astObj.columns[ij].expr.table + "." + astObj.columns[ij].expr.column;
            }

            let column_name = column;

            if (astObj.columns[ij].as && astObj.columns[ij].as != "") {
              column_name = astObj.columns[ij].as;
            }
            row[column_name] = GetValue(tweets[ii], column);
          }
          table.push(row);
        }

        resolve(table);
      })
    })
  }
}

module.exports  = Tsql;
