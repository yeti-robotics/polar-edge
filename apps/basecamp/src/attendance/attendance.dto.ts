import { IntegerOption } from "necord";

export class AttendanceSignInDto {
  @IntegerOption({
    name: "code",
    description: "The code to sign in with",
    required: true,
  })
  code: number;
}

export class AttendanceSignOutDto {
  @IntegerOption({
    name: "code",
    description: "The code to sign out with",
    required: true,
  })
  code: number;
}
