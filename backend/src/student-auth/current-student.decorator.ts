import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { StudentRequest } from './student-auth.guard';

export const CurrentStudent = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<StudentRequest>();
    const account = request.studentAccount;
    return data ? account?.[data as keyof typeof account] : account;
  },
);
