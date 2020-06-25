// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require('ask-sdk-core');
const skillData = require('skillData.js');
const persistenceAdapter = require('ask-sdk-s3-persistence-adapter');
const gameOn = require('./gameOn.js');

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    async handle(handlerInput) {
        const data = getLocalizedData(handlerInput.requestEnvelope.request.locale);
        console.log(data);
        let speakOutput = "";
        const prompt = data["QUESTION"];

        let persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();
        let player = persistentAttributes.PLAYER;
        let chance = persistentAttributes.CHANCE;
        
        if(player === undefined){
            player = await gameOn.newPlayer();
            const dataToSave = {
                "PLAYER": player
            }
            save(handlerInput, dataToSave, null);
            speakOutput = data["WELCOME_MESSAGE"]+ data["QUESTION"];
        } else {
            player = await gameOn.refreshPlayerSession(player);
            if(chance === 0){
                speakOutput = data["OUT_OF_CHANCES"];
                return handlerInput.responseBuilder
                    .speak(speakOutput)
                    .getResponse();
            }
            speakOutput = data["RETURNING_USERS_WELCOME"] + data["QUESTION"];
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(prompt)
            .getResponse();
    }
};


function dayOfTheYear(){
    let dt = new Date();
    let first = new Date(dt.getFullYear(), 0, 0);
    let difference = dt - first ;
    let oneDay = 1000 * 60 * 60 * 24;
    let day = Math.floor(difference / oneDay);
    return day;
}

function save(handlerInput, attributesToSave, attributesToDelete) {
    return new Promise((resolve, reject) => {
        handlerInput.attributesManager.getPersistentAttributes()
            .then((attributes) => {
                for (let key in attributesToSave) {
                    attributes[key] = attributesToSave[key];
                }
                if (null !== attributesToDelete) {
                    attributesToDelete.forEach(function (element) {
                        delete attributes[element];
                    });
                }
                handlerInput.attributesManager.setPersistentAttributes(attributes);

                return handlerInput.attributesManager.savePersistentAttributes();
            })
            .catch((error) => {
                reject(error);
            });
    });
}

function getLocalizedData(locale){
    return skillData[locale];
}

const RiddleIntentHandler = {
    canHandle(handlerInput) {
        return (Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RiddleIntent') || 
            (Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent') ;
    },
    handle(handlerInput) {
        const dayNumber = dayOfTheYear();
        const speakOutput = 'Here is the riddle for Day Number ' + dayNumber;
        const data = getLocalizedData(handlerInput.requestEnvelope.request.locale);
        // Homework : Find the number of the current day and get the corresponding question. 
        const speechOutput = speakOutput + data["QUESTIONS"][0];
        const dataToSave = {
            "RIGHT_ANSWER": data["ANSWERS"][0]
        }
        handlerInput.attributesManager.setSessionAttributes(dataToSave);

        const reprompt = data["QUESTIONS"][0] + " " + data["ANSWER_MESSAGE"];
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(reprompt)
            .getResponse();
    }
};


const AnswerIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AnswerIntent';
    },
    async handle(handlerInput) {
        const data = getLocalizedData(handlerInput.requestEnvelope.request.locale);

        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const correctAnswer = sessionAttributes.RIGHT_ANSWER;
        let persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes();
        let player = persistentAttributes.PLAYER;

        let speakOutput = '';
        let chance = persistentAttributes.CHANCE || 1;
        console.log("Chance Number");

        if(handlerInput.requestEnvelope.request.intent.slots.answer.resolutions.resolutionsPerAuthority[0].hasOwnProperty('values')){
            console.log("Property found");
            
            const userAnswer = handlerInput.requestEnvelope.request.intent.slots.answer.resolutions.resolutionsPerAuthority[0].values[0].value.name;
            
            if(correctAnswer === userAnswer){
            
                let points = 0;
                
                if(chance === 1){
                    points = 10;
                } else if(chance === 2){
                    points = 5;
                } else {
                    points = 3;
                }
                await gameOn.submitScore(player, points);
                const playerScore = await gameOn.getPlayerScore(player);
                console.log("Score");
                console.log(playerScore);
                speakOutput = '<audio src="soundbank://soundlibrary/ui/gameshow/amzn_ui_sfx_gameshow_positive_response_02"/>Correct Answer. You get '+ points +' points';
            } else {
                let remainingChances = 3 - chance;
                if (remainingChances === 0){
                    chance = 0;
                    speakOutput = "Uh oh! You lost all your chances. The Right Answer was" + correctAnswer;
                } else {
                    chance = chance + 1;
                    speakOutput = "Wrong Answer. You only have " + remainingChances + " chances remaining."
                }
                
                const dataToSave = {
                "CHANCE": chance
                }
                
                save(handlerInput, dataToSave, null);
                
            }

        }
        else{
            console.log("Property not found");
            let remainingChances = 3 - chance;
            if (remainingChances === 0){
                chance = 0;
                speakOutput = "Uh oh! You lost all your chances. The Right Answer was" + correctAnswer;
            } else {
                chance = chance + 1;
                speakOutput = "Wrong Answer. You only have " + remainingChances + " chances remaining."
            }
            
            const dataToSave = {
            "CHANCE": chance
            }
            
            save(handlerInput, dataToSave, null);
        }
        


        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};


const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .withPersistenceAdapter(
        new persistenceAdapter.S3PersistenceAdapter({bucketName: process.env.S3_PERSISTENCE_BUCKET})
    )
    .addRequestHandlers(
        LaunchRequestHandler,
        RiddleIntentHandler,
        AnswerIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    .addErrorHandlers(
        ErrorHandler,
    )
    .lambda();