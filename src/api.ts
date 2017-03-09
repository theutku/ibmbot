import * as express from 'express';
import * as http from 'http';
import * as botkit from 'botkit';
import * as watson from 'watson-developer-cloud';

class SlackBotApp {

    app: express.Application;
    server: http.Server;

    private botkit = require('botkit');
    private controller: botkit.slackbot;
    private personality_insights: watson.personality_insights;

    loadBot() {
        return new Promise((resolve, reject) => {
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

    loadWatson() {
        this.personality_insights = watson.personality_insights({
            username: process.env.watson_username,
            password: process.env.watson_password,
            version: 'v2'
        });
    }

    testRoute() {
        return new Promise((resolve, reject) => {
            this.app.get('/', (req: express.Request, res: express.Response, next: express.NextFunction) => {
                res.status(200).send('App is working');
            })

            this.app.get('/status', (req: express.Request, res: express.Response, next: express.NextFunction) => {
                res.status(200).send('App is OK!');
            })
            resolve();
        })

    }

    basicInteraction() {
        return new Promise((resolve, reject) => {

            this.controller.hears(['Hi Watson', 'hey', 'hello', 'hi there', 'howdy'], ['direct_message', 'direct_mention'], function (bot, message) {

                bot.reply(message, 'Hi!');

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

            this.controller.hears(['analyze'], ['direct_message', 'direct_mention'], function (bot, message) {

                bot.api.channels.history({

                    channel: message.channel,
                }, function (err, history) {
                    //count: 500,

                    if (err) {
                        console.log('ERROR', err);
                    }

                    var messages = [];
                    for (var i = 0; i < history.messages.length; i++) {
                        messages.push(history.messages[i].text);
                    }

                    // call the watson api with your text
                    var corpus = messages.join("\n");

                    this.personality_insights.profile(
                        {
                            text: corpus,
                            language: 'en'
                        },
                        function (err, response) {
                            if (err) {
                                console.log('error:', err);
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
            this.app.set('port', (process.env.PORT || 8124));
            var server = http.createServer(this.app);

            server.listen(this.app.get('port'), (err: Error) => {
                if (err) {
                    console.log(err);
                    process.exit(2);
                }
                console.log(`App started listening at port: ${this.app.get('port')} ...`);
                this.testRoute().then(() => {
                    this.loadBot().then(() => {
                        this.loadWatson();
                        console.log('Bot initialized...');
                        this.basicInteraction().then(() => {
                            resolve();
                        })
                    }).catch((err) => {
                        console.log('Error: Cannot connect to Slack.');
                        process.exit(2);
                    })
                })

            })

        })

    }

    constructor() {
        this.app = express();
        this.controller = this.botkit.slackbot({
            debug: false,
            retry: true
        });

    }
}

export var App: SlackBotApp;

export default () => (App = new SlackBotApp());