import { PubSub } from '@google-cloud/pubsub';
import { Request, Response } from 'express';
import * as _ from 'lodash';
import { rollbar } from './admin';

export const processTaskChanges = async (req: Request, res: Response) => {
  const todoistId: string = _.get(req, 'body.user_id');
  if (!todoistId) {
    res.status(400).send();
    return;
  }

  const pubsub = getPubSub();

  const topic: string = 'todoist-updates';
  const data = {
    todoistId,
  };
  const dataBuffer = Buffer.from(JSON.stringify(data));

  try {
    await pubsub.topic(topic).publish(dataBuffer);
  } catch (error) {
    rollbar.error('Failed to publish user ID from task to pubsub', {
      error,
    });
  }

  res.status(200).send();
};

export const getPubSub = () => new PubSub();
