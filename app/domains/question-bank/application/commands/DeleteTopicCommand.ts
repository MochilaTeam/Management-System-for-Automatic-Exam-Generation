import { BaseCommand } from "../../../../shared/domain/base_use_case";
import { NotFoundError } from "../../../../shared/exceptions/domainErrors";
import { TopicService } from "../../domain/services/topicService";

type Input = { topicId: string };
export class DeleteTopicCommand extends BaseCommand<Input, void> {
  constructor(private readonly svc: TopicService) { super(); }
  protected async executeBusinessLogic(input: Input) {
    const ok = await this.svc.deleteById(input.topicId);
    if (!ok) throw new NotFoundError({ message: "TOPIC_NOT_FOUND" });
  }
}
