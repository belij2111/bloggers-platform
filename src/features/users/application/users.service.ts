import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}
  async delete(id: string): Promise<boolean> {
    return this.usersRepository.delete(id);
  }
}
