import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { UserAccountConfig } from '../../../config/user-account.config';
import { CreateUserInputModel } from '../../../users/api/models/input/create-user.input-model';
import { BadRequestException } from '@nestjs/common';
import { User } from '../../../users/domain/user.entity';
import { CryptoService } from '../../../crypto/crypto.service';
import { UuidProvider } from '../../../../../core/helpers/uuid.provider';
import { UserRegistrationEvent } from '../events/user-registration.event';
import { UsersRepository } from '../../../users/infrastructure/users.repository';

export class RegisterUserCommand {
  constructor(public userCreateModel: CreateUserInputModel) {}
}

@CommandHandler(RegisterUserCommand)
export class RegisterUserUseCase
  implements ICommandHandler<RegisterUserCommand, void>
{
  constructor(
    private readonly userAccountConfig: UserAccountConfig,
    private readonly usersRepository: UsersRepository,
    private readonly bcryptService: CryptoService,
    private readonly uuidProvider: UuidProvider,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RegisterUserCommand): Promise<void> {
    const existingUserByLogin = await this.usersRepository.findByLoginOrEmail(
      command.userCreateModel.login,
    );
    if (existingUserByLogin) {
      throw new BadRequestException([
        { field: 'login', message: 'Login is not unique' },
      ]);
    }
    const existingUserByEmail = await this.usersRepository.findByLoginOrEmail(
      command.userCreateModel.email,
    );
    if (existingUserByEmail) {
      throw new BadRequestException([
        { field: 'email', message: 'Email is not unique' },
      ]);
    }
    const passHash = await this.bcryptService.generateHash(
      command.userCreateModel.password,
    );

    const user = User.createWithConfirmation(
      command.userCreateModel,
      this.uuidProvider,
      this.userAccountConfig.CONFIRMATION_CODE_EXPIRATION,
    );
    user.password = passHash;

    await this.usersRepository.create(user);
    this.eventBus.publish(
      new UserRegistrationEvent(
        user.email,
        user.emailConfirmation.confirmationCode,
      ),
    );
  }
}
