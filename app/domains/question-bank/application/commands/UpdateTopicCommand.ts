import { RetrieveOneSchema } from "../../../../shared/domain/base_response";
import { BaseCommand } from "../../../../shared/domain/base_use_case";
import { NotFoundError } from "../../../../shared/exceptions/domainErrors";
import { TopicService } from "../../domain/services/topicService";
import { UpdateTopicBody, TopicDetail } from "../../schemas/topicSchema";

type Input = { topicId: string; patch: UpdateTopicBody };
export class UpdateTopicCommand extends BaseCommand<Input, RetrieveOneSchema<TopicDetail>> {
  constructor(private readonly svc: TopicService) { super(); }
  protected async executeBusinessLogic(input: Input) {
    const updated = await this.svc.update(input.topicId, input.patch);
    if (!updated) throw new NotFoundError({ message: "TOPIC_NOT_FOUND" });
    return new RetrieveOneSchema(updated, "Topic updated", true);
  }
}
