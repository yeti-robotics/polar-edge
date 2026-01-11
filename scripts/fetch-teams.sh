#!/usr/bin/env zsh

# The Blue Alliance API v3 - Fetch all teams and map team numbers to nicknames
# Usage: ./fetch-teams.sh [API_KEY] [OUTPUT_FILE]

set -e

API_KEY="${1:-${TBA_API_KEY}}"
OUTPUT_FILE="${2:-teams.json}"

if [[ -z "$API_KEY" ]]; then
  echo "Error: API key required" >&2
  echo "Usage: $0 [API_KEY] [OUTPUT_FILE]" >&2
  exit 1
fi

python3 << EOF
import json
import urllib.request
import urllib.error

api_key = "${API_KEY}"
output_file = "${OUTPUT_FILE}"

headers = {"X-TBA-Auth-Key": api_key}
mapping = {}
page = 0

while True:
    url = f"https://www.thebluealliance.com/api/v3/teams/{page}"
    req = urllib.request.Request(url, headers=headers)

    print("Fetching page", page)

    try:
        with urllib.request.urlopen(req) as response:
            teams = json.loads(response.read().decode())

            if not teams:
                break

            for team in teams:
                team_num = team.get('team_number')
                nickname = team.get('nickname', '')
                city = team.get('city')
                state_prov = team.get('state_prov')
                country = team.get('country')

                if team_num:
                    mapping[str(team_num)] = {
                        "name": nickname,
                        "location": {
                            "city": city,
                            "state_prov": state_prov,
                            "country": country
                        }
                    }

            page += 1
    except urllib.error.HTTPError as e:
        if e.code == 404:
            break
        raise

with open(output_file, 'w') as f:
    json.dump(mapping, f, indent=2)

print(f"Fetched {len(mapping)} teams", file=__import__('sys').stderr)
EOF
