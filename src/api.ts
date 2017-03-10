import * as express from 'express';
import * as http from 'http';

import BotBase from './ai/botkit';
import WatsonBase from './ai/watson';

class SlackBotApp {

    app: express.Application;
    server: http.Server;

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
                    WatsonBase.loadBot().then(() => {
                        console.log('Slack Bot initialized...');
                        WatsonBase.loadConversations().then(() => {
                            WatsonBase.watsonInteraction().then(() => {
                                WatsonBase.personalityInsight().then(() => {
                                    console.log('Watson initialized...')
                                    resolve();
                                }).catch((err) => {
                                    console.log('Basic Interaction Error: ', err);
                                    process.exit(2);
                                })
                            })
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
    }
}

export var App: SlackBotApp;

export default () => (App = new SlackBotApp());