import { PubSub } from '@google-cloud/pubsub';
import { Request, Response } from 'express';
import * as _ from 'lodash';
import { rollbar } from './admin';

const pubsub = new PubSub();

// TODO: make interface that extends Request

export const processTaskChanges = async (req: Request, res: Response) => {
  const todoistId: string = _.get(req, 'body.user_id');
  // const luckyNumber = Math.floor(Math.random() * 10);
  // if (luckyNumber === 5) {
  //   const todoistInitiator = _.get(req.body, 'initiator');
  //   rollbar.info('Todoist user information', {
  //     todoistInitiator,
  //   });
  // }
  const topic: string = 'todoist-updates';
  if (!todoistId) {
    res.status(500).send();
  }
  // TODO: does res.send prevent the below from being executed? that should be a unit test

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
    // TODO: should probably call res.send with an error here
  }
  res.status(200).send();
};
