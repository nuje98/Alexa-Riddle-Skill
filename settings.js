/*
 *  ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 *  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *  ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 */

// Should be stored securely with KMS or as a secure environment variable on your lambda
// See https://github.com/alexa-games/skills-gameon-sdk-js/blob/master/README.md#gameon-api-secret-management
const gameOnApiKey = '310e562f-b941-4752-adcb-fb4b31e4165e';

// Preferable to store the following settings as AWS Lambda environment variables
const matchId = process.env.matchId || '36331ce7-0678-4f7e-b874-3d6f21caa7bd';
const tournamentId = process.env.tournamentId || 'dbc6af07-cf69-486e-801f-7836d6e7dd0a';

// Required for GameOn. Value must be set to 'development' or 'release'
const appBuildType = process.env.appBuildType || 'development';

// Base url for the player avatars. See https://github.com/alexa-games/skills-gameon-sdk-js/blob/master/README.md#avatar-generation
// Cannot be empty string. Passing in any other value will allow the leaderboard to render,
// but will display blank placeholders.
const gameAvatarBaseUrl = process.env.gameAvatarBaseUrl || 'https://picture-url-you-want-to-paste.com';

// Background image for the leaderboard template
// Recommended minimum size: 1280x800px
// Cannot be empty string. Passing in any other value will allow the leaderboard to render,
// but will display a blank white background
const leaderboardBackgroundImageUrl = process.env.leaderboardBackgroundImageUrl || 'https://image-of-background.com';

// Top n places to show on the leaderboard
const topNleaderboardItemCount = process.env.topNleaderboardItemCount || 5;
// Number of players to render before and after current player
const playerNeighborsCount = process.env.playerNeighborsCount || 1;
// Number of avatars that have been generated
// See https://github.com/alexa-games/skills-gameon-sdk-js/blob/master/README.md#avatar-generation
const numberOfUniqueAvatars = process.env.numberOfUniqueAvatars || 50;

module.exports = {
    matchId,
    tournamentId,
    appBuildType,
    gameOnApiKey,
    gameAvatarBaseUrl,
    leaderboardBackgroundImageUrl,
    topNleaderboardItemCount,
    playerNeighborsCount,
    numberOfUniqueAvatars
};