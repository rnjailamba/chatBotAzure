// var builder = require('botbuilder');

// // Create bot and bind to console
// var connector = new builder.ConsoleConnector().listen();
// var bot = new builder.UniversalBot(connector);

var builder = require('botbuilder');
var restify = require('restify');
var requestt = require('request');


//MICROSOFT_APP_ID='66abcc6a-33e6-495c-819d-bd574b3604c5' MICROSOFT_APP_PASSWORD='fxJn2cjcNunesZmqDZxMhVT' node server.js
//node --debug-brk=5314 server.js 
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
        var ht = builder.EntityRecognizer.findEntity(args.entities, 'height');
        var wt = builder.EntityRecognizer.findEntity(args.entities, 'weight');
        var data = {};
        data["ht"] = undefined;
        data["wt"] = undefined;
        if(ht){
            session.userData.height = ht.entity;
            data["ht"] = ht.entity;
            // session.send("ht is %s", ht.entity);        
        }
        if(wt){
            session.userData.weight = wt.entity;
            data["wt"] = wt.entity;
            // session.send("wt is %s", wt.entity);                    
        }
        session.replaceDialog('/enterBMI',data);

    }
]);

 intents.matches('HistoryBMI', [
    function (session, args, next) {
        session.replaceDialog('/historyBMI');        
    }
]);

 intents.matches('DeleteBMI', [
    function (session, args, next) {
        session.replaceDialog('/deleteBMI');        
    }
]);

 intents.matches('CurrentBMI', [
    function (session, args, next) {
        session.replaceDialog('/currentBMI');        
    }
]);

bot.dialog('/historyBMI', [
    function (session, args, next) {
        if(session.userData.arrayBMI){
            var i = 0;
            var arr = session.userData.arrayBMI;
            // var data = {};
            session.send('you have total %s readings sorted from earliest to newest.', session.userData.arrayBMI.length);
            for (var data in arr) {
                session.send('%s -> wt is %s and height is %s and bmi = %s.', i,arr[i]["wt"],arr[i]["ht"],arr[i]["wt"]/arr[i]["ht"]);
                i++;
            }          
            session.endDialog();

        }
        else{
            session.endDialog("You have not logged anything as yet, try saying - 'enter my bmi reading, my weight is 75 and height is 180'");               
        }   
    }
]);

bot.dialog('/deleteBMI', [
    function (session, args, next) {
        session.send('Delete command invoked');
        if (session.userData.arrayBMI && session.userData.arrayBMI.length > 0) {
            // Resolve entities passed from LUIS.
            var arr = session.userData.arrayBMI;
            var stringConcat = '';
            var i = 0;
            for (var data in arr) {
                stringConcat+=  'wt is ' + arr[i]["wt"] + ' and height is ' + arr[i]["ht"] + ' bmi is ' + (arr[i]["wt"]/arr[i]["ht"] + ' | ');
                // session.send('%s -> wt is %s and height is %s and bmi = %s.', i,arr[i]["wt"],arr[i]["ht"],arr[i]["wt"]/arr[i]["ht"]);
                i++;
            }     
            stringConcat = stringConcat.substring(0, stringConcat.length - 2);  
            builder.Prompts.choice(session, "Choose an bmi reading to delete : ", stringConcat);
         } else {
            session.endDialog("No bmi readings to delete.");
        }
    },
    function (session, results) {
        session.userData.arrayBMI.splice(results.response.index, 1);
        // delete session.userData.arrayBMI[results.response.index];
        session.endDialog("Deleted the '%s' bmi reading.", results.response.entity);
    }
]).cancelAction('cancel', "Ok.", {
    matches: /^(cancel|nevermind)/i
});



intents.matches(/^change name/i, [
    function (session) {
        session.send('Okk... Changed your name to %s', session.userData.name);
    },
    function (session, results) {
        session.send('Ok... Changed your name to %s', session.userData.name);
    }
]);

intents.matches(/^clear/i, [
    function (session) {
        session.replaceDialog('/clearData');
    }
]);



bot.dialog('/currentBMI', [
    function (session, args, next) {
        if(session.userData.height && session.userData.weight){
            session.endDialog('Your current wt is %s and height is %s and bmi = %s.', session.userData.weight,session.userData.height,
                session.userData.weight/session.userData.height);          
        }
        else{
            session.endDialog("You have not logged anything as yet, try saying - 'enter my bmi reading, my weight is 75 and height is 180'");               
        }   
    }
]).cancelAction('cancel', "Ok.", {
    matches: /^(cancel|nevermind)/i
});

bot.dialog('/profile', [
    function (session) {
        builder.Prompts.text(session, 'Hi! What is your name?');
    },
    function (session, results) {
        session.userData.name = results.response;
        session.endDialog();
    }
]).cancelAction('cancel', "Ok.", {
    matches: /^(cancel|nevermind)/i
});

bot.dialog('/sample', [
    function (session) {
        builder.Prompts.choice(session, "Choose an option:", 'Enter your BMI| \
                    Tell me my current BMI reading | Delete a bmi reading | Show all bmi readings |Clear Data|Quit|Enter any custom question');
    },
    function (session, results) {
        switch (results.response.index) {
            case 0:
                session.replaceDialog('/enterBMI');
                break;  
            case 1:
                 session.replaceDialog('/currentBMI');        
                break; 
            case 2:
                 session.replaceDialog('/deleteBMI');        
                break;  
            case 3:
                 session.replaceDialog('/historyBMI');        
                break;                                                            
            case 4:
                session.replaceDialog('/clearData');
                break;
            case 5:
                session.replaceDialog('/quit');
                break;
            case 6:
                session.replaceDialog('/enterAnyCustom');
                break;                
            default:
                session.endDialog();
                break;
        }
    }
]).cancelAction('cancel', "Ok.", {
    matches: /^(cancel|nevermind)/i
});

bot.dialog('/enterAnyCustom', [
    function (session, args) {
        session.endDialog('Go ahead...');
    }
]).cancelAction('cancel', "Ok.", {
    matches: /^(cancel|nevermind)/i
});

bot.dialog('/quit', [
    function (session, args) {
        session.send('Quitting, see you next time, stay responsible and healthy till next time!');
        session.endDialog();
    }
]).cancelAction('cancel', "Ok.", {
    matches: /^(cancel|nevermind)/i
});


bot.dialog('/clearData', [
    function (session, args) {
        session.send('Cleared data ..., ask me anything or say hello again to enter your data');        
        session.userData.weight = undefined;
        session.userData.height = undefined;
        session.userData.name = undefined;
        session.userData.arrayBMI = undefined;
        session.endDialog();
    }
]).cancelAction('cancel', "Ok.", {
    matches: /^(cancel|nevermind)/i
});

bot.dialog('/enterBMI', [
    function (session, args,next) {
        session.userData.weight = undefined;
        session.userData.height = undefined;
        if(args){
            session.userData.weight = args["wt"];
            session.userData.height = args["ht"];
        }

        if(!session.userData.weight){
            builder.Prompts.text(session, 'What is your weight in kgs?');
        }
        else{
            next();
        }
        // builder.Prompts.choice(session, "Choose heads or tails.", "heads|tails", { listStyle: builder.ListStyle.none })
    },
    function (session, results,next,args) {
        if(session.userData.weight){
            session.send('Ok... your weight is %s kgs', session.userData.weight);
            if(session.userData.height){
                next();
            }
            else{
                builder.Prompts.text(session, 'What is your hieght in cm?');            
            }  
        }
        else if(isNaN(results.response)){
            session.send('Please enter a number');
            session.replaceDialog('/enterBMI');
        }
        else{
            session.userData.weight = results.response;
            session.send('Ok... your weight is %s kgs', session.userData.weight);
            if(session.userData.height){
                next();
            }
            else{
                builder.Prompts.text(session, 'What is your hieght in cm?');            
            }            
        }        

    },
    function (session, results,next) {
        if(session.userData.weight && session.userData.height){
            session.userData.height = session.userData.height * 0.0328084;
            if(session.userData.height > 6){
                session.send('Oh my youre a tall one');                    
            }
            session.send('Ok... your height is %s feet', session.userData.height);
            next();
        }      
        else{
            if(isNaN(results.response)){
                session.send('Please enter a number');
                session.replaceDialog('/enterBMI');
            }
            else{
                session.userData.height = results.response * 0.0328084;
                if(session.userData.height > 6){
                    session.send('Oh my youre a tall one');                    
                }
                session.send('Ok... your height is %s feet', session.userData.height);
                next();
            }
        }  
    },
    function (session, results,next) {
        var bmi = session.userData.weight/session.userData.height;
        session.send('Ok... your height is %s and wt is %s and bmi = %s.', session.userData.height,session.userData.weight,
            bmi);
        var data = {};
        data["ht"] = session.userData.height;
        data["wt"] = session.userData.weight;
        data["bmi"] = bmi;
        if(session.userData.arrayBMI){
            session.userData.arrayBMI.push(data);
        }
        else{
            session.userData.arrayBMI = [];
            session.userData.arrayBMI.push(data);
        }
        session.endDialog('I can further tell you if this is good/bad for you...'); 
        session.userData.context = 'BMIResults';
    }              
        
]).cancelAction('cancel', "Ok cancelling taking your data.", {
    matches: /^(cancel|nevermind|exit|no)/i
});

intents.matches('InFeedback', [
    function (session, args, next) {
        var topic = builder.EntityRecognizer.findEntity(args.entities, 'topic');
        if(topic && (topic == 'count calories' || topic == 'count cals')){
            session.endDialog("By recording your food and activity in the Life in Control App! It will automatically calculate your calories for you."); 
        }
        else{
            if(session.userData.context == 'BMIResults'){
                var bmi = session.userData.weight/session.userData.height;        
                if(bmi < 5){//lower than optimal
                    session.userData.context = 'BMIResults_l';                                           
                    session.endDialog("It's lower than what it should be. %s, you need to put on some weight.",session.userData.name); 
                }
                else if(bmi >=5 && bmi < 10){//perfect
                    session.userData.context = 'BMIResults_p';                                                                              
                    session.endDialog("It's perfect 🙌. You know, I really admire people who keep in shape! 🚴"); 
                }
                else{//higher than optimal
                    session.userData.context = 'BMIResults_h';                                                                                                                
                    session.endDialog("It is on the higher side. But losing weight is easier than you think.");  
                }
            }
            else if(session.userData.context == 'BMIResults_l' || session.userData.context == 'BMIResults_h'){
                session.send("It's simple- set a long term goal, and break it down into short, achievable targets! \
                I recommend a weight of 65kg in 3 months for you. This means your daily calorie intake should be 1200, while calories burned should be 300");
                session.userData.context == 'BMIResults_lh_done'
            }
            else{
                session.send("Dont have feedback, sorry!.");                    
                session.endDialog();             
            }
        }        
       
    }
]).cancelAction('cancel', "Ok.", {
    matches: /^(cancel|nevermind)/i
});

bot.dialog('/cards', [
    function (session) { 
        var msg = new builder.Message(session)
            .attachments([
                new builder.HeroCard(session)
                    .title("Are you ok if i generate a plan based on the above goal?")
                    .images([
                        builder.CardImage.create(session, "https://smsmedia.files.wordpress.com/2015/03/plan-guy.jpg")
                    ])
                    .buttons([
                        builder.CardAction.dialogAction(session, "weather", "No", "No, i want to change it."),
                        builder.CardAction.dialogAction(session, "weather", "Yes", "Yes im fine with it.")  
                    ])
            ]);
        session.send(msg);
        session.endDialog("");
    }
]).cancelAction('cancel', "Ok.", {
    matches: /^(cancel|nevermind)/i
});

intents.matches('Continue', [
    function (session, args, next) {
        if(session.userData.context == 'BMIResults_p'){
            session.send("Let's keep you healthy. To maintain your current weight, your daily calorie goals should be 500 calories.!");    
            session.beginDialog('/cards');
            session.endDialog(); 
        }   
        else if(session.userData.context == 'BMIResults_lh_done'){
            session.endDialog('You should record your diet and activity in the app everyday. \
            That keeps you to accountability to me, but most importantly, to yourself!');
        }             
        else{
            session.send("Dont have anything, sorry!.");                    
            session.endDialog();             
        }
 
    }
]);

// Create a dialog and bind it to a global action
bot.dialog('/weather', [
    function (session, args) {
        if(args.data == 'Yes'){
            session.endDialog("Good to hear that, take user to goal screen and other flow(not implemented this)");
        }
        else{
            session.endDialog("Ok we will change this(not implemented this), in the meantime you can play around with other functionality such as list/ delete the bmi entries");
        }
    }
]).cancelAction('cancel', "Ok.", {
    matches: /^(cancel|nevermind)/i
});

bot.beginDialogAction('weather', '/weather');   // <-- no 'matches' option means this can only be triggered by a button.

intents.onDefault(builder.DialogAction.send("I'm sorry I didn't understand. Try saying 'hello' to me."));

var bmiLog = {};

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
