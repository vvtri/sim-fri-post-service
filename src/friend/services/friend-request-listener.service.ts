import { Injectable } from '@nestjs/common';
import { KafkaListener, SubscribeTo } from '@vvtri/nestjs-kafka';
import { EachMessagePayload } from '@vvtri/nestjs-kafka/dist/src/interfaces/external.interface';
import {
  FriendRequestCreatedKafkaPayload,
  FriendRequestDeletedKafkaPayload,
  FriendRequestUpdatedKafkaPayload,
  KAFKA_TOPIC,
} from 'common';
import { Transactional } from 'typeorm-transactional';
import { FriendRequestRepository } from '../repositories/friend-request.repository';

@KafkaListener()
@Injectable()
export class FriendRequestListenerService {
  constructor(private friendRequestRepo: FriendRequestRepository) {}

  @SubscribeTo(KAFKA_TOPIC.FRIEND_REQUEST_CREATED)
  @Transactional()
  async handleFriendRequestUpdated({
    message,
  }: EachMessagePayload<FriendRequestCreatedKafkaPayload>) {
    const friendRequest = this.friendRequestRepo.create(message.value);
    await this.friendRequestRepo.save(friendRequest);
  }

  @SubscribeTo(KAFKA_TOPIC.FRIEND_REQUEST_UPDATED)
  @Transactional()
  async handleFriendRequestDeleted({
    message,
  }: EachMessagePayload<FriendRequestUpdatedKafkaPayload>) {
    await this.friendRequestRepo.update(message.value.id, message.value);
  }

  @SubscribeTo(KAFKA_TOPIC.FRIEND_REQUEST_DELETED)
  @Transactional()
  async handleFriendRequestCreated({
    message,
  }: EachMessagePayload<FriendRequestDeletedKafkaPayload>) {
    await this.friendRequestRepo.softDelete(message.value.friendRequestId);
  }
}
