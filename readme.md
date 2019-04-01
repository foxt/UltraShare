# UltraShare
UltraShare is a all in one server for screenshots, files, images, and links

## Live Demo
https://ultrashare-public-demo--thelmgn.repl.co

## Setup Guide

1. Clone from Git.
2. `npm i`
3. Go to [the setup wizard](https://encouraging-paper.glitch.me/), and fill out the boxes, and add the TOTP code to your mobile authenticator app.
4. Copy everything from that page when you click generate
5. Create a file called `config.js` and paste the stuff from step 4 in, and save
6. Create a folder called `files`
7. Create a file called `db.json` and in it put `[]`
8. Fingers crossed, if you do `node index` it should work.

## MagicCap setup guide

1. Grab your API key
2. Update MagicCap to a post-1.0.0 version.
3. Uploader Config > UltraShare
4. Set as default
5. Domain is a link to your server (ex: ultrashare.example.org:8080)
6. API Key is your API key
