# Upload File Spec

## Upload file

- Type : Private
- Endpoint : /upload

### Request Body

```json
{
    "file" : "File",
    "is_temp": true
}
```

### Response Body

```json
{
    "status" : true,
    "messaage" : "success",
    "data" : {
        "outputFolder": "string",
        "filename": "string",
        "outputFolderFile": "string";
    }   
}
```

>[!NOTE]
- Request body type is `form`
- You can set temp file, by default duartion is 15 minute
