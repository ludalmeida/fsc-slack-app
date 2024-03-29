// create an express app
const express = require("express")
const app = express()
const qs = require('qs')
var bodyParser = require('body-parser')
const https = require('https');
const axios = require('axios').default;
const slack_helper = require("./slack_helper");
const liveagent_helper = require("./liveagent_helper");
const NodeCache = require("node-cache");
const myCache = new NodeCache();
// use the express-static middleware
var jsonParser = bodyParser.json()
app.use(express.static("public"))
app.use(bodyParser.urlencoded({ extended: true }))

const apiUrl = 'https://slack.com/api';

const homeTab = require("./views/homeTab");

// Ludmyla's einstein bot from Jenna's account

var customerOrgId = "00D5e000001N1pB"; // FSC Einstein Bot
var customerButtonId = "5735e000000MNFi"; // FSC Einstein Bot
var customerDeploymentId = "5725e000000MMGe"; // FSC Einstein Bot
var customerApiVersion = 52;
var customerLiveAgentHost = "https://d.la4-c1-ia4.salesforceliveagent.com"; // new
var slackBotToken = "xoxb-2250368327255-2250462246311-NJDcMNZQaVauPgelRkrsmRf8"; // Ludmyla's app token
var botInitiationText = "hi";
var botEndText = "end";

var orgCommunityUrl = "https://botpilotsb-ewecitscr6.cs23.force.com/sample/s/article/";

app.post('/slack_interactive', jsonParser, function (req, res) {
  // receives this request when an end user clicks on buttons
  console.log("#### /slack_interactive received a message of type " + req.body.payload.type + " at " + new Date().toISOString());
  //console.log(req.body.payload);
  var slack_payload = JSON.parse(req.body.payload);
  if (slack_payload.type == "interactive_message") {
    console.log("## a button is clicked");
    console.log(slack_payload.actions[0]);
    var response_url = slack_payload.response_url;
    var indexClicked = parseInt(slack_payload.actions[0].value);
    var richResponseToBot = {
      "actions": [
        {
          "index": indexClicked,
          "type": "ChatWindowMenu"
        }
      ]
    }
    var currentEndUser = liveagent_helper.myCache.get(slack_payload.user.id);
    // end user does not have an active sessino in cache, ask them to start a new session
    if (currentEndUser == undefined) {
      var no_session_json = { "text": "Sorry, do not recognize your session, please type '" + botInitiationText + "' to start a new session" }
      res.json(no_session_json);
    } else {
      // end user has an existing session in cache, so send the rich response to bot
      liveagent_helper.sendRichResponseToBot(richResponseToBot, slack_payload.user, currentEndUser, customerLiveAgentHost, customerApiVersion, slackBotToken);
      var replay_back_json = { "text": slack_payload.actions[0].name }
      res.json(replay_back_json);
    }
  }

});

app.post('/slack_webhook', jsonParser, function (req, res) {
  // send only non challenge requests to bot
  if (req.body.challenge == undefined) {
    console.log("#### /slack_webhook received a message of type " + req.body.event.type + " at " + new Date().toISOString());
    console.log(req.body);
    // dont have to listen to bot messages back
    if (req.body.event.bot_id !== undefined) {
      res.sendStatus(200);
    } else {
      console.log("#### slack webhook just received an event at " + new Date().toISOString());
      console.log(req.body);
      var does_not_have_message_changed = true;
      if (req.body.event.type == "message") {
        if (req.body.event.subtype !== undefined && req.body.event.subtype == "message_changed") {
          does_not_have_message_changed = false;
        }
      }
      // ignore message_changed events
      if (does_not_have_message_changed) {
        // process only direct messages of type "message"
        if (req.body.event.type === "message" && req.body.event.channel_type != undefined && req.body.event.channel_type == "im") {
          console.log("### im message " + req.body.event.text);
          // start a new bot session when encountering the bot initiation text
          if (req.body.event.text == botInitiationText) {
            liveagent_helper.InitializeLaAPI(req.body.event.user, req.body.event.channel, customerApiVersion, customerLiveAgentHost, customerOrgId, customerDeploymentId, customerButtonId, slackBotToken);
          } else if (req.body.event.text == botEndText) {
            var slackUserId = req.body.event.user;
            var retriveCacheUser = liveagent_helper.myCache.get(slackUserId);
            console.log("### fetching from cache using user");
            console.log(retriveCacheUser);
            if (retriveCacheUser == undefined) {
              slack_helper.sendHowToInitateBot(req.body.event.channel, slackUserId, slackBotToken, botInitiationText);
            } else {
              liveagent_helper.myCache.del(slackUserId);
              liveagent_helper.endSessionLaAPI(req.body.event.user, req.body.event.channel, customerApiVersion, customerLiveAgentHost, customerOrgId, customerDeploymentId, customerButtonId, slackBotToken, retriveCacheUser.affinityToken, retriveCacheUser.sessionKey);
              slack_helper.sendPlainTextToBot(req.body.event.channel, slackUserId, slackBotToken, "Session ended.");
            }
          } else {
            // if the message does not have bot initiation text, consider it as a message into an existing session
            console.log("### message type event with body " + req.body.event.text);
            console.log("### sending event to Bot");
            var slackUserId = req.body.event.user;
            console.log("### fetching from cache using user");
            console.log(liveagent_helper.myCache.get(slackUserId));
            var retriveLACreds = liveagent_helper.myCache.get(slackUserId);
            console.log(retriveLACreds);
            // if the end user's slack user id is not exists in cache, they dont have a running session, ask them to start a new sesion with bot initiation text
            if (retriveLACreds == undefined) {
              // end customer typed a message without bot initiation text and without a prior session established
              slack_helper.sendHowToInitateBot(req.body.event.channel, slackUserId, slackBotToken, botInitiationText);
            } else {
              // end user has an existing session in cache, so this message should go into an existing bot session
              liveagent_helper.sendTextMessageToBot(req.body.event.user, req.body.event.text, retriveLACreds.sessionId, retriveLACreds.sessionKey, retriveLACreds.affinityToken, customerApiVersion, customerLiveAgentHost, retriveLACreds, slackBotToken);
            }
          }
        }
      }
      res.sendStatus(200);
    }
  } else {
    handleChallenge(req, res);
  }

});

function handleChallenge(req, res) {
  console.log("#### /slack_webhook received a challenge " + req.body.challenge + " at " + new Date().toISOString());
  var challenge_json = { "challenge": req.body.challenge }
  res.json(challenge_json);
}

app.post("/slack/events", async (req, res) => {
  
  // Verify the signing secret
  if (!signature.isVerified(req)) {
    res.sendStatus(404);
    return;
  }

  // console.log(req.body);

  switch (req.body.type) {
      
    case "app_rate_limited": {
      res.sendStatus(200);
      break;
    }

    case "url_verification": {
      // verify Events API endpoint by returning challenge if present
      res.send({ challenge: req.body.challenge });
      break;
    }

    case "event_callback": {
      
      res.sendStatus(200);
      
      const { type, user, channel, tab, text, subtype } = req.body.event;

      // See https://api.slack.com/events
      switch (type) {
          
        case "app_home_opened": {
          displayHomeTab(user);
          break;
        }

        case "app_mention":
        case "app_requested":
        case "app_uninstalled":
        case "call_rejected":
        case "channel_archive":
        case "channel_created":
        case "channel_deleted":
        case "channel_history_changed":
        case "channel_id_changed":
        case "channel_left":
        case "channel_rename":
        case "channel_shared":
        case "channel_unarchive":
        case "channel_unshared":
        case "dnd_updated":
        case "dnd_updated_user":
        case "email_domain_changed":
        case "emoji_changed":
        case "file_change":
        case "file_comment_added":
        case "file_comment_deleted":
        case "file_comment_edited":
        case "file_created":
        case "file_deleted":
        case "file_public":
        case "file_shared":
        case "file_unshared":
        case "grid_migration_finished":
        case "grid_migration_started":
        case "group_archive":
        case "group_close":
        case "group_deleted":
        case "group_history_changed":
        case "group_left":
        case "group_open":
        case "group_rename":
        case "group_unarchive":
        case "im_close":
        case "im_created":
        case "im_history_changed":
        case "im_open":
        case "invite_requested":
        case "link_shared":
        case "member_joined_channel":
        case "member_left_channel": 
        case "message": 
        case "message.app_home": 
        case "message.channels":
        case "message.groups":
        case "message.im":
        case "message.mpim":
        case "pin_added":
        case "pin_removed":
        case "reaction_added":
        case "reaction_removed":
        case "scope_denied":
        case "scope_granted":
        case "star_added":
        case "star_removed":
        case "subteam_created":
        case "subteam_members_changed":
        case "subteam_self_added":
        case "subteam_self_removed":
        case "subteam_updated":
        case "team_access_granted":
        case "team_access_revoked":
        case "team_domain_change":
        case "team_join":
        case "team_rename":
        case "tokens_revoked":
        case "url_verification":
        case "user_change":
        case "user_resource_denied":
        case "user_resource_granted":
        case "user_resource_removed":
        case "workflow_deleted":
        case "workflow_published":
        case "workflow_step_deleted":
        case "workflow_step_execute":
        case "workflow_unpublished": {
          break;
        }

        default: {
          break;
        }
      } // switch (type)
      break;
    } // case "event_callback"

    default: {
      res.sendStatus(404);
      break;
    }
  } // switch (req.body.type)
});


const displayHomeTab = async (user) => {
  const args = {
    token: process.env.SLACK_BOT_TOKEN,
    user_id: user,
    view: JSON.stringify(homeTab)
  };

  const result = await axios.post(`${apiUrl}/views.publish`, qs.stringify(args));
};

// app.post('/slack/events', async (req, res) => {
//   switch (req.body.type) {

//     case 'url_verification': {
//       // verify Events API endpoint by returning challenge if present
//       res.send({ challenge: req.body.challenge });
//       break;
//     }

//     case 'event_callback': {
//       // Verify the signing secret
//       if (!signature.isVerified(req)) {
//         res.sendStatus(404);
//         return;
//       }

//       // Request is verified --
//       else {

//         const { type, user, channel, tab, text, subtype } = req.body.event;

//         // Triggered when the App Home is opened by a user
//         if (type === 'app_home_opened') {
//           // Display App Home

//           try {
//             const args = {
//               token: process.env.SLACK_BOT_TOKEN,
//               user_id: user,
//               view: {
//                 "type": "home",
//                 "blocks": [
//                   {
//                     "type": "section",
//                     "text": {
//                       "type": "mrkdwn",
//                       "text": "A simple stack of blocks for the simple sample Block Kit Home tab."
//                     }
//                   },
//                   {
//                     "type": "actions",
//                     "elements": [
//                       {
//                         "type": "button",
//                         "text": {
//                           "type": "plain_text",
//                           "text": "Action A",
//                           "emoji": true
//                         }
//                       },
//                       {
//                         "type": "button",
//                         "text": {
//                           "type": "plain_text",
//                           "text": "Action B",
//                           "emoji": true
//                         }
//                       }
//                     ]
//                   }
//                 ]
//               }
//             }

//             await axios.post("https://slack.com/api/views.publish", qs.stringify(args));

//           } catch (e) {
//             console.log(e + "wtf is wrong");
//           }
//         }
//       }
//       break;
//     }
//     default: { res.sendStatus(404); }
//   }
// });

// start the server listening for requests
app.listen(process.env.PORT || 3000,
  () => console.log("Server is running..."));
