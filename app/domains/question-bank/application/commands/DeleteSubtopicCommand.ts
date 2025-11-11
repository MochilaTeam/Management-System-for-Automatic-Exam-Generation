import { BaseCommand } from "../../../../shared/domain/base_use_case";
import { NotFoundError } from "../../../../shared/exceptions/domainErrors";
import { SubtopicService } from "../../domain/services/subtopicService";

type Input = { subtopicId: string };
export class DeleteSubtopicCommand extends BaseCommand<Input, void> {
  constructor(private readonly svc: SubtopicService) { super(); }
  protected async executeBusinessLogic(input: Input) {
    const ok = await this.svc.deleteById(input.subtopicId);
    if (!ok) throw new NotFoundError({ message: "SUBTOPIC_NOT_FOUND" });
  }
}
