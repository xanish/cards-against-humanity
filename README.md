# Cards against humanity

Simple implementation of the cards against humanity game using node and sockets. What is Cards against humanity? check [here](https://en.wikipedia.org/wiki/Cards_Against_Humanity).

## What works?

- Game works and is playable

## How to play with friends?

- Make sure you have node
- Clone repo
- Run `npm run start:dev`
- Expose port 3000 with ngork

## To do

- Should probably do first
  - Save cards in some database (sqlite? mongo?)
- Spagetti / Hacks
  - Find a way to get rid of delay timeouts for game:draw-cards even in game-controller.module.js
- Lobby settings screen
  - Card pack selection (would need to save and fetch card packs from db)
  - Password
  - Idle timer
  - Max rounds to play
  - Max players allowed
- Extra pages?
  - Rules
  - Card packs and cards
- Features
  - Show active games on home
- Scaling
  - Save game data in redis
  - Socket.io redis adapter
  - Prevent same browser from joining as different users (sessions / cookies)
- Use docker compose and updaet running instructions
- Make it response :upside_down_face: