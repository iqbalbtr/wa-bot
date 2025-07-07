# Schedule Message Spec

## Get All Schedule

- Type : Private
- Endpoint : GET /schedules

### Request Response

```json
{
    "status": true,
    "message": "success get schedules",
    "data": [
        {
            "id": 1,
            "scheduled_time": "0 12 12 1,2 7 * ",
            "message": "ok",
            "attachment": "null",
            "contact_ids": [
                "x@c.us",
                "x@c.us"
            ]
        },
    ]
}
```

## Create Schedule

- Type : Private
- Endpoint : POST /schedules

### Reqeust Body

```json
{
    "message":"",
    "contact_ids": [
        ""
    ],
    "scheduled_time": "",
    "attachment":""
}
```

### Reqeust Response 

```json
{
    "status" : true,
    "message" : "success create schedule"
}
```

## Delete Schedule


- Type : Private
- Endpoint : DELETE /schedules
- 
### Request Response 

```json
{
    "status" : true,
    "message" : "success delete schedule"
}
``