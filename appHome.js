const axios = require('axios'); 
const qs = require('qs');

const JsonDB = require('node-json-db');

const apiUrl = 'https://slack.com/api';

//db.delete("/");

const updateView = async(user) => {
  
  // Intro message - 
  
  let blocks = [
		{
			"type": "header",
			"text": {
				"type": "plain_text",
				"text": ":wave: Welcome, Jennifer! Let's get started...",
				"emoji": true
			}
		},
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "Hey there! Good to see you here, Slack for CIB helps you get rich information from your Salesforce org. Start by connecting to your Salesforce account first."
			}
		},
		{
			"type": "actions",
			"elements": [
				{
					"type": "button",
					"text": {
						"type": "plain_text",
						"text": "Connect to Salesforce",
						"emoji": true
					},
					"style": "primary",
					"value": "connect_salesforce",
					"action_id": "connect_salesforce"
				}
			]
		},
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "<https://google.com|Or, connect to a sandbox instead>"
			}
		},
		{
			"type": "divider"
		},
		{
			"type": "header",
			"text": {
				"type": "plain_text",
				"text": "What can you do with Slack + Financial Services Cloud?",
				"emoji": true
			}
		},
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": ":package: View account details"
			}
		},
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": ":handshake: see past interactions"
			}
		},
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": ":alarm_clock: Get reminders for logging interaction summaries"
			}
		},
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": ":calendar: Log interaction summaries"
			}
		},
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": ":car: Get driving directions to your meeting location"
			}
		},
		{
			"type": "divider"
		},
		{
			"type": "header",
			"text": {
				"type": "plain_text",
				"text": "More",
				"emoji": true
			}
		},
		{
			"type": "actions",
			"elements": [
				{
					"type": "button",
					"text": {
						"type": "plain_text",
						"text": "Getting Started",
						"emoji": true
					},
					"value": "getting_started",
					"action_id": "getting_started"
				},
				{
					"type": "button",
					"text": {
						"type": "plain_text",
						"text": "Open Salesforce",
						"emoji": true
					},
					"value": "open_salesforce",
					"action_id": "open_salesforce"
				},
				{
					"type": "button",
					"text": {
						"type": "plain_text",
						"text": "Help & Settings",
						"emoji": true
					},
					"value": "help_settings",
					"action_id": "help_settings"
				},
				{
					"type": "button",
					"text": {
						"type": "plain_text",
						"text": "Learn More",
						"emoji": true
					},
					"value": "learn_more",
					"action_id": "learn_more"
				}
			]
		}
	];
  
  
  // Append new data blocks after the intro - 
  
  // let newData = [];
  
  // try {
  //   const rawData = db.getData(`/${user}/data/`);
    
  //   newData = rawData.slice().reverse(); // Reverse to make the latest first
  //   newData = newData.slice(0, 50); // Just display 20. BlockKit display has some limit.

  // } catch(error) {
  //   //console.error(error); 
  // };
  
  // if(newData) {
  //   let noteBlocks = [];
    
  //   for (const o of newData) {
      
  //     const color = (o.color) ? o.color : 'yellow';
      
  //     let note = o.note;
  //     if (note.length > 3000) {
  //       note = note.substr(0, 2980) + '... _(truncated)_'
  //       console.log(note.length);
  //     }
            
  //     noteBlocks = [
  //       {
  //         type: "section",
  //         text: {
  //           type: "mrkdwn",
  //           text: note
  //         },
  //         accessory: {
  //           type: "image",
  //           image_url: `https://cdn.glitch.com/0d5619da-dfb3-451b-9255-5560cd0da50b%2Fstickie_${color}.png`,
  //           alt_text: "stickie note"
  //         }
  //       },
  //       {
  //         "type": "context",
  //         "elements": [
  //           {
  //             "type": "mrkdwn",
  //             "text": o.timestamp
  //           }
  //         ]
  //       },
  //       {
  //         type: "divider"
  //       }
  //     ];
  //     blocks = blocks.concat(noteBlocks);
    
  //   }
    
  // }

  // The final view -
  
  let view = {
    type: 'home',
    title: {
      type: 'plain_text',
      text: 'Keep notes!'
    },
    blocks: blocks
  }
  
  return JSON.stringify(view);
};



/* Display App Home */

const displayHome = async(user, data) => {

  const args = {
    token: process.env.SLACK_BOT_TOKEN,
    user_id: user,
    view: await updateView(user)
  };

  const result = await axios.post(`${apiUrl}/views.publish`, qs.stringify(args));

  try {
    if(result.data.error) {
      console.log(result.data.error);
    }
  } catch(e) {
    console.log(e);
  }
};

module.exports = { displayHome};