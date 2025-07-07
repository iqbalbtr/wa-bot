# Blok Contact API Spec

## Get All block user

- Type : Private
- Endpoint : GET /contacts

### Request Response 

```json
{
    "status": true,
    "message": "success get blocked users",
    "data": [
        {
            "id": 1,
            "block_reason": "spam",
            "contact_id": "6281229213321",
            "blocked_at": "2025-07-05 12:39:37"
        }
    ]
}
```

## Create User Block

- Type : Private
- Endpoint : POST /contacts

### Request Body

```json
{
    "contact_id": "xx",
    "block_reason": "xx",
}
```

### Request Response

```json
{
    "status": true,
    "message" : "success",
}
```

## Delete Block Contact

- Type : Private
- Endpoint : DELETE /contacts

### Request Body

```json
{
    "status": true,
    "message" : "success",
}
```