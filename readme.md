# Honest impressions

Stateless[^1] slack bot able to send replies anonymously to a thread in a specific channel. 

- Does not require a database.
- Implements replies moderation via a review queue.
- Implements user banning via salted hashes stored in a file or in memory.
- Uses minimal permissions (for example, no event subscriptions are required) and stores minimal data
- Does not show logs by default to prevent accidental identity leaks.



Also read [transcental/honest-impressions#3](https://github.com/transcental/honest-impressions/pull/3).

For a setup guide, read [dev.md](./dev.md)

# Concerns
This bot is designed to minimize data storage. However, purely by being a Slack app, it is NOT fully anonymous. If a bad actor was able to extract both the app's slack credentials and the salt used for hashing, they could potentially deanonymize users. \
If only the salt was compromised, and the attacker had access to the ban list, the attacker could be able to identify banned users.



Or they could just edit the source code and log everything really :P

[^1]: Banned users are stored in a file or in memory, so the bot is not really fully stateless. Unfortunately, Slack doesn't provide datastore for non-workflow Slack apps.
