import * as watson from 'watson-developer-cloud';
import { BotBase } from './botkit';

class WatsonBase extends BotBase {

    conversations;
    context: object = {}

    loadConversations() {
        return new Promise((resolve, reject) => {
            var conversation = watson.conversation({
                username: process.env.conv_username,
                password: process.env.conv_password,
                version: 'v1',
                version_date: '2016-09-20'
            });
            this.conversations = conversation;
            resolve();
        })

    }

    watsonMessage(message: string) {
        return new Promise((resolve, reject) => {
            this.conversations.message({
                workspace_id: process.env.workspaceId,
                input: { 'text': message },
                context: this.context
            }, (err, response) => {
                if (err) {
                    console.log('Error: ', err);
                    reject(err);
                } else {
                    console.log('Watson: ' + response.output.text[0]);

                    this.context = response.context;
                    resolve(response.output.text[0]);
                }
            });
        })

    }

    watsonInteraction() {
        return new Promise((resolve, reject) => {
            this.controller.hears('', ['direct_mention', 'direct_message'], (bot, message) => {

                this.watsonMessage(message.text.toString().trim()).then((res) => {
                    if (typeof res !== 'undefined') {
                        console.log(this.context);
                        bot.reply(message, res);
                    } else {
                        bot.reply(message, 'Could not get response from Watson.');
                    }
                }).catch((err) => {
                    bot.reply(message, 'Could not get response from Watson.');
                })

            })
            resolve();
        })
    }

    personalityInsight() {
        return new Promise((resolve, reject) => {

            var personality_insights = watson.personality_insights({
                username: process.env.watson_username,
                password: process.env.watson_password,
                version: 'v2'
            });

            this.controller.hears(['Hi Watson', 'hey', 'hi', 'hello', 'hi there', 'howdy'], ['direct_mention'], function (bot, message) {

                bot.reply(message, 'Hi! I can only help you with the Channel Personality Insight. If you would like to learn about MiBo and get consultancy, please direct message me!');

                bot.startConversation(message, function (task, convo) {
                    convo.ask('Would you like to learn about Personality Insights?', [
                        {
                            callback: function (response, convo) { console.log('YES'); convo.say('Awesome. Personality Insights is an API that divides personalities into five different characteristics. You can try it out with this channel by calling "@ibmbot /analyze" in the channel.'); convo.next(); },
                            pattern: bot.utterances.yes,
                        },
                        {
                            callback: function (response, convo) { console.log('NO'); convo.say("Alright, but you're missing out!"); convo.next(); },
                            pattern: bot.utterances.no,
                        },
                        {
                            default: true,
                            callback: function (response, convo) { console.log('DEFAULT'); convo.say('Huh?'); convo.repeat(); convo.next(); }
                        }
                    ])
                })
            });

            this.controller.hears(['analyze'], ['direct_mention'], function (bot, message) {

                bot.api.channels.history({

                    channel: message.channel,
                }, function (err, history) {
                    //count: 500,

                    if (err) {
                        console.log('ERROR', err);
                        reject(err);
                    }

                    var messages = [];
                    for (var i = 0; i < history.messages.length; i++) {
                        messages.push(history.messages[i].text);
                    }

                    // call the watson api with your text
                    var corpus = messages.join("\n");

                    personality_insights.profile(
                        {
                            text: corpus,
                            language: 'en'
                        },
                        function (err, response) {
                            if (err) {
                                console.log('error:', err);
                                reject(err);
                            } else {

                                bot.startConversation(message, function (task, convo) {

                                    // response.tree.children.children is a list of the top 5 traits
                                    var top5 = response.tree.children[0].children[0].children;
                                    console.log(top5);
                                    for (var c = 0; c < top5.length; c++) {

                                        convo.say('This channel has ' + Math.round(top5[c].percentage * 100) + '% ' + top5[c].name);

                                    }
                                    bot.reply(message, 'You can learn more about Personality Insights using Node here: https://github.com/watson-developer-cloud/personality-insights-nodejs');
                                });
                            }
                        }
                    );
                });
            })
            resolve();
        })

    }

    init() {
        return new Promise((resolve, reject) => {
            this.loadBot().then(() => {
                console.log('Slack Bot initialized...');
                this.loadConversations().then(() => {
                    this.watsonInteraction().then(() => {
                        this.personalityInsight().then(() => {
                            console.log('Watson initialized...')
                            resolve();
                        }).catch((err) => {
                            reject(err);
                            console.log('Basic Interaction Error: ', err);
                        })
                    })
                })
            }).catch((err) => {
                console.log('Error: Cannot connect to Slack.');
                reject(err);
            })
        })
    }

    constructor() {
        super();
    }
}

export default new WatsonBase();