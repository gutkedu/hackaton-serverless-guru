# Authentication API Documentation

This document outlines the authentication endpoints available in the LivestreamApp API.

## Base URL

```
{{url}}
```

## Authentication Flow

1. **Sign Up**: Register a new user
2. **Confirm Sign Up**: Verify email with confirmation code
3. **Sign In**: Authenticate and receive tokens
4. **Refresh Token**: Get new access and ID tokens
5. **Forgot Password**: Request password reset
6. **Reset Password**: Set a new password with confirmation code

## Endpoints

### Sign Up

Creates a new user account.

**Endpoint**: `POST /auth/signup`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe" // optional
}
```

**Response**:
```json
{
  "message": "User registration successful",
  "userConfirmed": false,
  "userSub": "user-uuid"
}
```

### Confirm Sign Up

Verifies a user's email address with the confirmation code.

**Endpoint**: `POST /auth/confirm-signup`

**Request Body**:
```json
{
  "email": "user@example.com",
  "confirmationCode": "123456"
}
```

**Response**:
```json
{
  "message": "User confirmed successfully"
}
```

### Sign In

Authenticates a user and returns tokens.

**Endpoint**: `POST /auth/signin`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "accessToken": "eyJraWQiOiJrZXkxIiwiYWxnIjoiUlMyNTYifQ...",
  "idToken": "eyJraWQiOiJrZXkyIiwiYWxnIjoiUlMyNTYifQ...",
  "refreshToken": "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ...",
  "expiresIn": 3600
}
```

### Refresh Token

Gets new access and ID tokens using a refresh token.

**Endpoint**: `POST /auth/refresh-token`

**Request Body**:
```json
{
  "refreshToken": "eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ..."
}
```

**Response**:
```json
{
  "tokens": {
    "idToken": "eyJraWQiOiJrZXkxIiwiYWxnIjoiUlMyNTYifQ...",
    "accessToken": "eyJraWQiOiJrZXkyIiwiYWxnIjoiUlMyNTYifQ...",
    "expiresIn": 3600
  }
}
```

### Forgot Password

Sends a confirmation code to the user's email address for password reset.

**Endpoint**: `POST /auth/forgot-password`

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "message": "Password reset code sent successfully"
}
```

### Reset Password

Resets a user's password with the confirmation code.

**Endpoint**: `POST /auth/reset-password`

**Request Body**:
```json
{
  "email": "user@example.com",
  "confirmationCode": "123456",
  "newPassword": "newPassword123"
}
```

**Response**:
```json
{
  "message": "Password reset successful"
}
```

## Using JWT Tokens

After successful authentication, you'll receive JWT tokens that should be used for authorized requests:

- **Access Token**: Use this token in the `Authorization` header for API requests
  ```
  Authorization: Bearer eyJraWQiOiJrZXkyIiwiYWxnIjoiUlMyNTYifQ...
  ```

- **ID Token**: Contains user information and claims

- **Refresh Token**: Use this to obtain new tokens when the access token expires

## Error Responses

```json
{
  "error": "Error message"
}
```

For validation errors:

```json
{
  "error": "Validation error",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["email"],
      "message": "Required"
    }
  ]
}
```
