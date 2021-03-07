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

## MagicCap or ShareX setup guide

1. Go to your UltraShare dashboard, and click "Get your API key", or visit yourserver.com/dash/apikey.html
2. Download the MagicCap mconf or ShareX SXCU's.
3. For ShareX, extract the zip and open the files with ShareX.
4. For MagicCap, open the config, click "Uploader Config", then "Import Uploader Configurations", then select the file.
5. Also for MagicCap, click "UltraShare" and click "Set as default"
6. Congratulations, you've set up UltraShare for instantly uploading your screenshots!

