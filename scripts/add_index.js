const { DynamoDBClient, UpdateTableCommand } = require('@aws-sdk/client-dynamodb');
require('dotenv').config({path: '.env.local'});

const client = new DynamoDBClient({ region: process.env.AWS_REGION });

const params = {
  TableName: process.env.USERS_TABLE || 'nexring_users',
  AttributeDefinitions: [
    { AttributeName: 'email', AttributeType: 'S' }
  ],
  GlobalSecondaryIndexUpdates: [
    {
      Create: {
        IndexName: 'EmailIndex',
        KeySchema: [
          { AttributeName: 'email', KeyType: 'HASH' }
        ],
        Projection: {
          ProjectionType: 'ALL'
        }
      }
    }
  ]
};

client.send(new UpdateTableCommand(params)).then(data => {
  console.log("Index creation successfully initiated!");
}).catch(console.error);
