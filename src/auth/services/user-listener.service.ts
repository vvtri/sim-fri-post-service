import { Injectable } from '@nestjs/common';
import { KafkaListener, SubscribeTo } from '@vvtri/nestjs-kafka';
import { EachMessagePayload } from '@vvtri/nestjs-kafka/dist/src/interfaces/external.interface';
import { KAFKA_TOPIC, UserCreatedPayload, UserUpdatedPayload } from 'common';
import { Transactional } from 'typeorm-transactional';
import { UserRepository } from '../repositories/user.repository';

@KafkaListener()
@Injectable()
export class UserListenerService {
  constructor(private userRepo: UserRepository) {}

  @SubscribeTo(KAFKA_TOPIC.USER_CREATED)
  @Transactional()
  async handleUserCreated({ message }: EachMessagePayload<UserCreatedPayload>) {
    const user = this.userRepo.create(message.value);
    await this.userRepo.insert(user);
  }

  @SubscribeTo(KAFKA_TOPIC.USER_UPDATED)
  @Transactional()
  async handleUserUpdated({ message }: EachMessagePayload<UserUpdatedPayload>) {
    await this.userRepo.update(message.value.id, message.value);
  }
}
