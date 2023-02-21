# Cards against humanity

Simple implementation of the cards against humanity game using node and sockets. What is Cards against humanity? check [here](https://en.wikipedia.org/wiki/Cards_Against_Humanity).

## What works?

- Game works and is playable

## Running locally for test / development

- Make sure docker is installed
- Clone repo
- Run `docker-compose run -d app`
- Access app on [http://localhost:3000](http://localhost:3000)

## How to play with friends?

- Make sure docker is installed
- Make sure you have an ngrok account and copy your authtoken
- Clone repo
- Create a `.env` file in project root folder (should be in same place as docker-compose.yml)
- Create entry `NGROK_TOKEN=WHATEVER_YOUR_ACCESS_TOKEN_IS` in the file
- Run `docker-compose up -d ngrok`
- Open [http://localhost:4040/status](http://localhost:4040/status) and copy / share the URL with people you want to play with

## To do

- Should probably do first
  - ~~Save cards in some database (sqlite? mongo?)~~ Done (Just went with json files since its much faster for this use-case, created different json files for each use-case).
  - Add some logic to check minimum cards needed from selected packs
  - ~~Add validation logic for game settings~~ Done
  - ~~Send setting updates to other players~~ Done
  - ~~Prevent lobby join if game not started and player limit is set~~ Done
- Spagetti / Hacks
  - ~~Find a way to get rid of delay timeouts for game:draw-cards even in game-controller.module.js~~ Done
- Lobby settings screen
  - ~~Card pack selection (would need to save and fetch card packs from db)~~ Done
  - ~~Password~~ Done
  - ~~Idle timer~~ Done
  - ~~Max rounds to play~~ Done
  - ~~Max players allowed~~ Done
- Extra pages?
  - Rules
  - ~~Card packs and cards~~ Done
- Features
  - Show active games on home
- Scaling
  - Save game data in redis
  - Socket.io redis adapter
  - Prevent same browser from joining as different users (sessions / cookies)
- ~~Use docker compose and update running instructions~~ Done
- Make it responsive :upside_down_face:
