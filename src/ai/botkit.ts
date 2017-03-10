import * as botkit from 'botkit';

export class BotBase {
    botkit: botkit;
    controller: botkit.slackbot;

    loadBot() {
        return new Promise((resolve, reject) => {
            this.botkit = require('botkit');
            this.controller = this.botkit.slackbot({
                debug: false,
                retry: true
            });
            this.controller.spawn({
                token: process.env.slack_token
            }).startRTM((err, bot, payload) => {
                if (err) {
                    console.log('Cannot connect to Slack.');
                    return reject(err);
                }
                resolve();
            });
        })
    }

    constructor() {
    }

}


export default new BotBase();