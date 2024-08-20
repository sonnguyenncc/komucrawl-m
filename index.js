const fs = require('fs'),
  { getFreeClientID: getFreeClientID, setToken: setToken } = require('play-dl'),
  {
    MezonClient: MezonClient
  } = require('mezon-sdk'),
  client = new MezonClient("594c67737675324859665a5867716d54"),
  util = require('util'),
  mongoose = require('mongoose');

client.config = require('./config.js');
client.footer = client.config.footer;
client.owners = [''];
getFreeClientID().then((e) => {
  setToken({ soundcloud: { client_id: e } });
});
mongoose
  .connect(client.config.database.MongoURL, client.config.database.options)
  .then(() => {
    console.log('[MongoDB]: Ready');
  })
  .catch((e) => {
    console.log('[MongoDB]: Error\n' + e);
  });

client.authenticate().then(e => {
  console.log("authenticated.", e);
  const moduleMsgCreate = require(`./events/mezon/messageCreate.js`);
  client.onMessage(event => moduleMsgCreate.execute(...event, client));
  //const moduleMsgReactionAdd = require(`./events/mezon/messageReactionAdd.js`);
  //client.onMessageReactionAdd(event => moduleMsgReactionAdd.execute(...event, client))
}).catch(e => {
  console.log("error authenticating.", e);
});
