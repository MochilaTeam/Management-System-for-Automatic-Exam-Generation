import { get_logger } from '../../../core/dependencies/dependencies';
import { SystemLogger } from '../../../core/logging/logger';
import { LoginCommand } from '../application/commands/login';
import { IUserRepository } from '../domain/ports/IUserRepository';
import { UserService } from '../domain/services/userService';

//Repositories

//Services
export function makeUserService(deps?: {
    logger?: SystemLogger;
    userRepository?: IUserRepository;
}) {
    const logger = deps?.logger ?? get_logger();
    const userRepository = deps?.userRepository ?? get_user_repository();
    return new UserService(logger, userRepository);
}

//Commands
export function makeLoginCommand(deps?: { userService?: UserService }) {
    const userService = deps?.userService ?? makeUserService();
    return new LoginCommand(userService);
}
