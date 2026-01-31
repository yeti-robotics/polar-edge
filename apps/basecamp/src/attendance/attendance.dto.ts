import { User } from "discord.js";
import { IntegerOption, StringOption, UserOption } from "necord";

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

export class AdminAttendanceDto {
  @UserOption({
    name: "user",
    description: "The user to sign in or out",
    required: true,
  })
  user: User;

  @StringOption({
    name: "action",
    description: "Whether to sign in or sign out the user",
    required: true,
    choices: [
      { name: "Sign In", value: "signin" },
      { name: "Sign Out", value: "signout" },
    ],
  })
  action: "signin" | "signout";
}
