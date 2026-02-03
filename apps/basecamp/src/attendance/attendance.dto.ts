import { User } from "discord.js";
import { IntegerOption, UserOption } from "necord";

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

export class AdminSignInDto {
  @UserOption({
    name: "user",
    description: "The user to sign in",
    required: true,
  })
  user: User;
}

export class AdminSignOutDto {
  @UserOption({
    name: "user",
    description: "The user to sign out",
    required: true,
  })
  user: User;
}
