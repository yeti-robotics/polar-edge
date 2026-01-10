import { StringOption } from "necord";

export class HandbookQuestionDto {
  @StringOption({
    name: "question",
    description: "Your question",
    required: true,
  })
  question: string;
}
