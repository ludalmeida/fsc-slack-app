const axios = require('axios').default;
const https = require('https');

function convertMenuToSlackBlocks(menuItems, messageChannel){
  var result = {"channel": messageChannel, "attachments": [{ "fallback": "Please choose", "callback_id":"main_menu", "actions": [] }]}
  var element =	{
           "name": "name",
           "text": "text",
  					"type": "button",
  					"value": "click_me_123"
  }
  for(var i =0; i < menuItems.length; i++) {
    result.attachments[0].actions[result.attachments[0].actions.length] = {
            "name": menuItems[i].text,
            "text": menuItems[i].text,
             "type": "button",
             "value": i
    }
    if(i > 5){
      break;
    }
  }
    if(menuItems.length > 5){
      result.attachments[1] = { "fallback": "Please choose", "callback_id":"main_menu", "actions": [] };
      for(var i = 5; i < menuItems.length; i++) {
        result.attachments[1].actions[result.attachments[1].actions.length] = {
                "name": menuItems[i].text,
                "text": menuItems[i].text,
                 "type": "button",
                 "value": i
        }
    }


  }

  return result;
}



function postSyncTextMessageToSlack(retrievedUserCache, slackUserId, slackMessage, slackBotToken) {
  return new Promise((resolve, reject) => {
    console.log("### postSyncTextMessageToSlack method started...");
    console.log("### logging slack user id, and slackMessage");
    console.log(slackUserId);
    console.log(slackMessage);
    // var retrievedUserCache = myCache.get(slackUserId);
    // console.log("### logging retreived user cache");
    // console.log(retrievedUserCache);

    var prepapredText = slackMessage.message.text;
    if(slackMessage.message.text.includes("ARTICLE")){
      var articleText = slackMessage.message.text.substring(8)
      var articleJson = JSON.parse(articleText);
      var articleUrlSuffix = articleJson[0].urlName;
      var orgCommunityUrl = "https://botpilotsb-ewecitscr6.cs23.force.com/sample/s/article/";
      var articleUrl = orgCommunityUrl+articleUrlSuffix;
      prepapredText = articleUrl;
    }

    axios.post('https://slack.com/api/chat.postMessage',
      {
        'text': prepapredText,
        'channel': retrievedUserCache.messageChannel
      },
      {
        headers: {
        'Authorization': 'Bearer '+slackBotToken,
        'Content-Type': 'application/json',
        'Accept-Charset': 'application/json'
        }
      }
    )
    .then(function (response) {
      console.log(" ### postSyncTextMessageToSlack api success" + slackMessage.message.text);
      resolve("done!");
      // console.log(response);
    })
    .catch(function (error) {
      console.log("## postSyncTextMessageToSlack api failed");
      resolve("done!");
    //  console.log(error);
    });
  });
}

function postSyncRichMessageToSlack(retrievedUserCache, slackUserId, slackMessage, slackBotToken) {
  return new Promise((resolve, reject) => {
    console.log("### postSyncRichMessageToSlack method started...");
    // var retrievedUserChace = myCache.get(slackUserId);
    // console.log("### logging retreived user cache");
    // console.log(retrievedUserChace);

    var slackMessageBody = convertMenuToSlackBlocks(slackMessage.message.items, retrievedUserCache.messageChannel);
    console.log("### slack message body for buttons ");
    console.log(slackMessageBody);

    axios.post('https://slack.com/api/chat.postMessage',
      slackMessageBody,
      {
        headers: {
        'Authorization': 'Bearer '+slackBotToken,
        'Content-Type': 'application/json',
        'Accept-Charset': 'application/json'
        }
      }
    )
    .then(function (response) {
      console.log(" ### postSyncRichMessageToSlack api success");
      // console.log(response);
      resolve("done!");
    })
    .catch(function (error) {
      console.log("## postSyncRichMessageToSlack api failed");
      // console.log(error);
      resolve("done!");
    });
  });
}

async function postToSlack(slackUserId, sample_response, retrievedUserCache, slackBotToken, myCache) {
  console.log("### postToSlack method started...");
  // var retrievedUserCache = myCache.get(slackUserId);
  console.log("### logging retreived user cache");
  console.log(retrievedUserCache);
  console.log("### respose fro LA API");
  console.log(sample_response);
  for (slackMessage of sample_response.messages ) {
    if(slackMessage.type == "ChatMessage"){
      const contents = await postSyncTextMessageToSlack(retrievedUserCache, slackUserId, slackMessage, slackBotToken);
    }
    if(slackMessage.type == "RichMessage"){
      const contents = await postSyncRichMessageToSlack(retrievedUserCache, slackUserId, slackMessage, slackBotToken);
    }
    if(slackMessage.type == "ChatEnded"){
      sendPlainTextToBot(retrievedUserCache.messageChannel, slackUserId, slackBotToken, "Session Ended.");
      myCache.del(slackUserId);
    }
  }
}

function sendHowToInitateBot(messageChannelId, slackUserId, slackBotToken, botInitiationTextToUser){
  var notEstablishedUser = { "messageChannel": messageChannelId};
  var howToEstablishMessage = { message: {"text": "Please type '"+botInitiationTextToUser+"' to start a conversation"}};

    postSyncTextMessageToSlack(notEstablishedUser, slackUserId, howToEstablishMessage, slackBotToken);
}

function sendPlainTextToBot(messageChannelId, slackUserId, slackBotToken, plainText){
  var notEstablishedUser = { "messageChannel": messageChannelId};
  var plainTextMessage = { message: {"text": plainText}};
    postSyncTextMessageToSlack(notEstablishedUser, slackUserId, plainTextMessage, slackBotToken);
}


module.exports = { convertMenuToSlackBlocks, postSyncTextMessageToSlack, postSyncRichMessageToSlack, postToSlack, sendHowToInitateBot, sendPlainTextToBot};
