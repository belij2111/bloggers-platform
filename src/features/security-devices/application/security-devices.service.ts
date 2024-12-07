import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SecurityDevicesRepository } from '../infrastructure/security-devices.repository';

@Injectable()
export class SecurityDevicesService {
  constructor(
    private readonly securityDevicesRepository: SecurityDevicesRepository,
  ) {}

  async delete(
    currentUserId: string,
    currentDeviceId: string,
  ): Promise<boolean> {
    return this.securityDevicesRepository.delete(
      currentUserId,
      currentDeviceId,
    );
  }

  async deleteById(currentUserId: string, deviceId: string) {
    const foundDevice = await this.securityDevicesRepository.findById(deviceId);
    if (!foundDevice) {
      throw new NotFoundException('The device was not found');
    }
    if (currentUserId !== foundDevice.userId) {
      throw new ForbiddenException([
        {
          field: 'device',
          message: "You cannot delete another user's device ID",
        },
      ]);
    }
    return await this.securityDevicesRepository.deleteById(
      foundDevice.deviceId,
    );
  }
}
