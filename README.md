# TypeScript HTTP Function for Company Provision.

This endpoint will take in new company info and create all the initial data for said company.
Additionally it will create a user in cognito in the admin group and enable them.

Send the api a json body:
```
{
    "company_name": "",
    "company_subdomain": "",
    "company_slug": "",
    "identity_name_first": "",
    "identity_name_last": "",
    "identity_personal_email": "",
    "identity_work_email": "",
    "identity_mobile_phone": ""
}
```

## Local execution

To run locally 

```console
npm install
# In one terminal
npm run watch # Typescript watch and recompile
# In another terminal
npm run dev # JS watch and restart server
```

I use postman to test endpoint locally. 
This may not work if some kind of auth is added to this function later.

## Default Readme stuff

The runtime will expose three endpoints.

  * `/` The endpoint for your function.
  * `/health/readiness` The endpoint for a readiness health check
  * `/health/liveness` The endpoint for a liveness health check

The parameter provided to the function endpoint at invocation is a `Context` object containing HTTP request information.

```js
function handleRequest(context) {
  const log = context.log;
  log.info(context.httpVersion);
  log.info(context.method); // the HTTP request method (only GET or POST supported)
  log.info(context.query); // if query parameters are provided in a GET request
  log.info(context.body); // contains the request body for a POST request
  log.info(context.headers); // all HTTP headers sent with the event
}
```

The health checks can be accessed in your browser at [http://localhost:8080/health/readiness]() and [http://localhost:8080/health/liveness](). You can use `curl` to `POST` an event to the function endpoint:

```console
curl -X POST -d '{"hello": "world"}' \
  -H'Content-type: application/json' \
  http://localhost:8080
```

The readiness and liveness endpoints use [overload-protection](https://www.npmjs.com/package/overload-protection) and will respond with `HTTP 503 Service Unavailable` with a `Client-Retry` header if your function is determined to be overloaded, based on the memory usage and event loop delay.

## Testing

This function project includes a [unit test](./test/unit.ts) and an [integration test](./test/integration.ts). Modify these, or add additional tests for your business logic.

```console
npm test
```