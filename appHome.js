const axios = require('axios'); 
const qs = require('qs');

const apiUrl = 'https://slack.com/api';

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