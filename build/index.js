"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = void 0;
const pg_1 = require("pg");
const onboarding_1 = require("./sql/onboarding");
/**
 * Your HTTP handling function, invoked with each request. This is an example
 * function that logs the incoming request and echoes its input to the caller.
 *
 * @param {Context} context a context object.
 * @param {object} context.body the request body if any
 * @param {object} context.query the query string deserialzed as an object, if any
 * @param {object} context.log logging object with methods for 'info', 'warn', 'error', etc.
 * @param {object} context.headers the HTTP request headers
 * @param {string} context.method the HTTP request method
 * @param {string} context.httpVersion the HTTP protocol version
 * See: https://github.com/knative-sandbox/kn-plugin-func/blob/main/docs/guides/nodejs.md#the-context-object
 */
const handle = async function (context) {
    const input = context.body;
    const client = new pg_1.Client();
    try {
        await client.connect();
        await client.query('BEGIN');
        const queryString = onboarding_1.buildOnboardingSQL(input);
        console.log(input);
        validateInput(input);
        await client.query(queryString);
        await client.query('COMMIT');
    }
    catch (error) {
        console.log(error);
        await client.query('ROLLBACK');
        throw error;
    }
    return JSON.stringify({ statusMessage: 'success' });
    // psql -f ./onboarding.sql
    // aws cognito-idp admin-create-user --region us-east-1 --user-pool-id us-east-1_Xa0VPdba5 --username $FIRST_USER | jq .
    // aws cognito-idp admin-add-user-to-group --user-pool-id us-east-1_Xa0VPdba5 --region us-east-1 --group-name Admin --username $FIRST_USER | jq . 
    // aws cognito-idp admin-enable-user  --user-pool-id us-east-1_Xa0VPdba5 --region us-east-1  --username $FIRST_USER | jq .
};
exports.handle = handle;
/**
 * Ensure all fields exist and have values.
 * @param input Input from request
 */
const validateInput = (input) => {
    const ensureFields = ['company_name', 'company_subdomain', 'company_slug', 'identity_name_first', 'identity_name_last', 'identity_personal_email', 'identity_work_email', 'identity_mobile_phone'];
    ensureFields.forEach(field => {
        if (!input[field] || input[field].length === 0)
            throw new Error(`Bad Input for ${field}`);
    });
};
const createCognitoParams = (firstUserEmail) => {
    const createUserParams = {
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: firstUserEmail,
        UserAttributes: [{
                Name: "email",
                Value: firstUserEmail,
            },
            {
                Name: "email_verified",
                Value: "true",
            }]
    };
    return createUserParams;
};
