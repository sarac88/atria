import { Module } from "@nestjs/common";
import { ModulesController } from "./modules.controller";
import { ModulesService } from "./modules.service";
import { ClassMembershipGuard } from "../auth/guards";

@Module({
  controllers: [ModulesController],
  providers: [ModulesService, ClassMembershipGuard],
})
export class ModulesModule {}
