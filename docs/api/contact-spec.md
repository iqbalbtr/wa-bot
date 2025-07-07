# Contact Api Spec

## Get all contact from bot 

- Endpoint : GET /api/contacts
- Type : Private

### Response Body

```json
{
    "status": "success",
    "message": "success get contacts",
    "data": [
        {
            "id": {
                "server": "c.us",
                "user": "xxx",
                "_serialized": "xxx@c.us"
            },
            "number": "xxx",
            "isBusiness": false,
            "isEnterprise": false,
            "name": "x",
            "pushname": "X",
            "shortName": "x",
            "type": "in",
            "isMe": true,
            "isUser": true,
            "isGroup": false,
            "isWAContact": true,
            "isMyContact": true,
            "isBlocked": false
        },
    ]
}
```

>[!NOTE]
> This endpint will return all contact from bot
> Using caching with 15 minutes duration
> You can change duartion caching but be aware from limit request bot