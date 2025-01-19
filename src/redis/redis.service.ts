import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { TTL } from 'src/constants/redis';
import {
  IFetchRecordsFromSortedSets,
  ISortedKeyValue,
  ZRANGEConfig,
} from 'src/types/redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redisClient: RedisClientType;

  async onModuleInit() {
    try {
      this.redisClient = createClient({
        url: process.env.REDIS_URL,
      });

      this.redisClient.on('error', (err) =>
        this.logger.error('Redis connection error:', err),
      );

      await this.redisClient.connect();
      this.logger.log('Redis connected successfully.');
    } catch (error) {
      this.logger.error('Error connecting to Redis', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
    this.logger.log('Redis disconnected.');
  }

  getClient(): RedisClientType {
    return this.redisClient;
  }

  // Service function to set the string value in Redis
  async set(key: string, value: string, ttlInSeconds: number) {
    await this.redisClient.set(key, value, { EX: ttlInSeconds });
  }

  // Service function to get the string value from Redis
  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  // Function to fetch the records from the sorted sets
  async fetchRecordsFromSortedSets({
    setName,
    filter,
    rev,
    sort = 'SCORE',
    limit,
    skip,
  }: IFetchRecordsFromSortedSets) {
    const filterRange: (string | number)[] = filter
      ? [filter.min, filter.max]
      : rev
        ? ['+inf', '-inf']
        : ['-inf', '+inf'];
    const config: ZRANGEConfig = {
      BY: sort,
      REV: rev,
    };

    if (limit && skip)
      config['LIMIT'] = {
        offset: Number(skip),
        count: Number(limit),
      };

    return this.redisClient.ZRANGE(
      setName,
      filterRange[0],
      filterRange[1],
      config,
    );
  }

  // Function to set record in the sorted sets
  async setRecordsInSortedSets(
    setName: string,
    records: ISortedKeyValue[],
  ): Promise<number> {
    const response = await this.redisClient.zAdd(setName, records);
    await this.redisClient.expire(setName, TTL.WEEK);
    return response;
  }

  // Function to delete records from the sorted sets
  async deleteRecordFromSortedSets(
    setName: string,
    records: string[],
  ): Promise<number> {
    return this.redisClient.zRem(setName, records);
  }

  async delete(key: string) {
    await this.redisClient.del(key);
  }
}
