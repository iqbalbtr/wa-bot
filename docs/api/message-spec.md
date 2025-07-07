# Message Spec API

## Send message to specific user

- Endpoint : POST /message/forward
- Type : Private

### Request Body 

```json
{
    "message": "Pesan yang akan di kirim",
    "contact_ids" : [
        "628xxxx"
    ],
    "attachment": "file path attachment"
}
```

>[!NOTE]
> You can find upload enpoint [here]() 

### Response Body

```json
{
    "status": true,
    "message": "Messages forwarded successfully"
}
```