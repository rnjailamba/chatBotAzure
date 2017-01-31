// var builder = require('botbuilder');

// // Create bot and bind to console
// var connector = new builder.ConsoleConnector().listen();
// var bot = new builder.UniversalBot(connector);

var builder = require('botbuilder');
var restify = require('restify');

//MICROSOFT_APP_ID='66abcc6a-33e6-495c-819d-bd574b3604c5' MICROSOFT_APP_PASSWORD='fxJn2cjcNunesZmqDZxMhVT' node server.js

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url);
}); 

// Create chat bot
// var connector = new builder.ChatConnector({
//     appId: process.env.MICROSOFT_APP_ID,
//     appPassword: process.env.MICROSOFT_APP_PASSWORD
// });
var connector = new builder.ChatConnector({
    appId: '66abcc6a-33e6-495c-819d-bd574b3604c5',
    appPassword: 'fxJn2cjcNunesZmqDZxMhVT'
});
// var connector = new builder.ConsoleConnector().listen();
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

// Create LUIS recognizer that points at our model and add it as the root '/' dialog for our Cortana Bot.
// var model = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/4ae18224-cdb3-4676-8fef-ab92401a91b0?subscription-key=c77f95149dea4c4c820a617d01720f31&timezoneOffset=0.0&verbose=true&q=';
var model = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/45920bdd-a3db-4d6e-b05e-ebfbf5a8e262?subscription-key=5871c7a8471840cd9122d563643af60b&verbose=true&q=';
var recognizer = new builder.LuisRecognizer(model);
var intents = new builder.IntentDialog({ recognizers: [recognizer] });
bot.dialog('/', intents);

// Add intent handlers

intents.matches('Greeting', [
    function (session, args, next) {
        // session.userData.name = undefined;
        if (!session.userData.name) {
            session.send("Welcome to Life in Control!\n*Thank you for trusting us with your health. As your care team, we shall do everything we can( to keep you fit and healthy!)/(for your health and well-being!)But always remember, the most important member in your care team is you!Now, it's time for you to meet Maya, your personal health assistant!");
            builder.Prompts.text(session, "What is your name?");
        } else {
            next();
        }
    },
    function (session, results) {
        if(!session.userData.name){
            session.userData.name = results.response;
        }
        session.send('Hello %s!', session.userData.name);
        // session.endDialog();
        session.beginDialog('/sample');

    }
]);

intents.matches('EnterBMI', [
    function (session, args, next) {
        session.beginDialog('/enterBMI');
    }
]);


intents.matches(/^change name/i, [
    function (session) {
        session.send('Okk... Changed your name to %s', session.userData.name);
    },
    function (session, results) {
        session.send('Ok... Changed your name to %s', session.userData.name);
    }
]);

bot.dialog('/profile', [
    function (session) {
        builder.Prompts.text(session, 'Hi! What is your name?');
    },
    function (session, results) {
        session.userData.name = results.response;
        session.endDialog();
    }
]);

bot.dialog('/sample', [
    function (session) {
        builder.Prompts.choice(session, "Choose an option:", 'Give me expert advice based on my BMI|Clear Data|Quit|Enter any custom question');
    },
    function (session, results) {
        switch (results.response.index) {
            case 0:
                session.beginDialog('/enterBMI');
                break;            
            case 1:
                session.beginDialog('/clearData');
                break;
            case 2:
                session.beginDialog('/quit');
                break;
            case 3:
                session.beginDialog('/enterAnyCustom');
                break;                
            default:
                session.endDialog();
                break;
        }
    }
]);

bot.dialog('/enterAnyCustom', [
    function (session, args) {
        session.endDialog();
    }
]);

bot.dialog('/quit', [
    function (session, args) {
        session.send('Quitting, see you next time, stay responsible and healthy till next time!');
        session.endDialog();
    }
]);


bot.dialog('/clearData', [
    function (session, args) {
        session.send('Cleared data ..., ask me anything or say hello again to enter your data');        
        session.userData.weight = undefined;
        session.userData.height = undefined;
        session.userData.name = undefined;
        session.endDialog();
    }
   
]);

bot.dialog('/enterBMI', [
    function (session, args,next) {
        if(!session.userData.weight){
            builder.Prompts.text(session, 'Hi! What is your wt?');
        }
        else{
            next();
        }
        // builder.Prompts.choice(session, "Choose heads or tails.", "heads|tails", { listStyle: builder.ListStyle.none })
    },
    function (session, results,next) {
        if(session.userData.weight){
            if(session.userData.height){
                next();
            }
            else{
                builder.Prompts.text(session, 'What is your ht?');            
            }
        }
        else{
            if(isNaN(results.response)){
                session.send('Please enter a number');
                session.replaceDialog('/enterBMI');
            }
            else{
                session.userData.weight = results.response;
                session.send('Ok... your weight is %s', session.userData.weight);
                builder.Prompts.text(session, 'What is your ht?');            
            }
        }
    },
    function (session, results,next) {
        if(session.userData.weight && session.userData.height){
            next();
        }      
        else{
            if(isNaN(results.response)){
                session.send('Please enter a number');
                session.replaceDialog('/enterBMI');
            }
            else{
                session.userData.height = results.response;
                if(session.userData.height > 6){
                    session.send('Oh my youre a tall one');                    
                }
                session.send('Ok... your height is %s', session.userData.height);
                next();
            }
        }  
    },
    function (session, results,next) {
        session.send('Ok... your height is %s and wt is %s and bmi = %s', session.userData.height,session.userData.weight,
            session.userData.weight/session.userData.height);
        session.endDialog();
    }    
]).cancelAction('cancel', "Ok cancelling taking your data.", {
    matches: /^(cancel|nevermind|exit|no)/i
});




intents.onDefault(builder.DialogAction.send("I'm sorry I didn't understand. Try saying hello to me."));

// var restify = require('restify');
// var builder = require('botbuilder');

// // Get secrets from server environment
// var botConnectorOptions = { 
//     appId: process.env.BOTFRAMEWORK_APPID, 
//     appSecret: process.env.BOTFRAMEWORK_APPSECRET 
// };

// // Create bot
// var bot = new builder.BotConnectorBot(botConnectorOptions);
// bot.add('/', function (session) {
    
//     //respond with user's message
//     session.send("You said " + session.message.text);
// });

// // Setup Restify Server
// var server = restify.createServer();

// // Handle Bot Framework messages
// server.post('/api/messages', bot.verifyBotFramework(), bot.listen());

// // Serve a static web page
// server.get(/.*/, restify.serveStatic({
// 	'directory': '.',
// 	'default': 'index.html'
// }));

// server.listen(process.env.port || 3978, function () {
//     console.log('%s listening to %s', server.name, server.url); 
// });
