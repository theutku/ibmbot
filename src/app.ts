import App from './api';

console.log('Starting Bot Application...');

App().init().then(() => {
    console.log('Bot Application started.')
}).catch((err) => {
    console.log(err);
    process.exit(2);
})