let parse = require('node-sqlparser').parse;
let Twit = require('twit')

// Based on https://stackoverflow.com/a/43053803, but modified to do object merging
const f = (a,b, as) => a.map(aa=> b.map(bb=>Object.assign(JSON.parse(JSON.stringify(aa)),JSON.parse('{"' + as + '":' + JSON.stringify(bb)+ "}"))));
const cartesian = (a,b, as) => [].concat.apply([],f(a,b, as));

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
      case "retweeted":
        options.is_retweet = toBoolean(part.right.value);
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
    let twit_options = {count:200};

    
    switch (astObj.from[0]['table'].toLowerCase())
    {
      case "home":
        endpoint = "statuses/home_timeline";
        break;
      case "_faves":
      case "_likes":
      case "_favourites":
      case "_hearts":
        endpoint = "favorites/list"
        break
      default:
        endpoint = "statuses/user_timeline";
        twit_options.screen_name = astObj.from[0]['table'];
    }

    let joins = []

    for (var ii=1;ii<astObj.from.length;ii++)
    {
        joins.push(astObj.from[ii]['table'].toLowerCase());
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
        if (subkeys.length == 1)
        {
          if (tweet)
          {
            return tweet[key];
          }
          return null;

        }
        return GetValue(tweet[subkeys[0]], subkeys.slice(1).join('.'));
      }



      self.T.get(endpoint, twit_options, function(err, data, response)
      {
        if (twit_options.is_retweet != null)
        {
            data = data.filter((item)=>{
              return toBoolean(item.retweeted) == twit_options.is_retweet;
            })
        }

        var tweets = [];
        for (var ii=0;ii<data.length;ii++)
        {
          var ot = data[ii];
          var tweet = [data[ii]];

          if (ot.entities)
          {
            for (var i_joinTable = 0;i_joinTable<joins.length;i_joinTable++)
            {
                let join_table = joins[i_joinTable];
                if (ot.entities[join_table] && ot.entities[join_table].length > 0)
                {
                  tweet = cartesian(tweet,ot.entities[join_table], join_table);
                }
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
