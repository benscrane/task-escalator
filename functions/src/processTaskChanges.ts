import { rollbar } from './admin';
import { Request, Response } from 'express';
import * as _ from 'lodash';
const { PubSub } = require("@google-cloud/pubsub");

const pubsub = new PubSub();

export const processTaskChanges = async (req: Request, res: Response) => {
  const todoistId = _.get(req.body, "user_id");
  const topic = 'todoist-updates';
  if (!todoistId) {
    res.status(500).send();
  }
  const data = {
    todoistId
  };
  const dataBuffer = Buffer.from(JSON.stringify(data));
  try {
    await pubsub.topic(topic).publish(dataBuffer);
  } catch(error) {
    rollbar.error('Failed to publish user ID from task to pubsub', {
      error,
    });
  }
  res.status(200).send();
};
