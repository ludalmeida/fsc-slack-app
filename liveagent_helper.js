const axios = require('axios').default;
const slack_helper = require("./slack_helper");
const https = require('https');
const NodeCache = require( "node-cache" );
const myCache = new NodeCache();

const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));

function sendRichResponseToBot(richResponse, currentSlackuser, currentEndUser, customerLiveAgentHost, customerApiVersion, slackBotToken){
  console.log("### sendRichResponseToBot method started...");
  // var currentEndUser = myCache.get(currentSlackuser.id);
  var currentEndUserLocal = myCache.get(currentSlackuser.id);
  console.log(currentEndUserLocal);
  currentEndUser = currentEndUserLocal;
  if (currentEndUserLocal == undefined){
    console.log("### could not find a corresponding LA session for this user "+ currentSlackuser.id);
  }else {
    const instance = axios.create({
                      headers: {'X-LIVEAGENT-API-VERSION': customerApiVersion, 'X-LIVEAGENT-AFFINITY': currentEndUser.affinityToken, 'X-LIVEAGENT-SESSION-KEY': currentEndUser.sessionKey},
                      httpsAgent: new https.Agent({
                        rejectUnauthorized: false
                      })
                    });
    instance.post(customerLiveAgentHost+'/chat/rest/Chasitor/RichMessage', richResponse,
      {
      }
    )
    .then(function (response) {
      console.log(" ### sendRichResponseToBot success liveagent_helper ");
      console.log("### will wait 7 secs before polling LA server");
      sleep(5000).then(() => {
        pollLAMessages(currentSlackuser.id, currentEndUser.sessionKey, currentEndUser.affinityToken, currentEndUser.sessionId, customerApiVersion, customerLiveAgentHost, currentEndUser, slackBotToken)
      });
      sleep(10000).then(() => {
        pollLAMessages(currentSlackuser.id, currentEndUser.sessionKey, currentEndUser.affinityToken, currentEndUser.sessionId, customerApiVersion, customerLiveAgentHost, currentEndUser, slackBotToken)
      });
      sleep(15000).then(() => {
        pollLAMessages(currentSlackuser.id, currentEndUser.sessionKey, currentEndUser.affinityToken, currentEndUser.sessionId, customerApiVersion, customerLiveAgentHost, currentEndUser, slackBotToken)
      });
    })
    .catch(function (error) {
      console.log("### sendRichResponseToBot request failed");
      console.log(error);
    });
  }
}


function pollLAMessages(slackUserId, chasitorKey, affinityToken, sessionId, customerApiVersion, customerLiveAgentHost, retrievedUserCache, slackBotToken){
  console.log("### pollLAMessages method started...");
  console.log("## logging slackUserId");
  console.log(slackUserId);
  const instance = axios.create({
    headers: {'X-LIVEAGENT-API-VERSION': customerApiVersion, 'X-LIVEAGENT-AFFINITY': affinityToken, 'X-LIVEAGENT-SESSION-KEY': chasitorKey},
    httpsAgent: new https.Agent({
      rejectUnauthorized: false
    })
  });
  instance.get(customerLiveAgentHost+'/chat/rest/System/Messages',
    {
    },
    {
    }
  )
  .then(function (response) {
    console.log(" ### LA poll for messages success response");
    console.log(response);
    slack_helper.postToSlack(slackUserId, response.data, retrievedUserCache, slackBotToken, myCache);
  })
  .catch(function (error) {
    console.log("### LA poll for messages request failed");
     console.log(error);
  });
}


function InitializeLaAPI(requestingEndUser, messageChannel, customerApiVersion, customerLiveAgentHost, customerOrgId, customerDeploymentId, customerButtonId, slackBotToken){
  console.log("### InitializeLaAPI method started...");
  const instance = axios.create({
                    headers: {'X-LIVEAGENT-API-VERSION': customerApiVersion, 'X-LIVEAGENT-AFFINITY': null},
                    httpsAgent: new https.Agent({
                      rejectUnauthorized: false
                    })
                  });
  instance.get(customerLiveAgentHost+'/chat/rest/System/SessionId',
    {
    },
    {
    }
  )
  .then(function (response) {
    console.log(" ### LA SessionID success response");
    //console.log(response);
    obj = { sessionKey: response.data.key, sessionId: response.data.id, affinityToken: response.data.affinityToken, apiVersion: customerApiVersion, messageChannel: messageChannel };
    success = myCache.set( requestingEndUser, obj, 1200 ); // expires in 20 minutes
    console.log("### retrieve from cache ");
    console.log(myCache.get(requestingEndUser));
    var retrievedUserCache = myCache.get(requestingEndUser);
    LAChasitorInit(requestingEndUser, response.data.key, response.data.id, response.data.affinityToken, customerApiVersion, customerOrgId, customerDeploymentId, customerButtonId, customerLiveAgentHost, retrievedUserCache, slackBotToken);
  })
  .catch(function (error) {
    console.log("### LA SessionID request failed");
    console.log(error);
  });
}

function LAChasitorInit(slackUserId, chasitorKey, sessionId, affinityToken, customerApiVersion, customerOrgId, customerDeploymentId, customerButtonId, customerLiveAgentHost, retrievedUserCache, slackBotToken){
  console.log("### LAChasitorInit method started...");
  const instance = axios.create({
    headers: {'X-LIVEAGENT-API-VERSION': customerApiVersion, 'X-LIVEAGENT-AFFINITY': affinityToken, 'X-LIVEAGENT-SESSION-KEY': chasitorKey},
    httpsAgent: new https.Agent({
      rejectUnauthorized: false
    })
  });
  instance.post(customerLiveAgentHost+'/chat/rest/Chasitor/ChasitorInit',
    {
      "organizationId": customerOrgId,
      "deploymentId": customerDeploymentId,
      "buttonId": customerButtonId,
      "doFallback": true,
      "sessionId": sessionId,
      "language": "en-US",
      "isPost": true,
      "screenResolution": "1900x1080",
      "prechatDetails": [],  "prechatEntities": [],
      "receiveQueueUpdates": true,
      "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1500.95 Safari/537.36"
    },
    {
    }
  )
  .then(function (response) {
    console.log(" ### LA Chasitor Init success response");
    //console.log(response.data);
    console.log("will wait for 7 secs before polling LA server");
    sleep(5000).then(() => {
      pollLAMessages(slackUserId, chasitorKey, affinityToken, sessionId, customerApiVersion, customerLiveAgentHost, retrievedUserCache, slackBotToken)
    });
    sleep(10000).then(() => {
      pollLAMessages(slackUserId, chasitorKey, affinityToken, sessionId, customerApiVersion, customerLiveAgentHost, retrievedUserCache, slackBotToken)
    });
    sleep(15000).then(() => {
      pollLAMessages(slackUserId, chasitorKey, affinityToken, sessionId, customerApiVersion, customerLiveAgentHost, retrievedUserCache, slackBotToken)
    });
  })
  .catch(function (error) {
    console.log("### LA Chasitor Init request failed");
    //console.log(error);
  });
}

function sendTextMessageToBot(slackUserId, botText, sessionId, sessionKey, affinityToken, customerApiVersion, customerLiveAgentHost, currentEndUser, slackBotToken){
  console.log("### sendTextMessageToBot method started...");
  const instance = axios.create({
                    headers: {'X-LIVEAGENT-API-VERSION': customerApiVersion, 'X-LIVEAGENT-AFFINITY': affinityToken, 'X-LIVEAGENT-SESSION-KEY': sessionKey},
                    httpsAgent: new https.Agent({
                      rejectUnauthorized: false
                    })
                  });
  instance.post(customerLiveAgentHost+'/chat/rest/Chasitor/ChatMessage',
    {
      "text": botText
    },
    {
    }
  )
  .then(function (response) {
    console.log(" ### sendTextMessageToBot success response");
    //console.log(response.data);
    console.log("### will wait for 7 secs before polling LA server");
    sleep(5000).then(() => {
      pollLAMessages(slackUserId, sessionKey, affinityToken, sessionId, customerApiVersion, customerLiveAgentHost, currentEndUser, slackBotToken)
    });
    sleep(10000).then(() => {
      pollLAMessages(slackUserId, sessionKey, affinityToken, sessionId, customerApiVersion, customerLiveAgentHost, currentEndUser, slackBotToken)
    });
    sleep(15000).then(() => {
      pollLAMessages(slackUserId, sessionKey, affinityToken, sessionId, customerApiVersion, customerLiveAgentHost, currentEndUser, slackBotToken)
    });
  })
  .catch(function (error) {
    console.log("### sendTextMessageToBot request failed");
    //console.log(error);
  });
}



function endSessionLaAPI(requestingEndUser, messageChannel, customerApiVersion, customerLiveAgentHost, customerOrgId, customerDeploymentId, customerButtonId, slackBotToken, affinityToken, sessionKey){
  console.log("### endSessionLaAPI method started...");
  const instance = axios.create({
                    headers: {'X-LIVEAGENT-API-VERSION': customerApiVersion, 'X-LIVEAGENT-AFFINITY': affinityToken, 'X-LIVEAGENT-SESSION-KEY': sessionKey},
                    httpsAgent: new https.Agent({
                      rejectUnauthorized: false
                    })
                  });
  instance.post(customerLiveAgentHost+'/chat/rest/Chasitor/ChatEnd',
    {
      "reason": "client"
    },
    {
    }
  )
  .then(function (response) {
    console.log(" ### endSessionLaAPI success response");
    //console.log(response);
    // obj = { sessionKey: response.data.key, sessionId: response.data.id, affinityToken: response.data.affinityToken, apiVersion: customerApiVersion, messageChannel: messageChannel };
    // success = myCache.set( requestingEndUser, obj, 1200 ); // expires in 20 minutes
    // console.log("### retrieve from cache ");
    // console.log(myCache.get(requestingEndUser));
    // var retrievedUserCache = myCache.get(requestingEndUser);
    // LAChasitorInit(requestingEndUser, response.data.key, response.data.id, response.data.affinityToken, customerApiVersion, customerOrgId, customerDeploymentId, customerButtonId, customerLiveAgentHost, retrievedUserCache, slackBotToken);
  })
  .catch(function (error) {
    console.log("### endSessionLaAPI request failed");
    console.log(error);
  });
}


module.exports = { sendRichResponseToBot, pollLAMessages, InitializeLaAPI, LAChasitorInit, myCache, sendTextMessageToBot, endSessionLaAPI};
