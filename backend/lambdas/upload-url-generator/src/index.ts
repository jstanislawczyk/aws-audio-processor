import {APIGatewayProxyResult} from 'aws-lambda';

export const handler = async (): Promise<APIGatewayProxyResult> => {
    console.log(123);
    return {
        isBase64Encoded: false,
        statusCode: 200,
        body: "Hello from Lambda!",
        headers: {
            "content-type": "application/json"
        }
    };
}
