import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailTemplateService {
  registrationEmail(code: string): string {
    return `<h1>Thanks for your registration</h1>
 <p>To finish registration please follow the link below:
     <a href='https://somesite.com/confirm-email?code=${code}'>complete registration</a>
 </p>`;
  }

  passwordRecoveryEmail(recoveryCode: string): string {
    return `
        <h1>Password recovery</h1>
 <p>To finish password recovery please follow the link below:
     <a href='https://somesite.com/password-recovery?recoveryCode=${recoveryCode}'>recovery password</a>
 </p>
        `;
  }
}
