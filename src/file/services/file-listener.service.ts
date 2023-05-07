import { Injectable } from '@nestjs/common';
import {
  EachMessagePayload,
  KafkaListener,
  SubscribeTo,
} from '@vvtri/nestjs-kafka';
import {
  FileCreatedKafkaPayload,
  FileUpdatedKafkaPayload,
  KAFKA_TOPIC,
} from 'common';
import { Transactional } from 'typeorm-transactional';
import { FileRepository } from '../repositories/file.repository';

@Injectable()
@KafkaListener()
export class FileListenerService {
  constructor(private fileRepo: FileRepository) {}

  @SubscribeTo(KAFKA_TOPIC.FILE_CREATED)
  @Transactional()
  async handleFileCreated({
    message,
  }: EachMessagePayload<FileCreatedKafkaPayload>) {
    const user = this.fileRepo.create(message.value);
    await this.fileRepo.insert(user);
  }

  @SubscribeTo(KAFKA_TOPIC.FILE_UPDATED)
  @Transactional()
  async handleFileUpdated({
    message,
  }: EachMessagePayload<FileUpdatedKafkaPayload>) {
    await this.fileRepo.update(message.value.id, message.value);
  }
}
