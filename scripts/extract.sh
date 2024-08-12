#! /bin/sh
mongoexport --uri mongodb+srv://[user]:[key]@cluster0.[cluster].mongodb.net/lucid-trainer --collection appdata --type json | sed '1s/^/[/' |sed '$ ! s/$/,/' | sed '$s/$/]/' | python -mjson.tool > fit-app-data.json
mongoexport --uri mongodb+srv://[user]:[key]@cluster0.[cluster].mongodb.net/lucid-trainer --collection fitdata --type json | sed '1s/^/[/' |sed '$ ! s/$/,/' | sed '$s/$/]/' | python -mjson.tool > fit-data.json
